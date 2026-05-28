const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateCreatePost, validateAddComment } = require('../middleware/validation');

// @route   POST /api/posts
// @desc    Create a new text post with optional image URL
// @access  Private
router.post('/', auth, validateCreatePost, async (req, res, next) => {
  const { content, imageUrl } = req.body;

  try {
    const newPost = new Post({
      authorId: req.user.id,
      content,
      imageUrl: imageUrl || null
    });

    await newPost.save();

    // Populate author details to send back in response
    const populatedPost = await Post.findById(newPost._id)
      .populate('authorId', 'username avatarUrl');

    // Safe formatting for the frontend (authorId -> author)
    const postObj = populatedPost.toObject();
    postObj.author = postObj.authorId;

    res.status(201).json({ post: postObj });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/posts
// @desc    Get explore feed (all posts), paginated
// @access  Public
router.get('/', async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format all posts safely for frontend expectations
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

// @route   GET /api/posts/:id
// @desc    Get post detail by ID along with its comment thread
// @access  Public
router.get('/:id', async (req, res, next) => {
  const postId = req.params.id;

  try {
    // 1. Fetch post and populate author details
    const post = await Post.findById(postId).populate('authorId', 'username avatarUrl');
    if (!post) {
      const error = new Error('Post not found.');
      error.status = 404;
      return next(error);
    }

    // 2. Fetch associated comments, populate comment authors, and sort chronologically
    const comments = await Comment.find({ postId })
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: 1 });

    // Format post object to include 'author' envelope mapping for frontend
    const postObj = post.toObject();
    postObj.author = postObj.authorId;

    // Format comments to include 'author' envelope mapping for frontend
    const formattedComments = comments.map(comment => {
      const obj = comment.toObject();
      obj.author = obj.authorId;
      return obj;
    });

    res.status(200).json({
      post: postObj,
      comments: formattedComments
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/posts/:id OR /api/comments/:id
// @desc    Delete post or comment depending on req.baseUrl context (both mapped to DELETE /:id)
// @access  Private
router.delete('/:id', auth, async (req, res, next) => {
  const resourceId = req.params.id;
  const isCommentRoute = req.baseUrl.startsWith('/api/comments');

  try {
    if (isCommentRoute) {
      // 1. Comment Deletion
      const comment = await Comment.findById(resourceId);
      if (!comment) {
        const error = new Error('Comment not found.');
        error.status = 404;
        return next(error);
      }

      // Check authorization (only the author of the comment may delete it)
      if (comment.authorId.toString() !== req.user.id) {
        const error = new Error('Access denied. You can only delete your own comments.');
        error.status = 403;
        return next(error);
      }

      await Comment.findByIdAndDelete(resourceId);
      res.status(200).json({ message: 'Deleted successfully' });
    } else {
      // 2. Post Deletion
      const post = await Post.findById(resourceId);
      if (!post) {
        const error = new Error('Post not found.');
        error.status = 404;
        return next(error);
      }

      // Check authorization (only the author of the post may delete it)
      if (post.authorId.toString() !== req.user.id) {
        const error = new Error('Access denied. You can only delete your own posts.');
        error.status = 403;
        return next(error);
      }

      // Delete the post itself
      await Post.findByIdAndDelete(resourceId);
      
      // Cascade delete: delete all associated comments
      await Comment.deleteMany({ postId: resourceId });

      res.status(200).json({ message: 'Deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/posts/:id/like
// @desc    Toggle post like (idempotent, returns updated count and likes list)
// @access  Private
router.post('/:id/like', auth, async (req, res, next) => {
  const postId = req.params.id;
  const currentUserId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found.');
      error.status = 404;
      return next(error);
    }

    const likeIndex = post.likes.indexOf(currentUserId);
    let isLiked = false;

    if (likeIndex > -1) {
      // Already liked, remove user ID (unlike)
      post.likes.splice(likeIndex, 1);
    } else {
      // Not liked yet, add user ID (like)
      post.likes.push(currentUserId);
      isLiked = true;
    }

    await post.save();

    res.status(200).json({
      likeCount: post.likes.length,
      likes: post.likes,
      isLiked
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add comment to a post
// @access  Private
router.post('/:id/comments', auth, validateAddComment, async (req, res, next) => {
  const postId = req.params.id;
  const { content } = req.body;

  try {
    // Check if target post exists
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found.');
      error.status = 404;
      return next(error);
    }

    const newComment = new Comment({
      postId,
      authorId: req.user.id,
      content
    });

    await newComment.save();

    // Populate author details to send back in response
    const populatedComment = await Comment.findById(newComment._id)
      .populate('authorId', 'username avatarUrl');

    // Format safely
    const commentObj = populatedComment.toObject();
    commentObj.author = commentObj.authorId;

    res.status(201).json({ comment: commentObj });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/posts/:id/comments
// @desc    Get comment thread for a specific post
// @access  Public
router.get('/:id/comments', async (req, res, next) => {
  const postId = req.params.id;

  try {
    const comments = await Comment.find({ postId })
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: 1 });

    const formattedComments = comments.map(comment => {
      const obj = comment.toObject();
      obj.author = obj.authorId;
      return obj;
    });

    res.status(200).json({ comments: formattedComments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
