const mongoose = require("mongoose");
const Joi = require("joi");

const calendarSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
      required: true,
    },
  },
  { timestamps: true }
);

calendarSchema.index({ userId: 1, date: 1 }, { unique: true });

const Calendar = mongoose.model("Calendar", calendarSchema);

function validateCalendarEntry(entry) {
  const schema = Joi.object({
    date: Joi.date().required(),
    workoutId: Joi.string().required(),
  });
  return schema.validate(entry);
}

module.exports = {
  Calendar,
  validateCalendarEntry,
};
