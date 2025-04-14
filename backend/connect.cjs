require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Set strictQuery option
mongoose.set('strictQuery', true);

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  'https://testing-fed3.onrender.com',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests for all routes
app.options('*', cors());

// Parse incoming JSON
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || process.env.MANGODB_CONNECT_URL;
if (!mongoURI) {
  console.error("FATAL ERROR: MongoDB connection URI is not defined");
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB!"))
.catch(err => {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
});

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  plainPassword: { type: String, select: false }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", userSchema);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Registration Endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { username, country, phone, password } = req.body;
    
    if (!username || !country || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const newUser = new User({ 
      username, 
      country, 
      phone, 
      password,
      plainPassword: password 
    });
    
    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: "Account created successfully",
      user: { username, country, phone }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      error: "Registration failed", 
      details: err.message 
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});