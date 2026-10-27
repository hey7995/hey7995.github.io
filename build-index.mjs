/* build-index.mjs
   tools/ 폴더의 각 프로그램 HTML에서 <!--PROGRAM ... PROGRAM--> 메타데이터를 읽어
   programs.js를 자동으로 다시 만들고, 각 페이지의 검색·공유 태그와 만든이 링크, sitemap.xml도 갱신합니다.  (GitHub Action이 실행하거나, 로컬에서 `node build-index.mjs`)
*/
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
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

/* ───────────────── 검색·공유 태그, 만든이 링크, 사이트맵 ─────────────────
   각 프로그램 페이지에 아래 두 블록을 자동으로 넣거나 갱신합니다. (블록 안은 직접 고치지 마세요)
     <!--SEO:auto--> ... <!--/SEO:auto-->       : 설명·공유 미리보기(og) 태그
     만든이: 컴매니저 (helpcomkr.com 링크)       : 페이지 맨 아래
     <!--ADS:auto--> ... <!--/ADS:auto-->       : 구글 애드센스 코드 (ADSENSE_CLIENT)
   공유 이미지를 따로 쓰려면 PROGRAM 메타에  ogimage: 이미지주소  를 적으세요. */
const SITE = 'https://tools.helpcomkr.com/';
const HOME = 'https://helpcomkr.com/';
const SITE_NAME = '생활에 도움이 되는 프로그램';
const DEFAULT_OG = SITE + 'assets/og-default.png';
// 구글 애드센스 게시자 ID. 비워 두면('') 광고 코드를 넣지 않습니다.
const ADSENSE_CLIENT = 'ca-pub-2029767844815756';
const exists = p => access(p).then(() => true, () => false);
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const CREDIT_LINK = `만든이: <a href="${HOME}" target="_blank" rel="noopener" style="color:inherit"><b>컴매니저</b></a>`;

async function ogImage(p) {
  if (p.ogimage) return /^https?:/.test(p.ogimage) ? p.ogimage : SITE + p.ogimage;
  if (p.icon && /\.(png|jpe?g|webp)$/i.test(p.icon)) return SITE + p.icon;
  if (p.file.endsWith('/') && await exists(path.join(p.file, 'icon-512.png'))) return SITE + p.file + 'icon-512.png';
  return DEFAULT_OG;
}

function withCredit(html) {
  if (html.includes('<!--CREDIT:auto-->')) {
    return html.replace(/<!--CREDIT:auto-->[\s\S]*?<!--\/CREDIT:auto-->/, m => m.replace(/만든이:[\s\S]*?<\/a>/, CREDIT_LINK));
  }
  // 이미 "만든이 컴매니저" 문구가 있으면 그 자리에 링크만 겁니다.
  const inline = /만든이\s*:?\s*<b>컴매니저<\/b>/;
  if (inline.test(html)) return html.replace(inline, CREDIT_LINK);
  if (html.includes(CREDIT_LINK)) return html;
  // 하단 고정 메뉴가 있는 앱은 메뉴에 가리지 않게 아래 여백을 더 줍니다.
  const fixedBottom = /position:\s*fixed[^}]*bottom:\s*0/.test(html);
  const block = `<!--CREDIT:auto--><div style="text-align:center;font-size:13px;opacity:.75;padding:24px 16px ${fixedBottom ? 'calc(96px + env(safe-area-inset-bottom,0px))' : '28px'}">${CREDIT_LINK}</div><!--/CREDIT:auto-->\n`;
  const i = html.lastIndexOf('</body>');
  return i < 0 ? html : html.slice(0, i) + block + html.slice(i);
}

async function withSeo(html, p) {
  html = html.replace(/[ \t]*<!--SEO:auto-->[\s\S]*?<!--\/SEO:auto-->\n?/, '');
  const url = SITE + p.file;
  const img = await ogImage(p);
  const title = `${p.name} | ${SITE_NAME}`;
  const lines = [
    /<meta\s+name=["']description["']/i.test(html) ? null : `<meta name="description" content="${attr(p.desc)}">`,
    /<link\s+rel=["']canonical["']/i.test(html) ? null : `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:locale" content="ko_KR">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(p.desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta name="twitter:card" content="${img === DEFAULT_OG ? 'summary_large_image' : 'summary'}">`,
  ].filter(Boolean);
  const block = `<!--SEO:auto-->\n${lines.join('\n')}\n<!--/SEO:auto-->\n`;
  const i = html.indexOf('</head>');
  return i < 0 ? html : html.slice(0, i) + block + html.slice(i);
}

function withAds(html) {
  html = html.replace(/[ \t]*<!--ADS:auto-->[\s\S]*?<!--\/ADS:auto-->\n?/, '');
  if (!ADSENSE_CLIENT || html.includes(ADSENSE_CLIENT)) return html;
  const block = `<!--ADS:auto--><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script><!--/ADS:auto-->\n`;
  const i = html.indexOf('</head>');
  return i < 0 ? html : html.slice(0, i) + block + html.slice(i);
}

let touched = 0;
for (const p of items) {
  const target = p.file.endsWith('/') ? path.join(p.file, 'index.html') : p.file;
  if (!(await exists(target))) { console.warn('페이지 없음(건너뜀):', target); continue; }
  const before = await readFile(target, 'utf8');
  const after = withAds(withCredit(await withSeo(before, p)));
  if (after !== before) { await writeFile(target, after, 'utf8'); touched++; }
}
console.log(`검색·공유 태그와 만든이 링크 점검 완료 — 수정한 페이지 ${touched}개`);

// 사이트맵: 메인 + 각 프로그램 (갱신일이 2026-10처럼 월까지면 1일로 적습니다)
const day = u => /^\d{4}-\d{2}$/.test(u || '') ? `${u}-01` : (/^\d{4}-\d{2}-\d{2}$/.test(u || '') ? u : null);
const latest = items.map(p => day(p.updated)).filter(Boolean).sort().pop();
const urls = [{ loc: SITE, lastmod: latest }, ...items.map(p => ({ loc: SITE + p.file, lastmod: day(p.updated) }))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
await writeFile('sitemap.xml', sitemap, 'utf8');
console.log(`sitemap.xml 생성 완료 — 주소 ${urls.length}개`);
