/** Wizard steps (same-context panels, not route tabs). */
export const ONBOARDING_STEPS = ['Profile', 'Images', 'Product'] as const;

/** Clamp persisted wizard step into a valid index for resume. */
export function clampOnboardingStep(step: unknown, stepCount: number): number {
  if (stepCount < 1) return 0;
  if (typeof step !== 'number' || !Number.isFinite(step)) return 0;
  return Math.max(0, Math.min(stepCount - 1, Math.floor(step)));
}

/** Publish is a deliberate final action — never implied by draft save. */
export function shouldPublishOnSave(opts?: { publish?: boolean }): boolean {
  return opts?.publish === true;
}
