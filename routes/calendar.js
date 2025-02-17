const express = require("express");
const router = express.Router();
const { Calendar, validateCalendarEntry } = require("../models/calendar");
const auth = require("../middleware/auth");

// Belirli bir ay için workout'ları getir
router.get("/month/:year/:month", auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1); // Ay 0'dan başlıyor
    const endDate = new Date(year, month, 0);

    const entries = await Calendar.find({
      userId: req.user.userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate("workoutId", "name"); // Sadece workout adını getir

    res.send(entries);
  } catch (ex) {
    res.status(500).send("Error fetching calendar entries: " + ex.message);
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { error } = validateCalendarEntry(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Aynı gün için kayıt var mı kontrol et
    const existingEntry = await Calendar.findOne({
      userId: req.user.userId,
      date: new Date(req.body.date),
    });

    if (existingEntry) {
      return res.status(400).send("A workout is already assigned to this date");
    }

    const calendarEntry = new Calendar({
      userId: req.user.userId,
      date: new Date(req.body.date),
      workoutId: req.body.workoutId,
    });

    const result = await calendarEntry.save();
    res.send(result);
  } catch (ex) {
    res.status(500).send("Error assigning workout: " + ex.message);
  }
});

router.delete("/:date", auth, async (req, res) => {
  try {
    const entry = await Calendar.findOneAndDelete({
      userId: req.user.userId,
      date: new Date(req.params.date),
    });

    if (!entry) {
      return res.status(404).send("No workout found for this date");
    }

    res.send(entry);
  } catch (ex) {
    res.status(500).send("Error deleting workout assignment: " + ex.message);
  }
});

// Son 12 ayın workout verilerini getir
router.get("/last-twelve-months", auth, async (req, res) => {
  try {
    // Şu anki tarihi al
    const currentDate = new Date();

    // 12 ay öncesinin tarihini hesapla
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const entries = await Calendar.find({
      userId: req.user.userId,
      date: {
        $gte: twelveMonthsAgo,
        $lte: currentDate,
      },
    })
      .populate("workoutId", "name")
      .sort({ date: 1 }); // Tarihe göre sırala

    // Ayları grupla
    const monthlyData = {};
    entries.forEach((entry) => {
      const monthYear = entry.date.toISOString().slice(0, 7); // "YYYY-MM" formatı
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = [];
      }
      monthlyData[monthYear].push(entry);
    });

    res.send(monthlyData);
  } catch (ex) {
    res
      .status(500)
      .send("Error fetching last twelve months data: " + ex.message);
  }
});

module.exports = router;
