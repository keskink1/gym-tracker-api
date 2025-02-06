const express = require("express");
const app = express();
const mongoose = require("mongoose");
const auth = require("./routes/auth");
const users = require("./routes/users");
const exercisesRoutes = require("./routes/exercises");
const workouts = require("./routes/workouts");
const cors = require("cors");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

app.use(express.json());
app.use(cors()); // Tüm originlere izin ver

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/exercises", exercisesRoutes);
app.use("/api/workouts", workouts);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
