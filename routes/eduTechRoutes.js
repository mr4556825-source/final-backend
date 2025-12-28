const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // أضفنا ده
const bcrypt = require("bcrypt");

// استيراد الموديلات بشكل صريح لضمان عملها
const User = require("../models/user");
const EduTechRegistration = require("../models/EduTechRegistration");
const EduTechSettings = require("../models/EduTechSettings"); // تأكد من وجود هذا الملف

// 1. جلب الإعدادات (للزراير)
router.get("/settings", async (req, res) => {
    try {
        let settings = await EduTechSettings.findOne();
        if (!settings) settings = await EduTechSettings.create({ registrationOpen: true });
        res.json(settings);
    } catch (err) { 
        res.status(500).json({ message: "Settings fetch failed" }); 
    }
});

// 2. التبديل (Toggle Registration)
router.put("/toggle-registration", async (req, res) => {
    try {
        let settings = await EduTechSettings.findOne();
        if (!settings) settings = await EduTechSettings.create({ registrationOpen: true });
        
        settings.registrationOpen = !settings.registrationOpen;
        await settings.save();
        res.json({ registrationOpen: settings.registrationOpen });
    } catch (err) { 
        res.status(500).json({ message: "Toggle failed" }); 
    }
});

// 3. تسجيل مشروع جديد
router.post("/add", async (req, res) => {
    try {
        const { name, password, userClass, projectDescription, projectLink } = req.body;
        
        // التحقق من حالة التسجيل
        let settings = await EduTechSettings.findOne();
        if (settings && !settings.registrationOpen) {
            return res.status(403).json({ message: "Registration is currently closed!" });
        }

        const user = await User.findOne({ name });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Wrong password" });

        const existing = await EduTechRegistration.findOne({ userId: user._id });
        if (existing) return res.status(400).json({ message: "You already submitted a project" });

        const newEntry = new EduTechRegistration({
            userId: user._id, 
            name, 
            password: user.password, // يفضل استخدام الباسورد المشفر
            userClass, 
            projectDescription, 
            projectLink 
        });
        await newEntry.save();
        res.status(201).json({ message: "Project submitted successfully! 🚀" });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// 4. تحديد الفائز (للأدمن)
router.post("/set-winner", async (req, res) => {
    try {
        const { id } = req.body;
        // تصفير أي فائز قديم
        await EduTechRegistration.updateMany({}, { isWinner: false }); 
        // تعيين الفائز الجديد
        await EduTechRegistration.findByIdAndUpdate(id, { isWinner: true });
        res.json({ message: "New Winner Crowned! 👑" });
    } catch (err) { 
        res.status(500).json({ message: "Error setting winner" }); 
    }
});

// 5. حذف مشروع (الروت اللي كان ناقص)
router.delete("/delete/:id", async (req, res) => {
    try {
        await EduTechRegistration.findByIdAndDelete(req.params.id);
        res.json({ message: "Entry deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
});

// 6. جلب الفائز
router.get("/winner", async (req, res) => {
    try {
        const winner = await EduTechRegistration.findOne({ isWinner: true });
        res.json(winner);
    } catch (err) { res.status(500).json(null); }
});

// 7. جلب كل المشاركين
router.get("/", async (req, res) => {
    try {
        const participants = await EduTechRegistration.find();
        res.json(participants);
    } catch (err) { res.status(500).json([]); }
});

module.exports = router;
