/** Soft-archive when any subscription row exists; otherwise hard-delete. */
export function productRemoveMode(hasLinkedSubscription: boolean): 'archive' | 'delete' {
  return hasLinkedSubscription ? 'archive' : 'delete';
}
