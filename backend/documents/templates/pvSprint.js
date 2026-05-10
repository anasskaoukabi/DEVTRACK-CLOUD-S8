const PDFDocument = require('pdfkit');
const {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, sectionTitle, labelValue, statusColor, tableRow, checkPageBreak
} = require('../styles');

/**
 * Génère le PV de Sprint
 * @param {object} data — { sprint, tasks, bugs, project }
 * @returns {PDFDocument}
 */
const generatePvSprint = (data) => {
  const { sprint, tasks, bugs, project } = data;
  const doc = new PDFDocument({ size: 'A4', margin: MARGINS.left, bufferPages: true });

  // --- PAGE 1 ---
  drawHeader(doc, `Procès-Verbal de Sprint`, `${sprint.name} — ${project?.name || ''}`);

  // En-tête officiel
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.slate)
    .text('PROCÈS-VERBAL DE RÉUNION DE REVUE DE SPRINT', MARGINS.left, doc.y, { align: 'center', width: CONTENT_WIDTH });
  doc.moveDown(0.5);

  // Infos sprint
  doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 1).fill(COLORS.border);
  doc.moveDown(0.5);

  const dateDebut = sprint.start_date ? new Date(sprint.start_date).toLocaleDateString('fr-FR') : '—';
  const dateFin = sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('fr-FR') : '—';

  labelValue(doc, 'Sprint', sprint.name);
  labelValue(doc, 'Projet', project?.name || '—');
  labelValue(doc, 'Date début', dateDebut);
  labelValue(doc, 'Date de clôture', dateFin);
  labelValue(doc, 'Date du PV', new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }));
  labelValue(doc, 'Statut', sprint.status || '—');
  doc.moveDown(0.5);

  // Membres présents
  sectionTitle(doc, 'Équipe présente');
  if (project?.developers?.length > 0) {
    project.developers.forEach(dev => {
      doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.black)
        .text(`• ${dev.name} (${dev.role || 'DEV'})`, MARGINS.left + 12);
    });
  } else {
    doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.slateLight).text('— Équipe non renseignée', MARGINS.left + 12);
  }
  doc.moveDown(1);

  // --- Section 1 : Résultats ---
  sectionTitle(doc, '1. Résultats du sprint');

  const doneTasks = tasks.filter(t => t.status === 'DONE');
  const notDoneTasks = tasks.filter(t => t.status !== 'DONE');
  const velociteRealisee = doneTasks.reduce((s, t) => s + (t.story_points || 0), 0);
  const velocitePlanifiee = tasks.reduce((s, t) => s + (t.story_points || 0), 0);

  labelValue(doc, 'Vélocité planifiée', `${velocitePlanifiee} points`);
  labelValue(doc, 'Vélocité réalisée', `${velociteRealisee} points`);
  labelValue(doc, 'Taux de complétion', `${tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0}%`);
  labelValue(doc, 'Tâches DONE', `${doneTasks.length} / ${tasks.length}`);
  doc.moveDown(0.5);

  // Tableau tâches DONE
  if (doneTasks.length > 0) {
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black).text('Tâches terminées :', MARGINS.left);
    doc.moveDown(0.3);

    const cols = [
      { text: 'Titre', width: 260 },
      { text: 'Type', width: 80 },
      { text: 'Priorité', width: 80 },
      { text: 'SP', width: 55 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;

    doneTasks.forEach((t, i) => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      tableRow(doc, [
        { text: t.title, width: 260 },
        { text: t.type, width: 80 },
        { text: t.priority, width: 80 },
        { text: t.story_points || '—', width: 55 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
    doc.moveDown(0.5);
  }

  // Tâches non terminées
  if (notDoneTasks.length > 0) {
    checkPageBreak(doc, 80);
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black).text('Tâches reportées au backlog :', MARGINS.left);
    doc.moveDown(0.3);
    notDoneTasks.forEach(t => {
      doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
        .text(`• ${t.title} [${t.status}] — ${t.story_points || 0} SP`, MARGINS.left + 12);
    });
  }

  // --- Section 2 : Qualité ---
  checkPageBreak(doc, 120);
  sectionTitle(doc, '2. Qualité');

  const taskIds = tasks.map(t => String(t._id || t.id));
  const sprintBugs = bugs.filter(b => taskIds.includes(String(b.task_id)));
  const resolvedBugs = sprintBugs.filter(b => ['FIXED', 'CLOSED'].includes(b.status));
  const openBugs = sprintBugs.filter(b => !['FIXED', 'CLOSED'].includes(b.status));
  const criticalOpen = openBugs.filter(b => b.severity === 'CRITICAL');

  labelValue(doc, 'Bugs découverts', `${sprintBugs.length}`);
  labelValue(doc, 'Bugs résolus', `${resolvedBugs.length}`);
  labelValue(doc, 'Bugs encore ouverts', `${openBugs.length}`);
  labelValue(doc, 'Bugs CRITICAL ouverts', `${criticalOpen.length}`);

  if (criticalOpen.length > 0) {
    doc.moveDown(0.3);
    doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.red).text('⚠ Bugs critiques restants :', MARGINS.left);
    criticalOpen.forEach(b => {
      doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
        .text(`• ${b.title}`, MARGINS.left + 12);
    });
  }

  // --- Section 3 : Décisions ---
  checkPageBreak(doc, 140);
  sectionTitle(doc, '3. Décisions et actions');
  doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slateLight)
    .text('(À compléter manuellement lors de la réunion)', MARGINS.left);
  doc.moveDown(0.3);

  for (let i = 0; i < 6; i++) {
    const y = doc.y;
    doc.moveTo(MARGINS.left, y + 16).lineTo(PAGE_WIDTH - MARGINS.right, y + 16)
      .strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.moveDown(1.1);
  }

  // --- Section 4 : Signatures ---
  checkPageBreak(doc, 120);
  sectionTitle(doc, '4. Signatures');
  doc.moveDown(0.5);

  const signataires = ['SCRUM MASTER', 'PRODUCT OWNER', 'CLIENT'];
  const sigWidth = CONTENT_WIDTH / 3;

  signataires.forEach((nom, i) => {
    const x = MARGINS.left + i * sigWidth;
    doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.black).text(nom, x, doc.y, { width: sigWidth, align: 'center' });
    const lineY = doc.y + 30;
    doc.moveTo(x + 20, lineY).lineTo(x + sigWidth - 20, lineY)
      .strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text('Signature', x, lineY + 4, { width: sigWidth, align: 'center' });
  });

  // Footer sur chaque page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y)
      .strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text(`DevTrack Pro — PV de Sprint "${sprint.name}" — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
      .text(`Page ${i + 1} / ${range.count}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
  }

  doc.flushPages();
  doc.end();
  return doc;
};

module.exports = { generatePvSprint };
