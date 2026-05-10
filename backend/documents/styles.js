/**
 * styles.js — Charte graphique commune pour tous les PDFs DevTrack
 */

const COLORS = {
  indigo: '#6366f1',
  indigoDark: '#4338ca',
  slate: '#475569',
  slateLight: '#94a3b8',
  slateBg: '#f8fafc',
  white: '#ffffff',
  black: '#0f172a',
  red: '#ef4444',
  green: '#10b981',
  amber: '#f59e0b',
  blue: '#3b82f6',
  border: '#e2e8f0',
};

const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  oblique: 'Helvetica-Oblique',
};

const MARGINS = { top: 50, bottom: 50, left: 50, right: 50 };
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

/**
 * Dessine le header commun (bande indigo avec titre)
 */
const drawHeader = (doc, title, subtitle = 'DevTrack Pro') => {
  // Bande indigo
  doc.rect(0, 0, PAGE_WIDTH, 80).fill(COLORS.indigo);

  // Logo / App name
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.white).opacity(0.7)
    .text('DevTrack Pro', MARGINS.left, 18);

  // Titre
  doc.font(FONTS.bold).fontSize(18).fillColor(COLORS.white).opacity(1)
    .text(title, MARGINS.left, 34, { width: CONTENT_WIDTH - 100 });

  // Sous-titre / date à droite
  doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.white).opacity(0.8)
    .text(new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), PAGE_WIDTH - 160, 60, { width: 120, align: 'right' });

  doc.opacity(1);
  doc.moveDown(0);
  doc.y = 100; // Position après le header
};

/**
 * Dessine le footer sur chaque page
 */
const drawFooter = (doc, pageNum, totalPages) => {
  const y = doc.page.height - 40;
  doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y)
    .strokeColor(COLORS.border).lineWidth(1).stroke();

  doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
    .text(`Généré par DevTrack Pro — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
    .text(`Page ${pageNum}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
};

/**
 * Titre de section (H2)
 */
const sectionTitle = (doc, text, y = null) => {
  if (y !== null) doc.y = y;
  doc.moveDown(0.8);
  const startY = doc.y;
  doc.rect(MARGINS.left, startY, 4, 18).fill(COLORS.indigo);
  doc.font(FONTS.bold).fontSize(13).fillColor(COLORS.black)
    .text(text, MARGINS.left + 12, startY + 1);
  doc.moveDown(0.5);
};

/**
 * Label + valeur inline
 */
const labelValue = (doc, label, value, x = MARGINS.left) => {
  const startY = doc.y;
  doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.slateLight).text(label.toUpperCase(), x, startY);
  doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.black).text(value || '—', x + 130, startY, { width: CONTENT_WIDTH - 130 });
  doc.moveDown(0.3);
};

/**
 * Badge de statut coloré
 */
const statusColor = (status) => {
  const map = {
    DONE: COLORS.green, FIXED: COLORS.green, CLOSED: COLORS.green,
    IN_PROGRESS: COLORS.blue, IN_REVIEW: COLORS.blue,
    CRITICAL: COLORS.red, HIGH: COLORS.red,
    MEDIUM: COLORS.amber, LOW: COLORS.slateLight,
    OPEN: COLORS.amber, BACKLOG: COLORS.slateLight,
  };
  return map[status] || COLORS.slate;
};

/**
 * Ligne de tableau générique
 */
const tableRow = (doc, columns, y, isHeader = false) => {
  const bg = isHeader ? COLORS.indigoDark : (y % 2 === 0 ? COLORS.slateBg : COLORS.white);
  const textColor = isHeader ? COLORS.white : COLORS.black;
  const font = isHeader ? FONTS.bold : FONTS.regular;
  const rowHeight = 20;

  doc.rect(MARGINS.left, y, CONTENT_WIDTH, rowHeight).fill(bg);

  let x = MARGINS.left + 6;
  columns.forEach(({ text, width }) => {
    doc.font(font).fontSize(8.5).fillColor(textColor)
      .text(String(text || '—'), x, y + 5, { width: width - 8, ellipsis: true, lineBreak: false });
    x += width;
  });

  return rowHeight;
};

/**
 * Watermark "CONFIDENTIEL"
 */
const drawWatermark = (doc) => {
  doc.save();
  doc.rotate(-45, { origin: [PAGE_WIDTH / 2, doc.page.height / 2] });
  doc.font(FONTS.bold).fontSize(60).fillColor('#e2e8f0').opacity(0.3)
    .text('CONFIDENTIEL', 100, doc.page.height / 2 - 80, { width: 400, align: 'center' });
  doc.restore();
  doc.opacity(1);
};

/**
 * Vérifie si on est proche du bas de page et ajoute une page si nécessaire
 */
const checkPageBreak = (doc, neededHeight = 60) => {
  if (doc.y + neededHeight > doc.page.height - MARGINS.bottom - 40) {
    doc.addPage();
    doc.y = MARGINS.top;
    return true;
  }
  return false;
};

module.exports = {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, drawFooter, sectionTitle, labelValue,
  statusColor, tableRow, drawWatermark, checkPageBreak,
};
