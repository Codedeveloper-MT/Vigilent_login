require('dotenv').config({ path: `${__dirname}/.env` });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

mongoose.set('strictQuery', false);

const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MANGODB_CONNECT_URL;

console.log("Environment Variables:");
console.log("MANGODB_CONNECT_URL:", process.env.MANGODB_CONNECT_URL ? "exists" : "missing");
console.log("PORT:", process.env.PORT);

if (!mongoURI) {
  console.error("FATAL ERROR: MongoDB connection URI is not defined");
  console.error("Please check your .env file in:", __dirname);
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB Atlas!"))
.catch(err => {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  plainPassword: { type: String, select: false }
});

userSchema.index({ username: 1, password: 1 }, { unique: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model("User", userSchema, "vigilantaids_users");

app.post("/api/register", async (req, res) => {
  try {
    const { username, country, phone, password } = req.body;
    
    if (!username || !country || !phone || !password) {
      return res.status(400).json({ error: "Fill in the missing details" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
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
      message: "Your account is successfully created",
      user: {
        username,
        country,
        phone
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      error: "Your account failed to be created!", 
      details: err.message 
    });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Enter a correct username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid details" });

    res.json({ 
      success: true, 
      message: "Login successful",
      user: {
        username: user.username,
        country: user.country,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username }).select('+plainPassword');
    
    if (!user) {
      return res.status(404).json({ error: 'No account found with that username' });
    }

    res.json({ 
      success: true,
      password: user.plainPassword
    });
  } catch (err) {
    res.status(500).json({ error: 'Password retrieval failed' });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOne({ username }).select('-password -plainPassword');
    if (!user) {
      return res.status(404).json({ error: "You are not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error fetching your details" });
  }
});

app.put("/api/users/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { country, phone, password } = req.body;

    const updateData = { country, phone };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
      updateData.plainPassword = password;
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      updateData,
      { new: true }
    ).select('-password -plainPassword');

    if (!updatedUser) {
      return res.status(404).json({ error: "You are not found" });
    }

    res.json({ 
      success: true,
      message: "Your data is updated successfully",
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: "Can not updating your details" });
  }
});

app.delete("/api/users/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const deletedUser = await User.findOneAndDelete({ username });
    if (!deletedUser) {
      return res.status(404).json({ error: "You are not found" });
    }

    res.json({ 
      success: true,
      message: "Your Account is deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ error: "Can not delete your account" });
  }
});
/*
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});*/

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});