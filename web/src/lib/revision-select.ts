// PostgREST sees two FKs between implementations and revisions:
//   revisions.implementation_id -> implementations.id (draft ownership)
//   implementations.published_revision_id -> revisions.id (published pointer)
// Always name the FK for the many-to-one draft/reviewer embed (PGRST201).
// Alias the relation back to 'implementations' to keep its response shape.
export const revisionWithImplementationSelect =
  "id,title,explanation,pseudocode,python_code,status,test_status,review_note,edit_seq,updated_at,created_by,implementations:implementations!revisions_implementation_id_fkey(method_type,topics(slug,title))";
