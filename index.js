const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const mqtt = require("mqtt");

const app = express();
const PORT = 5000;

// MongoDB connection
mongoose
  .connect("mongodb+srv://proectnova:qIPaIQWO0z9BjGgB@cluster0.eu4py.mongodb.net/Vmarg-Prod", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());

// Mongoose Schema and Models
const logSchema = new mongoose.Schema({
  deviceName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  date: { type: String, required: true }, // Format: "DD-MM-YYYY"
  time: { type: String, required: true }, // Format: "HH:MM:SS"
});

const Log = mongoose.model("Log", logSchema);
const Realtime = mongoose.model("Realtime", logSchema);

// MQTT Client Configuration
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com"); // Public MQTT broker

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to a topic (replace "skoegle/gps" with your desired topic)
  mqttClient.subscribe("skoegle/gps", (err) => {
    if (err) {
      console.error("Failed to subscribe to MQTT topic:", err);
    } else {
      console.log("Subscribed to MQTT topic: skoegle/gps");
    }
  });
});

mqttClient.on("message", async (topic, message) => {
  try {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
    
    const payload = JSON.parse(message.toString());
    const { deviceName, latitude, longitude, date, time } = payload;

    // Save the log to MongoDB
    const newLog = new Log({ deviceName, latitude, longitude, date, time });
    await newLog.save();
    
    // Update or insert real-time data
    await Realtime.findOneAndUpdate(
      { deviceName },
      { latitude, longitude, date, time },
      { upsert: true, new: true }
    );

    console.log("Data saved successfully");
  } catch (error) {
    console.error("Error processing MQTT message:", error);
  }
});

// Sample HTTP route to fetch real-time data
app.get("/realtime/:deviceName", async (req, res) => {
  try {
    const { deviceName } = req.params;
    const result = await Realtime.findOne({ deviceName });
    if (!result) {
      return res.status(404).json({ message: "Device not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching real-time data", error });
  }
});

// HTTP route for health check
app.get("/ping", (req, res) => {
  res.send("We got your request");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
