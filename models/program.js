const mongoose = require("mongoose");
const Joi = require("joi");

const workoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
  },
  exercises: [
    {
      exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
        required: true,
      },
      sets: {
        type: Number,
        required: true,
      },
      reps: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Workout = mongoose.model("Workout", workoutSchema);

function validateWorkout(workout) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    exercises: Joi.array()
      .items(
        Joi.object({
          exerciseId: Joi.string().required(),
          sets: Joi.number().min(1).required(),
          reps: Joi.number().min(1).required(),
        })
      )
      .required(),
  });
  return schema.validate(workout);
}

module.exports = {
  Workout,
  validateWorkout,
};
