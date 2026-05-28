const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { validateUpdateProfile } = require('../middleware/validation');

// @route   GET /api/users
// @desc    Get all users for user discovery (Explore feed), paginated
// @access  Public
router.get('/', async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const totalUsers = await User.countDocuments();
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/users/:username
// @desc    Get public user profile detail by username
// @access  Public
router.get('/:username', async (req, res, next) => {
  const usernameQuery = req.params.username;

  try {
    // Perform case-insensitive search for username
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${usernameQuery}$`, 'i') } 
    }).select('-passwordHash');

    if (!user) {
      const error = new Error('User not found.');
      error.status = 404;
      return next(error);
    }

    // Get stats
    const followerCount = user.followers.length;
    const followingCount = user.following.length;

    // Get posts written by this user
    const posts = await Post.find({ authorId: user._id })
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      user,
      followerCount,
      followingCount,
      posts
    });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/users/me
// @desc    Update authenticated user's profile info
// @access  Private
router.patch('/me', auth, validateUpdateProfile, async (req, res, next) => {
  const { bio, avatarUrl } = req.body;
  const updates = {};

  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      const error = new Error('User not found.');
      error.status = 404;
      return next(error);
    }

    res.status(200).json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user (idempotent database guard via $addToSet)
// @access  Private
router.post('/:id/follow', auth, async (req, res, next) => {
  const targetId = req.params.id;
  const currentUserId = req.user.id;

  if (targetId === currentUserId) {
    const error = new Error('You cannot follow yourself.');
    error.status = 400;
    return next(error);
  }

  try {
    // 1. Verify target user exists
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      const error = new Error('Target user not found.');
      error.status = 404;
      return next(error);
    }

    // 2. Perform idempotent follow updates using $addToSet
    // Add targetId to current user's following list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetId }
    });

    // Add currentUserId to target user's followers list
    await User.findByIdAndUpdate(targetId, {
      $addToSet: { followers: currentUserId }
    });

    // Fetch and return the updated current user
    const updatedUser = await User.findById(currentUserId).select('-passwordHash');

    res.status(200).json({ 
      message: 'Followed successfully',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/users/:id/unfollow
// @desc    Unfollow a user using $pull
// @access  Private
router.post('/:id/unfollow', auth, async (req, res, next) => {
  const targetId = req.params.id;
  const currentUserId = req.user.id;

  try {
    // 1. Verify target user exists
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      const error = new Error('Target user not found.');
      error.status = 404;
      return next(error);
    }

    // 2. Remove follow links using $pull
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetId }
    });

    await User.findByIdAndUpdate(targetId, {
      $pull: { followers: currentUserId }
    });

    // Fetch and return the updated current user
    const updatedUser = await User.findById(currentUserId).select('-passwordHash');

    res.status(200).json({ 
      message: 'Unfollowed successfully',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
