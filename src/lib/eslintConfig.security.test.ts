import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(resolve(__dirname, '../../eslint.config.js'), 'utf8');

describe('eslint config hygiene', () => {
  it('ignores Convex generated files and intentional co-export surfaces', () => {
    expect(src).toMatch(/convex\/_generated\/\*\*/);
    expect(src).toMatch(/src\/components\/ui\/\*\*\/\*\.\{ts,tsx\}/);
    expect(src).toMatch(/src\/contexts\/\*\*\/\*\.\{ts,tsx\}/);
    expect(src).toMatch(/react-refresh\/only-export-components": "off"/);
  });
});
