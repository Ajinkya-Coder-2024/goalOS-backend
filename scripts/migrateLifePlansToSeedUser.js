const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const LifePlan = require('../src/models/LifePlan');

dotenv.config();

const SOURCE_USER_ID = '68a9cb90107a8fa58d1e4435';
const TARGET_EMAIL = 'ajinkya.inchanalkar2001@gmail.com';

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const targetUser = await User.findOne({ email: TARGET_EMAIL }).select('_id email');
    if (!targetUser) {
      throw new Error(`Target user not found for email: ${TARGET_EMAIL}`);
    }

    const result = await LifePlan.updateMany(
      { user: SOURCE_USER_ID },
      { $set: { user: targetUser._id } }
    );

    const totalForTarget = await LifePlan.countDocuments({ user: targetUser._id });

    console.log(`Migrated plans: ${result.modifiedCount}`);
    console.log(`Target user id: ${targetUser._id}`);
    console.log(`Total plans for target user: ${totalForTarget}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Life plan migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
