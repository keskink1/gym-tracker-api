const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { Exercise, validateExercise } = require("../models/exercises");
const auth = require("../middleware/auth");
const { Workout } = require("../models/workouts");

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

// Delete exercise
router.delete("/:id", auth, async (req, res) => {
  try {
    // Önce bu egzersizin herhangi bir workout'ta kullanılıp kullanılmadığını kontrol et
    const workout = await Workout.findOne({
      "exercises.exerciseId": req.params.id,
    });

    if (workout) {
      return res
        .status(400)
        .send(
          "This exercise cannot be deleted because it is used in one or more workouts. " +
            "Remove it from all workouts first."
        );
    }

    const exercise = await Exercise.findByIdAndDelete(req.params.id);

    if (!exercise) {
      return res.status(404).send("Exercise not found.");
    }

    res.send(exercise);
  } catch (ex) {
    // MongoDB'nin geçersiz ID formatı hatası için özel kontrol
    if (ex.kind === "ObjectId") {
      return res.status(400).send("Invalid exercise ID format.");
    }
    res.status(500).send("Error deleting exercise: " + ex.message);
  }
});

// Update exercise
router.put("/:id", auth, async (req, res) => {
  try {
    // Validation
    const { error } = validateExercise(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          type: req.body.type,
        },
      },
      { new: true, runValidators: true }
    );

    if (!exercise) {
      return res.status(404).send("Exercise not found.");
    }

    res.send(exercise);
  } catch (ex) {
    // MongoDB'nin geçersiz ID formatı hatası için özel kontrol
    if (ex.kind === "ObjectId") {
      return res.status(400).send("Invalid exercise ID format.");
    }
    res.status(500).send("Error updating exercise: " + ex.message);
  }
});

module.exports = router;
