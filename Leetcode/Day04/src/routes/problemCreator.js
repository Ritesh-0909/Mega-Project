const express = require('express');
const problemRouter = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware")




//Create
problemRouter.post("/create", adminMiddleware, CreateProblem);

//Fetch
problemRouter.get("/:id",getProblemById);
problemRouter.get("/",getAllProblem);
problemRouter.get("/user",solvedAllProblembyUser);

//UPDATE
problemRouter.patch("/:id",UpdateProblem);

// DELETE
problemRouter.delete("/:id",DeleteProblem);
