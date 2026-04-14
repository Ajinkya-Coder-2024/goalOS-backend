const dotenv = require('dotenv');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

dotenv.config();

const DEFAULT_EMAIL = 'ajinkya.inchanalkar2001@gmail.com';
const DEFAULT_PASSWORD = 'india@11';
const DEFAULT_USERNAME = 'ajinkya';

const seedUser = async () => {
  try {
    await connectDB();

    const email = process.env.SEED_USER_EMAIL || DEFAULT_EMAIL;
    const password = process.env.SEED_USER_PASSWORD || DEFAULT_PASSWORD;
    const username = process.env.SEED_USER_USERNAME || DEFAULT_USERNAME;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.username = username;
      existingUser.password = password;
      await existingUser.save();

      console.log(`Updated existing user: ${email}`);
    } else {
      await User.create({
        username,
        email,
        password
      });

      console.log(`Created new user: ${email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('User seeding failed:', error.message);
    process.exit(1);
  }
};

seedUser();
