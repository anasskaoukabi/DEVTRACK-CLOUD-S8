const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 16:9

// ── Palette ──────────────────────────────────────────────
const C = {
  white:       'FFFFFF',
  black:       '0F172A',
  slate:       '475569',
  slateLight:  '94A3B8',
  border:      'E2E8F0',
  bg:          'F8FAFC',
  indigo:      '6366F1',
  indigoDark:  '4338CA',
  violet:      '8B5CF6',
  pink:        'EC4899',
  blue:        '3B82F6',
  blueDark:    '1D4ED8',
  green:       '16A34A',
  greenLight:  'DCFCE7',
  orange:      'EA580C',
  teal:        '0D9488',
  red:         'DC2626',
  amber:       'D97706',
  purple:      '7C3AED',
};

// ── Helpers ───────────────────────────────────────────────
const font = 'Calibri';

function slide(pptx) {
  const s = pptx.addSlide();
  // White background
  s.background = { color: C.white };
  return s;
}

function accentBar(s, color1 = C.indigo, color2 = C.pink) {
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.07,
    fill: { type: 'gradient', gradientType: 'linear', color: color1, color2: color2, angle: 90 },
    line: { color: color1, width: 0 },
  });
}

function badge(s, text, x, y, bgColor, textColor) {
  const w = text.length * 0.085 + 0.3;
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.27,
    fill: { color: bgColor },
    line: { color: bgColor },
    rectRadius: 0.1,
  });
  s.addText(text, {
    x, y, w, h: 0.27,
    fontSize: 8.5, bold: true, color: textColor,
    align: 'center', valign: 'middle', fontFace: font,
  });
  return w + 0.1;
}

function sectionLabel(s, text, x, y, w) {
  s.addText(text.toUpperCase(), {
    x, y, w, h: 0.22,
    fontSize: 7.5, bold: true, color: C.slateLight,
    fontFace: font, charSpacing: 1.5,
  });
}

function cardBox(s, x, y, w, h, opts = {}) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: opts.fill || C.bg },
    line: { color: opts.border || C.border, width: 1 },
    rectRadius: 0.12,
    shadow: opts.shadow ? { type: 'outer', blur: 6, offset: 2, angle: 45, color: 'CCCCCC' } : undefined,
  });
}

function statBox(s, x, y, w, num, label, color = C.indigo) {
  cardBox(s, x, y, w, 1.1);
  s.addText(num, {
    x, y: y + 0.1, w, h: 0.55,
    fontSize: 32, bold: true, color: color,
    align: 'center', fontFace: font,
  });
  s.addText(label, {
    x, y: y + 0.65, w, h: 0.35,
    fontSize: 9, color: C.slate, align: 'center', fontFace: font,
  });
}

function featureRow(s, icon, title, desc, x, y, w) {
  s.addText(icon, {
    x, y, w: 0.38, h: 0.38,
    fontSize: 16, align: 'center', valign: 'middle',
  });
  s.addText(title, {
    x: x + 0.45, y: y + 0.01, w: w - 0.45, h: 0.2,
    fontSize: 10, bold: true, color: C.black, fontFace: font,
  });
  s.addText(desc, {
    x: x + 0.45, y: y + 0.21, w: w - 0.45, h: 0.18,
    fontSize: 8.5, color: C.slate, fontFace: font,
  });
  // separator line
  s.addShape(pptx.ShapeType.line, {
    x, y: y + 0.44, w, h: 0,
    line: { color: C.border, width: 0.5 },
  });
}

