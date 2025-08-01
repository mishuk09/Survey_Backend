const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config(); // Load environment variables

const app = express();
app.use(express.json());

// ✅ CORS with specific allowed origins
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://mishukinfo.com",
    "https://powderblue-goldfinch-362369.hostingersite.com/"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST"],
    credentials: true
}));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Cloudinary Storage Setup
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "survey_uploads",
        allowed_formats: ["jpg", "png", "jpeg", "pdf"],
        transformation: [{ width: 800, height: 800, crop: "limit" }]
    }
});

const upload = multer({ storage });

// ✅ Mongoose Schema
const surveySchema = new mongoose.Schema({
    demographics: Object,
    awareness: Object,
    readiness: Object,
    textAnswers: Object,
    images: [String]
});

const Survey = mongoose.model("Survey", surveySchema);

// ✅ Get All Surveys
app.get("/get/surveys", async (req, res) => {
    try {
        const surveys = await Survey.find();
        res.status(200).json(surveys);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch surveys." });
    }
});

// ✅ Submit Survey with Images
app.post("/api/survey", upload.array("images", 5), async (req, res) => {
    try {
        const imageUrls = req.files?.map(file => file.path) || [];
        const { demographics, awareness, readiness, textAnswers } = req.body;

        const newSurvey = new Survey({
            demographics: JSON.parse(demographics),
            awareness: JSON.parse(awareness),
            readiness: JSON.parse(readiness),
            textAnswers: JSON.parse(textAnswers),
            images: imageUrls
        });

        await newSurvey.save();
        res.status(201).json({ message: "Survey with files saved successfully!" });
    } catch (error) {
        console.error("Survey upload error:", error);
        res.status(500).json({ message: "Failed to save survey with images." });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
