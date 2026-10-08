const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Challenge = require('../src/models/challengeModel');

dotenv.config();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toMidnightUtc = (date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

const formatDate = (date) => {
  const day = String(date.getUTCDate());
  const month = String(date.getUTCMonth() + 1);
  const year = String(date.getUTCFullYear());
  return `${day}-${month}-${year}`;
};

const shiftDateText = (text, dayOffset) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text.replace(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/g, (full, day, month, year) => {
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (Number.isNaN(parsed.getTime())) {
      return full;
    }

    const shifted = addDays(parsed, dayOffset);
    return formatDate(shifted);
  });
};

const shiftDateField = (value, dayOffset) => {
  if (!value) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return addDays(parsed, dayOffset);
};

const shiftChallengeDates = (challenge, dayOffset) => {
  challenge.startDate = shiftDateField(challenge.startDate, dayOffset);
  challenge.endDate = shiftDateField(challenge.endDate, dayOffset);
  challenge.description = shiftDateText(challenge.description, dayOffset);

  if (!Array.isArray(challenge.sections)) {
    return;
  }

  challenge.sections.forEach((section) => {
    section.description = shiftDateText(section.description, dayOffset);

    if (!Array.isArray(section.subjects)) {
      return;
    }

    section.subjects.forEach((subject) => {
      subject.startDate = shiftDateField(subject.startDate, dayOffset);
      subject.endDate = shiftDateField(subject.endDate, dayOffset);
      subject.description = shiftDateText(subject.description, dayOffset);
    });
  });
};

const getChallengeQuery = () => {
  const challengeId = process.env.CHALLENGE_ID;
  const challengeName = process.env.CHALLENGE_NAME;

  if (challengeId) {
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw new Error('Invalid CHALLENGE_ID format');
    }
    return { _id: challengeId, isDeleted: false };
  }

  if (challengeName) {
    return { name: challengeName, isDeleted: false };
  }

  throw new Error('Set CHALLENGE_ID or CHALLENGE_NAME in environment');
};

const parseTargetStartDate = () => {
  const targetDateText = process.env.TARGET_START_DATE;
  if (!targetDateText) {
    return null;
  }

  const parsed = new Date(targetDateText);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid TARGET_START_DATE format. Use ISO date like 2026-05-25');
  }

  return toMidnightUtc(parsed);
};

const getTargetConfig = (oldStartDate) => {
  const dayOffsetText = process.env.DAY_OFFSET;
  const targetStartUtc = parseTargetStartDate();

  if (dayOffsetText !== undefined && dayOffsetText !== '') {
    const offset = Number(dayOffsetText);
    if (Number.isNaN(offset)) {
      throw new Error('Invalid DAY_OFFSET value. Must be a number.');
    }

    return {
      dayOffset: Math.round(offset),
      newStartUtc: toMidnightUtc(oldStartDate) + Math.round(offset) * MS_PER_DAY
    };
  }

  if (targetStartUtc !== null) {
    return {
      dayOffset: Math.round((targetStartUtc - toMidnightUtc(oldStartDate)) / MS_PER_DAY),
      newStartUtc: targetStartUtc
    };
  }

  const fallbackDate = new Date(Date.UTC(2026, 4, 12)); // 12th May 2026
  return {
    dayOffset: Math.round((toMidnightUtc(fallbackDate) - toMidnightUtc(oldStartDate)) / MS_PER_DAY),
    newStartUtc: toMidnightUtc(fallbackDate)
  };
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const query = getChallengeQuery();
    const challenge = await Challenge.findOne(query);

    if (!challenge) {
      throw new Error('Challenge not found for given CHALLENGE_ID/CHALLENGE_NAME');
    }

    if (!challenge.startDate) {
      throw new Error('Challenge does not have startDate, unable to calculate offset');
    }

    const oldStartDate = new Date(challenge.startDate);
    const { dayOffset, newStartUtc } = getTargetConfig(oldStartDate);
    const newStartDate = new Date(newStartUtc);

    shiftChallengeDates(challenge, dayOffset);
    await challenge.save();

    console.log(`Challenge updated: ${challenge.name} (${challenge._id})`);
    console.log(`Old start date: ${formatDate(oldStartDate)}`);
    console.log(`New start date: ${formatDate(newStartDate)}`);
    console.log(`Shifted by days: ${dayOffset}`);
    console.log('Date fields and description date text updated successfully.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Reschedule challenge failed:', error.message);
    process.exit(1);
  }
};

run();
