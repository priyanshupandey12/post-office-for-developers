const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const  {readLimiter,submissionLimiter,voteLimiter,writeLimiter}= require('../middleware/ratelimiter.middleware.js');
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


router.get('/my-submissions', readLimiter, requireAuth(), getOrCreateUser, getMySubmissions);

router.get('/problem/:problemId', readLimiter, getSubmissionsByProblem);

router.get('/:id', readLimiter, getSubmissionById);

router.post('/', submissionLimiter, requireAuth(), getOrCreateUser, createSubmission);

router.patch('/:id/vote', voteLimiter, requireAuth(), getOrCreateUser, voteSubmission);

router.patch('/:id', writeLimiter, requireAuth(), getOrCreateUser, updateSubmission);

router.delete('/:id', writeLimiter, requireAuth(), getOrCreateUser, deleteSubmission);

router.patch('/:id/winner', writeLimiter, requireAuth(), getOrCreateUser, selectWinner);

module.exports = router;