function slideHeader(s, icon, title, subtitle, iconBg) {
  accentBar(s);
  // icon box
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 0.18, w: 0.6, h: 0.6,
    fill: { color: iconBg }, line: { color: iconBg },
    rectRadius: 0.1,
  });
  s.addText(icon, {
    x: 0.4, y: 0.18, w: 0.6, h: 0.6,
    fontSize: 22, align: 'center', valign: 'middle',
  });
  // title
  s.addText(title, {
    x: 1.15, y: 0.2, w: 8.5, h: 0.38,
    fontSize: 18, bold: true, color: C.black, fontFace: font,
  });
  s.addText(subtitle, {
    x: 1.15, y: 0.57, w: 8.5, h: 0.2,
    fontSize: 9, color: C.slateLight, fontFace: font,
  });
  // separator
  s.addShape(pptx.ShapeType.line, {
    x: 0.4, y: 0.9, w: 12.3, h: 0,
    line: { color: C.border, width: 0.7 },
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  accentBar(s);

  // Gradient accent block left
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0.07, w: 4.2, h: 7.43,
    fill: { type: 'gradient', gradientType: 'linear', color: C.indigoDark, color2: C.violet, angle: 135 },
    line: { color: C.indigoDark, width: 0 },
  });

  // White logo box
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.35, y: 1.1, w: 1.5, h: 1.5,
    fill: { color: C.white }, line: { color: C.white },
    rectRadius: 0.22,
  });
  s.addText('📋', { x: 1.35, y: 1.1, w: 1.5, h: 1.5, fontSize: 52, align: 'center', valign: 'middle' });

  // Project name on dark
  s.addText('DevTrack', {
    x: 0.2, y: 2.9, w: 3.8, h: 0.75,
    fontSize: 40, bold: true, color: C.white, align: 'center', fontFace: font,
  });
  s.addText('v2.0', {
    x: 0.2, y: 3.6, w: 3.8, h: 0.3,
    fontSize: 13, color: 'C7D2FE', align: 'center', fontFace: font, italic: true,
  });

  // Thin white line
  s.addShape(pptx.ShapeType.line, {
    x: 0.8, y: 4.05, w: 2.6, h: 0,
    line: { color: '818CF8', width: 0.8 },
  });

  // Subtitle on dark
  s.addText('Plateforme de gestion de\nprojets Agile / Scrum', {
    x: 0.2, y: 4.2, w: 3.8, h: 0.75,
    fontSize: 12, color: 'E0E7FF', align: 'center', fontFace: font,
  });

  // Right side — content
  s.addText('Présentation du Projet', {
    x: 4.6, y: 0.5, w: 8, h: 0.35,
    fontSize: 10, color: C.slateLight, fontFace: font, italic: true,
  });

  s.addShape(pptx.ShapeType.line, {
    x: 4.6, y: 0.9, w: 7.7, h: 0,
    line: { color: C.border, width: 0.7 },
  });

  // Main tagline
  s.addText('Une solution complète pour piloter\nle cycle de vie du logiciel', {
    x: 4.6, y: 1.15, w: 7.7, h: 1.1,
    fontSize: 22, bold: true, color: C.black, fontFace: font, lineSpacingMultiple: 1.3,
  });

  s.addText(
    'DevTrack centralise la gestion des projets, sprints, tâches, bugs, tests ' +
    'et la collaboration d\'équipe au sein d\'une seule plateforme web sécurisée et moderne.',
    {
      x: 4.6, y: 2.45, w: 7.7, h: 0.75,
      fontSize: 10.5, color: C.slate, fontFace: font, lineSpacingMultiple: 1.4,
    }
  );

  // Tech badges
  const techBadges = [
    ['⚛️ React 18', 'EDE9FE', C.violet],
    ['🟢 Node.js', 'DCFCE7', C.green],
    ['🍃 MongoDB', 'FEF3C7', C.amber],
    ['🔌 Socket.io', 'FFE4E6', C.red],
    ['🔐 JWT Auth', 'DBEAFE', C.blueDark],
    ['📊 Recharts', 'F0FDFA', C.teal],
  ];
  let bx = 4.6;
  let by = 3.5;
  techBadges.forEach(([label, bg, color]) => {
    const bw = label.length * 0.083 + 0.28;
    if (bx + bw > 12.1) { bx = 4.6; by += 0.35; }
    badge(s, label, bx, by, bg, color);
    bx += bw + 0.05;
  });

  // Bottom info
  s.addShape(pptx.ShapeType.line, {
    x: 4.6, y: 6.4, w: 7.7, h: 0,
    line: { color: C.border, width: 0.7 },
  });
  s.addText('Année universitaire 2024 – 2025', {
    x: 4.6, y: 6.55, w: 4, h: 0.25,
    fontSize: 9, color: C.slateLight, fontFace: font,
  });
  s.addText('Full-Stack Web Application', {
    x: 9.5, y: 6.55, w: 2.8, h: 0.25,
    fontSize: 9, color: C.slateLight, fontFace: font, align: 'right',
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 2 — OBJECTIF
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '🎯', 'Objectif du Projet', 'Slide 2 / 10  •  Problématique et vision', 'EDE9FE');

  // Highlight box
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 1.05, w: 12.3, h: 0.85,
    fill: { type: 'gradient', gradientType: 'linear', color: C.indigo, color2: C.violet, angle: 90 },
    line: { color: C.indigo, width: 0 },
    rectRadius: 0.12,
  });
  s.addText('Centraliser l\'intégralité du cycle de développement logiciel en une plateforme Agile unifiée', {
    x: 0.55, y: 1.1, w: 12, h: 0.75,
    fontSize: 14, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: font,
  });

  // 4 objective cards
  const cards = [
    { icon: '📐', title: 'Méthodologie Agile / Scrum', desc: 'Gérer des sprints, du backlog et des story points de manière native, avec estimation collaborative (Planning Poker)', bg: 'EEF2FF', col: C.indigoDark },
    { icon: '👥', title: 'Collaboration d\'équipe', desc: 'Réunions structurées, commentaires avec @mentions, notifications en temps réel via WebSockets', bg: 'F0FDF4', col: C.green },
    { icon: '🧪', title: 'Qualité & Tests intégrés', desc: 'Plans de test, code review, métriques de complexité et suivi exhaustif des bugs par sévérité', bg: 'FFF7ED', col: C.orange },
    { icon: '📊', title: 'Reporting & Analytiques', desc: 'Tableaux de bord, exports CSV/PDF, diagrammes de Gantt et vue portfolio multi-projets', bg: 'FDF4FF', col: C.purple },
  ];

  const cx = [0.4, 6.4, 0.4, 6.4];
  const cy = [2.1, 2.1, 4.2, 4.2];

  cards.forEach((c, i) => {
    cardBox(s, cx[i], cy[i], 5.8, 1.85, { fill: c.bg, border: C.border, shadow: true });
    s.addText(c.icon, { x: cx[i] + 0.15, y: cy[i] + 0.15, w: 0.5, h: 0.5, fontSize: 22 });
    s.addText(c.title, {
      x: cx[i] + 0.75, y: cy[i] + 0.18, w: 4.85, h: 0.28,
      fontSize: 11.5, bold: true, color: c.col, fontFace: font,
    });
    s.addText(c.desc, {
      x: cx[i] + 0.75, y: cy[i] + 0.5, w: 4.85, h: 1.15,
      fontSize: 9.5, color: C.slate, fontFace: font, lineSpacingMultiple: 1.35,
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 3 — ARCHITECTURE
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '🏗️', 'Architecture Globale', 'Slide 3 / 10  •  Architecture 3-tiers découplée', 'DBEAFE');

  // Three arch boxes
  const archItems = [
    { icon: '⚛️', title: 'Frontend', sub: 'React 18 + Vite', desc: 'SPA avec 25+ pages\nTailwind CSS\nPort : 3000', col: C.violet, bg: 'EDE9FE', border: 'C4B5FD' },
    { icon: '🟢', title: 'Backend API', sub: 'Express.js + Socket.io', desc: '28 routes REST\nAuthentification JWT\nPort : 3001', col: C.green, bg: 'DCFCE7', border: 'BBF7D0' },
    { icon: '🍃', title: 'Base de données', sub: 'MongoDB + Mongoose', desc: '26 modèles de données\nIndexation avancée\nRelations référencées', col: C.orange, bg: 'FFF7ED', border: 'FED7AA' },
  ];

  archItems.forEach((a, i) => {
    const x = 0.4 + i * 4.15;
    cardBox(s, x, 1.1, 3.9, 2.55, { fill: a.bg, border: a.border, shadow: true });
    s.addText(a.icon, { x, y: 1.2, w: 3.9, h: 0.55, fontSize: 28, align: 'center' });
    s.addText(a.title, { x, y: 1.78, w: 3.9, h: 0.3, fontSize: 13, bold: true, color: a.col, align: 'center', fontFace: font });
    s.addText(a.sub, { x, y: 2.08, w: 3.9, h: 0.22, fontSize: 9, color: C.slate, align: 'center', fontFace: font, italic: true });
    s.addShape(pptx.ShapeType.line, { x: x + 0.4, y: 2.35, w: 3.1, h: 0, line: { color: a.border, width: 0.7 } });
    s.addText(a.desc, { x: x + 0.2, y: 2.45, w: 3.5, h: 0.9, fontSize: 9.5, color: C.slate, fontFace: font, lineSpacingMultiple: 1.4, align: 'center' });

    // Arrow between boxes
    if (i < 2) {
      s.addText('⇆', { x: 4.25 + i * 4.15, y: 2.15, w: 0.3, h: 0.35, fontSize: 18, align: 'center', color: C.slateLight });
    }
  });

  // Bottom 3 columns
  const botCards = [
    { title: '🔐 Sécurité', items: ['JWT • bcryptjs', 'RBAC (6 rôles)', 'Rate Limiting', 'CORS'], bg: 'FDF4FF', border: 'E9D5FF' },
    { title: '⚡ Temps réel', items: ['Socket.io WebSockets', 'Notifications live', 'Planning Poker', 'Rooms par projet'], bg: 'FFF7ED', border: 'FED7AA' },
    { title: '📄 Exports', items: ['PDF (PDFKit / pdfmake)', 'CSV (csv-stringify)', 'Uploads (Multer)', 'Webhooks externes'], bg: 'F0FDF4', border: 'BBF7D0' },
  ];

  botCards.forEach((c, i) => {
    const x = 0.4 + i * 4.15;
    cardBox(s, x, 3.85, 3.9, 2.75, { fill: c.bg, border: c.border });
    s.addText(c.title, { x: x + 0.2, y: 3.98, w: 3.5, h: 0.3, fontSize: 10.5, bold: true, color: C.black, fontFace: font });
    c.items.forEach((item, j) => {
      s.addText('• ' + item, {
        x: x + 0.25, y: 4.38 + j * 0.47, w: 3.4, h: 0.35,
        fontSize: 9.5, color: C.slate, fontFace: font,
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 4 — STACK FRONTEND
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '⚛️', 'Stack Frontend', 'Slide 4 / 10  •  Interface utilisateur moderne et réactive', 'FCE7F3');

  const techs = [
    { icon: '⚛️', name: 'React 18.2', role: 'Framework UI', desc: 'Composants fonctionnels, Context API\npour la gestion d\'état globale', bg: 'EDE9FE', col: C.violet },
    { icon: '⚡', name: 'Vite 5.2', role: 'Build tool', desc: 'Hot Module Replacement, proxy API\nvers le backend Express', bg: 'DBEAFE', col: C.blueDark },
    { icon: '🎨', name: 'Tailwind CSS 3.4', role: 'Styling', desc: 'Design system utility-first,\ninterface responsive et cohérente', bg: 'CCFBF1', col: C.teal },
    { icon: '📈', name: 'Recharts + ReactFlow', role: 'Visualisation', desc: 'Graphiques interactifs (burndown,\nvélocité), diagrammes de flux', bg: 'FFF7ED', col: C.orange },
    { icon: '📅', name: 'FullCalendar 6', role: 'Calendrier', desc: 'Vue calendrier pour réunions\net jalons de projet', bg: 'FDF4FF', col: C.purple },
    { icon: '✍️', name: 'TipTap 3 + @dnd-kit', role: 'Éditeur / DnD', desc: 'Éditeur riche collaboratif\n+ Drag & Drop Kanban natif', bg: 'F0FDF4', col: C.green },
  ];

  const cols = [0.4, 4.45, 8.5];
  const rows = [1.1, 3.55];

  techs.forEach((t, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = cols[col];
    const y = rows[row];
    cardBox(s, x, y, 3.8, 2.2, { fill: t.bg, border: C.border, shadow: true });
    s.addText(t.icon, { x, y: y + 0.12, w: 3.8, h: 0.45, fontSize: 22, align: 'center' });
    s.addText(t.name, { x: x + 0.15, y: y + 0.6, w: 3.5, h: 0.28, fontSize: 11, bold: true, color: t.col, fontFace: font });
    s.addText(t.role.toUpperCase(), {
      x: x + 0.15, y: y + 0.88, w: 3.5, h: 0.2,
      fontSize: 7.5, color: C.slateLight, fontFace: font, bold: true, charSpacing: 0.8,
    });
    s.addText(t.desc, {
      x: x + 0.15, y: y + 1.1, w: 3.5, h: 0.9,
      fontSize: 9, color: C.slate, fontFace: font, lineSpacingMultiple: 1.35,
    });
  });

  // Footer bar
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 5.9, w: 12.3, h: 0.55,
    fill: { color: C.bg }, line: { color: C.border, width: 0.8 }, rectRadius: 0.08,
  });
  s.addText('Également : React Router DOM 6  •  Axios  •  Socket.io-client  •  react-hot-toast  •  25+ pages  •  Composant <Can> (RBAC)', {
    x: 0.6, y: 5.95, w: 12, h: 0.42,
    fontSize: 9, color: C.slate, fontFace: font, align: 'center',
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 5 — STACK BACKEND
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '🟢', 'Stack Backend', 'Slide 5 / 10  •  API REST robuste et sécurisée', 'DCFCE7');

  // Left column — tech list
  sectionLabel(s, 'Technologies principales', 0.4, 1.05, 5.8);

  const backTechs = [
    { icon: '🚀', name: 'Express.js 4.18', desc: '28 fichiers de routes REST, middleware RBAC centralisé' },
    { icon: '🍃', name: 'MongoDB + Mongoose 8', desc: '26 schémas de données, indexes composés, populate()' },
    { icon: '🔐', name: 'JWT + bcryptjs', desc: 'Auth stateless 24h, hachage sécurisé des mots de passe' },
    { icon: '🔌', name: 'Socket.io 4.8', desc: 'WebSockets : notifications live, rooms projet & poker' },
    { icon: '📄', name: 'PDFKit + pdfmake', desc: 'Génération de documents PDF avec templates métier' },
    { icon: '🛡️', name: 'express-rate-limit', desc: '10 req/min (auth), 200 req/min (API générale)' },
  ];

  backTechs.forEach((t, i) => {
    featureRow(s, t.icon, t.name, t.desc, 0.4, 1.35 + i * 0.82, 5.8);
  });

  // Right column — stats
  sectionLabel(s, 'Chiffres clés', 6.6, 1.05, 6);

  const stats = [
    { num: '28', label: 'Routes API REST', col: C.indigo },
    { num: '26', label: 'Modèles Mongoose', col: C.violet },
    { num: '6',  label: 'Rôles utilisateurs', col: C.green },
    { num: '4',  label: 'Générateurs de docs', col: C.orange },
  ];

  const sCol = [6.6, 9.5, 6.6, 9.5];
  const sRow = [1.35, 1.35, 2.75, 2.75];
  stats.forEach((st, i) => statBox(s, sCol[i], sRow[i], 2.7, st.num, st.label, st.col));

  // Middleware / patterns box
  cardBox(s, 6.6, 4.1, 6.0, 2.5, { fill: 'F8FAFC', border: C.border });
  s.addText('Patterns & Middleware', {
    x: 6.8, y: 4.2, w: 5.6, h: 0.28,
    fontSize: 10, bold: true, color: C.black, fontFace: font,
  });
  const patterns = [
    '📌  RESTful — verbes HTTP standards (GET, POST, PUT, DELETE)',
    '🔑  Middleware authenticateToken appliqué sur toutes les routes protégées',
    '📝  Audit Log automatique sur chaque opération CREATE / UPDATE / DELETE',
    '🌐  CORS configuré, body-parser JSON, dotenv pour les variables d\'env',
    '🗃️  Seeding réaliste via seed_all.js / seed_qa.js / seed_realistic.js',
  ];
  patterns.forEach((p, i) => {
    s.addText(p, {
      x: 6.75, y: 4.6 + i * 0.37, w: 5.65, h: 0.3,
      fontSize: 9, color: C.slate, fontFace: font,
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 6 — FONCTIONNALITÉS GESTION PROJET
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '📋', 'Fonctionnalités — Gestion de Projet', 'Slide 6 / 10  •  Cycle de vie complet des tâches et sprints Agile', 'EDE9FE');

  const features = [
    { icon: '🗂️', title: 'Projets & Sprints', desc: 'Création de projets, planification de sprints, vélocité, story points et burndown chart automatique', bg: 'EEF2FF', col: C.indigoDark },
    { icon: '✅', title: 'Tâches & Sous-tâches', desc: 'Cycle : BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → TESTING → DONE avec historique de statuts', bg: 'F0FDF4', col: C.green },
    { icon: '🐛', title: 'Bug Tracker', desc: '4 niveaux de sévérité : CRITICAL, HIGH, MEDIUM, LOW avec date de résolution', bg: 'FFF7ED', col: C.orange },
    { icon: '🎯', title: 'Kanban Board', desc: 'Glisser-déposer inter-colonnes avec @dnd-kit, vue visuelle par statut et priorité', bg: 'FDF4FF', col: C.purple },
    { icon: '📅', title: 'Gantt & Calendrier', desc: 'Timeline de projet interactive, vue calendrier des réunions et deadlines', bg: 'F0FDFA', col: C.teal },
    { icon: '🃏', title: 'Planning Poker', desc: 'Sessions d\'estimation collaboratives en temps réel via Socket.io, consensus automatique', bg: 'FDF2F8', col: C.pink },
    { icon: '🏁', title: 'Milestones', desc: 'Jalons de projet avec livrables définis et suivi de progression par pourcentage', bg: 'FFFBEB', col: C.amber },
    { icon: '⚠️', title: 'Gestion des Risques', desc: 'Registre des risques, scoring probabilité × impact, niveaux CRITICAL/HIGH/MEDIUM/LOW', bg: 'FEF2F2', col: C.red },
  ];

  const fCols = [0.4, 6.4];
  const fRows = [1.1, 2.55, 4.0, 5.45];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = fCols[col];
    const y = fRows[row];
    cardBox(s, x, y, 5.8, 1.25, { fill: f.bg, border: C.border });
    s.addText(f.icon, { x: x + 0.12, y: y + 0.1, w: 0.5, h: 0.5, fontSize: 20 });
    s.addText(f.title, { x: x + 0.72, y: y + 0.12, w: 4.88, h: 0.28, fontSize: 10.5, bold: true, color: f.col, fontFace: font });
    s.addText(f.desc, { x: x + 0.72, y: y + 0.42, w: 4.88, h: 0.72, fontSize: 9, color: C.slate, fontFace: font, lineSpacingMultiple: 1.3 });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 7 — COLLABORATION & QUALITÉ
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '👥', 'Fonctionnalités — Collaboration & Qualité', 'Slide 7 / 10  •  Travail d\'équipe et assurance qualité intégrés', 'DCFCE7');

  // Left — Collaboration
  sectionLabel(s, 'Collaboration & Communication', 0.4, 1.05, 6.0);
  const collab = [
    { icon: '💬', title: 'Commentaires & @Mentions', desc: 'Discussion contextualisée par tâche, notification automatique des utilisateurs mentionnés' },
    { icon: '🔔', title: 'Notifications temps réel', desc: 'Alertes live Socket.io : assignations, changements de statut, bugs critiques signalés' },
    { icon: '🤝', title: 'Réunions structurées', desc: 'Standup, Sprint Review, Rétrospective — ordre du jour, notes, actions items suivis' },
    { icon: '⏱️', title: 'Time Tracking', desc: 'Journaux d\'heures par tâche et par développeur, suivi de charge de travail' },
  ];
  collab.forEach((c, i) => featureRow(s, c.icon, c.title, c.desc, 0.4, 1.35 + i * 1.05, 5.9));

  // Separator
  s.addShape(pptx.ShapeType.line, {
    x: 6.6, y: 1.05, w: 0, h: 5.55,
    line: { color: C.border, width: 0.8 },
  });

  // Right — Qualité
  sectionLabel(s, 'Assurance Qualité (QA)', 6.8, 1.05, 5.8);
  const qa = [
    { icon: '🧪', title: 'Plans de test', desc: 'Test cases manuels & automatisés avec étapes, critères d\'entrée/sortie, scope' },
    { icon: '🔄', title: 'Cycles de test', desc: 'Suivi d\'exécution des tests, résultats par cycle, taux de réussite' },
    { icon: '🔍', title: 'Code Review', desc: 'Checklists de révision personnalisables, scoring pass/fail par critère' },
    { icon: '📐', title: 'Métriques de code', desc: 'Complexité cyclomatique, LOC, couverture de tests, indice de maintenabilité' },
  ];
  qa.forEach((q, i) => featureRow(s, q.icon, q.title, q.desc, 6.8, 1.35 + i * 1.05, 5.7));

  // Bottom banner
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 5.7, w: 12.3, h: 0.72,
    fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 0.8 }, rectRadius: 0.1,
  });
  s.addText('📝  Audit Log complet  •  Traçabilité de toutes les actions (CREATE / UPDATE / DELETE) avec utilisateur, horodatage et détail des changements', {
    x: 0.6, y: 5.78, w: 12, h: 0.56,
    fontSize: 9.5, color: C.green, fontFace: font, align: 'center', valign: 'middle',
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 8 — REPORTING & DOCS
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '📊', 'Reporting & Documentation', 'Slide 8 / 10  •  Visualisation des données et génération de documents métier', 'FFF7ED');

  // Top row — 3 dashboard cards
  sectionLabel(s, 'Tableaux de bord & Vues analytiques', 0.4, 1.05, 12.3);
  const dashboards = [
    { icon: '🏠', title: 'Dashboard Projet', desc: 'Progression tâches, statut des bugs, burndown chart, charge développeurs', bg: 'EEF2FF', col: C.indigoDark },
    { icon: '🗃️', title: 'Vue Portfolio', desc: 'Consolidation multi-projets, comparaison de métriques, allocation des ressources', bg: 'F0FDF4', col: C.green },
    { icon: '🔬', title: 'Dashboard Qualité', desc: 'Métriques de code par module, seuils configurables, suivi de la dette technique', bg: 'FDF4FF', col: C.purple },
  ];
  dashboards.forEach((d, i) => {
    const x = 0.4 + i * 4.15;
    cardBox(s, x, 1.3, 3.9, 1.55, { fill: d.bg, border: C.border, shadow: true });
    s.addText(d.icon, { x, y: 1.35, w: 3.9, h: 0.42, fontSize: 22, align: 'center' });
    s.addText(d.title, { x: x + 0.15, y: 1.78, w: 3.6, h: 0.28, fontSize: 10.5, bold: true, color: d.col, fontFace: font });
    s.addText(d.desc, { x: x + 0.15, y: 2.08, w: 3.6, h: 0.65, fontSize: 9, color: C.slate, fontFace: font, lineSpacingMultiple: 1.3 });
  });

  // Document types
  sectionLabel(s, 'Types de documents générés (PDF)', 0.4, 3.1, 12.3);
  const docTypes = [
    { label: '📋 Cahier des charges', bg: 'EDE9FE', col: C.violet },
    { label: '⚙️ Fiche technique', bg: 'DBEAFE', col: C.blueDark },
    { label: '📌 Fiche fonctionnelle', bg: 'DCFCE7', col: C.green },
    { label: '🏃 PV de Sprint', bg: 'FFF7ED', col: C.orange },
    { label: '🐛 Rapport de bugs', bg: 'FEF2F2', col: C.red },
    { label: '⏱️ Rapport de temps', bg: 'CCFBF1', col: C.teal },
    { label: '🚀 Release Notes', bg: 'F1F5F9', col: C.slate },
    { label: '✏️ Document custom', bg: 'FDF4FF', col: C.purple },
  ];
  let dx = 0.4, dy = 3.38;
  docTypes.forEach((d, i) => {
    if (i === 4) { dx = 0.4; dy = 3.82; }
    const dw = d.label.length * 0.079 + 0.35;
    badge(s, d.label, dx, dy, d.bg, d.col);
    dx += dw + 0.08;
  });

  // Export / search
  sectionLabel(s, 'Exports & Intégrations', 0.4, 4.35, 12.3);
  const exportCards = [
    { icon: '📊', title: 'Exports CSV', items: ['Tâches (filtres, colonnes)', 'Bugs (par sévérité)', 'Time logs (par dev / période)'], bg: 'F0FDF4', col: C.green },
    { icon: '📄', title: 'Exports PDF', items: ['Documents générés (templates)', 'Rapports complets de projet', 'Notes de réunions formatées'], bg: 'EEF2FF', col: C.indigoDark },
    { icon: '🔗', title: 'Intégrations', items: ['Webhooks vers systèmes externes', 'Recherche full-text globale', 'Upload de fichiers (Multer)'], bg: 'FFF7ED', col: C.orange },
    { icon: '🗓️', title: 'Vues temporelles', items: ['Diagramme de Gantt interactif', 'Calendrier (FullCalendar)', 'Historique des statuts'], bg: 'FDF4FF', col: C.purple },
  ];
  exportCards.forEach((ec, i) => {
    const x = 0.4 + i * 3.1;
    cardBox(s, x, 4.6, 2.9, 1.98, { fill: ec.bg, border: C.border });
    s.addText(ec.icon + ' ' + ec.title, { x: x + 0.12, y: 4.68, w: 2.65, h: 0.28, fontSize: 10, bold: true, color: ec.col, fontFace: font });
    ec.items.forEach((item, j) => {
      s.addText('• ' + item, { x: x + 0.15, y: 5.05 + j * 0.43, w: 2.65, h: 0.35, fontSize: 9, color: C.slate, fontFace: font });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 9 — SÉCURITÉ & RÔLES
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  slideHeader(s, '🔐', 'Sécurité & Gestion des Rôles', 'Slide 9 / 10  •  Contrôle d\'accès basé sur les rôles (RBAC)', 'FCE7F3');

  // Left — roles
  sectionLabel(s, 'Hiérarchie des rôles utilisateurs', 0.4, 1.05, 6.0);

  const roles = [
    { role: 'ADMIN',        perm: 'Accès total — gestion des utilisateurs et toutes les entités', col: C.red,      bg: 'FEF2F2' },
    { role: 'PRODUCT OWNER', perm: 'Création de projets, gestion du backlog, validation des sprints',col: C.purple,  bg: 'FDF4FF' },
    { role: 'SCRUM MASTER', perm: 'Gestion des sprints, communication d\'équipe, métriques',      col: C.amber,   bg: 'FFFBEB' },
    { role: 'DEV',          perm: 'Travail sur les tâches, commentaires, time logs',               col: C.blueDark, bg: 'EEF2FF' },
    { role: 'QA',           perm: 'Plans de test, exécution, rapport de bugs',                    col: C.teal,    bg: 'F0FDFA' },
    { role: 'CLIENT',       perm: 'Lecture seule — consultation des projets et avancements',      col: C.slate,   bg: 'F8FAFC' },
  ];

  roles.forEach((r, i) => {
    cardBox(s, 0.4, 1.3 + i * 0.82, 5.9, 0.72, { fill: r.bg, border: C.border });
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.52, y: 1.42 + i * 0.82, w: 1.4, h: 0.38,
      fill: { color: r.col }, line: { color: r.col }, rectRadius: 0.08,
    });
    s.addText(r.role, { x: 0.52, y: 1.42 + i * 0.82, w: 1.4, h: 0.38, fontSize: 8.5, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: font });
    s.addText(r.perm, { x: 2.05, y: 1.44 + i * 0.82, w: 4.1, h: 0.55, fontSize: 9.5, color: C.slate, fontFace: font, lineSpacingMultiple: 1.25 });

    // Level indicator bar
    const fillPct = [1.0, 0.83, 0.67, 0.5, 0.33, 0.17][i];
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.1, y: 1.51 + i * 0.82, w: 0.18, h: 0.22,
      fill: { color: r.col }, line: { color: r.col }, rectRadius: 0.03,
    });
  });

  // Separator
  s.addShape(pptx.ShapeType.line, {
    x: 6.6, y: 1.05, w: 0, h: 5.55,
    line: { color: C.border, width: 0.8 },
  });

  // Right — security mechanisms
  sectionLabel(s, 'Mécanismes de sécurité', 6.8, 1.05, 5.8);

  const secItems = [
    { icon: '🔑', title: 'JWT — JSON Web Token', desc: 'Authentification stateless, expiration 24h, secret configurable via .env', bg: 'EDE9FE', col: C.violet },
    { icon: '🔒', title: 'bcryptjs — Hachage des mots de passe', desc: 'Aucun mot de passe en clair en base de données, salt automatique', bg: 'DBEAFE', col: C.blueDark },
    { icon: '🛡️', title: 'express-rate-limit', desc: '10 req/min sur /auth  •  200 req/min sur l\'API générale', bg: 'DCFCE7', col: C.green },
    { icon: '🌐', title: 'CORS + Middleware RBAC', desc: 'Contrôle des origines autorisées, middleware d\'autorisation centralisé (authorize.js)', bg: 'FFF7ED', col: C.orange },
    { icon: '📝', title: 'Audit Log complet', desc: 'Traçabilité exhaustive — chaque action est enregistrée avec utilisateur et timestamp', bg: 'FEF2F2', col: C.red },
  ];

  secItems.forEach((sec, i) => {
    cardBox(s, 6.8, 1.3 + i * 0.99, 5.7, 0.88, { fill: sec.bg, border: C.border });
    s.addText(sec.icon, { x: 6.88, y: 1.35 + i * 0.99, w: 0.45, h: 0.45, fontSize: 18 });
    s.addText(sec.title, { x: 7.38, y: 1.37 + i * 0.99, w: 4.88, h: 0.24, fontSize: 10, bold: true, color: sec.col, fontFace: font });
    s.addText(sec.desc, { x: 7.38, y: 1.62 + i * 0.99, w: 4.88, h: 0.45, fontSize: 9, color: C.slate, fontFace: font, lineSpacingMultiple: 1.25 });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 10 — CONCLUSION
// ═══════════════════════════════════════════════════════════
{
  const s = slide(pptx);
  accentBar(s);

  // Header
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0, y: 0.07, w: '100%', h: 1.55,
    fill: { type: 'gradient', gradientType: 'linear', color: C.indigoDark, color2: C.violet, angle: 90 },
    line: { color: C.indigoDark, width: 0 },
  });
  s.addText('🏆  Bilan & Réalisations', {
    x: 0.4, y: 0.18, w: 12.3, h: 0.55,
    fontSize: 22, bold: true, color: C.white, fontFace: font,
  });
  s.addText('Slide 10 / 10  •  Un projet complet, de bout en bout, prêt pour la production', {
    x: 0.4, y: 0.72, w: 12.3, h: 0.28,
    fontSize: 10, color: 'C7D2FE', fontFace: font,
  });

  // Stats row
  const finalStats = [
    { num: '25+', label: 'Pages React', col: C.violet },
    { num: '28',  label: 'Routes API REST', col: C.indigo },
    { num: '26',  label: 'Modèles de données', col: C.blue },
    { num: '6',   label: 'Rôles RBAC', col: C.green },
    { num: '8',   label: 'Types de documents', col: C.orange },
  ];
  finalStats.forEach((st, i) => {
    statBox(s, 0.4 + i * 2.46, 1.85, 2.22, st.num, st.label, st.col);
  });

  // Three pillars
  const pillars = [
    {
      icon: '⚡', title: 'Temps réel & Performance',
      points: [
        'WebSockets Socket.io pour collaboration instantanée',
        'Rooms par projet : notifications ciblées',
        'Planning Poker collaboratif synchronisé',
        'Proxy Vite pour un développement fluide',
      ],
      bg: 'FFF7ED', col: C.orange,
    },
    {
      icon: '🔄', title: 'Agile natif de bout en bout',
      points: [
        'Sprints, backlog et vélocité intégrés',
        'Kanban, Gantt et calendrier unifiés',
        'Estimation collaborative (Planning Poker)',
        'Métriques de qualité et code review',
      ],
      bg: 'EEF2FF', col: C.indigoDark,
    },
    {
      icon: '🛡️', title: 'Sécurité & Maintenabilité',
      points: [
        'Authentification JWT + hachage bcryptjs',
        'RBAC sur 6 niveaux hiérarchiques',
        'Rate limiting et audit log complet',
        'Architecture 3-tiers claire et évolutive',
      ],
      bg: 'F0FDF4', col: C.green,
    },
  ];

  pillars.forEach((p, i) => {
    const x = 0.4 + i * 4.15;
    cardBox(s, x, 3.12, 3.9, 3.4, { fill: p.bg, border: C.border, shadow: true });
    s.addText(p.icon, { x, y: 3.2, w: 3.9, h: 0.45, fontSize: 22, align: 'center' });
    s.addText(p.title, { x: x + 0.15, y: 3.68, w: 3.6, h: 0.3, fontSize: 10.5, bold: true, color: p.col, fontFace: font });
    s.addShape(pptx.ShapeType.line, { x: x + 0.15, y: 4.02, w: 3.6, h: 0, line: { color: C.border, width: 0.7 } });
    p.points.forEach((pt, j) => {
      s.addText('• ' + pt, {
        x: x + 0.2, y: 4.12 + j * 0.52, w: 3.5, h: 0.42,
        fontSize: 9, color: C.slate, fontFace: font, lineSpacingMultiple: 1.25,
      });
    });
  });

  // Bottom thank you
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 6.68, w: 12.3, h: 0.55,
    fill: { type: 'gradient', gradientType: 'linear', color: C.indigo, color2: C.pink, angle: 90 },
    line: { color: C.indigo, width: 0 }, rectRadius: 0.1,
  });
  s.addText('Merci pour votre attention  —  DevTrack v2.0  |  Full-Stack Agile Platform', {
    x: 0.5, y: 6.72, w: 12.2, h: 0.45,
    fontSize: 11, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: font,
  });
}

// ── Save ──────────────────────────────────────────────────
pptx.writeFile({ fileName: 'DevTrack_Presentation.pptx' })
  .then(() => console.log('✅  DevTrack_Presentation.pptx generated successfully'))
  .catch(err => { console.error('❌  Error:', err); process.exit(1); });
