const mongoose = require("mongoose");
const Joi = require("joi");

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "chest", // göğüs
      "back", // sırt
      "shoulders", // omuz
      "legs", // bacak
      "arms", // kol
      "abs", // karın
      "cardio", // kardiyo
      "fullbody", // tüm vücut
    ],
  },
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

function validateExercise(exercise) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    type: Joi.string()
      .valid(
        "chest",
        "back",
        "shoulders",
        "legs",
        "arms",
        "abs",
        "cardio",
        "fullbody"
      )
      .required(),
  });
  return schema.validate(exercise);
}

module.exports = {
  Exercise,
  validateExercise,
};
