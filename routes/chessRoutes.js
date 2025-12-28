const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// استيراد الموديلات - تأكد أن أسماء الملفات في فولدر models تطابق هذه الأسماء
const ChessSettings = require("../models/ChessSettings");
const User = require("../models/user"); 
const ChessRegistration = require("../models/ChessRegistration"); 
const Match = require("../models/ChessMatch"); 
const ChessLeaderboard = require('../models/ChessLeaderboard');

// 1. Middleware للتحقق من حالة التسجيل
async function checkRegistration(req, res, next) {
    try {
        let settings = await ChessSettings.findOne();
        if (!settings) settings = await ChessSettings.create({});
        if (!settings.registrationOpen) return res.status(403).json({ message: "Registration is closed" });
        next();
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
}

// 2. الحصول على الإعدادات
router.get("/settings", async (req, res) => {
    let settings = await ChessSettings.findOne();
    if (!settings) settings = await ChessSettings.create({});
    res.json(settings);
});

// 3. إضافة لاعب (تسجيل في الشطرنج)
router.post("/add", checkRegistration, async (req, res) => {
    try {
        const { name, password, userClass } = req.body;
        
        // التحقق من وجود المستخدم
        const user = await User.findOne({ name });
        if (!user) return res.status(401).json({ message: "User not found" });

        // التحقق من الباسورد
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: "Wrong password" });

        // التحقق من التسجيل المسبق
        const existing = await ChessRegistration.findOne({ userId: user._id });
        if (existing) return res.status(409).json({ message: "Already registered" });

        // حفظ التسجيل
        const reg = new ChessRegistration({ userId: user._id, name: user.name, userClass });
        await reg.save();

        // إنشاء سجل في الليدربورد لو مش موجود
        await ChessLeaderboard.findOneAndUpdate(
            { player: user.name },
            { $setOnInsert: { player: user.name, played: 0, won: 0, lost: 0 } },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: `Grandmaster ${name} has entered the tournament!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", details: err.message });
    }
});

// 4. جلب كل اللاعبين
router.get("/", async (req, res) => {
    try {
        const players = await ChessRegistration.find({});
        res.json(players);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch players" });
    }
});

// 5. حذف لاعب
router.delete("/delete/:id", async (req, res) => {
    try {
        const player = await ChessRegistration.findById(req.params.id);
        if (!player) return res.status(404).json({ message: "Player not found" });

        await ChessRegistration.findByIdAndDelete(req.params.id);
        await ChessLeaderboard.findOneAndDelete({ player: player.name });

        res.json({ message: "Grandmaster removed" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting player" });
    }
});

// 6. فتح/قفل التسجيل
router.put("/toggle-registration", async (req, res) => {
    try {
        let settings = await ChessSettings.findOne();
        if (!settings) settings = await ChessSettings.create({});
        settings.registrationOpen = !settings.registrationOpen;
        await settings.save();
        res.json({ registrationOpen: settings.registrationOpen });
    } catch (err) {
        res.status(500).json({ message: "Error toggling status" });
    }
});

// 7. توليد القرعة (نظام أفراد)
router.post("/generate-draw", async (req, res) => {
    try {
        const playersList = await ChessRegistration.find({});
        const players = playersList.map(p => p.name);

        if (players.length < 2) return res.status(400).json({ message: "Need at least 2 players" });

        const matches = [];
        for (let i = 0; i < players.length; i++)
            for (let j = i + 1; j < players.length; j++)
                matches.push({ player1: players[i], player2: players[j], winner: null, isFinished: false });

        await Match.deleteMany({});
        // ريست لليدربورد عند عمل قرعة جديدة
        await ChessLeaderboard.updateMany({}, { played: 0, won: 0, lost: 0 }); 

        const createdMatches = await Match.insertMany(matches);
        res.json({ message: "Draw generated", matches: createdMatches });
    } catch (err) {
        res.status(500).json({ message: "Error generating draw" });
    }
});

// 8. جلب الماتشات
router.get("/matches", async (req, res) => {
    try {
        const matches = await Match.find();
        res.json(matches);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 9. تسجيل الفائز وتحديث الليدربورد داينمك (نفس منطق الأرم ريسلنج)
router.post("/update-score", async (req, res) => {
    const { matchId, winnerName } = req.body;
    try {
        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        match.winner = winnerName;
        match.isFinished = true;
        await match.save();

        // تحديث إحصائيات اللاعبين اللذين شاركا في الماتش
        const players = [match.player1, match.player2];
        for (let pName of players) {
            const playerMatches = await Match.find({
                $or: [{ player1: pName }, { player2: pName }],
                isFinished: true
            });

            let stats = { played: 0, won: 0, lost: 0 };
            playerMatches.forEach(m => {
                stats.played++;
                if (m.winner === pName) stats.won++;
                else stats.lost++;
            });

            await ChessLeaderboard.findOneAndUpdate(
                { player: pName }, 
                stats, 
                { upsert: true, new: true }
            );
        }

        res.json({ message: "Score updated successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// 10. جلب الليدربورد مرتبة
router.get("/leaderboard", async (req, res) => {
    try {
        const leaderboard = await ChessLeaderboard.find().sort({ won: -1, played: -1 });
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
});

module.exports = router;
