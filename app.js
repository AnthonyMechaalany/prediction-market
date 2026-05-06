require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const path = require('path');
const cron = require('node-cron');
const Market = require('./models/Market');

const authRoutes = require('./routes/authRoutes');
const marketRoutes = require('./routes/marketRoutes');
const betRoutes = require('./routes/betRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prediction-market')
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Start cron only after DB is ready
    cron.schedule('* * * * *', async () => {
      try {
        const result = await Market.updateMany(
          { status: 'open', closesAt: { $lte: new Date() } },
          { $set: { status: 'closed' } }
        );
        if (result.modifiedCount > 0) {
          console.log(`🕐 Auto-closed ${result.modifiedCount} expired market(s)`);
        }
      } catch (err) {
        console.error('Cron error:', err.message);
      }
    });

  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/markets', marketRoutes);
app.use('/bets', betRoutes);
app.use('/users', userRoutes);
app.use('/', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));