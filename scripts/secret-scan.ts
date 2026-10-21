import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const EXCLUDE = new Set(['node_modules', '.git', 'dist', 'coverage']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE.has(name)) continue;
    if (name.endsWith('.test.ts')) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const credUrl = /https?:\/\/[^\s"'<>]*[?#][^\s"'<>]*/g;
const credPath = /https?:\/\/[^/\s"'<>]+\/[A-Za-z0-9_\-]{8,}(?=[\s"'<>]|$)/g;
const hits: string[] = [];
for (const f of walk(ROOT)) {
  let text = '';
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  const lines = text.split(/\n/);
  lines.forEach((line, i) => {
    if (/!\[[^\]]*\]\(https?:\/\//.test(line)) return; // allow markdown badges
    if (credUrl.test(line)) hits.push(`${relative(ROOT, f)}:${i + 1}: query/fragment in URL`);
    credUrl.lastIndex = 0;
    if (credPath.test(line)) hits.push(`${relative(ROOT, f)}:${i + 1}: path segment in URL`);
    credPath.lastIndex = 0;
  });
}
if (hits.length) {
  console.error('SECRET SCAN FAILED:');
  hits.forEach((h) => console.error(h));
  process.exit(1);
}
console.log('secret scan clean');
