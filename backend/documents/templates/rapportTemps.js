const PDFDocument = require('pdfkit');
const {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, sectionTitle, labelValue, tableRow, checkPageBreak
} = require('../styles');

const generateRapportTemps = (data) => {
  const { project, timeLogs, tasks, sprints } = data;
  const doc = new PDFDocument({ size: 'A4', margin: MARGINS.left, bufferPages: true });

  drawHeader(doc, 'Rapport de Temps', project.name);

  const totalHeures = timeLogs.reduce((s, l) => s + (l.hours || 0), 0);

  // 1. Résumé
  sectionTitle(doc, '1. Résumé');
  labelValue(doc, 'Projet', project.name);
  labelValue(doc, 'Total heures loggées', `${totalHeures.toFixed(1)}h`);
  labelValue(doc, 'Nombre de logs', `${timeLogs.length}`);
  doc.moveDown(0.5);

  // Tableau par développeur
  const devMap = {};
  timeLogs.forEach(l => {
    const key = String(l.developer_id || l.developer_name || 'inconnu');
    const name = l.developer_name || 'Inconnu';
    if (!devMap[key]) devMap[key] = { name, hours: 0, logs: [] };
    devMap[key].hours += l.hours || 0;
    devMap[key].logs.push(l);
  });

  const devEntries = Object.values(devMap).sort((a, b) => b.hours - a.hours);

  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black).text('Heures par développeur :', MARGINS.left);
  doc.moveDown(0.3);

  const cols = [
    { text: 'Développeur', width: 200 },
    { text: 'Heures loggées', width: 130 },
    { text: '% du projet', width: 100 },
    { text: 'Nbre de logs', width: 65 },
  ];
  let rowY = doc.y;
  tableRow(doc, cols, rowY, true);
  rowY += 20;

  devEntries.forEach(entry => {
    if (doc.y !== rowY) rowY = doc.y;
    const pct = totalHeures > 0 ? Math.round((entry.hours / totalHeures) * 100) : 0;
    tableRow(doc, [
      { text: entry.name, width: 200 },
      { text: `${entry.hours.toFixed(1)}h`, width: 130 },
      { text: `${pct}%`, width: 100 },
      { text: String(entry.logs.length), width: 65 },
    ], rowY, false);
    rowY += 20;
    doc.y = rowY;
  });

  // 2. Détail par développeur
  checkPageBreak(doc, 100);
  sectionTitle(doc, '2. Détail par développeur');

  devEntries.forEach(entry => {
    checkPageBreak(doc, 80);
    doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 22).fill(COLORS.indigoDark);
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.white)
      .text(`${entry.name}  —  ${entry.hours.toFixed(1)}h total`, MARGINS.left + 8, doc.y + 5);
    doc.y += 26;

    const miniCols = [
      { text: 'Tâche', width: 200 },
      { text: 'Heures', width: 80 },
      { text: 'Date', width: 110 },
      { text: 'Description', width: 105 },
    ];
    let rowY = doc.y;
    tableRow(doc, miniCols, rowY, true);
    rowY += 20;

    entry.logs.forEach(l => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      const task = tasks.find(t => String(t._id || t.id) === String(l.task_id));
      tableRow(doc, [
        { text: task?.title || '—', width: 200 },
        { text: `${l.hours}h`, width: 80 },
        { text: l.logged_at ? new Date(l.logged_at).toLocaleDateString('fr-FR') : '—', width: 110 },
        { text: l.description || '—', width: 105 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
    doc.moveDown(0.8);
  });

  // 3. Détail par tâche
  checkPageBreak(doc, 100);
  sectionTitle(doc, '3. Détail par tâche (estimé vs réel)');

  const taskLogMap = {};
  timeLogs.forEach(l => {
    const key = String(l.task_id);
    if (!taskLogMap[key]) taskLogMap[key] = 0;
    taskLogMap[key] += l.hours || 0;
  });

  const cols2 = [
    { text: 'Tâche', width: 190 },
    { text: 'Heures estimées', width: 110 },
    { text: 'Heures réelles', width: 110 },
    { text: 'Écart', width: 85 },
  ];
  rowY = doc.y;
  tableRow(doc, cols2, rowY, true);
  rowY += 20;

  tasks.filter(t => taskLogMap[String(t._id || t.id)]).forEach(t => {
    checkPageBreak(doc);
    if (doc.y !== rowY) rowY = doc.y;
    const real = taskLogMap[String(t._id || t.id)] || 0;
    const delta = real - (t.estimated_hours || 0);
    tableRow(doc, [
      { text: t.title, width: 190 },
      { text: t.estimated_hours ? `${t.estimated_hours}h` : '—', width: 110 },
      { text: `${real.toFixed(1)}h`, width: 110 },
      { text: t.estimated_hours ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}h` : '—', width: 85 },
    ], rowY, false);
    rowY += 20;
    doc.y = rowY;
  });

  // 4. Détail par sprint
  checkPageBreak(doc, 100);
  sectionTitle(doc, '4. Heures par sprint');

  const taskSprintMap = {};
  tasks.forEach(t => { taskSprintMap[String(t._id || t.id)] = String(t.sprint_id || 'backlog'); });

  const sprintHoursMap = {};
  timeLogs.forEach(l => {
    const sprintId = taskSprintMap[String(l.task_id)] || 'backlog';
    sprintHoursMap[sprintId] = (sprintHoursMap[sprintId] || 0) + (l.hours || 0);
  });

  const cols3 = [{ text: 'Sprint', width: 250 }, { text: 'Heures consommées', width: 245 }];
  rowY = doc.y;
  tableRow(doc, cols3, rowY, true);
  rowY += 20;

  Object.entries(sprintHoursMap).forEach(([sprintId, hours]) => {
    if (doc.y !== rowY) rowY = doc.y;
    const sprint = sprints.find(s => String(s._id || s.id) === sprintId);
    tableRow(doc, [
      { text: sprint?.name || (sprintId === 'backlog' ? 'Hors sprint' : sprintId), width: 250 },
      { text: `${hours.toFixed(1)}h`, width: 245 },
    ], rowY, false);
    rowY += 20;
    doc.y = rowY;
  });

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text(`DevTrack Pro — Rapport de Temps — ${project.name} — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
      .text(`Page ${i + 1} / ${range.count}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
  }

  doc.flushPages();
  doc.end();
  return doc;
};

module.exports = { generateRapportTemps };
