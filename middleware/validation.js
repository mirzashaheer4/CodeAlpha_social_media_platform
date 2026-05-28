module.exports = {
  validateRegister: (req, res, next) => {
    const { username, email, password } = req.body;
    const fields = [];

    if (!username || username.trim().length < 3 || !/^[a-zA-Z0-9]+$/.test(username)) {
      fields.push({ field: 'username', message: 'Username is required, must be at least 3 characters and alphanumeric only.' });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      fields.push({ field: 'email', message: 'A valid email address is required.' });
    }

    if (!password || password.length < 8) {
      fields.push({ field: 'password', message: 'Password is required and must be at least 8 characters long.' });
    }

    if (fields.length > 0) {
      const error = new Error('Validation failed');
      error.status = 422;
      error.fields = fields;
      return next(error);
    }

    next();
  },

  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    const fields = [];

    if (!email) {
      fields.push({ field: 'email', message: 'Email is required.' });
    }
    if (!password) {
      fields.push({ field: 'password', message: 'Password is required.' });
    }

    if (fields.length > 0) {
      const error = new Error('Validation failed');
      error.status = 422;
      error.fields = fields;
      return next(error);
    }

    next();
  },

  validateCreatePost: (req, res, next) => {
    const { content } = req.body;
    const fields = [];

    if (!content || content.trim().length === 0) {
      fields.push({ field: 'content', message: 'Post content is required.' });
    } else if (content.length > 280) {
      fields.push({ field: 'content', message: 'Post content cannot exceed 280 characters.' });
    }

    if (fields.length > 0) {
      const error = new Error('Validation failed');
      error.status = 422;
      error.fields = fields;
      return next(error);
    }

    next();
  },

  validateAddComment: (req, res, next) => {
    const { content } = req.body;
    const fields = [];

    if (!content || content.trim().length === 0) {
      fields.push({ field: 'content', message: 'Comment content is required.' });
    } else if (content.length > 500) {
      fields.push({ field: 'content', message: 'Comment content cannot exceed 500 characters.' });
    }

    if (fields.length > 0) {
      const error = new Error('Validation failed');
      error.status = 422;
      error.fields = fields;
      return next(error);
    }

    next();
  },

  validateUpdateProfile: (req, res, next) => {
    const { bio, avatarUrl } = req.body;
    const fields = [];

    if (bio === undefined && avatarUrl === undefined) {
      fields.push({ field: 'profile', message: 'At least one of bio or avatarUrl must be provided for profile updates.' });
    }

    if (bio !== undefined && bio.length > 200) {
      fields.push({ field: 'bio', message: 'Bio cannot exceed 200 characters.' });
    }

    if (avatarUrl !== undefined && avatarUrl.trim().length > 0) {
      // Basic URL verification
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
      if (!urlRegex.test(avatarUrl)) {
        fields.push({ field: 'avatarUrl', message: 'Provided avatarUrl must be a valid URL format.' });
      }
    }

    if (fields.length > 0) {
      const error = new Error('Validation failed');
      error.status = 422;
      error.fields = fields;
      return next(error);
    }

    next();
  }
};
