const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const StatusHistory = require('../models/StatusHistory');
const Comment = require('../models/Comment');

// GitHub Webhook Endpoint
router.post('/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  
  if (event === 'push') {
    const commits = req.body.commits || [];
    
    for (const commit of commits) {
      const message = commit.message;
      const taskMatch = message.match(/(?:fixes|resolves|closes)\s+#([0-9a-fA-F]{24})/i); // matching ObjectId
      
      if (taskMatch && taskMatch[1]) {
        const taskId = taskMatch[1];
        
        try {
          const task = await Task.findById(taskId);
          if (task) {
            await StatusHistory.create({ task_id: taskId, from_status: task.status, to_status: 'IN_REVIEW' });
            task.status = 'IN_REVIEW';
            await task.save();
            
            await Comment.create({
              task_id: taskId,
              author: 'GitHub Webhook',
              content: `Status automatically updated to IN_REVIEW by commit: ${commit.url}`
            });
          }
        } catch (error) {
          console.error('Webhook error', error);
        }
      }
    }
  }

  res.status(200).send('OK');
});

module.exports = router;
