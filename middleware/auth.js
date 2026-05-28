const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    const error = new Error('Access denied. No token provided.');
    error.status = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_social_media_token_2026_xyz');
    req.user = decoded; // Contains id, username, email
    next();
  } catch (ex) {
    const error = new Error('Invalid token.');
    error.status = 401;
    return next(error);
  }
};
