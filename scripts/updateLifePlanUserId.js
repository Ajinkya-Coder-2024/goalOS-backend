const dotenv = require('dotenv');
const mongoose = require('mongoose');
const LifePlan = require('../src/models/LifePlan');

dotenv.config();

const [,, lifePlanId, newUserId] = process.argv;

if (!lifePlanId || !newUserId) {
  console.error('Usage: node scripts/updateLifePlanUserId.js <lifePlanId> <newUserId>');
  process.exit(1);
}

const updateLifePlanUserId = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const plan = await LifePlan.findById(lifePlanId);
    if (!plan) {
      throw new Error(`LifePlan not found for id: ${lifePlanId}`);
    }

    const previousUserId = plan.user?.toString();
    plan.user = newUserId;
    await plan.save();

    console.log(`Updated LifePlan ${lifePlanId} user from ${previousUserId} to ${newUserId}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('LifePlan user id update failed:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

updateLifePlanUserId();
