/* Markdown（本项目协议文档子集）→ Word
 * 支持：# 标题、表格、> 引用、- 列表、**加粗**、---、普通段落 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  Header, Footer, PageNumber, LevelFormat, VerticalAlign, convertInchesToTwip,
} = require('docx');

// 显式写入 East Asia 字体映射，确保 Word 与 LibreOffice 均能正确显示中文。
const CN = { ascii: 'Arial Unicode MS', hAnsi: 'Arial Unicode MS', eastAsia: 'Arial Unicode MS', cs: 'Arial Unicode MS' };
const CN_BOLD = CN;
const ACCENT = '0C86A0';
const GRAY = '5B6270';

const PAGE_W = 12240 - convertInchesToTwip(1) * 2; // Letter 正文宽度 ≈ 9360 dxa

/* ---------- 行内解析：**加粗** ---------- */
function runs(text, base = {}) {
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), font: CN, ...base }));
    out.push(new TextRun({ text: m[1], font: CN, bold: true, ...base }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), font: CN, ...base }));
  return out.length ? out : [new TextRun({ text: '', font: CN, ...base })];
}

const stripMd = (t) => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\\\*/g, '*');

/* ---------- 表格 ---------- */
function makeTable(head, rows) {
  const n = head.length;
  const widths = [];
  // 首列略窄，其余均分
  const first = Math.round(PAGE_W * (n >= 4 ? 0.2 : 0.26));
  widths.push(first);
  const rest = Math.floor((PAGE_W - first) / (n - 1));
  for (let i = 1; i < n; i += 1) widths.push(i === n - 1 ? PAGE_W - first - rest * (n - 2) : rest);

  const cell = (text, i, isHead) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: isHead ? { type: ShadingType.CLEAR, fill: 'F2F5F7', color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { before: 0, after: 0, line: 280 },
      children: runs(text, { size: 20, bold: isHead || undefined }),
    })],
  });

  return new Table({
    columnWidths: widths,
    width: { size: PAGE_W, type: WidthType.DXA },
    indent: { size: 120, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 3, color: 'C9CFD8' },
      bottom: { style: BorderStyle.SINGLE, size: 3, color: 'C9CFD8' },
      left: { style: BorderStyle.SINGLE, size: 3, color: 'C9CFD8' },
      right: { style: BorderStyle.SINGLE, size: 3, color: 'C9CFD8' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 3, color: 'DCE1E8' },
      insideVertical: { style: BorderStyle.SINGLE, size: 3, color: 'DCE1E8' },
    },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((c, i) => cell(c, i, true)) }),
      ...rows.map((r) => new TableRow({
        children: Array.from({ length: n }, (_, i) => cell(r[i] || '', i, false)),
      })),
    ],
  });
}

