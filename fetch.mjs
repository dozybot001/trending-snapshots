// Snapshots the three GitHub trending lists as JSON, dated in Asia/Shanghai.
// Runs in GitHub Actions because github.com is unreachable from the digest server.
import { mkdir, writeFile } from 'node:fs/promises';
import { fetchAll } from './crawl.mjs';
const date = process.env.TREND_DATE || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
const lists = await fetchAll({ top: 25 });
for (const dir of [`lists/${date}`, 'lists/latest']) {
  await mkdir(dir, { recursive: true });
  for (const [list, repos] of Object.entries(lists)) await writeFile(`${dir}/${list}.json`, JSON.stringify(repos, null, 1) + '\n');
}
console.log(date, Object.entries(lists).map(([l, r]) => `${l} ${r.length}`).join(', '));
