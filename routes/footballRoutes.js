const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const FootballSettings = require("../models/FootballSettings");
const User = require("../models/user"); 
const FootballRegistration = require("../models/FootballRegistration"); 
const Match = require("../models/FootballMatch"); // تأكد أن المسار صحيح حسب مشروعك
const FootballLeaderboard = require('../models/FootballLeaderboard');

// 1. Middleware للتحقق من حالة التسجيل
async function checkRegistration(req, res, next) {
  let settings = await FootballSettings.findOne();
  if (!settings) settings = await FootballSettings.create({});
  if (!settings.registrationOpen) return res.status(403).json({ message: "Registration is closed" });
  next();
}

// 2. الحصول على الإعدادات
router.get("/settings", async (req, res) => {
  let settings = await FootballSettings.findOne();
  if (!settings) settings = await FootballSettings.create({});
  res.json(settings);
});

// 3. إضافة لاعب (تسجيل في رياضة الكورة)
router.post("/add", checkRegistration, async (req, res) => {
  try {
    const { name, password, team } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ message: "User not found" });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Wrong password" });

    const existing = await FootballRegistration.findOne({ userId: user._id });
    if (existing) return res.status(409).json({ message: "Already registered" });

    const reg = new FootballRegistration({ userId: user._id, name: user.name, team });
    await reg.save();
    res.status(201).json({ message: `Success! Team ${team}` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 4. جلب كل اللاعبين
router.get("/", async (req, res) => {
  const players = await FootballRegistration.find({});
  res.json(players);
});

// 5. مسح لاعب
router.delete("/delete/:id", async (req, res) => {
  await FootballRegistration.findByIdAndDelete(req.params.id);
  res.json({ message: "Removed" });
});

// 6. فتح وقفل التسجيل
router.put("/toggle-registration", async (req, res) => {
  let settings = await FootballSettings.findOne();
  settings.registrationOpen = !settings.registrationOpen;
  await settings.save();
  res.json({ registrationOpen: settings.registrationOpen });
});

// 7. توليد القرعة (Generate Draw)
router.post("/generate-draw", async (req, res) => {
  try {
    const players = await FootballRegistration.find();
    const teams = [...new Set(players.map(p => p.team))];
    if (teams.length < 2) return res.status(400).json({ message: "Need at least 2 teams" });

    const matches = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({ home: teams[i], away: teams[j], homeScore: 0, awayScore: 0, isFinished: false });
      }
    }
    await Match.deleteMany({}); // مسح القرعة القديمة
    await FootballLeaderboard.deleteMany({}); // مسح الترتيب القديم للبدء من جديد
    const createdMatches = await Match.insertMany(matches);
    res.json({ message: "Draw created", matches: createdMatches });
  } catch (err) {
    res.status(500).json({ message: "Error generating draw" });
  }
});

// 8. جلب الماتشات
router.get("/matches", async (req, res) => {
  const matches = await Match.find();
  res.json(matches);
});

// 9. التعديل الجوهري: تحديث النتيجة وحساب النقاط تلقائياً
router.post("/update-score", async (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;
  try {
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Match not found" });

    match.homeScore = Number(homeScore);
    match.awayScore = Number(awayScore);
    match.isFinished = true;
    await match.save();

    // تحديث الليدربورد للفريقين اللي لعبوا الماتش ده
    const teamNames = [match.home, match.away];

    for (let tName of teamNames) {
      // 1. جلب كل ماتشات الفريق ده اللي خلصت
      const teamMatches = await Match.find({
        $or: [{ home: tName }, { away: tName }],
        isFinished: true
      });

      let stats = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };

      teamMatches.forEach(m => {
        stats.played++;
        let hScore = m.homeScore;
        let aScore = m.awayScore;

        if (m.home === tName) {
          stats.goalsFor += hScore;
          stats.goalsAgainst += aScore;
          if (hScore > aScore) stats.won++;
          else if (hScore === aScore) stats.drawn++;
          else stats.lost++;
        } else {
          stats.goalsFor += aScore;
          stats.goalsAgainst += hScore;
          if (aScore > hScore) stats.won++;
          else if (aScore === hScore) stats.drawn++;
          else stats.lost++;
        }
      });
      stats.points = (stats.won * 3) + (stats.drawn * 1);

      // 2. تحديث أو إنشاء سجل الفريق في الليدربورد
      await FootballLeaderboard.findOneAndUpdate(
        { team: tName },
        stats,
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Score updated and Leaderboard recalculated!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 10. جلب الليدربورد (مرتبة بالنقاط ثم فارق الأهداف)
router.get("/leaderboard", async (req, res) => {
  const leaderboard = await FootballLeaderboard.find().sort({ points: -1, goalsFor: -1 });
  res.json(leaderboard);
});

module.exports = router;
