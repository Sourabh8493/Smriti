const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/*
  The caretaker/doctor account. A User owns exactly one Patient for now (see
  Patient.user's unique index) — multi-patient caretaker accounts are a
  reasonable future extension, not something the current UI needs.
*/
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false so a normal find() never accidentally leaks the hash —
    // login explicitly opts back in with .select('+password').
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
