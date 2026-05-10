const { generatePvSprint } = require('./templates/pvSprint');
const { generateFicheTechnique } = require('./templates/ficheTechnique');
const { generateCahierDesCharges } = require('./templates/cahierDesCharges');
const { generateFicheFonctionnelle } = require('./templates/ficheFonctionnelle');
const { generateRapportBugs } = require('./templates/rapportBugs');
const { generateRapportTemps } = require('./templates/rapportTemps');
const { generateReleaseNotes } = require('./templates/releaseNotes');

const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const StatusHistory = require('../models/StatusHistory');
const TimeLog = require('../models/TimeLog');
const Developer = require('../models/Developer');

/**
 * Génère un document PDF en retournant un stream PDFKit
 * @param {string} type  — nom du template
 * @param {string} id    — identifiant MongoDB
 * @returns {{ stream: PDFDocument, filename: string }}
 */
const generateDocument = async (type, id) => {
  switch (type) {

    case 'pv-sprint': {
      const sprint = await Sprint.findById(id).lean();
      if (!sprint) throw new Error('Sprint not found');
      const project = await Project.findById(sprint.project_id).populate('developers', '-password').lean();
      const tasks = await Task.find({ sprint_id: id }).populate('developer_id', 'name color').lean();
      const taskIds = tasks.map(t => t._id);
      const bugs = await Bug.find({ task_id: { $in: taskIds } }).lean();
      const stream = generatePvSprint({ sprint, tasks, bugs, project });
      return { stream, filename: `pv-sprint-${sprint.name.replace(/\s+/g, '-')}.pdf` };
    }

    case 'fiche-technique': {
      const task = await Task.findById(id).populate('developer_id', 'name color').lean();
      if (!task) throw new Error('Task not found');
      task.id = task._id;
      task.developer_name = task.developer_id?.name;
      task.developer_color = task.developer_id?.color;

      const bugs = await Bug.find({ task_id: id }).lean();
      const comments = await Comment.find({ task_id: id }).sort('-created_at').lean();
      const history = await StatusHistory.find({ task_id: id }).sort('changed_at').lean();
      const timeLogs = await TimeLog.find({ task_id: id }).populate('developer_id', 'name').lean();
      const mappedLogs = timeLogs.map(l => ({ ...l, developer_name: l.developer_id?.name }));
      const project = await Project.findById(task.project_id).lean();

      task.bugs = bugs;
      task.comments = comments;
      task.history = history;

      const stream = generateFicheTechnique({ task, timeLogs: mappedLogs, project });
      return { stream, filename: `fiche-technique-${task.title.substring(0, 30).replace(/\s+/g, '-')}.pdf` };
    }

    case 'cahier-des-charges': {
      const project = await Project.findById(id).populate('developers', '-password').lean();
      if (!project) throw new Error('Project not found');
      project.stack = JSON.parse(project.stack || '[]');

      const sprints = await Sprint.find({ project_id: id }).sort('-created_at').lean();
      const tasks = await Task.find({ project_id: id }).lean();
      const taskIds = tasks.map(t => t._id);
      const bugsRaw = await Bug.find({ task_id: { $in: taskIds } }).lean();
      const taskMap = {};
      tasks.forEach(t => { taskMap[String(t._id)] = t.title; });
      const bugs = bugsRaw.map(b => ({ ...b, task_title: taskMap[String(b.task_id)] }));

      const stream = generateCahierDesCharges({ project, sprints, tasks, bugs });
      return { stream, filename: `cahier-des-charges-${project.name.replace(/\s+/g, '-')}.pdf` };
    }

    case 'fiche-fonctionnelle': {
      const project = await Project.findById(id).populate('developers', '-password').lean();
      if (!project) throw new Error('Project not found');
      project.stack = JSON.parse(project.stack || '[]');

      const sprints = await Sprint.find({ project_id: id }).sort('created_at').lean();
      const tasks = await Task.find({ project_id: id }).lean();

      const stream = generateFicheFonctionnelle({ project, sprints, tasks });
      return { stream, filename: `fiche-fonctionnelle-${project.name.replace(/\s+/g, '-')}.pdf` };
    }

    case 'rapport-bugs': {
      const project = await Project.findById(id).lean();
      if (!project) throw new Error('Project not found');

      const tasks = await Task.find({ project_id: id }).lean();
      const taskIds = tasks.map(t => t._id);
      const taskMap = {};
      tasks.forEach(t => { taskMap[String(t._id)] = t; });

      const bugsRaw = await Bug.find({ task_id: { $in: taskIds } }).sort('-created_at').lean();
      const bugs = bugsRaw.map(b => ({ ...b, task_title: taskMap[String(b.task_id)]?.title }));

      const stream = generateRapportBugs({ project, bugs, tasks });
      return { stream, filename: `rapport-bugs-${project.name.replace(/\s+/g, '-')}.pdf` };
    }

    case 'rapport-temps': {
      const project = await Project.findById(id).lean();
      if (!project) throw new Error('Project not found');

      const tasks = await Task.find({ project_id: id }).lean();
      const taskIds = tasks.map(t => t._id);
      const timeLogsRaw = await TimeLog.find({ task_id: { $in: taskIds } })
        .populate('developer_id', 'name').sort('-logged_at').lean();
      const timeLogs = timeLogsRaw.map(l => ({ ...l, developer_name: l.developer_id?.name }));
      const sprints = await Sprint.find({ project_id: id }).lean();

      const stream = generateRapportTemps({ project, timeLogs, tasks, sprints });
      return { stream, filename: `rapport-temps-${project.name.replace(/\s+/g, '-')}.pdf` };
    }

    case 'release-notes': {
      const sprint = await Sprint.findById(id).lean();
      if (!sprint) throw new Error('Sprint not found');
      const project = await Project.findById(sprint.project_id).lean();
      const tasks = await Task.find({ sprint_id: id }).lean();
      const taskIds = tasks.map(t => t._id);
      const taskMap = {};
      tasks.forEach(t => { taskMap[String(t._id)] = t; });
      const bugsRaw = await Bug.find({ task_id: { $in: taskIds } }).lean();
      const bugs = bugsRaw.map(b => ({ ...b, task_title: taskMap[String(b.task_id)]?.title }));

      const stream = generateReleaseNotes({ sprint, tasks, bugs, project });
      return { stream, filename: `release-notes-${sprint.name.replace(/\s+/g, '-')}.pdf` };
    }

    default:
      throw new Error(`Unknown document type: ${type}`);
  }
};

module.exports = { generateDocument };
