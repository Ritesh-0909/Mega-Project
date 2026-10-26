const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const submitCodeRateLimiter = require('../middleware/submitCodeRateLimiter');
const submitRouter = express.Router();

const { submitCode, runCode } = require('../controllers/userSubmission');

// Run code without the submission cooldown
submitRouter.post('/run/:id', userMiddleware, runCode);

// Apply rate limiter only to Submit
submitRouter.post(
  '/submit/:id',
  userMiddleware,
  submitCodeRateLimiter,
  submitCode
);

module.exports = submitRouter;