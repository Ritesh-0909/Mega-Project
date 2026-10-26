const express = require('express');

const problemRouter = express.Router();




//Create
problemRouter.post("/create", problemCreate);

//Fetch
problemRouter.get("/:id",problemFetch);
problemRouter.get("/",getAllProblem);
problemRouter.get("/user",solvedProblem);

//UPDATE
problemRouter.patch("/:id",problemUpdate);

// DELETE
problemRouter.delete("/:id",problemDelete);
