const PDFDocument = require('pdfkit');
const {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, sectionTitle, labelValue, tableRow, drawWatermark, checkPageBreak
} = require('../styles');

const generateFicheFonctionnelle = (data) => {
  const { project, sprints, tasks } = data;
  const doc = new PDFDocument({ size: 'A4', margin: MARGINS.left, bufferPages: true });

  drawHeader(doc, 'Fiche Fonctionnelle', project.name);
  drawWatermark(doc);

  // Page de garde
  doc.moveDown(1.5);
  doc.font(FONTS.bold).fontSize(22).fillColor(COLORS.indigoDark)
    .text(project.name, MARGINS.left, doc.y, { align: 'center', width: CONTENT_WIDTH });
  doc.moveDown(0.4);
  doc.font(FONTS.regular).fontSize(13).fillColor(COLORS.slate)
    .text('Dossier Fonctionnel', { align: 'center', width: CONTENT_WIDTH });
  doc.moveDown(0.3);
  doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.slateLight)
    .text(new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), { align: 'center', width: CONTENT_WIDTH });

  // Nouvelle page — contenu
  doc.addPage();
  doc.y = MARGINS.top;

  // 1. Vision produit
  sectionTitle(doc, '1. Vision produit');
  labelValue(doc, 'Projet', project.name);
  const stack = Array.isArray(project.stack) ? project.stack.join(', ') : JSON.parse(project.stack || '[]').join(', ');
  labelValue(doc, 'Stack', stack || '—');
  labelValue(doc, 'Deadline', project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : '—');
  doc.moveDown(0.5);
  if (project.description) {
    doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.black)
      .text(project.description, MARGINS.left, doc.y, { width: CONTENT_WIDTH, lineGap: 3 });
  }

  // 2. Fonctionnalités par sprint
  checkPageBreak(doc, 100);
  sectionTitle(doc, '2. Fonctionnalités par sprint');

  sprints.forEach(sprint => {
    const sprintTasks = tasks.filter(t =>
      t.type === 'FEATURE' && String(t.sprint_id) === String(sprint._id || sprint.id)
    );

    checkPageBreak(doc, 80);
    // Sprint header
    doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 26).fill(COLORS.indigoDark);
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.white)
      .text(sprint.name, MARGINS.left + 8, doc.y + 7);
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.white)
      .text(`Objectifs : ${sprint.objectives || '—'}`, MARGINS.left + 8, doc.y + 18, { width: CONTENT_WIDTH - 80 });
    doc.y += 32;
    doc.moveDown(0.2);

    if (sprintTasks.length > 0) {
      const cols = [
        { text: 'Fonctionnalité', width: 230 },
        { text: 'Priorité', width: 90 },
        { text: 'SP', width: 60 },
        { text: 'Statut', width: 115 },
      ];
      let rowY = doc.y;
      tableRow(doc, cols, rowY, true);
      rowY += 20;
      sprintTasks.forEach(t => {
        checkPageBreak(doc);
        if (doc.y !== rowY) rowY = doc.y;
        tableRow(doc, [
          { text: t.title, width: 230 },
          { text: t.priority, width: 90 },
          { text: t.story_points || '—', width: 60 },
          { text: t.status, width: 115 },
        ], rowY, false);
        rowY += 20;
        doc.y = rowY;
      });
    } else {
      doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight)
        .text('Aucune fonctionnalité dans ce sprint.', MARGINS.left + 12);
    }
    doc.moveDown(0.8);
  });

  // 3. Matrice de priorités
  checkPageBreak(doc, 120);
  sectionTitle(doc, '3. Matrice de priorités');
  const features = tasks.filter(t => t.type === 'FEATURE');
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const priorityCount = {};
  const priorityPoints = {};
  priorities.forEach(p => {
    priorityCount[p] = features.filter(t => t.priority === p).length;
    priorityPoints[p] = features.filter(t => t.priority === p).reduce((s, t) => s + (t.story_points || 0), 0);
  });

  const cols = [
    { text: 'Priorité', width: 120 },
    { text: 'Nombre de fonctionnalités', width: 180 },
    { text: 'Total Story Points', width: 195 },
  ];
  let rowY = doc.y;
  tableRow(doc, cols, rowY, true);
  rowY += 20;
  priorities.forEach((p, i) => {
    if (doc.y !== rowY) rowY = doc.y;
    tableRow(doc, [
      { text: p, width: 120 },
      { text: String(priorityCount[p]), width: 180 },
      { text: String(priorityPoints[p]), width: 195 },
    ], rowY, false);
    rowY += 20;
    doc.y = rowY;
  });

  // 4. Évolution des livraisons
  checkPageBreak(doc, 120);
  sectionTitle(doc, '4. Évolution des livraisons');
  const completedSprints = sprints.filter(s => s.status === 'COMPLETED');

  if (completedSprints.length > 0) {
    const cols = [
      { text: 'Sprint', width: 160 },
      { text: 'Vélocité réalisée', width: 130 },
      { text: 'Dates', width: 150 },
      { text: 'Statut', width: 55 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;
    completedSprints.forEach(s => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      const dateRange = `${s.start_date ? new Date(s.start_date).toLocaleDateString('fr-FR') : '—'} → ${s.end_date ? new Date(s.end_date).toLocaleDateString('fr-FR') : '—'}`;
      tableRow(doc, [
        { text: s.name, width: 160 },
        { text: `${s.velocity || 0} SP`, width: 130 },
        { text: dateRange, width: 150 },
        { text: s.status, width: 55 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight)
      .text('Aucun sprint complété pour le moment.', MARGINS.left);
  }

  // Taux global
  doc.moveDown(0.5);
  const done = tasks.filter(t => t.status === 'DONE').length;
  const rate = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 30).fill(COLORS.slateBg);
  doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.indigoDark)
    .text(`Taux de complétion global : ${rate}%  (${done} / ${tasks.length} tâches DONE)`, MARGINS.left + 10, doc.y + 8);
  doc.y += 36;

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text(`DevTrack Pro — Fiche Fonctionnelle — ${project.name} — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
      .text(`Page ${i + 1} / ${range.count}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
  }

  doc.flushPages();
  doc.end();
  return doc;
};

module.exports = { generateFicheFonctionnelle };
