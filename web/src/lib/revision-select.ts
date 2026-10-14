// Explicitly select the ownership FK; implementations also points to revisions via published_revision_id.
export const revisionWithImplementationSelect =
  "id,title,explanation,pseudocode,python_code,entry_function,input_schema,test_cases,status,test_status,test_evidence,review_note,reviewer_id,reviewed_at,submitted_at,edit_seq,updated_at,created_by,implementations:implementations!revisions_implementation_id_fkey(id,published_revision_id,method_type,topics(slug,title))";
