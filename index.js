const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());


const allowedOrigins = [
    "http://localhost:3000",
    "https://mishukinfo.com",
    "http://localhost:3001",
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


// MongoDB Connection
mongoose.connect("mongodb+srv://mishukinfo09:7Ns4Jabo6aWgGVtf@mmu-task-add.sgp9njp.mongodb.net/?retryWrites=true&w=majority&appName=mmu-task-add", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Storage Setup with Multer
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: "survey_uploads",
//         allowed_formats: ["jpg", "png", "jpeg", "pdf"]
//     }
// });

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "survey_uploads",
        allowed_formats: ["jpg", "png", "jpeg", "pdf"],
        transformation: [{ width: 800, height: 800, crop: "limit" }] // 👈 resize here
    }
});

const upload = multer({ storage });

// Mongoose Schema
const surveySchema = new mongoose.Schema({
    demographics: Object,
    awareness: Object,
    readiness: Object,
    textAnswers: Object,
    images: [String] // to store image URLs from Cloudinary
});
const Survey = mongoose.model("Survey", surveySchema);

// Get All Surveys
app.get("/get/surveys", async (req, res) => {
    try {
        const surveys = await Survey.find();
        res.status(200).json(surveys);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch surveys." });
    }
});

// Submit Survey with Images (Main Endpoint)
app.post("/api/survey", upload.array("images", 5), async (req, res) => {
    try {
        const imageUrls = req.files?.map(file => file.path) || [];

        // Parse form data (stringified JSON)
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
