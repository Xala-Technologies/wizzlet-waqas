import { describe, expect, it } from 'vitest';
import { clampOnboardingStep, shouldPublishOnSave } from './onboardingStep';

describe('clampOnboardingStep', () => {
  it('keeps valid steps', () => {
    expect(clampOnboardingStep(0, 3)).toBe(0);
    expect(clampOnboardingStep(2, 3)).toBe(2);
  });

  it('clamps out-of-range and non-numbers', () => {
    expect(clampOnboardingStep(-1, 3)).toBe(0);
    expect(clampOnboardingStep(99, 3)).toBe(2);
    expect(clampOnboardingStep('1', 3)).toBe(0);
    expect(clampOnboardingStep(1.9, 3)).toBe(1);
  });
});

describe('shouldPublishOnSave', () => {
  it('only publishes when explicitly requested', () => {
    expect(shouldPublishOnSave()).toBe(false);
    expect(shouldPublishOnSave({})).toBe(false);
    expect(shouldPublishOnSave({ publish: false })).toBe(false);
    expect(shouldPublishOnSave({ publish: true })).toBe(true);
  });
});
