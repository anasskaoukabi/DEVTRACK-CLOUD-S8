require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('./database/db');

// Routes
const projectsRouter      = require('./routes/projects');
const sprintsRouter       = require('./routes/sprints');
const tasksRouter         = require('./routes/tasks');
const bugsRouter          = require('./routes/bugs');
const commentsRouter      = require('./routes/comments');
const developersRouter    = require('./routes/developers');
const { router: authRouter } = require('./routes/auth');
const timeLogsRouter      = require('./routes/timeLogs');
const searchRouter        = require('./routes/search');
const webhooksRouter      = require('./routes/webhooks');
const documentsRouter     = require('./routes/documents');
const documentEditorRouter= require('./routes/documentEditor');
const uploadsRouter       = require('./routes/uploads');
const teamsRouter         = require('./routes/teams');
const meetingsRouter      = require('./routes/meetings');
const testPlansRouter     = require('./routes/testPlans');
const qualityRouter       = require('./routes/quality');
const governanceRouter    = require('./routes/governance');
const tagsRouter          = require('./routes/tags');
const attachmentsRouter   = require('./routes/attachments');
const { router: notificationsRouter } = require('./routes/notifications');
const risksRouter         = require('./routes/risks');
const milestonesRouter    = require('./routes/milestones');
const { router: auditRouter } = require('./routes/audit');
const exportRouter        = require('./routes/exportData');
const portfolioRouter     = require('./routes/portfolio');
const planningPokerRouter = require('./routes/planningPoker');
const metricsRouter       = require('./routes/metrics');

const app = express();
const server = http.createServer(app);

// WebSocket
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
});

// Attach io to app so routes can emit events
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => socket.join(`project:${projectId}`));
  socket.on('leave-project', (projectId) => socket.leave(`project:${projectId}`));
  socket.on('join-poker', (sessionId) => socket.join(`poker:${sessionId}`));
  socket.on('leave-poker', (sessionId) => socket.leave(`poker:${sessionId}`));
  socket.on('disconnect', () => {});
});

// Rate limiting
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Too many login attempts' } });
const apiLimiter  = rateLimit({ windowMs: 60 * 1000, max: 200 });

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',            authLimiter);
app.use('/api',                 apiLimiter);

app.use('/api/projects',        projectsRouter);
app.use('/api/sprints',         sprintsRouter);
app.use('/api/tasks',           tasksRouter);
app.use('/api/bugs',            bugsRouter);
app.use('/api/comments',        commentsRouter);
app.use('/api/developers',      developersRouter);
app.use('/api/auth',            authRouter);
app.use('/api/time-logs',       timeLogsRouter);
app.use('/api/search',          searchRouter);
app.use('/api/webhooks',        webhooksRouter);
app.use('/api/documents',       documentsRouter);
app.use('/api/document-editor', documentEditorRouter);
app.use('/api/uploads',         uploadsRouter);
app.use('/api/teams',           teamsRouter);
app.use('/api/meetings',        meetingsRouter);
app.use('/api/test-plans',      testPlansRouter);
app.use('/api/quality',         qualityRouter);
app.use('/api/governance',      governanceRouter);
app.use('/api/tags',            tagsRouter);
app.use('/api/attachments',     attachmentsRouter);
app.use('/api/notifications',   notificationsRouter);
app.use('/api/risks',           risksRouter);
app.use('/api/milestones',      milestonesRouter);
app.use('/api/audit',           auditRouter);
app.use('/api/export',          exportRouter);
app.use('/api/portfolio',       portfolioRouter);
app.use('/api/planning-poker',  planningPokerRouter);
app.use('/api/metrics',         metricsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'DevTrack', version: '2.0' }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`DevTrack backend running on http://localhost:${PORT}`);
  console.log(`WebSocket ready`);
});
