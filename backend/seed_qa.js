require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Developer = require('./models/Developer');
const TestPlan = require('./models/TestPlan');
const TestCase = require('./models/TestCase');
const TestCycle = require('./models/TestCycle');
const Risk = require('./models/Risk');
const Milestone = require('./models/Milestone');
const CodeMetrics = require('./models/CodeMetrics');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devtrack')
  .then(() => {
    console.log('Connected to MongoDB for seeding');
    seed();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });

async function seed() {
  try {
    const admin = await Developer.findOne({ role: 'ADMIN' });
    const qa = await Developer.findOne({ role: 'QA' });
    const po = await Developer.findOne({ role: 'PO' });

    if (!admin) {
      console.error('No admin found. Start backend normally first to seed developers.');
      process.exit(1);
    }

    // 1. Un projet cible
    let project = await Project.findOne();
    if (!project) {
      project = await Project.create({
        name: 'ERP G2I - V3',
        description: 'Refonte complète de l\'ERP ISO 17025',
        status: 'ACTIVE',
      });
      console.log('Created project:', project.name);
    } else {
      console.log('Using project:', project.name);
    }

    const pid = project._id;

    // ── RISQUES ───────────────────────────────────────────────────
    await Risk.deleteMany({ project_id: pid });
    await Risk.create([
      { project_id: pid, title: 'Retard migration Odoo', description: 'La db odoo 19 n\'est pas prête', probability: 4, impact: 5, category: 'TECHNIQUE', status: 'IDENTIFIED', owner_id: admin._id, mitigation_plan: 'Préparer un environnement docker isolé', review_date: new Date(Date.now() + 86400000 * 7) },
      { project_id: pid, title: 'Bugs de régression sur la facturation', description: 'Le nouveau module pourrait casser l\'existant', probability: 3, impact: 4, category: 'AUTRE', status: 'ANALYSED', owner_id: qa?._id || admin._id, mitigation_plan: 'Augmenter la couverture de test' },
      { project_id: pid, title: 'Indisponibilité du client', description: 'Le PO client est en vacances', probability: 2, impact: 3, category: 'DÉLAIS', status: 'MITIGATING', owner_id: po?._id || admin._id, mitigation_plan: 'Valider les specs avant son départ' },
      { project_id: pid, title: 'Dépassement budget AWS', description: 'Les tests de charge coûtent cher', probability: 2, impact: 2, category: 'BUDGET', status: 'CLOSED' }
    ]);
    console.log('✅ Risks seeded');

    // ── JALONS ────────────────────────────────────────────────────
    await Milestone.deleteMany({ project_id: pid });
    const now = Date.now();
    await Milestone.create([
      { project_id: pid, name: 'Kickoff', target_date: new Date(now - 86400000 * 15), status: 'COMPLETED', deliverables: ['Cahier des charges', 'Architecture'] },
      { project_id: pid, name: 'MVP Backend', target_date: new Date(now - 86400000 * 2), status: 'DELAYED', deliverables: ['API GraphQL', 'Auth JWT'] },
      { project_id: pid, name: 'UAT Client', target_date: new Date(now + 86400000 * 10), status: 'ON_TRACK', deliverables: ['Staging env', 'Test accounts'] },
      { project_id: pid, name: 'Go Live', target_date: new Date(now + 86400000 * 30), status: 'UPCOMING', deliverables: ['Prod deployment'] }
    ]);
    console.log('✅ Milestones seeded');

    // ── PLANS DE TEST & CAS ─────────────────────────────────────────
    await TestPlan.deleteMany({ project_id: pid });
    await TestCase.deleteMany({ project_id: pid });
    await TestCycle.deleteMany({ project_id: pid });

    const plan1 = await TestPlan.create({
      project_id: pid, title: 'Régression V2.0', description: 'Tests complets avant release', type: 'REGRESSION', environment: 'STAGING', status: 'ACTIVE', created_by: admin._id
    });

    const c1 = await TestCase.create({ project_id: pid, test_plan_id: plan1._id, title: 'Login valide', description: 'Se connecter avec des bons identifiants', status: 'ACTIVE', priority: 'HIGH', category: 'Auth', steps: [{step_number:1,action:'Ouvrir /login',expected_result:'Page affichée'},{step_number:2,action:'Saisir admin/admin + submit',expected_result:'Redirection dashboard'}] });
    const c2 = await TestCase.create({ project_id: pid, test_plan_id: plan1._id, title: 'Login invalide', description: 'Mot de passe erroné', status: 'ACTIVE', priority: 'MEDIUM', category: 'Auth', steps: [{step_number:1,action:'Saisir mauvais mdp',expected_result:'Message erreur'}] });
    const c3 = await TestCase.create({ project_id: pid, test_plan_id: plan1._id, title: 'Création facture', description: 'Générer PDF', status: 'ACTIVE', priority: 'HIGH', category: 'Billing', steps: [{step_number:1,action:'Cliquer générer',expected_result:'PDF téléchargeable'}] });

    const cycle = await TestCycle.create({
      project_id: pid, test_plan_id: plan1._id, name: 'Exécution Semaine 42', environment: 'STAGING', status: 'IN_PROGRESS', started_at: new Date()
    });

    // Ajouter les executions
    cycle.executions.push(
      { test_case_id: c1._id, status: 'PASS', executed_by: qa?._id || admin._id, executed_at: new Date() },
      { test_case_id: c2._id, status: 'PASS', executed_by: qa?._id || admin._id, executed_at: new Date() },
      { test_case_id: c3._id, status: 'FAIL', executed_by: qa?._id || admin._id, executed_at: new Date(), notes: 'Erreur 500 sur le PDF' }
    );
    await cycle.save();
    console.log('✅ Test Plans & Cycles seeded');

    // ── MÉTRIQUES QUALITÉ ──────────────────────────────────────────
    await CodeMetrics.deleteMany({ project_id: pid });
    await CodeMetrics.create([
      { project_id: pid, module_name: 'BillingService.js', language: 'JavaScript', source: 'SONARQUBE', loc: 450, sloc: 380, comment_ratio: 12, cyclomatic_complexity: 24, cognitive_complexity: 30, maintainability_index: 45, max_nesting_depth: 5, duplication_pct: 18, test_coverage_pct: 45, analyzed_by: admin._id },
      { project_id: pid, module_name: 'AuthController.ts', language: 'TypeScript', source: 'MANUAL', loc: 150, sloc: 120, comment_ratio: 20, cyclomatic_complexity: 8, cognitive_complexity: 10, maintainability_index: 75, max_nesting_depth: 2, duplication_pct: 0, test_coverage_pct: 90, analyzed_by: admin._id },
      { project_id: pid, module_name: 'PdfGenerator.js', language: 'JavaScript', source: 'AUTO', loc: 850, sloc: 700, comment_ratio: 5, cyclomatic_complexity: 42, cognitive_complexity: 55, maintainability_index: 20, max_nesting_depth: 7, duplication_pct: 25, test_coverage_pct: 10, analyzed_by: admin._id },
      { project_id: pid, module_name: 'UserModel.js', language: 'JavaScript', source: 'MANUAL', loc: 80, sloc: 60, comment_ratio: 25, cyclomatic_complexity: 3, cognitive_complexity: 2, maintainability_index: 85, max_nesting_depth: 1, wmc: 5, dit: 1, cbo: 2, rfc: 8, lcom: 0.1, test_coverage_pct: 100, analyzed_by: admin._id },
    ]);
    console.log('✅ Code Metrics seeded');

    console.log('\n🎉 Seeding terminé avec succès !');
    process.exit(0);

  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}
