const PDFDocument = require('pdfkit');
const {
  COLORS, FONTS, MARGINS, PAGE_WIDTH, CONTENT_WIDTH,
  drawHeader, sectionTitle, labelValue, tableRow, drawWatermark, checkPageBreak
} = require('../styles');

const generateCahierDesCharges = (data) => {
  const { project, sprints, tasks, bugs } = data;
  const doc = new PDFDocument({ size: 'A4', margin: MARGINS.left, bufferPages: true });

  // --- PAGE DE GARDE ---
  drawHeader(doc, 'Cahier des Charges', project.name);
  drawWatermark(doc);

  doc.moveDown(2);
  doc.font(FONTS.bold).fontSize(26).fillColor(COLORS.indigoDark)
    .text(project.name, MARGINS.left, doc.y, { align: 'center', width: CONTENT_WIDTH });
  doc.moveDown(0.5);
  doc.font(FONTS.regular).fontSize(14).fillColor(COLORS.slate)
    .text('Cahier des Charges Fonctionnel', { align: 'center', width: CONTENT_WIDTH });
  doc.moveDown(2);

  // Bloc infos
  doc.rect(MARGINS.left + 40, doc.y, CONTENT_WIDTH - 80, 120).fill(COLORS.slateBg);
  const infoY = doc.y + 15;
  labelValue(doc, 'Version', '1.0', MARGINS.left + 55);
  labelValue(doc, 'Date', new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), MARGINS.left + 55);
  const stack = Array.isArray(project.stack) ? project.stack.join(', ') : JSON.parse(project.stack || '[]').join(', ');
  labelValue(doc, 'Stack technique', stack || '—', MARGINS.left + 55);
  labelValue(doc, 'Deadline', project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : '—', MARGINS.left + 55);
  labelValue(doc, 'Statut', project.status || 'ACTIVE', MARGINS.left + 55);
  doc.y = infoY + 130;
  doc.moveDown(1);

  // Équipe
  if (project.developers?.length > 0) {
    doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.black).text('Équipe projet :', MARGINS.left);
    doc.moveDown(0.3);
    project.developers.forEach(dev => {
      doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.slate)
        .text(`• ${dev.name}  —  ${dev.role || 'DEV'}  <${dev.email}>`, MARGINS.left + 12);
    });
  }

  // --- NOUVELLE PAGE : Contenu ---
  doc.addPage();
  doc.y = MARGINS.top;

  // 1. Contexte
  sectionTitle(doc, '1. Contexte et objectifs');
  if (project.description) {
    doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.black)
      .text(project.description, MARGINS.left, doc.y, { width: CONTENT_WIDTH, lineGap: 3 });
  } else {
    doc.font(FONTS.oblique).fontSize(10).fillColor(COLORS.slateLight).text('Aucune description fournie.');
  }

  // 2. Périmètre fonctionnel
  checkPageBreak(doc, 100);
  sectionTitle(doc, '2. Périmètre fonctionnel');
  const features = tasks.filter(t => t.type === 'FEATURE');

  // Par sprint
  const sprintMap = {};
  features.forEach(t => {
    const key = t.sprint_id ? String(t.sprint_id) : 'backlog';
    if (!sprintMap[key]) sprintMap[key] = [];
    sprintMap[key].push(t);
  });

  sprints.forEach(sprint => {
    const spTasks = sprintMap[String(sprint._id || sprint.id)] || [];
    if (spTasks.length === 0) return;

    checkPageBreak(doc, 80);
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.indigoDark)
      .text(`Sprint : ${sprint.name}`, MARGINS.left, doc.y);
    doc.moveDown(0.3);

    const cols = [
      { text: 'Fonctionnalité', width: 240 },
      { text: 'Priorité', width: 90 },
      { text: 'Statut', width: 90 },
      { text: 'SP', width: 75 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;
    spTasks.forEach(t => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      tableRow(doc, [
        { text: t.title, width: 240 },
        { text: t.priority, width: 90 },
        { text: t.status, width: 90 },
        { text: t.story_points || '—', width: 75 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
    doc.moveDown(0.5);
  });

  const backlogFeatures = sprintMap['backlog'] || [];
  if (backlogFeatures.length > 0) {
    checkPageBreak(doc, 60);
    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.slate).text('Backlog (non sprinté) :', MARGINS.left);
    doc.moveDown(0.3);
    backlogFeatures.forEach(t => {
      doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
        .text(`• ${t.title} [${t.priority}] — ${t.story_points || '?'} SP`, MARGINS.left + 12);
    });
  }

  // 3. Exigences non-fonctionnelles
  checkPageBreak(doc, 100);
  sectionTitle(doc, '3. Exigences non-fonctionnelles');
  const techDebt = tasks.filter(t => t.type === 'TECH_DEBT');
  if (techDebt.length > 0) {
    techDebt.forEach(t => {
      checkPageBreak(doc, 30);
      doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 0.5).fill(COLORS.border);
      doc.moveDown(0.2);
      doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black).text(`• ${t.title}`, MARGINS.left + 8);
      if (t.description) {
        doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
          .text(t.description, MARGINS.left + 20, doc.y, { width: CONTENT_WIDTH - 20 });
      }
      doc.moveDown(0.3);
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucune dette technique recensée.', MARGINS.left);
  }

  // 4. Critères d'acceptation
  checkPageBreak(doc, 100);
  sectionTitle(doc, '4. Critères d\'acceptation');
  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  labelValue(doc, 'Taux de complétion actuel', `${completionRate}% (${doneTasks}/${tasks.length} tâches DONE)`);
  doc.moveDown(0.5);
  doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.black).text('Définition du DONE :', MARGINS.left);
  doc.moveDown(0.2);
  const doneItems = [
    'Code implémenté et revu par un pair (code review)',
    'Tests unitaires écrits et passants',
    'Documentation technique à jour',
    'Validé par le Product Owner',
    'Aucun bug CRITICAL ouvert',
    'Déployé en environnement de test',
  ];
  doneItems.forEach(item => {
    doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.slate)
      .text(`☐  ${item}`, MARGINS.left + 12);
  });

  // 5. Annexes — Bugs ouverts
  checkPageBreak(doc, 100);
  sectionTitle(doc, '5. Annexes — Bugs ouverts');
  const openBugs = bugs.filter(b => !['FIXED', 'CLOSED'].includes(b.status));
  if (openBugs.length > 0) {
    const cols = [
      { text: 'Titre', width: 200 },
      { text: 'Sévérité', width: 90 },
      { text: 'Statut', width: 90 },
      { text: 'Tâche liée', width: 115 },
    ];
    let rowY = doc.y;
    tableRow(doc, cols, rowY, true);
    rowY += 20;
    openBugs.forEach(b => {
      checkPageBreak(doc);
      if (doc.y !== rowY) rowY = doc.y;
      tableRow(doc, [
        { text: b.title, width: 200 },
        { text: b.severity, width: 90 },
        { text: b.status, width: 90 },
        { text: b.task_title || '—', width: 115 },
      ], rowY, false);
      rowY += 20;
      doc.y = rowY;
    });
  } else {
    doc.font(FONTS.oblique).fontSize(9).fillColor(COLORS.slateLight).text('Aucun bug ouvert. 🎉', MARGINS.left);
  }

  // Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.slateLight)
      .text(`DevTrack Pro — Cahier des Charges — ${project.name} — ${new Date().toLocaleDateString('fr-FR')}`, MARGINS.left, y + 8)
      .text(`Page ${i + 1} / ${range.count}`, PAGE_WIDTH - MARGINS.right - 50, y + 8, { width: 50, align: 'right' });
  }

  doc.flushPages();
  doc.end();
  return doc;
};

module.exports = { generateCahierDesCharges };
