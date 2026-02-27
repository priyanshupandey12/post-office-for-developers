const rateLimit = require('express-rate-limit');


const limitResponse = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    error: message,
    retryAfter: res.getHeader('Retry-After'),
  });
};


const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, 
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          limitResponse('Too many requests. Please slow down.'),
});



const createProblemLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, 
  max:              5,               
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          limitResponse('Too many problem creation attempts. Try again later.'),
});


const submissionLimiter = rateLimit({
  windowMs:         60 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          limitResponse('Too many submissions. Try again later.'),
});


const voteLimiter = rateLimit({
  windowMs:         60 * 1000, 
  max:              30,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          limitResponse('Voting too fast. Please slow down.'),
});


const readLimiter = rateLimit({
  windowMs:         1 * 60 * 1000,
  max:              60,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          limitResponse('Too many requests.'),
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitResponse('Too many update requests. Try again later.'),
});

module.exports = {
  globalLimiter,
  createProblemLimiter,
  submissionLimiter,
  voteLimiter,
  readLimiter,
    writeLimiter
};