/* ---------- 主解析 ---------- */
function parse(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const kids = [];
  let i = 0;
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i += 1; continue; }

    /* 分隔线 */
    if (/^---+$/.test(line.trim())) {
      kids.push(new Paragraph({
        spacing: { before: 120, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'DCE1E8', space: 1 } },
        children: [new TextRun({ text: '', font: CN })],
      }));
      i += 1; continue;
    }

    /* 标题 */
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lv = h[1].length;
      const text = stripMd(h[2]);
      if (lv === 1) {
        kids.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 0, after: 280 },
          children: [new TextRun({ text, font: CN_BOLD, bold: true, size: 34, color: '1B2027' })],
        }));
      } else if (lv === 2) {
        kids.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          keepNext: true,
          spacing: { before: 280, after: 140 },
          children: [new TextRun({ text, font: CN_BOLD, bold: true, size: 26, color: ACCENT })],
        }));
      } else {
        kids.push(new Paragraph({
          heading: lv === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
          keepNext: true,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text, font: CN_BOLD, bold: true, size: 24, color: '1F4D78' })],
        }));
      }
      i += 1; continue;
    }

    /* 表格 */
    if (/^\|/.test(line) && /^\|[\s:|-]+\|$/.test(lines[i + 1] || '')) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(cells(lines[i])); i += 1; }
      kids.push(makeTable(head, rows));
      kids.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: '', font: CN, size: 12 })] }));
      continue;
    }

    /* 引用（草稿状态说明 / 法务提示） */
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      buf.forEach((t, k) => kids.push(new Paragraph({
        spacing: { before: k === 0 ? 120 : 0, after: k === buf.length - 1 ? 200 : 0, line: 300 },
        indent: { left: 240 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'C3C9D6', space: 8 } },
        shading: { type: ShadingType.CLEAR, fill: 'F6F7FA', color: 'auto' },
        children: runs(t, { size: 19, color: GRAY }),
      })));
      continue;
    }

    /* 无序列表 */
    if (/^[-*]\s+/.test(line)) {
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        kids.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { after: 80, line: 300 },
          children: runs(lines[i].replace(/^[-*]\s+/, ''), { size: 22 }),
        }));
        i += 1;
      }
      continue;
    }

    /* 有序列表 */
    if (/^\d+\.\s+/.test(line)) {
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        kids.push(new Paragraph({
          numbering: { reference: 'numbers', level: 0 },
          spacing: { after: 80, line: 300 },
          children: runs(lines[i].replace(/^\d+\.\s+/, ''), { size: 22 }),
        }));
        i += 1;
      }
      continue;
    }

    /* 普通段落；(a)(b) 等子项缩进 */
    const isSub = /^\((?:[a-z]|[0-9]+)\)/.test(line.trim()) || /^[❌•]/.test(line.trim());
    kids.push(new Paragraph({
      spacing: { after: 120, line: 300 },
      indent: isSub ? { left: 320 } : undefined,
      children: runs(line.trim(), { size: 22 }),
    }));
    i += 1;
  }
  return kids;
}

/* ---------- 输出 ---------- */
function build(mdPath, outPath, titleForHeader, version, audience) {
  const src = fs.readFileSync(mdPath, 'utf8');
  const doc = new Document({
    creator: '四川萃雅教育科技有限公司',
    title: titleForHeader,
    description: `天府未来教育中心 · ${audience}法律文本（${version}）`,
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 270 } } },
        }],
      }, {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 270 } } },
        }],
      }],
    },
    styles: {
      default: {
        document: { run: { font: CN, size: 22, color: '2F3540' }, paragraph: { spacing: { after: 120, line: 300 } } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DCE1E8', space: 4 } },
            children: [new TextRun({ text: `天府未来教育中心 · ${titleForHeader}（${version}）`, font: CN, size: 16, color: '9097A3' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '四川萃雅教育科技有限公司　　第 ', font: CN, size: 16, color: '9097A3' }),
              new TextRun({ children: [PageNumber.CURRENT], font: CN, size: 16, color: '9097A3' }),
              new TextRun({ text: ' 页 / 共 ', font: CN, size: 16, color: '9097A3' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: CN, size: 16, color: '9097A3' }),
              new TextRun({ text: ' 页', font: CN, size: 16, color: '9097A3' }),
            ],
          })],
        }),
      },
      children: parse(src),
    }],
  });
  return Packer.toBuffer(doc).then((buf) => {
    fs.writeFileSync(outPath, buf);
    console.log('✓', path.basename(outPath), (buf.length / 1024).toFixed(0) + 'KB');
  });
}

const JOBS = [
  ['家长端平台服务协议.md', '天府未来教育中心_平台服务协议（家长端）_v1.1.docx', '平台服务协议（家长端）', 'v1.1', '家长端'],
  ['家长端课程服务协议.md', '天府未来教育中心_课程服务协议（家长端）_v1.1.docx', '课程服务协议（家长端）', 'v1.1', '家长端'],
  ['家长端隐私政策.md', '天府未来教育中心_隐私政策（家长端）_v1.1.docx', '隐私政策（家长端）', 'v1.1', '家长端'],
  ['商户入驻平台协议.md', '天府未来教育中心_商户入驻平台协议_v0.2.docx', '商户入驻平台协议', 'v0.2', '商户端'],
];
const SRC = process.argv[2];
const OUT = process.argv[3];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [md, out, title, version, audience] of JOBS) {
    await build(path.join(SRC, md), path.join(OUT, out), title, version, audience);
  }
})();
