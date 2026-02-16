const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const validate = require("../middlewares/validate.middleware");
const { updateProfileSchema } = require("../validators/user.validator");
const {
  getOrCreateUser,
  getCurrentUser,
  updateProfile,
  switchRole,
  getUserById,
  getLeaderboard
} = require('../controllers/user.controller');


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