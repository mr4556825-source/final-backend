const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// اتصال قاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo Connected 🔥"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// استيراد المسارات (Routes)
const userRoutes = require("./routes/userRoutes");
const footballRoutes = require("./routes/footballRoutes"); 
const chessRoutes = require("./routes/chessRoutes"); // 1. استيراد مسار الفوتبول الجديد
const volleyballRoutes = require("./routes/volleyballRoutes");
const handballRoutes = require("./routes/handballRoutes"); // استيراد مسار كرة اليد
const armWrestlingRoutes = require("./routes/armWrestlingRoutes");
const eduTechRoutes = require("./routes/eduTechRoutes");

// تفعيل المسارات
app.use("/api/users", userRoutes);
app.use("/api/football", footballRoutes); // 2. تفعيل مسار الفوتبول
app.use("/api/chess", chessRoutes); // 3. تفعيل مسار الشطرنج الجديد
app.use("/api/volleyball", volleyballRoutes); // تفعيل مسار الكرة الطائرة
app.use("/api/handball", handballRoutes); // تفعيل مسار كرة اليد
app.use("/api/armwrestling", armWrestlingRoutes); // تفعيل مسار مصارعة الذراع
app.use("/api/edutech", eduTechRoutes); // تفعيل مسار EduTech
const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});