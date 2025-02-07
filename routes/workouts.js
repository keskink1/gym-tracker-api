const express = require("express");
const router = express.Router();
const { Workout, validateWorkout } = require("../models/workouts");
const auth = require("../middleware/auth");

// Get all workouts (sadece kullanıcının kendi workoutları)
router.get("/", auth, async (req, resp) => {
  try {
    const workouts = await Workout.find({ userId: req.user.userId }).populate({
      path: "exercises.exerciseId",
      select: "name description type",
    });
    resp.send(workouts);
  } catch (ex) {
    console.error(ex);
    return resp.status(500).send("Error while fetching workouts.");
  }
});

// Create workout
router.post("/", auth, async (req, resp) => {
  try {
    const { error } = validateWorkout(req.body);
    if (error) return resp.status(400).send(error.details[0].message);

    const workout = new Workout({
      name: req.body.name,
      exercises: req.body.exercises,
      userId: req.user.userId, // Kullanıcı ID'sini ekle
    });

    const result = await workout.save();
    resp.send(result);
  } catch (ex) {
    console.error(ex);
    return resp.status(500).send("Error while saving workout.");
  }
});

// Delete workout (sadece kendi workout'unu silebilir)
router.delete("/:id", auth, async (req, resp) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId, // Kullanıcının kendi workout'u mu kontrol et
    });

    if (!workout) {
      return resp.status(404).send("Workout not found or unauthorized.");
    }

    return resp.send(workout);
  } catch (ex) {
    return resp.status(500).send("Error deleting workout.");
  }
});

// Update workout (sadece kendi workout'unu güncelleyebilir)
router.put("/:id", auth, async (req, resp) => {
  try {
    const { error } = validateWorkout(req.body);
    if (error) return resp.status(400).send(error.details[0].message);

    const workout = await Workout.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId, // Kullanıcının kendi workout'u mu kontrol et
      },
      {
        $set: {
          name: req.body.name,
          exercises: req.body.exercises,
        },
      },
      { new: true, runValidators: true }
    );

    if (!workout)
      return resp.status(404).send("Workout not found or unauthorized.");

    return resp.send(workout);
  } catch (error) {
    return resp.status(500).send("Error updating workout: " + error.message);
  }
});

// Get workout by ID
router.get("/:id", async (req, resp) => {
  try {
    const workout = await Workout.findById(req.params.id).populate({
      path: "exercises.exerciseId",
      select: "name description type",
    });

    if (!workout) {
      return resp.status(404).send("Workout not found.");
    }

    return resp.send(workout);
  } catch (ex) {
    // MongoDB'nin geçersiz ID formatı hatası için özel kontrol
    if (ex.kind === "ObjectId") {
      return resp.status(400).send("Invalid workout ID format.");
    }
    return resp.status(500).send("Error fetching workout.");
  }
});

module.exports = router;
