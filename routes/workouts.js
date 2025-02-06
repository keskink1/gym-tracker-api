const express = require("express");
const router = express.Router();
const { Workout, validateWorkout } = require("../models/workouts");
const auth = require("../middleware/auth");

// Get all workouts
router.get("/", async (req, resp) => {
  try {
    const workouts = await Workout.find().populate({
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
    // req.user ile token içindeki bilgilere erişebilirsiniz
    console.log("User ID:", req.user.userId);
    console.log("User Email:", req.user.email);

    const { error } = validateWorkout(req.body);
    if (error) return resp.status(400).send(error.details[0].message);

    const workout = new Workout({
      name: req.body.name,
      exercises: req.body.exercises,
    });

    const result = await workout.save();
    resp.send(result);
  } catch (ex) {
    console.error(ex);
    return resp.status(500).send("Error while saving workout.");
  }
});

// Delete workout
router.delete("/:id", async (req, resp) => {
  try {
    // Sadece belirli bir ID'ye sahip workout'u sil
    const workout = await Workout.findByIdAndDelete(req.params.id);

    if (!workout) {
      return resp.status(404).send("Workout not found.");
    }

    return resp.send(workout);
  } catch (ex) {
    return resp.status(500).send("Error deleting workout.");
  }
});

//update workout
router.put("/:id", async (req, resp) => {
  try {
    // Önce gelen datayı validate edelim
    const { error } = validateWorkout(req.body);
    if (error) return resp.status(400).send(error.details[0].message);

    // En az bir alan kontrolü (schema'da name ve exercises required olduğu için gerekli değil aslında)
    if (!req.body.name && !req.body.exercises) {
      return resp
        .status(400)
        .send("At least one field (name or exercises) must be provided.");
    }

    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          // $set operatörü ekleyelim
          name: req.body.name,
          exercises: req.body.exercises,
        },
      },
      {
        new: true,
        runValidators: true, // Schema validasyonlarını çalıştır
      }
    );

    if (!workout) return resp.status(404).send("Workout not found.");

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
