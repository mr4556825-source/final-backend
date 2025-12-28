const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Admin = require("../models/admin"); // 1. تأكد إنك عامل استيراد لموديل الأدمن هنا

// ... كود الـ Register سليم زي ما هو ...
// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ name });
    if (exists)
      return res.status(400).json({ message: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      password: hashed,
      role: "user" // أي تسجيل من الفورم = يوزر عادي
    });

    await user.save();
    res.status(201).json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ message: "All fields required" });

    // 2. المحاولة الأولى: البحث في كوليكشن الأدمنز
    let account = await Admin.findOne({ name });
    let role = "admin";
    let redirectPage = "admin.html";

    // 3. لو ملقاش أدمن، يدور في كوليكشن اليوزرز
    if (!account) {
      account = await User.findOne({ name });
      role = "user";
      redirectPage = "user.html";
    }

    // 4. لو ملقاش في الاتنين
    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5. مقارنة الباسورد (سواء كان أدمن أو يوزر)
    const match = await bcrypt.compare(password, account.password);
    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // 6. الرد بالنجاح مع تحديد الصفحة اللي المفروض يروح لها
    res.status(200).json({
      message: "Login successful",
      role: role,
      name: account.name,
      redirect: redirectPage // ابعت اسم الصفحة للفرونت إند
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
