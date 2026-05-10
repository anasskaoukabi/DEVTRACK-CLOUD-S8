require('dotenv').config();
const mongoose = require('mongoose');

const Developer = require('./models/Developer');
const Project = require('./models/Project');
const Sprint = require('./models/Sprint');
const Task = require('./models/Task');
const Bug = require('./models/Bug');
const TimeLog = require('./models/TimeLog');
const Team = require('./models/Team');
const Meeting = require('./models/Meeting');
const DocumentEditor = require('./models/DocumentEditor');
const Tag = require('./models/Tag');

// QA & Governance Models
const TestPlan = require('./models/TestPlan');
const TestCase = require('./models/TestCase');
const TestCycle = require('./models/TestCycle');
const ReviewChecklist = require('./models/ReviewChecklist');
const CodeReview = require('./models/CodeReview');
const Risk = require('./models/Risk');
const Milestone = require('./models/Milestone');
const CodeMetrics = require('./models/CodeMetrics');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devtrack')
  .then(() => {
    console.log('Connected to MongoDB for global seeding');
    seedAll();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });

async function seedAll() {
  try {
    console.log('🧹 Clearing old data...');
    await Project.deleteMany({});
    await Sprint.deleteMany({});
    await Task.deleteMany({});
    await Bug.deleteMany({});
    await TimeLog.deleteMany({});
    await Team.deleteMany({});
    await Meeting.deleteMany({});
    await DocumentEditor.deleteMany({});
    await Tag.deleteMany({});
    
    await TestPlan.deleteMany({});
    await TestCase.deleteMany({});
    await TestCycle.deleteMany({});
    await ReviewChecklist.deleteMany({});
    await CodeReview.deleteMany({});
    await Risk.deleteMany({});
    await Milestone.deleteMany({});
    await CodeMetrics.deleteMany({});

    console.log('👥 Fetching developers...');
    const devs = await Developer.find();
    if (devs.length === 0) {
      console.error('No developers found. Please run the app once to trigger db.js developer seeding.');
      process.exit(1);
    }

    const admin = devs.find(d => d.role === 'ADMIN') || devs[0];
    const po = devs.find(d => d.role === 'PO') || devs[0];
    const sm = devs.find(d => d.role === 'SCRUM_MASTER') || devs[0];
    const dev1 = devs.find(d => d.role === 'DEV') || devs[0];
    const qa = devs.find(d => d.role === 'QA') || devs[0];
    const client = devs.find(d => d.role === 'CLIENT') || devs[0];

    // ── TEAMS ──
    const team1 = await Team.create({
      name: 'Squad Alpha',
      description: 'Équipe principale backend & frontend',
      members: [admin._id, dev1._id, qa._id, sm._id],
      scrum_master_id: sm._id,
      product_owner_id: po._id
    });

    // ── PROJECTS ──
    console.log('📁 Creating projects...');
    const p1 = await Project.create({
      name: 'ERP Laboratoire G2I - V3',
      description: 'Refonte complète du système pour la norme ISO 17025.',
      status: 'ACTIVE',
      repository_url: 'https://github.com/g2i/erp-lab',
      team_id: team1._id
    });

    const p2 = await Project.create({
      name: 'Portail Client Extranet',
      description: 'Interface web pour les clients finaux.',
      status: 'ACTIVE'
    });

    // ── TAGS ──
    const tFrontend = await Tag.create({ name: 'Frontend', color: '#3b82f6', project_id: p1._id });
    const tBackend = await Tag.create({ name: 'Backend', color: '#10b981', project_id: p1._id });
    const tBug = await Tag.create({ name: 'BugFix', color: '#ef4444', project_id: p1._id });
    const tIso = await Tag.create({ name: 'ISO 17025', color: '#8b5cf6', project_id: p1._id });

    // ── SPRINTS ──
    const now = new Date();
    const s1 = await Sprint.create({
      project_id: p1._id,
      name: 'Sprint 1 - Fondation',
      goal: 'Mise en place de l\'architecture de base',
      start_date: new Date(now.getTime() - 14 * 86400000),
      end_date: new Date(now.getTime() - 1 * 86400000),
      status: 'COMPLETED'
    });

    const s2 = await Sprint.create({
      project_id: p1._id,
      name: 'Sprint 2 - Workflows ISO',
      goal: 'Implémentation des validations techniques',
      start_date: new Date(),
      end_date: new Date(now.getTime() + 14 * 86400000),
      status: 'ACTIVE'
    });

    // ── TASKS ──
    console.log('📝 Creating tasks and bugs...');
    const t1 = await Task.create({
      project_id: p1._id, sprint_id: s1._id, title: 'Configuration Docker & CI/CD', description: 'Setup Github Actions',
      status: 'DONE', priority: 'HIGH', type: 'TECH_TASK', assignee_id: admin._id, reporter_id: sm._id, story_points: 5, tags: [tBackend._id]
    });
    const t2 = await Task.create({
      project_id: p1._id, sprint_id: s2._id, title: 'Validation technique PV', description: 'Double signature électronique',
      status: 'IN_PROGRESS', priority: 'CRITICAL', type: 'STORY', assignee_id: dev1._id, reporter_id: po._id, story_points: 8, tags: [tBackend._id, tIso._id]
    });
    const t3 = await Task.create({
      project_id: p1._id, sprint_id: s2._id, title: 'Dashboard Commercial', description: 'Vue d\'ensemble des ventes',
      status: 'TODO', priority: 'MEDIUM', type: 'STORY', assignee_id: null, reporter_id: po._id, story_points: 3, tags: [tFrontend._id]
    });

    // ── TIMELOGS ──
    await TimeLog.create([
      { task_id: t1._id, developer_id: admin._id, date: new Date(now.getTime() - 10 * 86400000), hours: 4, description: 'Setup Dockerfile' },
      { task_id: t1._id, developer_id: admin._id, date: new Date(now.getTime() - 9 * 86400000), hours: 3, description: 'Github Actions config' },
      { task_id: t2._id, developer_id: dev1._id, date: now, hours: 2, description: 'Implémentation modèle signature' },
    ]);

    // ── BUGS ──
    const b1 = await Bug.create({
      project_id: p1._id, task_id: t2._id, title: 'Erreur 500 sur génération PDF', description: 'pdfmake crashe avec les grandes tables',
      status: 'OPEN', severity: 'HIGH', priority: 'HIGH', assignee_id: dev1._id, reporter_id: qa._id, environment: 'STAGING', steps_to_reproduce: '1. Ouvrir PV\n2. Cliquer imprimer', tags: [tBug._id]
    });

    // ── RISKS ──
    console.log('⚠️ Creating governance data (Risks, Milestones)...');
    await Risk.create([
      { project_id: p1._id, title: 'Retard migration base de données', description: 'Schéma Odoo incompatible', probability: 4, impact: 5, category: 'TECHNIQUE', status: 'IDENTIFIED', owner_id: admin._id },
      { project_id: p1._id, title: 'Changement norme ISO en cours', description: 'Nouveaux prérequis audit', probability: 2, impact: 4, category: 'AUTRE', status: 'ANALYSED', owner_id: po._id }
    ]);

    // ── MILESTONES ──
    await Milestone.create([
      { project_id: p1._id, name: 'Audit Blanc ISO 17025', target_date: new Date(now.getTime() + 30 * 86400000), status: 'UPCOMING', deliverables: ['Rapport traçabilité', 'Logs complets'] },
      { project_id: p1._id, name: 'V1.0 Production', target_date: new Date(now.getTime() + 60 * 86400000), status: 'UPCOMING', deliverables: ['Deploiement', 'Formation utilisateurs'] }
    ]);

    // ── QUALITY METRICS ──
    console.log('🔬 Creating quality metrics...');
    await CodeMetrics.create([
      { project_id: p1._id, sprint_id: s2._id, module_name: 'MissionController.js', language: 'JavaScript', source: 'AUTO', loc: 450, sloc: 380, comment_ratio: 15, cyclomatic_complexity: 24, cognitive_complexity: 30, maintainability_index: 45, max_nesting_depth: 5, duplication_pct: 12, test_coverage_pct: 65, wmc: 35, dit: 2, cbo: 8, rfc: 40, lcom: 0.6, analyzed_by: admin._id },
      { project_id: p1._id, module_name: 'AuthMiddleware.ts', language: 'TypeScript', source: 'SONARQUBE', loc: 85, sloc: 60, comment_ratio: 25, cyclomatic_complexity: 4, cognitive_complexity: 5, maintainability_index: 85, max_nesting_depth: 2, duplication_pct: 0, test_coverage_pct: 95, analyzed_by: admin._id },
      { project_id: p1._id, module_name: 'PdfGenerator.js', language: 'JavaScript', source: 'MANUAL', loc: 850, sloc: 750, comment_ratio: 5, cyclomatic_complexity: 52, cognitive_complexity: 65, maintainability_index: 22, max_nesting_depth: 7, duplication_pct: 25, test_coverage_pct: 20, wmc: 60, dit: 1, cbo: 15, rfc: 80, lcom: 0.9, analyzed_by: dev1._id },
    ]);

    // ── REVIEW CHECKLISTS & REVIEWS ──
    const checklist = await ReviewChecklist.create({
      project_id: p1._id, name: 'Standard Backend JS', category: 'BACKEND', is_default: true,
      items: [
        { text: 'Pas de console.log() oubliés', category: 'LISIBILITÉ', mandatory: false },
        { text: 'Vérification des droits d\'accès (Auth)', category: 'SÉCURITÉ', mandatory: true },
        { text: 'Gestion des erreurs (try/catch)', category: 'ARCHITECTURE', mandatory: true }
      ]
    });

    await CodeReview.create({
      task_id: t1._id, project_id: p1._id, title: 'Revue Dockerfile', reviewer_id: admin._id, author_id: dev1._id, status: 'APPROVED',
      items: [
        { text: 'Pas de console.log() oubliés', status: 'PASS' },
        { text: 'Vérification des droits d\'accès (Auth)', status: 'PASS' },
        { text: 'Gestion des erreurs (try/catch)', status: 'N/A' }
      ],
      comments: [{ text: 'Bon travail sur l\'image alpine.', author_id: admin._id, date: now }],
      score: 100
    });

    // ── TEST PLANS & CYCLES ──
    const plan = await TestPlan.create({
      project_id: p1._id, title: 'Tests de Non-Régression V1', description: 'Valider les flux critiques', type: 'REGRESSION', environment: 'STAGING', status: 'ACTIVE', created_by: qa._id
    });

    const tc1 = await TestCase.create({ project_id: p1._id, test_plan_id: plan._id, title: 'Création Ordre de Mission', status: 'ACTIVE', priority: 'CRITICAL', category: 'Workflows', steps: [{order:1, action:'Remplir formulaire', expected_result:'Sauvegardé en BDD'}] });
    const tc2 = await TestCase.create({ project_id: p1._id, test_plan_id: plan._id, title: 'Génération PV', status: 'ACTIVE', priority: 'HIGH', category: 'Documents', steps: [{order:1, action:'Cliquer imprimer', expected_result:'PDF généré sans erreur'}] });

    const cycle = await TestCycle.create({
      project_id: p1._id, test_plan_id: plan._id, name: 'Cycle Sprint 2', environment: 'STAGING', status: 'IN_PROGRESS', start_date: now
    });

    cycle.executions.push(
      { test_case_id: tc1._id, status: 'PASS', executed_by: qa._id, executed_at: now, duration_min: 15 },
      { test_case_id: tc2._id, status: 'FAIL', executed_by: qa._id, executed_at: now, bug_ids: [b1._id], duration_min: 5, actual_result: 'Crash 500' }
    );
    await cycle.save();

    // ── MEETINGS ──
    await Meeting.create({
      title: 'Daily Standup', project_id: p1._id, team_id: team1._id, organizer_id: sm._id, type: 'STANDUP',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      duration_min: 15,
      status: 'DONE', attendees: [admin._id, dev1._id]
    });

    // ── DOCUMENTS ──
    await DocumentEditor.create({
      title: 'Architecture Technique V3', project_id: p1._id, author_id: admin._id,
      content: '<h1>Architecture G2I V3</h1><p>Nous utilisons Node.js, React et MongoDB.</p>', is_favorite: true
    });

    console.log('\n🎉 ALL DATA SEEDED SUCCESSFULLY! (Projects, Sprints, Tasks, Bugs, Metrics, QA, etc.)');
    process.exit(0);

  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}
