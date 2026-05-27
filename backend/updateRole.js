const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateRole() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rural_transport';
  await mongoose.connect(uri);
  
  const result = await User.updateOne(
    { email: 'kskulal23@gmail.com' },
    { $set: { role: 'DRIVER' } }
  );
  
  console.log('Updated:', result);
  
  const user = await User.findOne({ email: 'kskulal23@gmail.com' });
  console.log('User now:', user);
  
  await mongoose.disconnect();
}

updateRole().catch(console.error);
