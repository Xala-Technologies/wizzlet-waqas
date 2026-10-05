import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../contexts/AuthContext.tsx'),
  'utf8',
);
const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

describe('AuthContext role checks', () => {
  it('does not treat Vite DEV as holding every role', () => {
    expect(src).not.toMatch(/DEV_BYPASS_ALLOWED/);
    expect(src).toMatch(/\(target: AppRole\) => roles\.includes\(target\)/);
    expect(src).toMatch(/if \(!roles\.includes\(next\)\) return;/);
    expect(src).toMatch(/devMode: false/);
  });

  it('does not mount the DEV full-access banner', () => {
    expect(app).not.toMatch(/DevModeBanner/);
  });
});
