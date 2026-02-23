const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const { getOrCreateUser } = require('../controllers/user.controller');
const {
  createSubmission,
  getSubmissionsByProblem,
  getMySubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  voteSubmission,
  selectWinner
} = require('../controllers/submission.controller');


router.get('/my-submissions', requireAuth(), getOrCreateUser, getMySubmissions);

router.get('/problem/:problemId', getSubmissionsByProblem);

router.get('/:id', getSubmissionById);

router.post('/', requireAuth(), getOrCreateUser, createSubmission);

router.patch('/:id/vote', requireAuth(), getOrCreateUser, voteSubmission);

router.patch('/:id', requireAuth(), getOrCreateUser, updateSubmission);

router.delete('/:id', requireAuth(), getOrCreateUser, deleteSubmission);

router.patch('/:id/winner', requireAuth(), getOrCreateUser, selectWinner);

module.exports = router;