// scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Load Models
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database successfully.');

    // Clear existing data
    console.log('Cleaning existing collections...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    console.log('Collections cleared.');

    // Create Hashed Passwords
    const defaultPassword = 'password123';
    console.log('Hashing default passwords...');
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Mock Users
    console.log('Creating mock users...');
    const usersData = [
      {
        username: 'aurora',
        email: 'aurora@nocturne.app',
        passwordHash,
        bio: 'Digital artist & glassmorphism enthusiast. Designing the future of dark interfaces. ✨🎨',
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=aurora'
      },
      {
        username: 'orion',
        email: 'orion@nocturne.app',
        passwordHash,
        bio: 'Full stack developer & open-source contributor. I write code that doesn\'t sleep. 💻🚀',
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=orion'
      },
      {
        username: 'nova',
        email: 'nova@nocturne.app',
        passwordHash,
        bio: 'Tech journalist, coffee lover, and nighttime thinker. Exploring the interface of human and machine. ☕🌌',
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=nova'
      },
      {
        username: 'zephyr',
        email: 'zephyr@nocturne.app',
        passwordHash,
        bio: 'Traveler, photographer, and minimalism advocate. Capturing shadows and light across continents. 📷🌍',
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=zephyr'
      }
    ];

    const users = await User.insertMany(usersData);
    console.log(`Created ${users.length} mock users.`);

    const [aurora, orion, nova, zephyr] = users;

    // Establish Follows
    console.log('Setting up follow relationships...');
    // aurora follows orion, nova
    aurora.following.push(orion._id, nova._id);
    orion.followers.push(aurora._id);
    nova.followers.push(aurora._id);

    // orion follows aurora, zephyr
    orion.following.push(aurora._id, zephyr._id);
    aurora.followers.push(orion._id);
    zephyr.followers.push(orion._id);

    // nova follows aurora, orion, zephyr
    nova.following.push(aurora._id, orion._id, zephyr._id);
    aurora.followers.push(nova._id);
    orion.followers.push(nova._id);
    zephyr.followers.push(nova._id);

    // zephyr follows nova
    zephyr.following.push(nova._id);
    nova.followers.push(zephyr._id);

    await Promise.all([
      aurora.save(),
      orion.save(),
      nova.save(),
      zephyr.save()
    ]);
    console.log('Follow relationships updated.');

    // Mock Posts
    console.log('Creating mock posts...');
    const postsData = [
      {
        authorId: aurora._id,
        content: 'Just finished the design system tokens for Nocturne! Glassmorphism combined with deep velvet indigo works so well. What do you think? 🔮🌌',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
        likes: [orion._id, nova._id]
      },
      {
        authorId: orion._id,
        content: 'Spent the night migrating user sessions to secure httpOnly, SameSite=Strict cookies. JWTs in localStorage are officially legacy! Security first. 🔒💻',
        imageUrl: null,
        likes: [aurora._id, nova._id, zephyr._id]
      },
      {
        authorId: nova._id,
        content: 'Late night thoughts: Are we building interfaces for humans, or are we conditioning humans to fit our interfaces? The future of UX is organic. 🌱🧠',
        imageUrl: null,
        likes: [zephyr._id]
      },
      {
        authorId: zephyr._id,
        content: 'Chasing shadows in the cyberpunk alleyways of Tokyo. The city never sleeps, and neither does the light. 🗼✨',
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
        likes: [nova._id, aurora._id]
      },
      {
        authorId: orion._id,
        content: 'Just open-sourced a custom middleware stack for real-time traffic filtering in Express. Feels great to give back to the dev community! 🚀📦',
        imageUrl: null,
        likes: [aurora._id]
      },
      {
        authorId: aurora._id,
        content: 'Gradients are the music of web design. They blend distinct hues into a unified visual harmony. 🎶🌈',
        imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop',
        likes: [orion._id]
      }
    ];

    const posts = await Post.insertMany(postsData);
    console.log(`Created ${posts.length} mock posts.`);

    // Mock Comments
    console.log('Creating mock comments...');
    const commentsData = [
      {
        postId: posts[0]._id, // Aurora's design post
        authorId: orion._id,
        content: 'The frosted glass card aesthetic is incredible, Aurora! Feels extremely premium. 🙌'
      },
      {
        postId: posts[0]._id, // Aurora's design post
        authorId: nova._id,
        content: 'Agreed! That subtle border glow makes all the difference.'
      },
      {
        postId: posts[1]._id, // Orion's cookie security post
        authorId: aurora._id,
        content: 'Security is the ultimate feature. Thank you for implementing this! 🔒👏'
      },
      {
        postId: posts[2]._id, // Nova's thoughts post
        authorId: zephyr._id,
        content: 'Fascinating perspective, Nova. We shape our tools, and thereafter our tools shape us.'
      },
      {
        postId: posts[3]._id, // Zephyr's Tokyo post
        authorId: nova._id,
        content: 'This shot is breathtaking, Zephyr! The neon reflections are perfect.'
      }
    ];

    const comments = await Comment.insertMany(commentsData);
    console.log(`Created ${comments.length} mock comments.`);

    console.log('Database seeded successfully! 🎉');
    console.log('\nAvailable Test Users (all passwords are "password123"):');
    users.forEach(u => {
      console.log(`- Username: ${u.username} | Email: ${u.email}`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
