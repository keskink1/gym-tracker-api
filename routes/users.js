const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// Kullanıcı profilini getir
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name surname email -_id"
    ); // Sadece bu alanları seç, _id'yi hariç tut
    // veya
    // .select("-password -__v") // password ve __v hariç tüm alanları seç

    if (!user) {
      return res.status(404).send("User not found.");
    }

    res.send(user);
  } catch (ex) {
    res.status(500).send("Error fetching user profile.");
  }
});

// Hesabı sil
router.delete("/me", auth, async (req, res) => {
  try {
    // Şifre doğrulaması isteğe bağlı eklenebilir
    if (req.body.password) {
      const user = await User.findById(req.user.userId);
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword) {
        return res.status(400).send("Invalid password.");
      }
    }

    const deletedUser = await User.findByIdAndDelete(req.user.userId);
    if (!deletedUser) {
      return res.status(404).send("User not found.");
    }

    res.send({ message: "Account deleted successfully." });
  } catch (ex) {
    res.status(500).send("Error deleting account.");
  }
});

//get all users
router.get("/", async (req, resp) => {
  const result = await User.find().select("-password");
  resp.send(result);
});

// Profil bilgilerini güncelle (isim, soyisim, email)
router.put("/me", auth, async (req, res) => {
  try {
    const { name, surname, email } = req.body;

    // Validation
    if (!name && !surname && !email) {
      return res
        .status(400)
        .send("At least one field must be provided to update.");
    }

    // Email değişiyorsa, yeni email'in başka kullanıcı tarafından kullanılmadığından emin ol
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.userId },
      });
      if (existingUser) {
        return res.status(400).send("Email already in use.");
      }
    }

    // Güncelleme objesi oluştur
    const updateData = {};
    if (name) updateData.name = name;
    if (surname) updateData.surname = surname;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) {
      return res.status(404).send("User not found.");
    }

    res.send(user);
  } catch (ex) {
    res.status(500).send("Error updating profile: " + ex.message);
  }
});

// Şifre değiştir
router.put("/me/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .send("Both current and new password are required.");
    }

    // Minimum şifre uzunluğu kontrolü
    if (newPassword.length < 6) {
      return res
        .status(400)
        .send("New password must be at least 6 characters long.");
    }

    // Mevcut kullanıcıyı bul
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Mevcut şifreyi kontrol et
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).send("Current password is incorrect.");
    }

    // Yeni şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Şifreyi güncelle
    await User.findByIdAndUpdate(req.user.userId, {
      $set: { password: hashedPassword },
    });

    res.send({ message: "Password updated successfully." });
  } catch (ex) {
    res.status(500).send("Error updating password: " + ex.message);
  }
});

module.exports = router;
