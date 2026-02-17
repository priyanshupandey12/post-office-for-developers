const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const validate = require("../middleware/validate.middleware.js");
const { updateProfileSchema } = require("../utils/user.validation.js");
const {
  getOrCreateUser,
  getCurrentUser,
  updateProfile,
  switchRole,
  getUserById,
  getLeaderboard
} = require('../controllers/user.controller.js');


router.get('/me', 
  requireAuth(), 
  getOrCreateUser, 
  getCurrentUser
);


router.patch('/profile', 
  requireAuth(), 
  getOrCreateUser, 
  validate(updateProfileSchema),
  updateProfile
);


router.put('/role', 
  requireAuth(), 
  getOrCreateUser, 
  switchRole
);


router.get('/leaderboard', getLeaderboard);


router.get('/:id', getUserById);

module.exports = router;