const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const submitRouter = express.Router();
const submitCode = require("../controllers/userSubmission");

submitRouter.post("/submit/:id",userMiddleware, submitCode)