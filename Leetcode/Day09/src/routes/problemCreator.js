const express = require('express');
const problemRouter = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware")
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem} = require("../controllers/userProblem");
const userMiddleware = require("../middleware/userMiddleware");
//Create
problemRouter.post("/create", adminMiddleware, createProblem);

// //Fetch
problemRouter.get("/problemById/:id",userMiddleware,getProblemById);
problemRouter.get("/getAllProblem",userMiddleware,getAllProblem);
problemRouter.get("/problemSolvedByUser",userMiddleware,solvedAllProblembyUser);
problemRouter.get("submittedProblem/:pid",userMiddleware,submittedProblem)

//UPDATE
problemRouter.put("/update/:id",adminMiddleware,updateProblem);

// DELETE
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);

module.exports = problemRouter;
