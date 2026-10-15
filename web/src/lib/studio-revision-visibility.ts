export type StudioVisibleRevision = {
  id: string;
  status: "draft" | "changes_requested" | "submitted" | "published" | "archived";
  updated_at: string;
  implementations: {
    id: string;
    published_revision_id: string | null;
    topics: { slug: string; title: string };
  };
};

const privateStatuses = new Set<StudioVisibleRevision["status"]>(["draft", "changes_requested", "submitted"]);

/** Only the current action-worthy revision of each implementation appears in Studio. */
export function selectStudioRevisions<T extends StudioVisibleRevision>(revisions: readonly T[]) {
  const byImplementation = new Map<string, T[]>();
  for (const revision of revisions) {
    const list = byImplementation.get(revision.implementations.id) ?? [];
    list.push(revision);
    byImplementation.set(revision.implementations.id, list);
  }
  const privateRevisions: T[] = [];
  const publishedRevisions: T[] = [];
  for (const versions of byImplementation.values()) {
    const ordered = [...versions].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id));
    const privateVersion = ordered.find(r => privateStatuses.has(r.status));
    if (privateVersion) {
      privateRevisions.push(privateVersion);
      continue;
    }
    const liveId = ordered[0]?.implementations.published_revision_id;
    const live = ordered.find(r => r.id === liveId && r.status === "published");
    if (live) publishedRevisions.push(live);
    // Archived and superseded revisions stay in Supabase but never show as cards.
  }
  const newest = (a: T, b: T) =>
    b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id);
  return { privateRevisions: privateRevisions.sort(newest), publishedRevisions: publishedRevisions.sort(newest) };
}

export function chaptersForStudioRevisions<T extends StudioVisibleRevision>(revisions: readonly T[]) {
  const chapters = new Map<string, string>();
  for (const r of revisions) chapters.set(r.implementations.topics.slug, r.implementations.topics.title);
  return [...chapters].map(([slug, title]) => ({ slug, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
}
