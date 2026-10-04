/**
 * Only one product per creator may be featured (list / CTA price).
 * When featuring `keepProductId`, return sibling ids that must clear `isFeatured`.
 */
export function siblingIdsToUnfeature(
  siblings: Array<{ _id: string; isFeatured: boolean }>,
  keepProductId: string | undefined,
): string[] {
  return siblings
    .filter((s) => s.isFeatured && s._id !== keepProductId)
    .map((s) => s._id);
}
