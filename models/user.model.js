const mongoose = require('mongoose');

// Define a schema for the user model
const userSchema = new mongoose.Schema({
  title: String,
  name: String,
  lastName: String,
  email: String,
  number: String,
  password: String,
  country: String,
  username: String,
  googleId: String,
  verificationToken: String,
  isVerified: { type: Boolean, default: false },
});

// Create a user model based on the schema
const User = mongoose.model('User', userSchema);
module.exports = User;
