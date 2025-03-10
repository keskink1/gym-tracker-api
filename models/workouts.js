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
        setDetails: [
          {
            setNumber: {
              type: Number,
              required: true,
              min: 1,
            },
            weight: {
              type: Number,
              min: 0,
              required: false,
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
          setDetails: Joi.array()
            .items(
              Joi.object({
                setNumber: Joi.number().min(1).required(),
                weight: Joi.number().min(0).optional(),
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
