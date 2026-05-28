const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 1. Helmet Security Headers with custom Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["*", "data:"], // Explicitly allow wildcard user-provided images and base64 SVGs
      connectSrc: ["'self'"]
    }
  }
}));

// 2. Strict CORS restrictions with credentials support for HttpOnly cookies
// Allowlist CORS origins (sanitize trailing slashes from environment variable)
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : null;
const allowedOrigins = [
  clientUrl,
  'http://127.0.0.1:3000',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // allow curl/postman/server-side requests with no origin
    if (!origin) return callback(null, true);

    // Allow any localhost/127.0.0.1 origin on any port for development
    const localhostRegex = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;
    if (localhostRegex.test(origin)) return callback(null, true);

    // Fall back to explicit allowlist
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// 3. Request parsers
app.use(express.json());
app.use(cookieParser());

// 4. Logging - Development environment only
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// 5. Serve static files from frontend public folder
app.use(express.static('public'));

// 6. Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/postRoutes')); // Approach A: mount same post router under comments base path
app.use('/api/feed', require('./routes/feedRoutes'));

// 7. Global Error Handler (Last Middleware in the stack)
app.use(require('./middleware/error'));

const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_media';

mongoose.connect(DB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB database.');
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error occurred:', err);
    process.exit(1);
  });
