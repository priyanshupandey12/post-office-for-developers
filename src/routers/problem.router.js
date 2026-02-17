const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const validate = require("../middleware/validate.middleware");
const { createProblemSchema } = require("../utils/problem.validation");
const {
  getOrCreateUser,
} = require('../controllers/user.controller');
const {createProblem}=require('../controllers/problem.controller')

router.post('/',
  requireAuth(),
  getOrCreateUser,
  validate(createProblemSchema),
  createProblem
);

module.exports=router