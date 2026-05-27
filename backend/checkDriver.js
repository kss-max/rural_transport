require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: 'kskulal23@gmail.com' });
  console.log('User:', user);
  
  const driver = await Driver.findOne({ userId: user._id });
  console.log('Driver:', driver);
  
  if (!driver) {
    console.log('\n⚠️ No driver record found! Creating one...');
    const newDriver = new Driver({
      userId: user._id,
      email: user.email,
      vehicleNumber: 'KA-21-AB-1234',
      licenseNumber: 'DL-123456789',
      phoneNumber: '9876543210',
      isActive: true
    });
    await newDriver.save();
    console.log('✅ Driver created:', newDriver);
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
