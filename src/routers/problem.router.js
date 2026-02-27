const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const validate = require("../middleware/validate.middleware");
const  {readLimiter,createProblemLimiter,voteLimiter,writeLimiter}= require('../middleware/ratelimiter.middleware.js');
const { createProblemSchema } = require("../utils/problem.validation");
const {
  getOrCreateUser,
} = require('../controllers/user.controller');
const {createProblem,getAllProblems,
  getProblemById,  
  updateProblem,
  getMyProblems,
  voteProblem
}=require('../controllers/problem.controller')

  router.get('/user/my-problems',
  readLimiter,
  requireAuth(),
  getOrCreateUser,
  getMyProblems
);
router.get('/', 
  readLimiter,
  getAllProblems);
router.get('/:id', readLimiter, getProblemById);

router.post('/',
  createProblemLimiter,
  requireAuth(),
  getOrCreateUser,
  validate(createProblemSchema),
  createProblem
);

router.patch('/:id',
  writeLimiter,
  requireAuth(),
  getOrCreateUser,
  updateProblem
);

router.patch('/:id/vote',
  voteLimiter,
  requireAuth(),
  getOrCreateUser,
  voteProblem
);

module.exports=router