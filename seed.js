require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Market = require('./models/Market');
const Bet = require('./models/Bet');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prediction-market');
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Market.deleteMany({});
  await Bet.deleteMany({});

  // Create admin user (password: admin123)
  const admin = await User.create({
    username: 'admin',
    email: 'admin@predictit.com',
    password: 'admin123',
    role: 'admin',
    points: 9999
  });

  // Create regular users (password: user123)
  const alice = await User.create({ username: 'alice', email: 'alice@example.com', password: 'user123', points: 1000 });
  const bob = await User.create({ username: 'bob', email: 'bob@example.com', password: 'user123', points: 1000 });

  // Create markets
  const m1 = await Market.create({
    title: 'Will AI surpass human-level reasoning by end of 2025?',
    description: 'Resolves YES if a major AI lab (OpenAI, Anthropic, Google) announces a model that demonstrably passes a comprehensive human reasoning benchmark by December 31, 2025.',
    category: 'technology',
    closesAt: new Date('2025-12-31'),
    createdBy: admin._id
  });

  const m2 = await Market.create({
    title: 'Will the global average temperature in 2025 be a record high?',
    description: 'Resolves YES if 2025 is confirmed as the hottest year on record by NASA or NOAA by March 2026.',
    category: 'science',
    closesAt: new Date('2026-03-01'),
    createdBy: admin._id
  });

  const m3 = await Market.create({
    title: 'Will a major streaming platform launch in Lebanon in 2025?',
    description: 'Resolves YES if Netflix, Disney+, or another major platform officially launches a Lebanon-specific tier in 2025.',
    category: 'entertainment',
    closesAt: new Date('2025-12-31'),
    createdBy: admin._id
  });

  // Place some bets
  await Bet.create({ user: alice._id, market: m1._id, prediction: 'YES', amount: 200 });
  await Bet.create({ user: bob._id, market: m1._id, prediction: 'NO', amount: 150 });
  await Market.findByIdAndUpdate(m1._id, {
    $inc: { totalYesPoints: 200, totalNoPoints: 150 },
    $addToSet: { participants: [alice._id, bob._id] }
  });
  await User.findByIdAndUpdate(alice._id, { $inc: { points: -200 } });
  await User.findByIdAndUpdate(bob._id, { $inc: { points: -150 } });

  console.log('✅ Seed complete!');
  console.log('Admin: admin@predictit.com / admin123');
  console.log('User: alice@example.com / user123');
  console.log('User: bob@example.com / user123');
  await mongoose.disconnect();
}

seed().catch(console.error);
