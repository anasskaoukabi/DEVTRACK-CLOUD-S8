const PDFDocument = require('pdfkit');
const {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, sectionTitle, labelValue, tableRow, checkPageBreak
} = require('../styles');

const generateRapportBugs = (data) => {
  const { project, bugs, tasks } = data;
  const doc = new PDFDocument({ size: 'A4', margin: MARGINS.left, bufferPages: true });

  drawHeader(doc, 'Rapport de Bugs', project.name);

  // Résumé exécutif
  sectionTitle(doc, 'Résumé exécutif');

  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const resolved = bugs.filter(b => ['FIXED', 'CLOSED'].includes(b.status));
  const open = bugs.filter(b => !['FIXED', 'CLOSED'].includes(b.status));
  const resolutionRate = bugs.length > 0 ? Math.round((resolved.length / bugs.length) * 100) : 0;

  labelValue(doc, 'Total bugs', `${bugs.length}`);
  labelValue(doc, 'Bugs résolus', `${resolved.length} (${resolutionRate}%)`);
  labelValue(doc, 'Bugs ouverts', `${open.length}`);
  doc.moveDown(0.5);

  // Barres de progression par sévérité
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black).text('Répartition par sévérité :', MARGINS.left);
  doc.moveDown(0.3);

  const sevColors = { CRITICAL: COLORS.red, HIGH: '#f97316', MEDIUM: COLORS.amber, LOW: COLORS.slateLight };
  severities.forEach(sev => {
    const count = bugs.filter(b => b.severity === sev).length;
    const pct = bugs.length > 0 ? (count / bugs.length) : 0;
    const barWidth = Math.max(2, Math.round(pct * (CONTENT_WIDTH - 120)));
    const y = doc.y;

    doc.font(FONTS.bold).fontSize(9).fillColor(sevColors[sev]).text(sev, MARGINS.left, y, { width: 80 });
    doc.rect(MARGINS.left + 85, y + 1, barWidth, 12).fill(sevColors[sev]);
    doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.black)
      .text(`${count}`, MARGINS.left + 90 + barWidth, y, { width: 40 });
    doc.moveDown(0.8);
  });

  // Tableau détaillé
  checkPageBreak(doc, 100);
  sectionTitle(doc, 'Tableau détaillé des bugs');

  const cols = [
    { text: 'Titre', width: 160 },
    { text: 'Sévérité', width: 75 },
    { text: 'Statut', width: 75 },
    { text: 'Tâche liée', width: 110 },
    { text: 'Créé le', width: 80 },
  ];
  let rowY = doc.y;
  tableRow(doc, cols, rowY, true);
  rowY += 20;

  bugs.forEach(b => {
    checkPageBreak(doc);
    if (doc.y !== rowY) rowY = doc.y;
    tableRow(doc, [
      { text: b.title, width: 160 },
      { text: b.severity, width: 75 },
      { text: b.status, width: 75 },
      { text: b.task_title || '—', width: 110 },
      { text: b.created_at ? new Date(b.created_at).toLocaleDateString('fr-FR') : '—', width: 80 },
    ], rowY, false);
    rowY += 20;
    doc.y = rowY;
  });

  // Bugs CRITICAL — détail exhaustif
  const critBugs = bugs.filter(b => b.severity === 'CRITICAL');
  if (critBugs.length > 0) {
    checkPageBreak(doc, 100);
    sectionTitle(doc, 'Analyse CRITICAL — Détail exhaustif');
    critBugs.forEach(b => {
      checkPageBreak(doc, 70);
      doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 0.5).fill(COLORS.red);
      doc.moveDown(0.3);
      doc.rect(MARGINS.left, doc.y, 4, 14).fill(COLORS.red);
      doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black)
        .text(b.title, MARGINS.left + 10, doc.y);
      doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slateLight)
        .text(`Statut : ${b.status}  •  Tâche : ${b.task_title || '—'}  •  Créé le : ${b.created_at ? new Date(b.created_at).toLocaleDateString('fr-FR') : '—'}`, MARGINS.left + 10);
      if (b.description) {
        doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
          .text(b.description, MARGINS.left + 10, doc.y, { width: CONTENT_WIDTH - 10 });
      }
      if (b.steps) {
        doc.font(FONTS.oblique).fontSize(8).fillColor(COLORS.slate)
          .text(`Étapes : ${b.steps}`, MARGINS.left + 10, doc.y, { width: CONTENT_WIDTH - 10 });
      }
      doc.moveDown(0.5);
    });
  }

  // Tendance — Bugs par sprint
  checkPageBreak(doc, 100);
  sectionTitle(doc, 'Tendance par sprint');
  const taskMap = {};
  tasks.forEach(t => { taskMap[String(t._id || t.id)] = t; });

  const sprintStats = {};
  bugs.forEach(b => {
    const task = taskMap[String(b.task_id)];
    const sprintId = task?.sprint_id ? String(task.sprint_id) : 'backlog';
    if (!sprintStats[sprintId]) sprintStats[sprintId] = { open: 0, closed: 0 };
    if (['FIXED', 'CLOSED'].includes(b.status)) sprintStats[sprintId].closed++;
    else sprintStats[sprintId].open++;
  });

  const sprintKeys = Object.keys(sprintStats);
  if (sprintKeys.length > 0) {
    const cols = [{ text: 'Sprint', width: 200 }, { text: 'Ouverts', width: 100 }, { text: 'Fermés', width: 100 }, { text: 'Total', width: 95 }];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;
    sprintKeys.forEach(key => {
      if (doc.y !== rowY) rowY = doc.y;
      const s = sprintStats[key];
      tableRow(doc, [
        { text: key === 'backlog' ? 'Hors sprint / Backlog' : `Sprint ${key}`, width: 200 },
        { text: String(s.open), width: 100 },
        { text: String(s.closed), width: 100 },
        { text: String(s.open + s.closed), width: 95 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucune donnée disponible.', MARGINS.left);
  }

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text(`DevTrack Pro — Rapport de Bugs — ${project.name} — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
      .text(`Page ${i + 1} / ${range.count}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
  }

  doc.flushPages();
  doc.end();
  return doc;
};

module.exports = { generateRapportBugs };
