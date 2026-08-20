/* build-index.mjs
   tools/ 폴더의 각 프로그램 HTML에서 <!--PROGRAM ... PROGRAM--> 메타데이터를 읽어
   programs.js를 자동으로 다시 만듭니다.  (GitHub Action이 실행하거나, 로컬에서 `node build-index.mjs`)
*/
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const TOOLS = 'tools';
const OUT = 'programs.js';

function parseBlock(text) {
  const m = text.match(/<!--PROGRAM([\s\S]*?)PROGRAM-->/);
  if (!m) return null;
  const obj = {};
  m[1].split(/\r?\n/).forEach(line => {
    const i = line.indexOf(':');
    if (i < 0) return;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    if (!key) return;
    if (key === 'tags') obj.tags = val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
    else obj[key] = val;
  });
  return obj.name ? obj : null;
}

const files = (await readdir(TOOLS)).filter(f => /\.html?$/i.test(f));
const items = [];
for (const f of files) {
  const raw = await readFile(path.join(TOOLS, f), 'utf8');
  const p = parseBlock(raw);
  if (!p) { console.warn('메타데이터 없음(건너뜀):', f); continue; }
  if (!p.file) p.file = `${TOOLS}/${f}`;
  items.push(p);
}
// 갱신일(updated) 최신순, 없으면 이름순
items.sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || (a.name || '').localeCompare(b.name || ''));

const body = items.map(p =>
  '  {\n' +
  `    name: ${JSON.stringify(p.name || '')},\n` +
  `    desc: ${JSON.stringify(p.desc || '')},\n` +
  `    category: ${JSON.stringify(p.category || '기타')},\n` +
  `    icon: ${JSON.stringify(p.icon || '🧰')},\n` +
  `    tags: [${(p.tags || []).map(t => JSON.stringify(t)).join(', ')}],\n` +
  `    price: ${JSON.stringify(p.price || '')},\n` +
  (p.download ? `    download: ${JSON.stringify(p.download)},\n` : '') +
  `    file: ${JSON.stringify(p.file)},\n` +
  `    updated: ${JSON.stringify(p.updated || '')}\n` +
  '  }'
).join(',\n');

const out =
`/* 이 파일은 build-index.mjs가 자동으로 생성합니다. 직접 고치지 마세요.
   프로그램을 추가하려면 tools 폴더에 파일을 넣고 <!--PROGRAM ...--> 메타데이터를 적으세요. */
window.PROGRAMS = [
${body}
];
`;

await writeFile(OUT, out, 'utf8');
console.log(`programs.js 생성 완료 — 프로그램 ${items.length}개`);
