const express = require('express');
const router = express.Router();
const path = require('path');
const DocumentEditor = require('../models/DocumentEditor');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const TimeLog = require('../models/TimeLog');
const { authenticateToken } = require('./auth');

// Génère le contenu TipTap initial selon le type de document
const buildPreFillContent = async (type, refId) => {
  const nodes = [];

  const heading = (text, level = 1) => ({
    type: 'heading', attrs: { level },
    content: [{ type: 'text', text }]
  });

  const paragraph = (text = '') => ({
    type: 'paragraph',
    content: text ? [{ type: 'text', text }] : undefined
  });

  const bulletList = (items) => ({
    type: 'bulletList',
    content: items.map(item => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
    }))
  });

  const makeTable = (headers, rows) => ({
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: headers.map(h => ({
          type: 'tableHeader',
          attrs: { colspan: 1, rowspan: 1 },
          content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: h }] }]
        }))
      },
      ...rows.map(row => ({
        type: 'tableRow',
        content: row.map(cell => ({
          type: 'tableCell',
          attrs: { colspan: 1, rowspan: 1 },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: String(cell ?? '—') }] }]
        }))
      }))
    ]
  });

  if (type === 'cahier-des-charges') {
    const project = await Project.findById(refId).populate('developers', '-password').lean();
    if (!project) throw new Error('Projet introuvable');
    const tasks = await Task.find({ project_id: refId }).lean();
    const bugs = await Bug.find({ task_id: { $in: tasks.map(t => t._id) } }).lean();

    const stack = Array.isArray(project.stack) ? project.stack : JSON.parse(project.stack || '[]');
    const features = tasks.filter(t => t.type === 'FEATURE');
    const techDebt = tasks.filter(t => t.type === 'TECH_DEBT');
    const openBugs = bugs.filter(b => !['FIXED', 'CLOSED'].includes(b.status));
    const done = tasks.filter(t => t.status === 'DONE').length;
    const rate = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

    nodes.push(heading(project.name, 1));
    nodes.push({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: `Cahier des Charges — Version 1.0 — ${new Date().toLocaleDateString('fr-FR')}` }] });
    nodes.push(heading('1. Contexte et objectifs', 2));
    nodes.push(paragraph(project.description || 'Description du projet à compléter...'));
    nodes.push({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Stack technologique : ' }, { type: 'text', text: stack.join(', ') || 'À compléter' }] });
    nodes.push({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Deadline : ' }, { type: 'text', text: project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : 'Non définie' }] });

    nodes.push(heading('2. Équipe projet', 2));
    if (project.developers?.length > 0) {
      nodes.push(bulletList(project.developers.map(d => `${d.name} — ${d.role || 'DEV'} (${d.email})`)));
    } else {
      nodes.push(paragraph('Aucun membre assigné.'));
    }

    nodes.push(heading('3. Périmètre fonctionnel', 2));
    if (features.length > 0) {
      nodes.push(makeTable(
        ['Fonctionnalité', 'Priorité', 'Story Points', 'Statut'],
        features.map(t => [t.title, t.priority, t.story_points || '—', t.status])
      ));
    } else {
      nodes.push(paragraph('Aucune fonctionnalité de type FEATURE définie.'));
    }

    nodes.push(heading('4. Exigences non-fonctionnelles', 2));
    if (techDebt.length > 0) {
      nodes.push(bulletList(techDebt.map(t => t.title + (t.description ? ` — ${t.description}` : ''))));
    } else {
      nodes.push(paragraph('Aucune dette technique recensée.'));
    }

    nodes.push(heading('5. Critères d\'acceptation', 2));
    nodes.push(paragraph(`Taux de complétion actuel : ${rate}% (${done}/${tasks.length} tâches DONE)`));
    nodes.push(paragraph('Définition du DONE : à compléter ici...'));

    nodes.push(heading('6. Annexes — Bugs ouverts', 2));
    if (openBugs.length > 0) {
      nodes.push(makeTable(
        ['Titre', 'Sévérité', 'Statut'],
        openBugs.map(b => [b.title, b.severity, b.status])
      ));
    } else {
      nodes.push(paragraph('Aucun bug ouvert. 🎉'));
    }

  } else if (type === 'pv-sprint') {
    const sprint = await Sprint.findById(refId).lean();
    if (!sprint) throw new Error('Sprint introuvable');
    const tasks = await Task.find({ sprint_id: refId }).lean();
    const doneTasks = tasks.filter(t => t.status === 'DONE');
    const notDone = tasks.filter(t => t.status !== 'DONE');
    const velocity = doneTasks.reduce((s, t) => s + (t.story_points || 0), 0);

    nodes.push(heading(`PV de Sprint — ${sprint.name}`, 1));
    nodes.push(paragraph(`Date : ${new Date().toLocaleDateString('fr-FR')}`));
    nodes.push(heading('1. Résultats', 2));
    nodes.push(paragraph(`Vélocité réalisée : ${velocity} story points`));
    nodes.push(paragraph(`Tâches terminées : ${doneTasks.length}/${tasks.length}`));
    if (doneTasks.length > 0) {
      nodes.push(makeTable(['Titre', 'Type', 'Story Points'], doneTasks.map(t => [t.title, t.type, t.story_points || '—'])));
    }
    if (notDone.length > 0) {
      nodes.push(heading('Tâches reportées', 3));
      nodes.push(bulletList(notDone.map(t => `${t.title} [${t.status}]`)));
    }
    nodes.push(heading('2. Décisions et actions', 2));
    nodes.push(paragraph(''));
    nodes.push(paragraph(''));
    nodes.push(heading('3. Signatures', 2));
    nodes.push(paragraph('SCRUM MASTER : ___________________'));
    nodes.push(paragraph('PRODUCT OWNER : ___________________'));
    nodes.push(paragraph('CLIENT : ___________________'));

  } else if (type === 'fiche-technique') {
    const task = await Task.findById(refId).populate('developer_id', 'name').lean();
    if (!task) throw new Error('Tâche introuvable');
    const timeLogs = await TimeLog.find({ task_id: refId }).populate('developer_id', 'name').lean();
    const total = timeLogs.reduce((s, l) => s + (l.hours || 0), 0);

    nodes.push(heading(task.title, 1));
    nodes.push(paragraph(`Type : ${task.type} | Priorité : ${task.priority} | Statut : ${task.status}`));
    nodes.push(paragraph(`Développeur : ${task.developer_id?.name || 'Non assigné'} | SP : ${task.story_points || '—'} | Estimé : ${task.estimated_hours || '—'}h`));
    nodes.push(heading('1. Description technique', 2));
    nodes.push(paragraph(task.description || 'Description à compléter...'));
    nodes.push(heading('2. Temps passé', 2));
    if (timeLogs.length > 0) {
      nodes.push(makeTable(['Développeur', 'Heures', 'Description'], timeLogs.map(l => [l.developer_id?.name || '—', `${l.hours}h`, l.description || '—'])));
      nodes.push(paragraph(`Total : ${total}h`));
    } else {
      nodes.push(paragraph('Aucun temps loggé.'));
    }
    nodes.push(heading('3. Notes techniques', 2));
    nodes.push(paragraph(''));

  } else {
    nodes.push(heading('Document', 1));
    nodes.push(paragraph('Rédigez votre document ici...'));
  }

  return { type: 'doc', content: nodes };
};

// GET /api/document-editor — liste des documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, type } = req.query;
    const filter = {};
    if (project_id) filter.project_id = project_id;
    if (type) filter.type = type;
    const docs = await DocumentEditor.find(filter)
      .populate('created_by', 'name color')
      .sort('-updated_at')
      .select('-content -html')
      .lean();
    res.json(docs.map(d => ({ ...d, id: d._id })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/document-editor/:id — charger un document
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await DocumentEditor.findById(req.params.id)
      .populate('created_by', 'name color')
      .populate('project_id', 'name')
      .lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    doc.id = doc._id;
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/document-editor — créer un document vide
router.post('/', authenticateToken, async (req, res) => {
  const { type = 'custom', title, project_id, sprint_id, task_id } = req.body;
  try {
    const doc = await DocumentEditor.create({
      type,
      title: title || 'Nouveau document',
      project_id,
      sprint_id,
      task_id,
      content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: title || 'Nouveau document' }] }, { type: 'paragraph' }] },
      html: '',
      created_by: req.user.id,
    });
    const obj = doc.toObject();
    obj.id = obj._id;
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/document-editor/pre-fill/:type/:refId — pré-remplir depuis DevTrack
router.post('/pre-fill/:type/:refId', authenticateToken, async (req, res) => {
  try {
    const content = await buildPreFillContent(req.params.type, req.params.refId);
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Pre-fill failed' });
  }
});

// PUT /api/document-editor/:id — sauvegarder
router.put('/:id', authenticateToken, async (req, res) => {
  const { title, content, html, project_id, sprint_id, task_id } = req.body;
  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (html !== undefined) updateData.html = html;
    if (project_id !== undefined) updateData.project_id = project_id;
    if (sprint_id !== undefined) updateData.sprint_id = sprint_id;
    if (task_id !== undefined) updateData.task_id = task_id;

    const doc = await DocumentEditor.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    doc.id = doc._id;
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/document-editor/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await DocumentEditor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/document-editor/:id/pdf — export HTML vers PDF via pdfmake
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const doc = await DocumentEditor.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const htmlToPdfmake = require('html-to-pdfmake');
    const PdfPrinter = require('pdfmake');

    const fonts = {
      Roboto: {
        normal: require.resolve('pdfmake/build/vfs_fonts.js'),
      }
    };

    const printer = new PdfPrinter(fonts);
    const html = doc.html || `<h1>${doc.title}</h1><p>Document vide.</p>`;
    const content = htmlToPdfmake(html);

    const docDef = {
      content: [
        { text: 'DevTrack Pro', style: 'header', color: '#6366f1' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#6366f1' }] },
        { text: '', margin: [0, 10] },
        ...content,
      ],
      styles: {
        header: { fontSize: 10, bold: true, margin: [0, 0, 0, 5] },
      },
      defaultStyle: { fontSize: 11, lineHeight: 1.5 },
      footer: (currentPage, pageCount) => ({
        text: `DevTrack Pro — ${doc.title} — Page ${currentPage}/${pageCount}`,
        fontSize: 8,
        color: '#94a3b8',
        margin: [40, 10],
      }),
    };

    const pdfDoc = printer.createPdfKitDocument(docDef);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title)}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

// POST /api/document-editor/:id/share
router.post('/:id/share', authenticateToken, async (req, res) => {
  const { type, ref_id, access } = req.body;
  try {
    const doc = await DocumentEditor.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    doc.shared_with.push({ type, ref_id, access: access || 'READ', shared_by: req.user.id });
    await doc.save();
    res.json({ ...doc.toObject(), id: doc._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/document-editor/:id/share/:shareId
router.delete('/:id/share/:shareId', authenticateToken, async (req, res) => {
  try {
    const doc = await DocumentEditor.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    doc.shared_with = doc.shared_with.filter(s => String(s._id) !== req.params.shareId);
    await doc.save();
    res.json({ ...doc.toObject(), id: doc._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/document-editor/:id/public
router.patch('/:id/public', authenticateToken, async (req, res) => {
  try {
    const doc = await DocumentEditor.findByIdAndUpdate(req.params.id, { is_public: req.body.is_public }, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ ...doc, id: doc._id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/document-editor/shared-with-me — docs partagés avec l'utilisateur courant
router.get('/shared-with-me', authenticateToken, async (req, res) => {
  try {
    const docs = await DocumentEditor
      .find({ $or: [{ is_public: true }, { 'shared_with.ref_id': req.user.id }] })
      .populate('created_by', 'name color')
      .populate('project_id', 'name')
      .select('-content -html')
      .sort('-updated_at')
      .lean();
    res.json(docs.map(d => ({ ...d, id: d._id })));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

