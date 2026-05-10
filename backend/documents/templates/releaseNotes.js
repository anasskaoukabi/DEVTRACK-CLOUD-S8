const PDFDocument = require('pdfkit');
const {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, sectionTitle, labelValue, tableRow, checkPageBreak
} = require('../styles');

const generateReleaseNotes = (data) => {
  const { sprint, tasks, bugs, project } = data;
  const doc = new PDFDocument({ size: 'A4', margin: MARGINS.left, bufferPages: true });

  drawHeader(doc, 'Release Notes', `${sprint.name} — ${project?.name || ''}`);

  // En-tête version
  doc.font(FONTS.bold).fontSize(18).fillColor(COLORS.indigoDark)
    .text(`Version : ${sprint.name}`, MARGINS.left, doc.y, { align: 'center', width: CONTENT_WIDTH });
  doc.moveDown(0.2);
  doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.slate)
    .text(`Date de livraison : ${sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR')}`, { align: 'center', width: CONTENT_WIDTH });
  doc.moveDown(1);

  // 1. Nouvelles fonctionnalités
  sectionTitle(doc, '1. Nouvelles fonctionnalités');
  const newFeatures = tasks.filter(t => t.type === 'FEATURE' && t.status === 'DONE');
  if (newFeatures.length > 0) {
    newFeatures.forEach(t => {
      checkPageBreak(doc, 40);
      doc.rect(MARGINS.left, doc.y, 4, 14).fill(COLORS.indigo);
      doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black)
        .text(t.title, MARGINS.left + 10, doc.y);
      if (t.description) {
        doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
          .text(t.description, MARGINS.left + 10, doc.y, { width: CONTENT_WIDTH - 10 });
      }
      doc.moveDown(0.4);
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucune nouvelle fonctionnalité.', MARGINS.left);
  }

  // 2. Améliorations (TECH_DEBT)
  checkPageBreak(doc, 80);
  sectionTitle(doc, '2. Améliorations techniques');
  const techDebts = tasks.filter(t => t.type === 'TECH_DEBT' && t.status === 'DONE');
  if (techDebts.length > 0) {
    techDebts.forEach(t => {
      checkPageBreak(doc, 30);
      doc.rect(MARGINS.left, doc.y, 4, 14).fill(COLORS.amber);
      doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black)
        .text(t.title, MARGINS.left + 10, doc.y);
      if (t.description) {
        doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
          .text(t.description, MARGINS.left + 10, doc.y, { width: CONTENT_WIDTH - 10 });
      }
      doc.moveDown(0.4);
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucune amélioration technique.', MARGINS.left);
  }

  // 3. Corrections de bugs
  checkPageBreak(doc, 80);
  sectionTitle(doc, '3. Corrections de bugs');
  const fixedBugs = bugs.filter(b => ['FIXED', 'CLOSED'].includes(b.status));
  if (fixedBugs.length > 0) {
    const cols = [
      { text: 'Bug', width: 220 },
      { text: 'Sévérité', width: 90 },
      { text: 'Date résolution', width: 110 },
      { text: 'Tâche', width: 75 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;
    fixedBugs.forEach(b => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      tableRow(doc, [
        { text: b.title, width: 220 },
        { text: b.severity, width: 90 },
        { text: b.fixed_at ? new Date(b.fixed_at).toLocaleDateString('fr-FR') : '—', width: 110 },
        { text: b.task_title || '—', width: 75 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucun bug corrigé dans ce sprint.', MARGINS.left);
  }

  // 4. Problèmes connus
  checkPageBreak(doc, 80);
  sectionTitle(doc, '4. Problèmes connus');
  const openBugs = bugs.filter(b => !['FIXED', 'CLOSED'].includes(b.status));
  if (openBugs.length > 0) {
    openBugs.forEach(b => {
      checkPageBreak(doc, 30);
      const col = b.severity === 'CRITICAL' ? COLORS.red : (b.severity === 'HIGH' ? '#f97316' : COLORS.amber);
      doc.rect(MARGINS.left, doc.y, 4, 14).fill(col);
      doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.black)
        .text(`[${b.severity}] ${b.title}`, MARGINS.left + 10, doc.y);
      if (b.description) {
        doc.font(FONTS.regular).fontSize(8.5).fillColor(COLORS.slate)
          .text(b.description, MARGINS.left + 10, doc.y, { width: CONTENT_WIDTH - 10 });
      }
      doc.moveDown(0.4);
    });
  } else {
    doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 26).fill('#d1fae5');
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.green)
      .text('✓ Aucun problème connu. Livraison propre !', MARGINS.left + 10, doc.y + 7);
    doc.y += 32;
  }

  // 5. Notes de migration / installation
  checkPageBreak(doc, 120);
  sectionTitle(doc, '5. Notes de migration / installation');
  doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slateLight)
    .text('(À compléter par l\'équipe DevOps/technique)', MARGINS.left);
  doc.moveDown(0.3);

  for (let i = 0; i < 8; i++) {
    const y = doc.y;
    doc.moveTo(MARGINS.left, y + 16).lineTo(PAGE_WIDTH - MARGINS.right, y + 16)
      .strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.moveDown(1.1);
  }

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text(`DevTrack Pro — Release Notes — ${sprint.name} — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
      .text(`Page ${i + 1} / ${range.count}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
  }

  doc.flushPages();
  doc.end();
  return doc;
};

module.exports = { generateReleaseNotes };
