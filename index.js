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
  .connect("mongodb+srv://proectnova:qIPaIQWO0z9BjGgB@cluster0.eu4py.mongodb.net/Vmarg-Prod", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));



  const logSchema = new mongoose.Schema({
    deviceName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    date: { type: String, required: true }, // Format: "DD-MM-YYYY"
    time: { type: String, required: true }  // Format: "HH:MM:SS"
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

app.get("/find/logs", async (req, res) => {
  const { deviceName, fromDate, toDate, fromTime, toTime } = req.query;

  try {
    const query = { ...(deviceName && { deviceName }) };

    if (fromDate && toDate) {
      query.date = {
        $gte: fromDate,
        $lte: toDate
      };
    }

    if (fromTime && toTime) {
      query.time = {
        $gte: fromTime,
        $lte: toTime
      };
    }

    console.log("Query:", query); // Debugging the query being sent

    const logs = await Log.find(query).sort({ date: 1, time: 1 }).select("deviceName latitude longitude date time");

    res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching logs", error });
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


app.get("/realtime/:deviceName",async(req,res)=>{

  const deviceName = req.params.deviceName;

  const result = await Realtime.findOne({deviceName:deviceName})


  res.send(result)
})

app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
