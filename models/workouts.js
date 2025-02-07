const mongoose = require("mongoose");
const Joi = require("joi");

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
          min: 1,
        },
        reps: {
          type: Number,
          required: true,
          min: 1,
        },
        weight: {
          type: Number,
          min: 0,
          required: false,
        },
        sessions: [
          {
            exerciseTime: {
              type: Number,
              required: true,
              min: 0,
            },
            restTime: {
              type: Number,
              required: true,
              min: 0,
            },
            completedAt: {
              type: Date,
              required: true,
            },
          },
        ],
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

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
          weight: Joi.number().min(0).optional(),
          sessions: Joi.array()
            .items(
              Joi.object({
                exerciseTime: Joi.number().min(0).required(),
                restTime: Joi.number().min(0).required(),
                completedAt: Joi.date().required(),
              })
            )
            .optional(),
          notes: Joi.string().optional(),
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
