const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const ArmWrestlingSettings = require("../models/ArmWrestlingSettings"); // تأكد من المسار models/modals
const User = require("../models/user"); 
const ArmWrestlingRegistration = require("../models/ArmWrestlingRegistration"); 
const Match = require("../models/ArmWrestlingMatch"); 
const ArmWrestlingLeaderboard = require('../models/ArmWrestlingLeaderboard');

// Middleware للتحقق من حالة التسجيل
async function checkRegistration(req, res, next) {
    let settings = await ArmWrestlingSettings.findOne();
    if (!settings) settings = await ArmWrestlingSettings.create({});
    if (!settings.registrationOpen) return res.status(403).json({ message: "Registration is closed" });
    next();
}

// 1. إضافة لاعب (تسجيل)
router.post("/add", checkRegistration, async (req, res) => {
    try {
        const { name, password, userClass } = req.body;
        const user = await User.findOne({ name });
        if (!user) return res.status(401).json({ message: "User not found" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: "Wrong password" });

        const existing = await ArmWrestlingRegistration.findOne({ userId: user._id });
        if (existing) return res.status(409).json({ message: "Already registered" });

        // حفظ التسجيل
        const reg = new ArmWrestlingRegistration({ userId: user._id, name: user.name, userClass });
        await reg.save();

        // إنشاء سجل في leaderboard لو مش موجود (باستخدام upsert عشان نضمن وجود حقل الـ player)
        await ArmWrestlingLeaderboard.findOneAndUpdate(
            { player: user.name },
            { $setOnInsert: { player: user.name, played: 0, won: 0, lost: 0 } },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: `Warrior ${name} has entered the arena!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", details: err.message }); // هتشوف الـ error في الفرونت دلوقتي
    }
});

// 2. توليد القرعة (كل لاعب ضد كل لاعب)
router.post("/generate-draw", async (req, res) => {
    try {
        const playersList = await ArmWrestlingRegistration.find({});
        const players = playersList.map(p => p.name);

        if (players.length < 2) return res.status(400).json({ message: "Need at least 2 players" });

        const matches = [];
        for (let i = 0; i < players.length; i++)
            for (let j = i + 1; j < players.length; j++)
                matches.push({ player1: players[i], player2: players[j], winner: null, isFinished: false });

        await Match.deleteMany({});
        // إعادة تهيئة الليدربورد
        await ArmWrestlingLeaderboard.updateMany({}, { played: 0, won: 0, lost: 0 }); 

        const createdMatches = await Match.insertMany(matches);
        res.json({ message: "Draw generated", matches: createdMatches });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error generating draw" });
    }
});


// 3. تحديث النتيجة وحساب النقاط تلقائياً (اللوجيك بتاع الليدربورد الداينمك)
router.post("/update-score", async (req, res) => {
    const { matchId, winnerName } = req.body;
    try {
        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });
        if (match.isFinished) return res.status(400).json({ message: "Match already finished" });


        match.winner = winnerName;
        match.isFinished = true;
        await match.save();

        // تحديث الليدربورد للفريقين اللي لعبوا الماتش ده
        const players = [match.player1, match.player2];
        
        for (let pName of players) {
            // جلب كل ماتشات اللاعب ده اللي خلصت
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

            // تحديث سجل اللاعب في الليدربورد
            await ArmWrestlingLeaderboard.findOneAndUpdate(
                { player: pName }, 
                stats, 
                { upsert: true, new: true }
            );
        }

        res.json({ message: "Winner recorded and Leaderboard recalculated!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 4. جلب الليدربورد (مرتبة بالفوز ثم عدد اللعب)
router.get("/leaderboard", async (req, res) => {
    try {
        const leaderboard = await ArmWrestlingLeaderboard.find().sort({ won: -1, played: -1 });
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
});


// باقي الروتس (settings, get players, delete player, toggle registration, get matches) زي ما هي:
router.get("/settings", async (req, res) => {
    let settings = await ArmWrestlingSettings.findOne();
    if (!settings) settings = await ArmWrestlingSettings.create({});
    res.json(settings);
});

router.get("/", async (req, res) => {
    const players = await ArmWrestlingRegistration.find({});
    res.json(players);
});

router.delete("/delete/:id", async (req, res) => {
    await ArmWrestlingRegistration.findByIdAndDelete(req.params.id);
    res.json({ message: "Removed" });
});

router.put("/toggle-registration", async (req, res) => {
    let settings = await ArmWrestlingSettings.findOne();
    settings.registrationOpen = !settings.registrationOpen;
    await settings.save();
    res.json({ registrationOpen: settings.registrationOpen });
});

router.get("/matches", async (req, res) => {
    const matches = await Match.find();
    res.json(matches);
});


module.exports = router;
