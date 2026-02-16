const { clerkMiddleware, requireAuth, getAuth } = require('@clerk/express');

const clerkAuth = clerkMiddleware();

const verifyUser = (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized - No user ID found' 
      });
    }
    
 
    req.clerkUserId = userId;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

module.exports = { 
  clerkAuth,
  requireAuth,
  verifyUser
};