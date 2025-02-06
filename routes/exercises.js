const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { Exercise, validateExercise } = require("../models/exercises");

// Get all exercises
router.get("/", async (req, resp) => {
  try {
    const exercises = await Exercise.find();
    resp.send(exercises);
  } catch (ex) {
    console.error(ex);
    return resp.status(500).send("Error while fetching exercises.");
  }
});

// Create exercise
router.post("/", async (req, resp) => {
  try {
    const { error } = validateExercise(req.body);
    if (error) return resp.status(400).send(error.details[0].message);

    const exercise = new Exercise({
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
    });

    const result = await exercise.save();
    resp.send(result);
  } catch (ex) {
    console.error(ex);
    return resp.status(500).send("Error while saving exercise.");
  }
});

module.exports = router;
