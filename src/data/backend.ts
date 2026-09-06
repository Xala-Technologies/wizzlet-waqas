/**
 * Data backend is Convex only. Kept for compatibility with older call sites.
 */
export type DataBackend = "convex";

export function getDataBackend(): DataBackend {
  return "convex";
}

export function isConvexBackend() {
  return true;
}
