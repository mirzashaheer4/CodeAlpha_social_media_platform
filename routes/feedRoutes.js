const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// @route   GET /api/feed
// @desc    Get home feed (posts from followed users), paginated
// @access  Private
router.get('/', auth, async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    // 1. Fetch current user's followings
    const user = await User.findById(req.user.id);
    if (!user) {
      const error = new Error('Authenticated user not found.');
      error.status = 404;
      return next(error);
    }

    const followedUserIds = user.following;

    // 2. Count total posts from followed users
    const totalPosts = await Post.countDocuments({ authorId: { $in: followedUserIds } });

    // 3. Retrieve posts from followed users
    const posts = await Post.find({ authorId: { $in: followedUserIds } })
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format all posts safely for frontend (authorId -> author)
    const formattedPosts = posts.map(post => {
      const obj = post.toObject();
      obj.author = obj.authorId;
      return obj;
    });

    res.status(200).json({
      posts: formattedPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
