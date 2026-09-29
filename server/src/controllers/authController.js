const User = require("../models/User");
const Patient = require("../models/Patient");
const generateToken = require("../utils/generateToken");

async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are all required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
    hasPatientProfile: false,
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  const match = user ? await user.comparePassword(password) : false;
  if (!user || !match) {
    // Deliberately the same message either way, so login can't be used to
    // probe which emails have accounts.
    return res.status(401).json({ message: "Email or password is incorrect." });
  }

  const token = generateToken(user._id);
  const patient = await Patient.findOne({ user: user._id }).select("questionnaireCompleted");

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
    hasPatientProfile: Boolean(patient?.questionnaireCompleted),
  });
}

async function me(req, res) {
  const patient = await Patient.findOne({ user: req.user._id }).select("questionnaireCompleted");
  res.json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email },
    hasPatientProfile: Boolean(patient?.questionnaireCompleted),
  });
}

module.exports = { signup, login, me };
