const express = require('express');
const router = express.Router();
const ReviewChecklist = require('../models/ReviewChecklist');
const CodeReview = require('../models/CodeReview');
const { authenticateToken } = require('./auth');

// CHECKLISTS
router.get('/checklists', authenticateToken, async (req, res) => {
  try {
    const filter = req.query.project_id ? { project_id: req.query.project_id } : {};
    const lists = await ReviewChecklist.find(filter).populate('created_by', 'name').sort('-created_at').lean();
    res.json(lists.map(l => ({ ...l, id: l._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/checklists', authenticateToken, async (req, res) => {
  try {
    const cl = await ReviewChecklist.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ ...cl.toObject(), id: cl._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/checklists/:id', authenticateToken, async (req, res) => {
  try {
    const cl = await ReviewChecklist.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json({ ...cl, id: cl._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/checklists/:id', authenticateToken, async (req, res) => {
  try {
    await ReviewChecklist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CODE REVIEWS
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.project_id) filter.project_id = req.query.project_id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.task_id) filter.task_id = req.query.task_id;
    const reviews = await CodeReview.find(filter)
      .populate('task_id', 'title type priority')
      .populate('reviewer_id', 'name color')
      .populate('checklist_id', 'name')
      .populate('created_by', 'name')
      .sort('-created_at').lean();
    res.json(reviews.map(r => ({ ...r, id: r._id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const review = await CodeReview.findById(req.params.id)
      .populate('task_id', 'title type priority description')
      .populate('reviewer_id', 'name color')
      .populate('checklist_id')
      .populate('created_by', 'name').lean();
    if (!review) return res.status(404).json({ error: 'Not found' });
    res.json({ ...review, id: review._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { task_id, project_id, reviewer_id, checklist_id } = req.body;
    let items = req.body.items || [];
    if (checklist_id && items.length === 0) {
      const cl = await ReviewChecklist.findById(checklist_id);
      if (cl) items = cl.items.map(i => ({ item_text: i.text, category: i.category, mandatory: i.mandatory, passed: null, comment: '' }));
    }
    const review = await CodeReview.create({ task_id, project_id, reviewer_id: reviewer_id || req.user.id, checklist_id: checklist_id || null, items, status: 'IN_PROGRESS', created_by: req.user.id });
    const populated = await CodeReview.findById(review._id).populate('task_id', 'title type priority').populate('reviewer_id', 'name color').lean();
    res.status(201).json({ ...populated, id: populated._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const { items, global_comment, status } = req.body;
    const review = await CodeReview.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Not found' });
    if (items) review.items = items;
    if (global_comment !== undefined) review.global_comment = global_comment;
    if (status) review.status = status;
    const allItems = items || review.items;
    const evaluated = allItems.filter(i => i.passed !== null);
    const passed = allItems.filter(i => i.passed === true);
    review.score = evaluated.length > 0 ? Math.round((passed.length / evaluated.length) * 100) : null;
    await review.save();
    const populated = await CodeReview.findById(review._id).populate('task_id', 'title').populate('reviewer_id', 'name color').lean();
    res.json({ ...populated, id: populated._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    await CodeReview.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DASHBOARD QA
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    const filter = project_id ? { project_id } : {};
    const TestCycle = require('../models/TestCycle');
    const TestPlan = require('../models/TestPlan');
    const [planCount, cycles, reviews] = await Promise.all([
      TestPlan.countDocuments(filter),
      TestCycle.find(filter).lean(),
      CodeReview.find(filter).lean(),
    ]);
    let totalExec = 0, pass = 0, fail = 0, notRun = 0, blocked = 0;
    cycles.forEach(c => c.executions?.forEach(e => {
      totalExec++;
      if (e.status === 'PASS') pass++;
      else if (e.status === 'FAIL') fail++;
      else if (e.status === 'NOT_RUN') notRun++;
      else if (e.status === 'BLOCKED') blocked++;
    }));
    const executed = totalExec - notRun;
    const scoredReviews = reviews.filter(r => r.score !== null);
    res.json({
      test_plans: planCount, test_cycles: cycles.length,
      executions: { total: totalExec, pass, fail, not_run: notRun, blocked,
        pass_rate: executed > 0 ? Math.round((pass / executed) * 100) : 0,
        coverage: totalExec > 0 ? Math.round((executed / totalExec) * 100) : 0,
      },
      code_reviews: {
        total: reviews.length,
        approved: reviews.filter(r => r.status === 'APPROVED').length,
        rejected: reviews.filter(r => r.status === 'REJECTED').length,
        pending: reviews.filter(r => r.status === 'IN_PROGRESS' || r.status === 'PENDING').length,
        avg_score: scoredReviews.length > 0 ? Math.round(scoredReviews.reduce((s, r) => s + r.score, 0) / scoredReviews.length) : null,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
