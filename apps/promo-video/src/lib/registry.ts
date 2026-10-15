/** Picks a video by id, falling back to `fallback` when none is named. */
export const resolveVideo = <T>(
  videos: Readonly<Record<string, T>>,
  name: string | null | undefined,
  fallback: string,
): { id: string; video: T } => {
  const id = name || fallback;
  if (!(id in videos)) {
    throw new Error(`Unknown video "${id}". Available: ${Object.keys(videos).join(", ")}`);
  }
  return { id, video: videos[id] };
};
