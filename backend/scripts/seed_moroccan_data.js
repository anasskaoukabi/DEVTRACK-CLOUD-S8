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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devtrack';

const seedMoroccanData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB pour le seeding marocain...');

    // Nettoyage de la base de données
    console.log('Nettoyage des anciennes données...');
    await Promise.all([
      Developer.deleteMany({}),
      Project.deleteMany({}),
      Sprint.deleteMany({}),
      Task.deleteMany({}),
      Bug.deleteMany({}),
      TestPlan.deleteMany({}),
      TestCase.deleteMany({})
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
    ]);

    const admin = devs.find(d => d.role === 'ADMIN');
    const qa = devs.find(d => d.role === 'QA');
    const dev = devs.find(d => d.role === 'DEV');
    const po = devs.find(d => d.role === 'PO');

    // 2. Projets Réalistes
    console.log('Création des projets...');
    const projects = await Project.insertMany([
      {
        name: 'Migration ERP Odoo 19 (G2I)',
        description: 'Migration du système ERP G2I vers Odoo 19 avec respect de la norme ISO 17025.',
        stack: JSON.stringify(['Python', 'Odoo 19', 'PostgreSQL', 'Docker']),
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        status: 'ACTIVE',
        developers: [admin._id, dev._id, qa._id, po._id]
      },
      {
        name: 'Refonte SI Attijariwafa Bank',
        description: 'Modernisation du portail bancaire B2B et B2C.',
        stack: JSON.stringify(['Java', 'Spring Boot', 'React', 'Oracle']),
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        status: 'ACTIVE',
        developers: [dev._id, po._id]
      },
      {
        name: 'Portail Fournisseurs OCP',
        description: 'Plateforme de gestion et de suivi des fournisseurs OCP Group.',
        stack: JSON.stringify(['Node.js', 'Vue.js', 'MongoDB']),
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'ACTIVE',
        developers: [admin._id, dev._id, qa._id]
      }
    ]);

    const projectOdoo = projects[0];

    // 3. Sprints
    console.log('Création des Sprints...');
    const sprint1 = await Sprint.create({
      project_id: projectOdoo._id,
      name: 'Sprint 1 : Déploiement Docker & Base de Données',
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 14)),
      objectives: 'Avoir l\'environnement Odoo 19 opérationnel',
      status: 'ACTIVE',
      velocity: 35
    });

    // 4. Tasks
    console.log('Création des Tâches...');
    const tasks = await Task.insertMany([
      {
        project_id: projectOdoo._id,
        sprint_id: sprint1._id,
        title: 'Configurer le conteneur Docker Odoo 19',
        description: 'Adapter le docker-compose pour la version 19, corriger les erreurs de connexion DB.',
        type: 'FEATURE',
        priority: 'HIGH',
        status: 'DONE',
        developer_id: dev._id
      },
      {
        project_id: projectOdoo._id,
        sprint_id: sprint1._id,
        title: 'Mise à jour des manifests des modules custom',
        description: 'Passer la version à 19.0 pour tous les modules G2I.',
        type: 'FEATURE',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        developer_id: dev._id
      },
      {
        project_id: projectOdoo._id,
        sprint_id: sprint1._id,
        title: 'Génération PDF PV ISO 17025',
        description: 'Corriger la génération du PDF pour inclure les signatures électroniques.',
        type: 'BUG',
        priority: 'CRITICAL',
        status: 'TODO',
        developer_id: dev._id
      }
    ]);

    // 5. Test Plans & Test Cases
    console.log('Création des Plans de Test et Cas de Test...');
    const testPlan = await TestPlan.create({
      project_id: projectOdoo._id,
      sprint_id: sprint1._id,
      title: 'Validation Conformité ISO 17025',
      description: 'Vérifier tous les processus de traçabilité pour la certification.',
      status: 'ACTIVE',
      test_type: 'FUNCTIONAL',
      environment: 'STAGING',
      responsible_id: qa._id,
      start_date: new Date(),
      created_by: qa._id
    });

    const testCase1 = await TestCase.create({
      project_id: projectOdoo._id,
      test_plan_id: testPlan._id,
      title: 'Vérification workflow intervention',
      description: 'L\'intervention ne doit pas démarrer sans autorisation préalable.',
      test_type: 'MANUAL',
      priority: 'HIGH',
      status: 'ACTIVE',
      steps: [
        { order: 1, action: 'Se connecter en tant que Technicien', expected_result: 'Connexion réussie' },
        { order: 2, action: 'Créer une intervention sans PV', expected_result: 'Message d\'erreur bloquant' }
      ],
      created_by: qa._id
    });

    // 6. Bugs
    console.log('Création des Bugs...');
    await Bug.create({
      task_id: tasks[2]._id, // Attach to the PDF generation task
      title: 'Problème d\'encodage des caractères arabes',
      description: 'Le nom de l\'entreprise "Société Marocaine" s\'affiche mal dans le PDF généré.',
      steps: 'Générer le PV, ouvrir le PDF, vérifier la section Client.',
      severity: 'HIGH',
      status: 'OPEN'
    });

    await Bug.create({
      task_id: tasks[1]._id,
      title: 'Erreur TVA 20% au lieu de 10% sur les devis de maintenance',
      description: 'Le taux par défaut appliqué est 20% pour certains services au lieu de 10%.',
      severity: 'MEDIUM',
      status: 'OPEN'
    });

    console.log('✅ Seeding terminé avec succès ! Des données marocaines réalistes ont été ajoutées.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seeding:', err);
    process.exit(1);
  }
};

seedMoroccanData();
