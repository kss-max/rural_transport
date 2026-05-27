const User = require('../models/User');

async function getUsers() {
  return await User.find().select('-password');
}

async function findUserByEmail(email) {
  if (!email) return null;
  return await User.findOne({ email: email.toLowerCase() });
}

async function findUserById(id) {
  return await User.findById(id);
}

async function createUser({ email, passwordHash, role }) {
  const newUser = new User({
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'USER'
  });
  
  await newUser.save();
  return newUser;
}

module.exports = {
  getUsers,
  findUserByEmail,
  findUserById,
  createUser,
}
