require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Developer = require('./models/Developer');
const Project = require('./models/Project');
const Sprint = require('./models/Sprint');
const Task = require('./models/Task');
const Bug = require('./models/Bug');
const TimeLog = require('./models/TimeLog');
const Team = require('./models/Team');
const Meeting = require('./models/Meeting');
const Tag = require('./models/Tag');

// QA & Governance
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
    console.log('🔗 Connected to MongoDB. Starting G2I ODOO 19 SEEDING...');
    seedRealistic();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });

// Utilitaires de dates
const today = new Date();
const daysAgo = (days) => new Date(today.getTime() - days * 86400000);
const daysFromNow = (days) => new Date(today.getTime() + days * 86400000);

async function seedRealistic() {
  try {
    console.log('🧹 Clearing existing data...');
    const models = [Project, Sprint, Task, Bug, TimeLog, Team, Meeting, Tag, TestPlan, TestCase, TestCycle, ReviewChecklist, CodeReview, Risk, Milestone, CodeMetrics];
    for (const model of models) await model.deleteMany({});

    console.log('👥 Loading/Creating Developers...');
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('password123', 10);
    
    await Developer.deleteMany({});
    await Developer.create([
      // Core Team
      { name: 'Tech Lead (Admin)', email: 'admin@g2i.io',   password: defaultPassword, role: 'ADMIN',        color: '#6366f1' },
      { name: 'Product Owner (Client)', email: 'po@g2i.io',  password: defaultPassword, role: 'PO',           color: '#f59e0b' },
      { name: 'Scrum Master',   email: 'sm@g2i.io',   password: defaultPassword, role: 'SCRUM_MASTER', color: '#8b5cf6' },
      { name: 'Odoo Developer 1',    email: 'dev1@g2i.io',   password: defaultPassword, role: 'DEV',          color: '#10b981' },
      { name: 'Frontend/Owl Developer',   email: 'dev2@g2i.io',    password: defaultPassword, role: 'DEV',          color: '#ef4444' },
      { name: 'QA Engineer (ISO)',  email: 'qa@g2i.io',    password: defaultPassword, role: 'QA',           color: '#f97316' },
      
      // Extended Dev Team
      { name: 'Backend Python Dev', email: 'python.dev@g2i.io', password: defaultPassword, role: 'DEV', color: '#0ea5e9' },
      { name: 'Junior Odoo Dev', email: 'junior@g2i.io', password: defaultPassword, role: 'DEV', color: '#84cc16' },
      { name: 'DevOps Engineer', email: 'devops@g2i.io', password: defaultPassword, role: 'DEV', color: '#64748b' },
      
      // Extended QA Team
      { name: 'Manual Tester', email: 'tester@g2i.io', password: defaultPassword, role: 'QA', color: '#f43f5e' },
      
      // Clients & Auditors
      { name: 'Client Auditor (COFRAC)', email: 'auditor@cofrac.io', password: defaultPassword, role: 'CLIENT', color: '#14b8a6' },
      { name: 'Laboratory Manager', email: 'lab.manager@client.io', password: defaultPassword, role: 'CLIENT', color: '#d946ef' },
      { name: 'Technical Director', email: 'director@client.io', password: defaultPassword, role: 'CLIENT', color: '#8b5cf6' }
    ]);

    const devs = await Developer.find();
    const admin = devs.find(d => d.email === 'admin@g2i.io');
    const po = devs.find(d => d.email === 'po@g2i.io');
    const sm = devs.find(d => d.email === 'sm@g2i.io');
    const dev1 = devs.find(d => d.email === 'dev1@g2i.io');
    const dev2 = devs.find(d => d.email === 'dev2@g2i.io');
    const qa = devs.find(d => d.email === 'qa@g2i.io');
    const pythonDev = devs.find(d => d.email === 'python.dev@g2i.io');
    const devops = devs.find(d => d.email === 'devops@g2i.io');

    // ── TEAMS ──
    const teamCore = await Team.create({
      name: 'G2I Migration Team',
      description: 'Équipe principale en charge de la migration Odoo 19 et conformité ISO 17025',
      members: [admin._id, dev1._id, dev2._id, pythonDev._id, devops._id, qa._id, sm._id, po._id],
      scrum_master_id: sm._id,
      product_owner_id: po._id
    });

    // ── PROJECTS ──
    const p1 = await Project.create({
      name: 'G2I ERP - Migration Odoo 19',
      description: 'Transition du système ERP G2I (norme ISO 17025) vers Odoo 19. Objectifs: Refonte des Meta-Roles, Workflows Logicert (Ordres de Mission), système Audit Trail dynamique et correction des composants Owl JS.',
      status: 'ACTIVE',
      repository_url: 'https://github.com/g2i-lab/odoo-erp',
      team_id: teamCore._id,
      start_date: daysAgo(90),
      target_end_date: daysFromNow(60),
      budget: 150000
    });

    // ── TAGS ──
    const tagsData = [
      { name: 'Epic: Migration', color: '#1e3a8a' },
      { name: 'Epic: Security', color: '#831843' },
      { name: 'Epic: Logicert Workflows', color: '#14532d' },
      { name: 'Epic: Audit Trail', color: '#581c87' },
      { name: 'Epic: Frontend Owl', color: '#7c2d12' },
      { name: 'Odoo 19', color: '#8b5cf6' },
      { name: 'ISO-17025', color: '#ef4444' },
      { name: 'BugFix', color: '#dc2626' }
    ];
    const tags = {};
    for (const td of tagsData) {
      const t = await Tag.create({ ...td, project_id: p1._id });
      tags[td.name] = t._id;
    }

    // ── SPRINTS ──
    const sprints = await Sprint.create([
      { project_id: p1._id, name: 'Sprint 1 - Migration Core', goal: 'Odoo 19 DB connection and schema incompatibilities', start_date: daysAgo(60), end_date: daysAgo(46), status: 'COMPLETED' },
      { project_id: p1._id, name: 'Sprint 2 - Security Refactor', goal: 'G2I Security Core Meta-Role architecture', start_date: daysAgo(45), end_date: daysAgo(31), status: 'COMPLETED' },
      { project_id: p1._id, name: 'Sprint 3 - Logicert & Audit', goal: 'ISO 17025 Mission Workflows & Dynamic Audit', start_date: daysAgo(30), end_date: daysAgo(16), status: 'COMPLETED' },
      { project_id: p1._id, name: 'Sprint 4 - UI Stabilization', goal: 'Resolve Commercial Dashboard OwlError', start_date: daysAgo(15), end_date: daysAgo(1), status: 'COMPLETED' },
      { project_id: p1._id, name: 'Sprint 5 - UAT & ISO Audit', goal: 'Finalize ISO 17025 Traceability Systems', start_date: daysAgo(0), end_date: daysFromNow(14), status: 'ACTIVE' }
    ]);
    const [s1, s2, s3, s4, s5] = sprints;

    // ── TASKS ──
    let allTasks = [];
    
    // Epic 1: Migration Technique Odoo 19
    allTasks.push(
      { sprint_id: s1._id, title: 'Fix: Database connection and schema incompatibility errors', type: 'BUG', status: 'DONE', story_points: 8, developer_id: admin._id, tag_ids: [tags['Epic: Migration'], tags['Odoo 19'], tags['BugFix']] },
      { sprint_id: s1._id, title: 'Update manifest.py files for all custom modules to Odoo 19', type: 'TECH_TASK', status: 'DONE', story_points: 3, developer_id: dev1._id, tag_ids: [tags['Epic: Migration'], tags['Odoo 19']] },
      { sprint_id: s1._id, title: 'Resolve KeyError: \'calibration.order\' in systray notification', type: 'BUG', status: 'DONE', story_points: 5, developer_id: admin._id, tag_ids: [tags['Epic: Migration'], tags['Odoo 19'], tags['BugFix']] }
    );

    // Epic 2: Core Security & Meta-Roles
    allTasks.push(
      { sprint_id: s2._id, title: 'Refactor G2I Security Core to standard Meta-Role (Profile) architecture', type: 'FEATURE', status: 'DONE', story_points: 13, developer_id: admin._id, tag_ids: [tags['Epic: Security'], tags['Odoo 19']] },
      { sprint_id: s2._id, title: 'Implement role-based group inheritance to replace model-level security', type: 'FEATURE', status: 'DONE', story_points: 8, developer_id: dev1._id, tag_ids: [tags['Epic: Security']] },
      { sprint_id: s2._id, title: 'Enforce strict segregation of duties for technical validation', type: 'FEATURE', status: 'DONE', story_points: 5, developer_id: dev1._id, tag_ids: [tags['Epic: Security'], tags['ISO-17025']] }
    );

    // Epic 3: Logicert & Workflows ISO 17025
    allTasks.push(
      { sprint_id: s3._id, title: 'Automate Mission Personnel Assignment (Odoo Activities)', type: 'FEATURE', status: 'DONE', story_points: 5, developer_id: dev1._id, tag_ids: [tags['Epic: Logicert Workflows']] },
      { sprint_id: s3._id, title: 'Link technical interventions to electronic document signatures (Ordres de Mission et PV)', type: 'FEATURE', status: 'DONE', story_points: 8, developer_id: admin._id, tag_ids: [tags['Epic: Logicert Workflows'], tags['ISO-17025']] },
      { sprint_id: s3._id, title: 'Fix validation errors in the mission workflow', type: 'BUG', status: 'DONE', story_points: 5, developer_id: dev1._id, tag_ids: [tags['Epic: Logicert Workflows'], tags['BugFix']] },
      { sprint_id: s3._id, title: 'Automate fallback values for mandatory calibration fields', type: 'TECH_TASK', status: 'DONE', story_points: 3, developer_id: dev2._id, tag_ids: [tags['Epic: Logicert Workflows'], tags['ISO-17025']] }
    );

    // Epic 4: Audit Trail System
    allTasks.push(
      { sprint_id: s3._id, title: 'Develop dynamic audit system capturing all CRUD & workflow actions', type: 'FEATURE', status: 'DONE', story_points: 13, developer_id: admin._id, tag_ids: [tags['Epic: Audit Trail'], tags['ISO-17025']] },
      { sprint_id: s3._id, title: 'Support relational data (One2many/Many2many) in audit trail', type: 'FEATURE', status: 'DONE', story_points: 8, developer_id: dev1._id, tag_ids: [tags['Epic: Audit Trail']] },
      { sprint_id: s3._id, title: 'Extend audit coverage to core Odoo models (Sales, Invoices)', type: 'FEATURE', status: 'DONE', story_points: 5, developer_id: dev1._id, tag_ids: [tags['Epic: Audit Trail']] }
    );

    // Epic 5: Frontend Owl & Dashboards
    allTasks.push(
      { sprint_id: s4._id, title: 'Debug Commercial Dashboard persistent OwlError', type: 'BUG', status: 'DONE', story_points: 8, developer_id: dev2._id, tag_ids: [tags['Epic: Frontend Owl'], tags['BugFix']] },
      { sprint_id: s4._id, title: 'Fix TypeError: \'remove\' called on an object that does not implement interface Element', type: 'BUG', status: 'DONE', story_points: 5, developer_id: dev2._id, tag_ids: [tags['Epic: Frontend Owl'], tags['BugFix']] },
      { sprint_id: s4._id, title: 'Stabilize dashboard rendering logic during Kanban/List embedded view transitions', type: 'TECH_TASK', status: 'DONE', story_points: 5, developer_id: admin._id, tag_ids: [tags['Epic: Frontend Owl']] },
      { sprint_id: s4._id, title: 'Update PDF rendering methods for compatibility with Odoo 19', type: 'FEATURE', status: 'DONE', story_points: 5, developer_id: dev1._id, tag_ids: [tags['Epic: Frontend Owl']] }
    );

    // Sprint 5 (Active UAT & ISO Compliance)
    allTasks.push(
      { sprint_id: s5._id, title: 'Finalize ISO 17025 compliance of ERP system', type: 'FEATURE', status: 'IN_PROGRESS', story_points: 8, developer_id: qa._id, tag_ids: [tags['ISO-17025']] },
      { sprint_id: s5._id, title: 'Hardening ISO 17025 Traceability Systems', type: 'TECH_TASK', status: 'IN_PROGRESS', story_points: 5, developer_id: admin._id, tag_ids: [tags['ISO-17025']] },
      { sprint_id: s5._id, title: 'Push code explicitly excluding Odoo 19 work-in-progress migration', type: 'TECH_TASK', status: 'TODO', story_points: 2, developer_id: dev1._id, tag_ids: [tags['Odoo 19']] }
    );

    let createdTasks = [];
    for (const tData of allTasks) {
      createdTasks.push(await Task.create({ ...tData, project_id: p1._id }));
    }

    // ── BUGS (Module Qualité) ──
    const owlTask = createdTasks.find(t=>t.title.includes('OwlError'));
    if(owlTask) {
      await Bug.create({
        project_id: p1._id, task_id: owlTask._id,
        title: 'OwlError & TypeError in CommercialDashboard',
        description: 'Persistent `OwlError` and `TypeError: remove called on an object that does not implement interface Element` occurring within the Odoo web client. Triggered during the lifecycle of the `CommercialDashboard` component when switching between embedded Kanban/List views.',
        status: 'RESOLVED', severity: 'CRITICAL', priority: 'HIGH', environment: 'STAGING', steps_to_reproduce: '1. Open Commercial Dashboard\n2. Toggle Kanban/List view rapidly', assignee_id: dev2._id, reporter_id: qa._id, tags: [tags['Epic: Frontend Owl']]
      });
    }

    const rpcTask = createdTasks.find(t=>t.title.includes('calibration.order'));
    if(rpcTask) {
      await Bug.create({
        project_id: p1._id, task_id: rpcTask._id,
        title: 'KeyError: calibration.order causing RPC Errors',
        description: 'Critical KeyError occurring within the Odoo systray notification system. The `calibration.order` model is not being properly registered or initialized, causing an RPC error preventing access to system settings.',
        status: 'RESOLVED', severity: 'BLOCKER', priority: 'CRITICAL', environment: 'PRODUCTION', steps_to_reproduce: '1. Login\n2. View Systray Notifications', assignee_id: admin._id, reporter_id: qa._id, tags: [tags['Epic: Migration']]
      });
    }

    // ── RISQUES ──
    await Risk.create([
      { project_id: p1._id, title: 'Odoo 19 Database Schema Incompatibility', description: 'Significant schema changes in Odoo 19 core models may break the existing ISO 17025 Audit Trail module.', probability: 4, impact: 5, category: 'TECHNIQUE', status: 'MITIGATED', owner_id: admin._id, mitigation_plan: 'Extensive testing of dynamic CRUD tracking on Odoo 19.' },
      { project_id: p1._id, title: 'ISO 17025 Compliance Failure', description: 'Gaps in segregation of duties or missing electronic signatures could result in COFRAC audit failure.', probability: 2, impact: 5, category: 'AUTRE', status: 'ANALYSED', owner_id: po._id, mitigation_plan: 'Strict state-based blocking and Meta-Role enforcement.' }
    ]);

    // ── QA : TEST PLANS & CYCLES ──
    const plan = await TestPlan.create({
      project_id: p1._id, title: 'ISO 17025 Compliance Workflow Validation', description: 'Ensure full traceability and compliance for Ordres de Mission, Interventions, and Audit Trail.', type: 'FUNCTIONAL', environment: 'STAGING', status: 'ACTIVE', created_by: qa._id
    });

    const tc1 = await TestCase.create({ project_id: p1._id, test_plan_id: plan._id, title: 'Validate Segregation of Duties (Meta-Roles)', status: 'ACTIVE', priority: 'CRITICAL', category: 'Security', steps: [{order:1, action:'Attempt to approve technical intervention without Technical Manager profile', expected_result:'Access denied via Meta-Role rule'}] });
    const tc2 = await TestCase.create({ project_id: p1._id, test_plan_id: plan._id, title: 'Audit Trail captures Many2many changes', status: 'ACTIVE', priority: 'HIGH', category: 'Audit', steps: [{order:1, action:'Modify instruments linked to an intervention', expected_result:'Change logged accurately in audit system'}] });

    const cycle = await TestCycle.create({
      project_id: p1._id, test_plan_id: plan._id, name: 'UAT Execution - Sprint 5', environment: 'STAGING', status: 'IN_PROGRESS', start_date: daysAgo(2)
    });

    cycle.executions.push(
      { test_case_id: tc1._id, status: 'PASS', executed_by: qa._id, executed_at: daysAgo(1), duration_min: 15 },
      { test_case_id: tc2._id, status: 'PASS', executed_by: qa._id, executed_at: daysAgo(1), duration_min: 20 }
    );
    await cycle.save();

    // ── QUALITY METRICS ──
    await CodeMetrics.create([
      { project_id: p1._id, module_name: 'commercial_dashboard.js (Owl)', language: 'JavaScript', source: 'SONARQUBE', loc: 450, sloc: 380, cyclomatic_complexity: 25, maintainability_index: 55, analyzed_by: dev2._id },
      { project_id: p1._id, module_name: 'security_meta_role.py', language: 'Python', source: 'SONARQUBE', loc: 320, sloc: 280, cyclomatic_complexity: 15, maintainability_index: 75, analyzed_by: admin._id },
      { project_id: p1._id, module_name: 'audit_trail_mixin.py', language: 'Python', source: 'SONARQUBE', loc: 500, sloc: 400, cyclomatic_complexity: 20, maintainability_index: 68, analyzed_by: dev1._id }
    ]);

    // =========================================================================
    // ── PROJET 2 : PORTAIL E-GOV MAROC (TÉLÉPAIEMENT TGR) ──
    // =========================================================================
    console.log('🚀 Loading Project 2: Portail e-Gov Maroc...');

    // Nouveaux développeurs spécifiques e-Gov
    const egovDevs = await Developer.create([
      { name: 'UX/UI Designer (e-Gov)', email: 'ux@egov.ma', password: defaultPassword, role: 'DEV', color: '#ec4899' },
      { name: 'Security Auditor (CNDP)', email: 'audit@cndp.ma', password: defaultPassword, role: 'QA', color: '#14b8a6' },
      { name: 'Senior Java Dev', email: 'java@egov.ma', password: defaultPassword, role: 'DEV', color: '#f59e0b' }
    ]);
    const uxDev = egovDevs[0];
    const secQA = egovDevs[1];
    const javaDev = egovDevs[2];

    const teamEgov = await Team.create({
      name: 'TGR e-Gov Squad',
      description: 'Équipe dédiée au développement du portail citoyen pour le paiement des taxes locales.',
      members: [admin._id, sm._id, po._id, uxDev._id, secQA._id, javaDev._id],
      scrum_master_id: sm._id,
      product_owner_id: po._id
    });

    const p2 = await Project.create({
      name: 'Portail e-Gov: Télépaiement TGR',
      description: "Développement d'une plateforme web et mobile sécurisée pour le paiement des taxes locales par les citoyens marocains. Intégration CMI.",
      status: 'ACTIVE',
      repository_url: 'https://github.com/tgr-maroc/portail-taxes',
      team_id: teamEgov._id,
      start_date: daysAgo(45),
      target_end_date: daysFromNow(90),
      budget: 350000
    });

    // Tags e-Gov
    const tagsEgovData = [
      { name: 'Intégration CMI', color: '#2563eb' },
      { name: 'Sécurité CNDP', color: '#16a34a' },
      { name: 'UX Citoyen', color: '#d946ef' },
      { name: 'Backend SpringBoot', color: '#ea580c' },
      { name: 'Frontend React', color: '#06b6d4' }
    ];
    const tagsEgov = {};
    for (const td of tagsEgovData) {
      const t = await Tag.create({ ...td, project_id: p2._id });
      tagsEgov[td.name] = t._id;
    }

    // Sprints e-Gov
    const sprintsEgov = await Sprint.create([
      { project_id: p2._id, name: 'Sprint 1 - UX/UI & Architecture', goal: 'Validation des maquettes et setup du repo SpringBoot', start_date: daysAgo(45), end_date: daysAgo(31), status: 'COMPLETED' },
      { project_id: p2._id, name: 'Sprint 2 - Intégration CMI (Phase 1)', goal: 'Connexion Sandbox CMI et flux de paiement basique', start_date: daysAgo(30), end_date: daysAgo(16), status: 'COMPLETED' },
      { project_id: p2._id, name: 'Sprint 3 - Sécurisation & Front-End', goal: 'Chiffrement des données sensibles (CNDP) et intégration React', start_date: daysAgo(15), end_date: daysAgo(1), status: 'COMPLETED' },
      { project_id: p2._id, name: 'Sprint 4 - Tests de charge & UAT', goal: 'Préparation au lancement pilote', start_date: daysAgo(0), end_date: daysFromNow(14), status: 'ACTIVE' }
    ]);
    const [se1, se2, se3, se4] = sprintsEgov;

    // Tâches e-Gov
    let egovTasks = [];
    egovTasks.push(
      // Sprint 1
      { sprint_id: se1._id, title: 'Conception des maquettes Figma (Mobile-first)', type: 'FEATURE', status: 'DONE', story_points: 8, developer_id: uxDev._id, tag_ids: [tagsEgov['UX Citoyen']] },
      { sprint_id: se1._id, title: 'Setup architecture SpringBoot & Base de données PostgreSQL', type: 'TECH_TASK', status: 'DONE', story_points: 5, developer_id: javaDev._id, tag_ids: [tagsEgov['Backend SpringBoot']] },
      
      // Sprint 2
      { sprint_id: se2._id, title: 'Implémentation API Gateway pour flux CMI', type: 'FEATURE', status: 'DONE', story_points: 13, developer_id: javaDev._id, tag_ids: [tagsEgov['Intégration CMI'], tagsEgov['Backend SpringBoot']] },
      { sprint_id: se2._id, title: 'Bug: Sandbox CMI timeout lors du callback', type: 'BUG', status: 'DONE', story_points: 3, developer_id: javaDev._id, tag_ids: [tagsEgov['Intégration CMI']] },
      
      // Sprint 3
      { sprint_id: se3._id, title: 'Développement UI React pour le formulaire de paiement', type: 'FEATURE', status: 'DONE', story_points: 8, developer_id: admin._id, tag_ids: [tagsEgov['Frontend React']] },
      { sprint_id: se3._id, title: 'Audit sécurité (Conformité CNDP) des données personnelles', type: 'TECH_TASK', status: 'DONE', story_points: 8, developer_id: secQA._id, tag_ids: [tagsEgov['Sécurité CNDP']] },
      
      // Sprint 4 (Active)
      { sprint_id: se4._id, title: 'Optimisation des requêtes BD pour la recherche des taxes', type: 'TECH_TASK', status: 'IN_PROGRESS', story_points: 5, developer_id: javaDev._id, tag_ids: [tagsEgov['Backend SpringBoot']] },
      { sprint_id: se4._id, title: "Tests d'accessibilité (WCAG) sur le portail", type: 'TECH_TASK', status: 'TODO', story_points: 3, developer_id: uxDev._id, tag_ids: [tagsEgov['UX Citoyen']] },
      { sprint_id: se4._id, title: 'Simulation de charge (JMeter) sur API Paiement', type: 'FEATURE', status: 'IN_PROGRESS', story_points: 8, developer_id: secQA._id, tag_ids: [tagsEgov['Sécurité CNDP']] }
    );

    let createdEgovTasks = [];
    for (const tData of egovTasks) {
      createdEgovTasks.push(await Task.create({ ...tData, project_id: p2._id }));
    }

    // TimeLogs (Saisie des temps) pour quelques tâches e-Gov
    const tLogTask1 = createdEgovTasks.find(t => t.title.includes('Conception des maquettes'));
    const tLogTask2 = createdEgovTasks.find(t => t.title.includes('Implémentation API Gateway'));
    if (tLogTask1) {
      await TimeLog.create([
        { task_id: tLogTask1._id, developer_id: uxDev._id, hours: 4, description: 'Recherche UX et wireframes' },
        { task_id: tLogTask1._id, developer_id: uxDev._id, hours: 6, description: 'Design haute fidélité sur Figma' }
      ]);
    }
    if (tLogTask2) {
      await TimeLog.create([
        { task_id: tLogTask2._id, developer_id: javaDev._id, hours: 8, description: 'Intégration du SDK CMI' },
        { task_id: tLogTask2._id, developer_id: javaDev._id, hours: 4, description: 'Gestion des erreurs de transaction' },
        { task_id: tLogTask2._id, developer_id: admin._id, hours: 2, description: "Revue de code sur l'intégration CMI" }
      ]);
    }

    // Milestones
    await Milestone.create([
      { project_id: p2._id, name: 'Phase 1: Architecture Validée', description: 'Validation finale des choix techniques et des maquettes avec la TGR.', target_date: daysAgo(30), status: 'COMPLETED' },
      { project_id: p2._id, name: 'Phase 2: Intégration Bancaire', description: 'Connexion fonctionnelle avec la plateforme CMI en environnement de test.', target_date: daysAgo(10), status: 'COMPLETED' },
      { project_id: p2._id, name: 'Phase 3: Pilote Région Casa-Settat', description: 'Déploiement limité à la région pour tests réels.', target_date: daysFromNow(20), status: 'UPCOMING' }
    ]);

    // Code Reviews
    if (tLogTask2) { // Tâche d'intégration CMI
      await CodeReview.create({
        task_id: tLogTask2._id,
        project_id: p2._id,
        reviewer_id: admin._id,
        status: 'APPROVED',
        items: [
          { item_text: 'Pas de clés en dur dans le code', category: 'Security', mandatory: true, passed: true },
          { item_text: 'Tests unitaires présents', category: 'Quality', mandatory: true, passed: true }
        ],
        global_comment: 'Très bonne intégration. Le fallback en cas de timeout CMI est robuste.',
        score: 100,
        created_by: javaDev._id
      });
    }

    // Réunions (Meetings)
    await Meeting.create([
      { project_id: p2._id, organizer_id: sm._id, title: 'Sprint 4 Planning', notes: 'Planification des tests de charge et préparation de la phase pilote.', date: daysAgo(1), duration_min: 120, status: 'DONE', attendees: [sm._id, po._id, admin._id, javaDev._id, secQA._id] },
      { project_id: p2._id, organizer_id: sm._id, title: 'Point Synchronisation CMI', notes: 'Discussion avec les équipes CMI concernant les timeouts réseau en production.', date: daysFromNow(2), duration_min: 60, status: 'SCHEDULED', attendees: [admin._id, javaDev._id] }
    ]);

    console.log('\n🎉 MEGA SEEDING (GITHUB CONVERSATION MAPPING & E-GOV MAROC) TERMINÉ AVEC SUCCÈS !');
    process.exit(0);

  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}
