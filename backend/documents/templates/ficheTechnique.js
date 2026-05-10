const PDFDocument = require('pdfkit');
const {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, sectionTitle, labelValue, statusColor, tableRow, checkPageBreak
} = require('../styles');

const generateFicheTechnique = (data) => {
  const { task, timeLogs, project } = data;
  const doc = new PDFDocument({ size: 'A4', margin: MARGINS.left, bufferPages: true });

  drawHeader(doc, 'Fiche Technique', `${project?.name || ''}`);

  // En-tête tâche
  doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 60).fill(COLORS.slateBg);
  const headerY = doc.y + 8;
  doc.font(FONTS.bold).fontSize(14).fillColor(COLORS.black)
    .text(task.title, MARGINS.left + 10, headerY, { width: CONTENT_WIDTH - 100 });
  
  // Badge type
  const typeColors = { FEATURE: COLORS.indigo, BUG: COLORS.red, TECH_DEBT: COLORS.amber };
  doc.rect(PAGE_WIDTH - MARGINS.right - 90, headerY, 80, 18).fill(typeColors[task.type] || COLORS.slate);
  doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.white)
    .text(task.type, PAGE_WIDTH - MARGINS.right - 90, headerY + 4, { width: 80, align: 'center' });
  
  doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slateLight)
    .text(`ID: ${task._id || task.id}  •  Priorité: ${task.priority}  •  Statut: ${task.status}`, MARGINS.left + 10, headerY + 24);
  
  doc.y = doc.y + 70;
  doc.moveDown(0.5);

  // --- Section 1 : Infos ---
  sectionTitle(doc, '1. Informations générales');
  labelValue(doc, 'Développeur', task.developer_name || '— Non assigné');
  labelValue(doc, 'Sprint', task.sprint_id ? String(task.sprint_id) : '— Hors sprint');
  labelValue(doc, 'Projet', project?.name || '—');
  labelValue(doc, 'Deadline', task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : '— Aucune');
  labelValue(doc, 'Story Points', task.story_points ? `${task.story_points} SP` : '—');
  labelValue(doc, 'Heures estimées', task.estimated_hours ? `${task.estimated_hours}h` : '—');

  const totalLogged = (timeLogs || []).reduce((s, l) => s + (l.hours || 0), 0);
  labelValue(doc, 'Heures loggées', `${totalLogged}h`);

  if (task.estimated_hours && totalLogged > 0) {
    const delta = totalLogged - task.estimated_hours;
    const color = delta > 0 ? COLORS.red : COLORS.green;
    doc.font(FONTS.bold).fontSize(9).fillColor(color)
      .text(`  → Écart : ${delta > 0 ? '+' : ''}${delta.toFixed(1)}h`, MARGINS.left + 130, doc.y - 14);
  }

  // --- Section 2 : Description ---
  sectionTitle(doc, '2. Description technique');
  if (task.description) {
    doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 1).fill(COLORS.border);
    doc.moveDown(0.3);
    doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.black)
      .text(task.description, MARGINS.left, doc.y, { width: CONTENT_WIDTH, lineGap: 3 });
  } else {
    doc.font(FONTS.oblique).fontSize(10).fillColor(COLORS.slateLight)
      .text('Aucune description fournie.', MARGINS.left);
  }

  // --- Section 3 : Historique des statuts ---
  checkPageBreak(doc, 100);
  sectionTitle(doc, '3. Historique des statuts');
  const history = task.history || [];
  if (history.length > 0) {
    const cols = [
      { text: 'De', width: 120 },
      { text: 'Vers', width: 120 },
      { text: 'Date', width: 140 },
      { text: 'Durée (h)', width: 115 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;

    history.forEach((h, i) => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      const date = h.changed_at ? new Date(h.changed_at).toLocaleString('fr-FR') : '—';
      tableRow(doc, [
        { text: h.from_status || 'Création', width: 120 },
        { text: h.to_status, width: 120 },
        { text: date, width: 140 },
        { text: '—', width: 115 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucun historique disponible.', MARGINS.left);
  }

  // --- Section 4 : Notes techniques ---
  checkPageBreak(doc, 100);
  sectionTitle(doc, '4. Notes techniques');
  const techNotes = (task.comments || []).filter(c => c.is_technical_note);
  if (techNotes.length > 0) {
    techNotes.forEach(note => {
      checkPageBreak(doc, 50);
      doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 0.5).fill(COLORS.amber);
      doc.moveDown(0.2);
      doc.rect(MARGINS.left, doc.y, 3, 14).fill(COLORS.amber);
      doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.black)
        .text(note.author, MARGINS.left + 10, doc.y, { continued: true });
      doc.font(FONTS.regular).fillColor(COLORS.slateLight)
        .text(`  ${new Date(note.created_at).toLocaleDateString('fr-FR')}`);
      doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.black)
        .text(note.content, MARGINS.left + 10, doc.y, { width: CONTENT_WIDTH - 10 });
      doc.moveDown(0.5);
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucune note technique.', MARGINS.left);
  }

  // --- Section 5 : Bugs ---
  checkPageBreak(doc, 100);
  sectionTitle(doc, '5. Bugs associés');
  const bugs = task.bugs || [];
  if (bugs.length > 0) {
    const cols = [
      { text: 'Titre', width: 200 },
      { text: 'Sévérité', width: 90 },
      { text: 'Statut', width: 90 },
      { text: 'Date résolution', width: 115 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;
    bugs.forEach(b => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      tableRow(doc, [
        { text: b.title, width: 200 },
        { text: b.severity, width: 90 },
        { text: b.status, width: 90 },
        { text: b.fixed_at ? new Date(b.fixed_at).toLocaleDateString('fr-FR') : '—', width: 115 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucun bug associé.', MARGINS.left);
  }

  // --- Section 6 : Time Logs ---
  checkPageBreak(doc, 100);
  sectionTitle(doc, '6. Temps passé');
  if (timeLogs && timeLogs.length > 0) {
    const cols = [
      { text: 'Développeur', width: 160 },
      { text: 'Heures', width: 80 },
      { text: 'Date', width: 120 },
      { text: 'Description', width: 135 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;
    timeLogs.forEach(l => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      tableRow(doc, [
        { text: l.developer_name || '—', width: 160 },
        { text: `${l.hours}h`, width: 80 },
        { text: l.logged_at ? new Date(l.logged_at).toLocaleDateString('fr-FR') : '—', width: 120 },
        { text: l.description || '—', width: 135 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
    doc.moveDown(0.5);
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black)
      .text(`Total : ${totalLogged}h`, MARGINS.left);
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucun temps loggé.', MARGINS.left);
  }

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text(`DevTrack Pro — Fiche Technique — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
      .text(`Page ${i + 1} / ${range.count}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
  }

  doc.flushPages();
  doc.end();
  return doc;
};

module.exports = { generateFicheTechnique };
