const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const validate = require("../middleware/validate.middleware");
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
  requireAuth(),
  getOrCreateUser,
  getMyProblems
);
router.get('/', 
  getAllProblems);
router.get('/:id', getProblemById);

router.post('/',
  requireAuth(),
  getOrCreateUser,
  validate(createProblemSchema),
  createProblem
);

router.patch('/:id',
  requireAuth(),
  getOrCreateUser,
  updateProblem
);

router.patch('/:id/vote',
  requireAuth(),
  getOrCreateUser,
  voteProblem
);

module.exports=router