const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const  {readLimiter,writeLimiter}= require('../middleware/ratelimiter.middleware.js');
const validate = require("../middleware/validate.middleware.js");
const { updateProfileSchema } = require("../utils/user.validation.js");
const {
  getOrCreateUser,
  getCurrentUser,
  updateProfile,
  getLeaderboard
} = require('../controllers/user.controller.js');


router.get('/me', 
  readLimiter,
  requireAuth(), 
  getOrCreateUser, 
  getCurrentUser
);


router.patch('/profile', 
  writeLimiter,
  requireAuth(), 
  getOrCreateUser, 
  validate(updateProfileSchema),
  updateProfile
);



router.get('/leaderboard', readLimiter, getLeaderboard);



module.exports = router;