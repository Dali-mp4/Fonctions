-- 026: Save editable content and its chapter/type atomically.
-- Never rewrite the placement of a historically approved publication:
-- if its author changes chapter or type after withdrawal, fork only the
-- active draft into a new implementation. Approved history remains untouched.
CREATE FUNCTION public.save_private_lesson_with_placement(
  p_revision uuid, p_expected_edit_seq integer, p_topic_slug text,
  p_method_type text, p_title text, p_explanation text, p_pseudocode text,
  p_python_code text, p_entry_function text, p_input_schema jsonb,
  p_test_cases jsonb, p_lesson_content jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $save$
DECLARE
  actor uuid := (SELECT auth.uid());
  actor_role text := public.current_role();
  source public.revisions%ROWTYPE;
  original public.implementations%ROWTYPE;
  destination public.topics%ROWTYPE;
  target_implementation uuid;
  next_seq integer;
  placement_changed boolean;
  approved_history boolean;
  forked boolean := false;
  previous_slug text;
BEGIN
  IF actor IS NULL OR actor_role IS NULL
    OR actor_role NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor access required';
  END IF;
  IF p_expected_edit_seq IS NULL OR p_expected_edit_seq<1 OR
     p_method_type IS NULL OR p_method_type NOT IN ('base','advanced')
     OR p_topic_slug IS NULL THEN
    RAISE EXCEPTION 'Invalid chapter or method type';
  END IF;

  SELECT * INTO source FROM public.revisions
    WHERE id=p_revision FOR UPDATE;
  IF NOT FOUND OR source.created_by IS DISTINCT FROM actor
     OR source.status NOT IN ('draft','changes_requested')
     OR source.edit_seq IS DISTINCT FROM p_expected_edit_seq THEN
    RAISE EXCEPTION 'Private draft changed, submitted or unavailable. Refresh El studio.';
  END IF;

  SELECT * INTO original FROM public.implementations
    WHERE id=source.implementation_id FOR UPDATE;
  IF NOT FOUND OR original.created_by IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'You cannot change another contributor''s implementation';
  END IF;
  SELECT * INTO destination FROM public.topics WHERE slug=p_topic_slug FOR UPDATE;
  IF NOT FOUND OR (destination.state <> 'published'
      AND NOT (destination.state='pending' AND destination.created_by=actor)) THEN
    RAISE EXCEPTION 'Choose a published chapter or one of your private chapters';
  END IF;

  SELECT slug INTO previous_slug FROM public.topics WHERE id=original.topic_id;
  placement_changed := original.topic_id IS DISTINCT FROM destination.id
    OR original.method_type IS DISTINCT FROM p_method_type;
  IF placement_changed AND original.published_revision_id IS NOT NULL THEN
    RAISE EXCEPTION 'Retire the published method before changing its chapter or type';
  END IF;
  approved_history := original.archived_at IS NOT NULL
    OR EXISTS(SELECT 1 FROM public.revisions r
       WHERE r.implementation_id=original.id
         AND (r.status IN ('published','archived') OR r.reviewed_at IS NOT NULL));

  IF placement_changed AND approved_history THEN
    IF EXISTS(SELECT 1 FROM public.revisions r
      WHERE r.implementation_id=original.id AND r.id<>source.id
        AND r.status IN ('draft','changes_requested','submitted')) THEN
      RAISE EXCEPTION 'Another active draft exists for this implementation. Resolve it first.';
    END IF;

    INSERT INTO public.implementations(topic_id,method_type,created_by)
      VALUES(destination.id,p_method_type,actor) RETURNING id INTO target_implementation;
    -- Keep the original published/archived revision IDs and implementation unchanged.
    UPDATE public.revisions SET implementation_id=target_implementation
      WHERE id=source.id AND implementation_id=original.id;
    forked := true;
  ELSIF placement_changed THEN
    IF EXISTS(SELECT 1 FROM public.revisions r
      WHERE r.implementation_id=original.id AND r.id<>source.id
        AND (r.created_by<>actor OR r.status NOT IN ('draft','changes_requested'))) THEN
      RAISE EXCEPTION 'This implementation has another protected revision.';
    END IF;
    UPDATE public.implementations SET topic_id=destination.id,method_type=p_method_type
      WHERE id=original.id;
    target_implementation:=original.id;
  ELSE
    target_implementation:=original.id;
  END IF;

  -- Delegate all existing lesson validations and edit-sequence checks to
  -- the trusted save RPC. Any failure rolls back the placement transaction.
  next_seq:=public.update_draft_lesson_with_contract(
    p_revision,p_expected_edit_seq,p_title,p_explanation,p_pseudocode,p_python_code,
    p_entry_function,p_input_schema,p_test_cases,p_lesson_content);

  IF placement_changed THEN
    INSERT INTO public.audit_events(actor_id,revision_id,action,details)
    VALUES(actor,p_revision,'private_implementation_reclassified',
      jsonb_build_object(
        'old_implementation_id',original.id,'new_implementation_id',target_implementation,
        'old_chapter',previous_slug,'new_chapter',destination.slug,
        'old_type',original.method_type,'new_type',p_method_type,
        'forked_from_approved_history',forked,
        'edit_seq',next_seq));
  END IF;

  RETURN jsonb_build_object('edit_seq',next_seq,
    'implementation_id',target_implementation,'forked',forked,
    'placement_changed',placement_changed);
END $save$;
REVOKE ALL ON FUNCTION public.save_private_lesson_with_placement(
  uuid,integer,text,text,text,text,text,text,text,jsonb,jsonb,jsonb)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_private_lesson_with_placement(
  uuid,integer,text,text,text,text,text,text,text,jsonb,jsonb,jsonb)
  TO authenticated;
