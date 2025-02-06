const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { User, validateUser, validateLogin } = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth"); // auth middleware'ini düzgün import et

//register
router.post("/register", async (req, resp) => {
  try {
    const { email, name, surname, password } = req.body;

    // Alan kontrolü
    if (!email || !name || !surname || !password) {
      return resp
        .status(400)
        .send("All fields are required (email, name, surname, password)");
    }

    // Kullanıcı doğrulaması
    const { error } = validateUser(req.body);
    if (error) return resp.status(400).send(error.details[0].message);

    // Kullanıcı var mı kontrolü
    let user = await User.findOne({ email });
    if (user) return resp.status(400).send("Email is already registered.");

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Yeni kullanıcı oluşturma
    user = new User({
      email,
      name,
      surname,
      password: hashedPassword,
    });

    // Veritabanına kaydet
    await user.save();

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET
    );

    // Token ile birlikte başarılı yanıt gönder
    return resp.send({ token });
  } catch (ex) {
    console.error("Registration error:", ex);
    return resp.status(500).send("An error occurred during registration.");
  }
});

//login
router.post("/login", async (req, resp) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return resp.status(400).send(error.details[0].message);

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return resp.status(400).send("Invalid email or password.");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return resp.status(400).send("Invalid email or password.");
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Örneğin token süresi eklenebilir
    );

    // Token ve kullanıcı bilgilerini döndür
    return resp.send({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (ex) {
    console.error("Login error:", ex);
    return resp.status(500).send("Error in login.");
  }
});

//token middleware
const verifyToken = (req, resp, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader)
    return resp.status(401).send("Access denied. No token provided.");

  const token = authHeader.split(" ")[1];
  if (!token)
    return resp.status(401).send("Access denied. Invalid token format.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    resp.status(400).send("Invalid token");
  }
};

//protected route
router.get("/protected", verifyToken, (req, resp) => {
  resp.send({
    message: "This is a protected route.",
    user: req.user, // JWT'den gelen kullanıcı bilgileri
  });
});

// Get current user
router.get("/me", auth, async (req, resp) => {
  // auth middleware'ini kullan
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return resp.status(404).send("User not found.");
    }

    resp.send({
      _id: user._id,
      email: user.email,
      surname: user.surname,
      name: user.name,
    });
  } catch (ex) {
    resp.status(500).send("Error fetching user data.");
  }
});

module.exports = router;
