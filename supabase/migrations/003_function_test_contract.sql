-- Phase 3A: function signature and example test cases. Run AFTER 001 and 002.
-- IMPORTANT: This does not run code, certify tests, or enable publication.
-- Existing revisions are preserved; old drafts have no declared cases initially.
ALTER TABLE public.revisions
  ADD COLUMN IF NOT EXISTS test_cases jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Validate against the same limited, JSON-based types used by the editor.
CREATE OR REPLACE FUNCTION public.contract_value_matches(p_value jsonb, p_type text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE element jsonb; cell jsonb;
BEGIN
  IF p_type = 'int' THEN
    RETURN jsonb_typeof(p_value) = 'number' AND p_value::text ~ '^-?[0-9]+$'
      AND length(p_value::text) <= 16
      AND (p_value::text)::numeric BETWEEN -9007199254740991 AND 9007199254740991;
  ELSIF p_type = 'float' THEN
    RETURN jsonb_typeof(p_value) = 'number';
  ELSIF p_type = 'str' THEN
    RETURN jsonb_typeof(p_value) = 'string';
  ELSIF p_type = 'bool' THEN
    RETURN jsonb_typeof(p_value) = 'boolean';
  ELSIF p_type = 'list[int]' THEN
    IF jsonb_typeof(p_value) <> 'array' THEN RETURN false; END IF;
    FOR element IN SELECT value FROM jsonb_array_elements(p_value) LOOP
      IF NOT public.contract_value_matches(element, 'int') THEN RETURN false; END IF;
    END LOOP;
    RETURN true;
  ELSIF p_type = 'list[list[int]]' THEN
    IF jsonb_typeof(p_value) <> 'array' THEN RETURN false; END IF;
    FOR element IN SELECT value FROM jsonb_array_elements(p_value) LOOP
      IF NOT public.contract_value_matches(element, 'list[int]') THEN RETURN false; END IF;
    END LOOP;
    RETURN true;
  END IF;
  RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.contract_value_matches(jsonb, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_function_contract(
  p_entry_function text, p_input_schema jsonb, p_test_cases jsonb
) RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE param jsonb; tc jsonb; pname text; ptype text; names text[] := '{}';
param_count integer;
BEGIN
  IF p_entry_function IS NULL OR length(p_entry_function) > 64 OR
     p_entry_function !~ '^[A-Za-z_][A-Za-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid entry function name';
  END IF;
  IF jsonb_typeof(p_input_schema) IS DISTINCT FROM 'object' OR
     jsonb_typeof(p_input_schema->'parameters') IS DISTINCT FROM 'array' OR
     coalesce(p_input_schema->>'returns','') NOT IN ('int','float','str','bool','list[int]','list[list[int]]') THEN
    RAISE EXCEPTION 'Invalid function schema';
  END IF;
  param_count := jsonb_array_length(p_input_schema->'parameters');
  IF param_count > 8 OR length(p_input_schema::text) > 6000 THEN
    RAISE EXCEPTION 'Function schema too large (maximum 8 parameters)';
  END IF;
  FOR param IN SELECT value FROM jsonb_array_elements(p_input_schema->'parameters') LOOP
    pname := param->>'name'; ptype := param->>'type';
    IF pname IS NULL OR length(pname) > 64 OR pname !~ '^[A-Za-z_][A-Za-z0-9_]*$'
       OR pname = ANY(names) OR coalesce(ptype,'') NOT IN ('int','float','str','bool','list[int]','list[list[int]]') THEN
      RAISE EXCEPTION 'Invalid or duplicate parameter name/type';
    END IF;
    names := array_append(names, pname);
  END LOOP;
  IF jsonb_typeof(p_test_cases) IS DISTINCT FROM 'array' OR
     jsonb_array_length(p_test_cases) > 20 OR length(p_test_cases::text) > 20000 THEN
    RAISE EXCEPTION 'Invalid test cases (maximum 20)';
  END IF;
  FOR tc IN SELECT value FROM jsonb_array_elements(p_test_cases) LOOP
    IF jsonb_typeof(tc) IS DISTINCT FROM 'object' OR
       length(coalesce(tc->>'label','')) > 100 OR
       NOT (tc ? 'expected') OR
       jsonb_typeof(tc->'inputs') IS DISTINCT FROM 'object' OR
       (SELECT count(*) FROM jsonb_object_keys(tc->'inputs')) <> param_count OR
       NOT public.contract_value_matches(tc->'expected', p_input_schema->>'returns') THEN
      RAISE EXCEPTION 'Invalid test case structure or return type';
    END IF;
    FOR param IN SELECT value FROM jsonb_array_elements(p_input_schema->'parameters') LOOP
      pname := param->>'name'; ptype := param->>'type';
      IF NOT (tc->'inputs' ? pname) OR
         NOT public.contract_value_matches(tc->'inputs'->pname, ptype) THEN
        RAISE EXCEPTION 'Invalid test input for parameter %', pname;
      END IF;
    END LOOP;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.validate_function_contract(text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;

-- Create the implementation/revision atomically, including the test contract.
CREATE OR REPLACE FUNCTION public.create_draft_with_contract(
  p_topic_slug text, p_method_type text, p_title text, p_explanation text,
  p_pseudocode text, p_python_code text, p_entry_function text,
  p_input_schema jsonb, p_test_cases jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE topic_id uuid; impl_id uuid; rev_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor access required';
  END IF;
  IF coalesce(p_method_type,'') NOT IN ('base','advanced') OR
     length(btrim(coalesce(p_title,''))) NOT BETWEEN 5 AND 160 OR
     length(btrim(coalesce(p_explanation,''))) NOT BETWEEN 15 AND 20000 OR
     length(coalesce(p_python_code,'')) NOT BETWEEN 10 AND 30000 OR
     length(coalesce(p_pseudocode,'')) > 30000 THEN
    RAISE EXCEPTION 'Invalid draft content';
  END IF;
  PERFORM public.validate_function_contract(p_entry_function, p_input_schema, p_test_cases);
  SELECT id INTO topic_id FROM public.topics WHERE slug = p_topic_slug;
  IF topic_id IS NULL THEN RAISE EXCEPTION 'Unknown topic'; END IF;
  INSERT INTO public.implementations(topic_id,method_type,created_by)
    VALUES(topic_id,p_method_type,(SELECT auth.uid())) RETURNING id INTO impl_id;
  INSERT INTO public.revisions(implementation_id,created_by,title,explanation,pseudocode,python_code,
                               entry_function,input_schema,test_cases)
    VALUES(impl_id,(SELECT auth.uid()),btrim(p_title),btrim(p_explanation),coalesce(p_pseudocode,''),
           p_python_code,p_entry_function,p_input_schema,p_test_cases)
    RETURNING id INTO rev_id;
  INSERT INTO public.audit_events(actor_id,revision_id,action)
    VALUES((SELECT auth.uid()),rev_id,'draft_created');
  RETURN rev_id;
END $$;
REVOKE ALL ON FUNCTION public.create_draft_with_contract(text,text,text,text,text,text,text,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_draft_with_contract(text,text,text,text,text,text,text,jsonb,jsonb) TO authenticated;

-- Updating a draft replaces code + declared tests in ONE transaction; old results
-- and stale review decisions are invalidated. Immutable submitted revisions stay locked.
CREATE OR REPLACE FUNCTION public.update_draft_with_contract(
  p_revision uuid, p_expected_edit_seq integer,
  p_title text, p_explanation text, p_pseudocode text, p_python_code text,
  p_entry_function text, p_input_schema jsonb, p_test_cases jsonb
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE new_seq integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.current_role() NOT IN ('contributor','reviewer','owner') THEN
    RAISE EXCEPTION 'Contributor access required';
  END IF;
  IF p_expected_edit_seq IS NULL OR p_expected_edit_seq < 1 OR
     length(btrim(coalesce(p_title,''))) NOT BETWEEN 5 AND 160 OR
     length(btrim(coalesce(p_explanation,''))) NOT BETWEEN 15 AND 20000 OR
     length(coalesce(p_python_code,'')) NOT BETWEEN 10 AND 30000 OR
     length(coalesce(p_pseudocode,'')) > 30000 THEN
    RAISE EXCEPTION 'Invalid draft content';
  END IF;
  PERFORM public.validate_function_contract(p_entry_function, p_input_schema, p_test_cases);
  UPDATE public.revisions SET
    title=btrim(p_title), explanation=btrim(p_explanation), pseudocode=coalesce(p_pseudocode,''),
    python_code=p_python_code, entry_function=p_entry_function,
    input_schema=p_input_schema, test_cases=p_test_cases,
    status='draft', edit_seq=edit_seq+1,
    test_status='not_run', test_evidence='{}'::jsonb,
    reviewer_id=NULL, review_note=NULL, reviewed_at=NULL, updated_at=now()
  WHERE id=p_revision AND created_by=(SELECT auth.uid())
    AND status IN ('draft','changes_requested') AND edit_seq=p_expected_edit_seq
  RETURNING edit_seq INTO new_seq;
  IF new_seq IS NULL THEN
    RAISE EXCEPTION 'Draft unavailable or changed in another tab. Reload before editing.';
  END IF;
  INSERT INTO public.audit_events(actor_id,revision_id,action,details)
  VALUES((SELECT auth.uid()),p_revision,'draft_updated',jsonb_build_object('edit_seq',new_seq));
  RETURN new_seq;
END $$;
REVOKE ALL ON FUNCTION public.update_draft_with_contract(uuid,integer,text,text,text,text,text,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_draft_with_contract(uuid,integer,text,text,text,text,text,jsonb,jsonb) TO authenticated;

-- Read access continues to use the existing revisions RLS policy. No direct edits.
GRANT SELECT ON public.revisions TO authenticated;
