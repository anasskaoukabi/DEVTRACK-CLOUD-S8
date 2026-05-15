require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Developer = require('../models/Developer');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const TestPlan = require('../models/TestPlan');
const TestCase = require('../models/TestCase');
const Team = require('../models/Team');
const Risk = require('../models/Risk');
const ProjectBudget = require('../models/ProjectBudget');
const TestCycle = require('../models/TestCycle');
const TimeLog = require('../models/TimeLog');
const Milestone = require('../models/Milestone');
const Comment = require('../models/Comment');
const CodeReview = require('../models/CodeReview');
const DocumentEditor = require('../models/DocumentEditor');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devtrack';

const seedMoroccanData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB pour le seeding marocain (COMPLET)...');

    console.log('Nettoyage des anciennes données...');
    await Promise.all([
      Developer.deleteMany({}), Project.deleteMany({}), Sprint.deleteMany({}),
      Task.deleteMany({}), Bug.deleteMany({}), TestPlan.deleteMany({}),
      TestCase.deleteMany({}), Team.deleteMany({}), Risk.deleteMany({}),
      ProjectBudget.deleteMany({}), TestCycle.deleteMany({}), TimeLog.deleteMany({}),
      Milestone.deleteMany({}), Comment.deleteMany({}), CodeReview.deleteMany({}),
      DocumentEditor.deleteMany({})
    ]);

    // 1. Développeurs Marocains
    console.log('Création des développeurs marocains...');
    const defaultPassword = bcrypt.hashSync('password123', 10);
    const devs = await Developer.insertMany([
      { name: 'Youssef El Fassi', email: 'youssef@g2i.ma', password: defaultPassword, role: 'ADMIN', color: '#10b981' },
      { name: 'Fatima Zahra', email: 'fatima@g2i.ma', password: defaultPassword, role: 'QA', color: '#f43f5e' },
      { name: 'Amine Berrada', email: 'amine@g2i.ma', password: defaultPassword, role: 'DEV', color: '#3b82f6' },
      { name: 'Khadija Mansouri', email: 'khadija@g2i.ma', password: defaultPassword, role: 'PO', color: '#f59e0b' },
      { name: 'Omar Tazi', email: 'omar@g2i.ma', password: defaultPassword, role: 'SCRUM_MASTER', color: '#8b5cf6' },
      { name: 'Client OCP', email: 'contact@ocp.ma', password: defaultPassword, role: 'CLIENT', color: '#14b8a6' }
    ]);

    const admin = devs.find(d => d.role === 'ADMIN');
    const qa = devs.find(d => d.role === 'QA');
    const dev = devs.find(d => d.role === 'DEV');
    const po = devs.find(d => d.role === 'PO');
    const sm = devs.find(d => d.role === 'SCRUM_MASTER');
    const client = devs.find(d => d.role === 'CLIENT');

    // 2. Projets Réalistes
    console.log('Création des projets...');
    const projects = await Project.insertMany([
      {
        name: 'Migration ERP Odoo 19 (G2I)',
        description: 'Migration du système ERP G2I vers Odoo 19 avec respect de la norme ISO 17025.',
        stack: JSON.stringify(['Python', 'Odoo 19', 'PostgreSQL', 'Docker']),
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        status: 'ACTIVE',
        developers: [admin._id, dev._id, qa._id, po._id, sm._id]
      },
      {
        name: 'Refonte SI Attijariwafa Bank',
        description: 'Modernisation du portail bancaire B2B et B2C.',
        stack: JSON.stringify(['Java', 'Spring Boot', 'React', 'Oracle']),
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        status: 'ACTIVE',
        developers: [dev._id, po._id, sm._id]
      },
      {
        name: 'Portail Fournisseurs OCP',
        description: 'Plateforme de gestion et de suivi des fournisseurs OCP Group.',
        stack: JSON.stringify(['Node.js', 'Vue.js', 'MongoDB']),
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'ACTIVE',
        developers: [admin._id, dev._id, qa._id, client._id]
      }
    ]);

    const projectOdoo = projects[0];

    // 3. Teams
    console.log('Création des Équipes...');
    const teamOdoo = await Team.create({
      name: 'Équipe Odoo Casa',
      description: 'Développeurs en charge de la migration ERP.',
      color: '#0284c7',
      members: [
        { developer_id: sm._id, role_in_team: 'LEAD' },
        { developer_id: dev._id, role_in_team: 'MEMBER' },
        { developer_id: qa._id, role_in_team: 'MEMBER' }
      ],
      project_ids: [projectOdoo._id],
      created_by: admin._id
    });

    // 4. Milestones
    console.log('Création des Milestones...');
    const milestone1 = await Milestone.create({
      project_id: projectOdoo._id,
      name: 'Lancement du conteneur Odoo 19',
      description: 'Déploiement initial de la base vide sur Docker.',
      status: 'COMPLETED',
      target_date: new Date(new Date().setDate(new Date().getDate() - 5))
    });

    // 5. Sprints
    console.log('Création des Sprints...');
    const sprint1 = await Sprint.create({
      project_id: projectOdoo._id,
      name: 'Sprint 1 : Déploiement Docker & BD',
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 14)),
      objectives: 'Avoir l\'environnement Odoo 19 opérationnel',
      status: 'ACTIVE',
      velocity: 35
    });

    // 6. Tasks
    console.log('Création des Tâches...');
    const tasks = await Task.insertMany([
      {
        project_id: projectOdoo._id,
        sprint_id: sprint1._id,
        milestone_id: milestone1._id,
        title: 'Configurer le conteneur Docker Odoo 19',
        description: 'Adapter le docker-compose pour la version 19.',
        type: 'FEATURE', priority: 'HIGH', status: 'DONE',
        developer_id: dev._id, estimated_hours: 8
      },
      {
        project_id: projectOdoo._id,
        sprint_id: sprint1._id,
        title: 'Mise à jour des manifests des modules custom',
        description: 'Passer la version à 19.0 pour tous les modules G2I.',
        type: 'FEATURE', priority: 'MEDIUM', status: 'IN_PROGRESS',
        developer_id: dev._id, estimated_hours: 12
      },
      {
        project_id: projectOdoo._id,
        sprint_id: sprint1._id,
        title: 'Génération PDF PV ISO 17025',
        description: 'Corriger la génération du PDF avec signature électronique.',
        type: 'BUG', priority: 'CRITICAL', status: 'TODO',
        developer_id: dev._id, estimated_hours: 16
      }
    ]);

    // 7. TimeLogs
    console.log('Saisie des temps de travail...');
    await TimeLog.create([
      { task_id: tasks[0]._id, developer_id: dev._id, hours: 4, date: new Date(), note: 'Installation Docker' },
      { task_id: tasks[0]._id, developer_id: dev._id, hours: 4, date: new Date(), note: 'Configuration DB Odoo' },
      { task_id: tasks[1]._id, developer_id: dev._id, hours: 2, date: new Date(), note: 'Analyse manifests' }
    ]);

    // 8. Test Plans & Test Cases & Test Cycles
    console.log('Création de la QA...');
    const testPlan = await TestPlan.create({
      project_id: projectOdoo._id, sprint_id: sprint1._id,
      title: 'Validation Conformité ISO 17025',
      test_type: 'FUNCTIONAL', environment: 'STAGING',
      status: 'ACTIVE', responsible_id: qa._id, created_by: qa._id
    });

    const testCase1 = await TestCase.create({
      project_id: projectOdoo._id, test_plan_id: testPlan._id,
      title: 'Vérification workflow intervention',
      description: 'L\'intervention ne doit pas démarrer sans autorisation.',
      test_type: 'MANUAL', priority: 'HIGH', status: 'ACTIVE',
      steps: [{ order: 1, action: 'Se connecter en tant que Tech', expected_result: 'Connexion OK' }],
      created_by: qa._id
    });

    await TestCycle.create({
      test_plan_id: testPlan._id, project_id: projectOdoo._id,
      name: 'Cycle Alpha 1', status: 'IN_PROGRESS',
      assignees: [qa._id], created_by: qa._id,
      executions: [{ test_case_id: testCase1._id, status: 'PASS', executed_by: qa._id, executed_at: new Date() }]
    });

    // 9. Bugs & Comments
    console.log('Création des Bugs et Commentaires...');
    const bug1 = await Bug.create({
      task_id: tasks[2]._id,
      title: 'Problème encodage caractères arabes',
      description: 'Le nom de l\'entreprise "Société Marocaine" s\'affiche mal dans le PDF généré.',
      severity: 'HIGH', status: 'OPEN'
    });

    await Comment.create({
      task_id: tasks[2]._id,
      author: qa.name,
      author_id: qa._id,
      content: 'Je confirme, j\'ai le même problème sur le navigateur Chrome version Windows en français.'
    });

    // 10. Risks
    console.log('Création des Risques...');
    await Risk.create({
      project_id: projectOdoo._id,
      title: 'Dépassement du délai de certification ISO',
      category: 'DÉLAIS', probability: 3, impact: 5,
      status: 'IDENTIFIED', owner_id: po._id,
      mitigation_plan: 'Prioriser les tâches de signature électronique dès le sprint 1.',
      created_by: admin._id
    });

    // 11. ProjectBudget
    console.log('Création du Budget...');
    await ProjectBudget.create({
      project_id: projectOdoo._id,
      total_budget: 250000,
      currency: 'MAD',
      expenses: [{ label: 'Serveur AWS Casablanca', amount: 12000, category: 'INFRASTRUCTURE' }],
      created_by: admin._id
    });

    // 12. CodeReview
    console.log('Création des Revues de Code...');
    await CodeReview.create({
      project_id: projectOdoo._id,
      task_id: tasks[0]._id,
      reviewer_id: admin._id,
      status: 'APPROVED',
      global_comment: 'LGTM',
      created_by: dev._id
    });

    // 13. Documents
    console.log('Création de Documents...');
    await DocumentEditor.create({
      project_id: projectOdoo._id,
      title: 'Cahier des charges Odoo 19',
      content: '<h1>Cahier des charges</h1><p>Spécifications pour la migration Odoo 19 (G2I)...</p>',
      author_id: po._id,
      status: 'PUBLISHED'
    });

    console.log('✅ Seeding COMPLET terminé avec succès ! Toutes les collections sont populées avec des données marocaines.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seeding:', err);
    process.exit(1);
  }
};

seedMoroccanData();
