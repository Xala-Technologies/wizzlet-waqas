/** Max products a creator may pin to the public profile strip (J2). */
export const MAX_PROFILE_PRODUCTS = 4;

/**
 * Whether enabling showOnProfile would exceed the strip cap.
 * `currentlyShown` = siblings already shown (excluding the product being toggled).
 */
export function wouldExceedProfileSlots(
  currentlyShown: number,
  enabling: boolean,
  max: number = MAX_PROFILE_PRODUCTS,
): boolean {
  if (!enabling) return false;
  return currentlyShown >= max;
}
