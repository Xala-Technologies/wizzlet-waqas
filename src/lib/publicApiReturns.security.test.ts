import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const CONVEX_ROOT = join(__dirname, '../../convex');
const SKIP_DIRS = new Set(['_generated', 'lib']);

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...listTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('public Convex API returns validators (Section 8 gate 2)', () => {
  it('every public query/mutation/action declares returns', () => {
    const missing: string[] = [];
    let ok = 0;
    const re = /export const (\w+)\s*=\s*(query|mutation|action)\s*\(\s*\{/g;
    for (const file of listTsFiles(CONVEX_ROOT)) {
      const text = readFileSync(file, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const name = m[1];
        if (name.startsWith('internal')) continue;
        const after = m.index + m[0].length;
        const window = text.slice(after, after + 1600);
        if (/\breturns\s*:/.test(window)) {
          ok += 1;
        } else {
          missing.push(`${relative(CONVEX_ROOT, file)}:${name}`);
        }
      }
    }
    expect(missing, `missing returns: ${missing.join(', ')}`).toEqual([]);
    expect(ok).toBeGreaterThanOrEqual(170);
  });
});
