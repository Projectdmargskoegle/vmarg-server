const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan")
const app = express();
const PORT = 5000;
const cors = require("cors");

// Middleware
app.use(bodyParser.json());
app.use(morgan("dev"))
app.use(cors())
mongoose
  .connect("mongodb+srv://proectnova:qIPaIQWO0z9BjGgB@cluster0.eu4py.mongodb.net/dmarg", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));



const logSchema = new mongoose.Schema({
  deviceName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  date: { type: String, required: true }, // Store date as a string (e.g., "2025-02-06")
  time: { type: String, required: true }, // Store time as a string (e.g., "14:30:00")
});

const Log = mongoose.model("Log", logSchema);
const Realtime = mongoose.model("Realtime", logSchema);

// Create Route (POST /logs)
app.post("/logs", async (req, res) => {
  try {
    const { deviceName, latitude, longitude, date, time } = req.body;

    // Create a new log entry
    const newLog = new Log({ deviceName, latitude, longitude, date, time });
    await newLog.save();

    res.status(201).json({ message: "Log created successfully", log: newLog });
  } catch (error) {
    res.status(500).json({ message: "Error creating log", error });
  }
});

// Get Route (GET /logs)
app.get("/logs", async (req, res) => {
  try {
    const logs = await Log.find(); // Fetch all logs
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching logs", error });
  }
});
app.put("/realtime/:deviceName", async (req, res) => {
  try {
    const { deviceName } = req.params;
    const { latitude, longitude, date, time } = req.body;

    const updatedRealtime = await Realtime.findOneAndUpdate(
      { deviceName }, // Find real-time entry by deviceName
      { latitude, longitude, date, time }, // Update fields
      { new: true, upsert: true } // Return the updated document and create it if it doesn't exist
    );

    res.status(200).json({ message: "Real-time data updated", realtime: updatedRealtime });
  } catch (error) {
    res.status(500).json({ message: "Error updating real-time data", error });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
