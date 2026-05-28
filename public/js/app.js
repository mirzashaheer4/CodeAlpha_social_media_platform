// public/js/app.js
// Main application orchestration layer.
// Handles SPA routing, in-memory state caching, DOM event delegation, dynamic rendering, and session rehydration.

// 1. GLOBAL APP STATE
let currentUser = null;
let activeView = 'auth';
let feedPage = 1;
let explorePage = 1;
let currentProfileUsername = null;
let currentPostId = null;

// 2. DOM CONTENT LOADED EVENT
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// 3. INITIALIZATION & REHYDRATION
async function initApp() {
  bindGlobalEvents();
  
  // Rehydrate Session immediately
  try {
    const data = await window.api.getMe();
    if (data?.user) {
      currentUser = data.user;
      showToast('Welcome back!', 'success');
      
      // Default to feed if logged in and accessing auth
      const currentHash = window.location.hash;
      if (!currentHash || currentHash === '#/auth' || currentHash === '') {
        window.location.hash = '#/feed';
      }
    } else {
      window.location.hash = '#/auth';
    }
  } catch (err) {
    // No valid session, redirect to auth
    currentUser = null;
    window.location.hash = '#/auth';
  }

  // Set up SPA router
  handleRouting();
  window.addEventListener('hashchange', handleRouting);
}

// 4. SPA ROUTER
async function handleRouting() {
  const hash = window.location.hash || '#/feed';
  
  // Clean active states on navigation links
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => el.classList.remove('active'));

  // Auth Guard
  if (!currentUser && hash !== '#/auth') {
    window.location.hash = '#/auth';
    return;
  }

  if (hash === '#/auth') {
    if (currentUser) {
      window.location.hash = '#/feed';
      return;
    }
    switchView('auth');
    return;
  }

  // Display the layout shell since the user is verified
  document.getElementById('app-wrapper').classList.remove('hidden');
  document.getElementById('auth-view').classList.add('hidden');

  // Route matches
  if (hash === '#/feed') {
    updateActiveNav('feed');
    switchView('feed-view');
    loadFeed(1);
  } 
  else if (hash === '#/explore') {
    updateActiveNav('explore');
    switchView('explore-view');
    loadExplore(1);
  } 
  else if (hash === '#/profile') {
    // Current user's own profile redirect
    if (currentUser) {
      window.location.hash = `#/profile/${currentUser.username}`;
    }
  } 
  else if (hash.startsWith('#/profile/')) {
    const parts = hash.split('/');
    const username = parts[2];
    updateActiveNav('profile');
    switchView('profile-view');
    loadUserProfile(username);
  } 
  else if (hash.startsWith('#/post/')) {
    const parts = hash.split('/');
    const postId = parts[2];
    switchView('post-detail-view');
    loadPostDetail(postId);
  } 
  else {
    // Fallback
    window.location.hash = '#/feed';
  }
}

// Helper to update active nav state
function updateActiveNav(viewName) {
  const desktopNav = document.getElementById(`nav-${viewName}`);
  const mobileNav = document.getElementById(`mobile-nav-${viewName}`);
  if (desktopNav) desktopNav.classList.add('active');
  if (mobileNav) mobileNav.classList.add('active');
}

// Toggle display of view sections
function switchView(viewId) {
  if (viewId === 'auth') {
    document.getElementById('app-wrapper').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('hidden');
    return;
  }

  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.add('hidden');
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove('hidden');
    // Scroll top seamlessly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update layout user elements
  if (currentUser) {
    document.getElementById('nav-username').textContent = currentUser.username;
    document.getElementById('nav-avatar').src = currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default';
    document.getElementById('composer-avatar').src = currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default';
  }
}

// 5. GLOBAL EVENT BINDINGS
function bindGlobalEvents() {
  // Auth Tab Toggles
  document.getElementById('btn-tab-login').addEventListener('click', (e) => {
    e.target.classList.add('auth-tabactive');
    document.getElementById('btn-tab-register').classList.remove('auth-tabactive');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
  });

  document.getElementById('btn-tab-register').addEventListener('click', (e) => {
    e.target.classList.add('auth-tabactive');
    document.getElementById('btn-tab-login').classList.remove('auth-tabactive');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
  });

  // Login Submit
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const data = await window.api.login({ email, password });
      currentUser = data.user;
      showToast('Logged in successfully', 'success');
      e.target.reset();
      window.location.hash = '#/feed';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Register Submit
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
      const data = await window.api.register({ username, email, password });
      currentUser = data.user;
      showToast('Account registered successfully', 'success');
      e.target.reset();
      window.location.hash = '#/feed';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Logout actions
  const triggerLogout = async () => {
    try {
      await window.api.logout();
      currentUser = null;
      showToast('Logged out', 'success');
      window.location.hash = '#/auth';
    } catch (err) {
      showToast('Failed to logout', 'error');
    }
  };
  document.getElementById('btn-logout').addEventListener('click', triggerLogout);
  document.getElementById('mobile-logout-btn').addEventListener('click', triggerLogout);

  // Post composer submit
  document.getElementById('post-composer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('composer-content').value;
    const imageUrl = document.getElementById('composer-image').value;
    try {
      const data = await window.api.createPost({ content, imageUrl });
      showToast('Post created successfully!', 'success');
      e.target.reset();
      document.getElementById('char-counter').textContent = '280';
      // Load feed page 1 to show the new post
      loadFeed(1);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Post composer character count listener
  document.getElementById('composer-content').addEventListener('input', (e) => {
    const remaining = 280 - e.target.value.length;
    document.getElementById('char-counter').textContent = remaining;
  });

  // Edit Profile Modal Toggles
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bio = document.getElementById('edit-bio').value;
    const avatarUrl = document.getElementById('edit-avatar').value;
    try {
      const data = await window.api.updateProfile({ bio, avatarUrl });
      currentUser = data.user;
      showToast('Profile updated!', 'success');
      closeModal();
      // Reload current profile page
      loadUserProfile(currentUser.username);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Back button for detail thread view
  document.getElementById('btn-back-to-feed').addEventListener('click', () => {
    window.history.back();
  });

  // Comment Form Submit
  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const commentInput = document.getElementById('comment-input');
    const content = commentInput.value;
    if (!currentPostId) return;

    try {
      await window.api.addComment(currentPostId, content);
      showToast('Comment added!', 'success');
      commentInput.value = '';
      // Reload detail view to show new comment
      loadPostDetail(currentPostId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Pagination Glicks Feed
  document.getElementById('btn-feed-prev').addEventListener('click', () => {
    if (feedPage > 1) loadFeed(feedPage - 1);
  });
  document.getElementById('btn-feed-next').addEventListener('click', () => {
    loadFeed(feedPage + 1);
  });

  // Pagination Explore
  document.getElementById('btn-explore-prev').addEventListener('click', () => {
    if (explorePage > 1) loadExplore(explorePage - 1);
  });
  document.getElementById('btn-explore-next').addEventListener('click', () => {
    loadExplore(explorePage + 1);
  });

  // Dynamic Delegated Clicks (Likes, Comments navigators, follow buttons, delete actions)
  document.addEventListener('click', handleDynamicClicks);
}

// 6. DYNAMIC DELEGATE CLICK INTERCEPTOR
async function handleDynamicClicks(e) {
  // Find closest targets with custom attributes
  
  // A. Like Button Trigger
  const likeBtn = e.target.closest('.btn-like');
  if (likeBtn) {
    e.preventDefault();
    const postId = likeBtn.dataset.postId;
    try {
      const data = await window.api.likePost(postId);
      
      // Update like UI directly
      const heartIcon = likeBtn.querySelector('svg');
      const countSpan = likeBtn.querySelector('.like-count');
      
      countSpan.textContent = data.likeCount;
      if (data.isLiked) {
        likeBtn.classList.add('liked');
        heartIcon.setAttribute('fill', '#f43f5e');
      } else {
        likeBtn.classList.remove('liked');
        heartIcon.setAttribute('fill', 'none');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
    return;
  }

  // B. Delete Post Trigger
  const deletePostBtn = e.target.closest('.btn-delete-post');
  if (deletePostBtn) {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this post?')) return;
    const postId = deletePostBtn.dataset.postId;
    try {
      await window.api.deletePost(postId);
      showToast('Post deleted successfully', 'success');
      
      // Check if we are on thread page
      if (window.location.hash.startsWith('#/post/')) {
        window.location.hash = '#/feed';
      } else {
        // Just reload current view
        handleRouting();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
    return;
  }

  // C. Delete Comment Trigger
  const deleteCommentBtn = e.target.closest('.btn-delete-comment');
  if (deleteCommentBtn) {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this comment?')) return;
    const commentId = deleteCommentBtn.dataset.commentId;
    try {
      await window.api.deleteComment(commentId);
      showToast('Comment deleted', 'success');
      if (currentPostId) loadPostDetail(currentPostId);
    } catch (err) {
      showToast(err.message, 'error');
    }
    return;
  }

  // D. Follow Button Trigger
  const followBtn = e.target.closest('.btn-follow-toggle');
  if (followBtn) {
    e.preventDefault();
    const userId = followBtn.dataset.userId;
    const isFollowing = followBtn.dataset.following === 'true';
    try {
      if (isFollowing) {
        const data = await window.api.unfollowUser(userId);
        currentUser = data.user;
        showToast('Unfollowed', 'success');
      } else {
        const data = await window.api.followUser(userId);
        currentUser = data.user;
        showToast('Following creator!', 'success');
      }
      
      // Reload current view state
      handleRouting();
    } catch (err) {
      showToast(err.message, 'error');
    }
    return;
  }

  // E. Edit profile trigger
  const editProfileBtn = e.target.closest('#btn-edit-profile');
  if (editProfileBtn) {
    e.preventDefault();
    openModal();
    return;
  }
}

// 7. RENDERERS & DATAFETCH

// A. Feed Loader
async function loadFeed(page) {
  feedPage = page;
  const feedPostsContainer = document.getElementById('feed-posts');
  feedPostsContainer.innerHTML = getSkeletonHtml(3);

  try {
    // Hit feed route. If user follows nobody, feed will return empty.
    // In that case, let's fall back to listing general explore posts so the app feels alive!
    let data = await window.api.getFeed(page);
    
    if (data.posts.length === 0 && page === 1) {
      // Fallback: load general explore posts if home feed has 0 posts
      data = await window.api.getPosts(1);
    }

    renderPosts(data.posts, feedPostsContainer);
    
    // Pagination UI
    const paginationEl = document.getElementById('feed-pagination');
    document.getElementById('feed-page-num').textContent = `Page ${data.currentPage} of ${data.totalPages || 1}`;
    
    document.getElementById('btn-feed-prev').disabled = data.currentPage <= 1;
    document.getElementById('btn-feed-next').disabled = data.currentPage >= data.totalPages;

    if (data.totalPages > 1) {
      paginationEl.classList.remove('hidden');
    } else {
      paginationEl.classList.add('hidden');
    }
  } catch (err) {
    feedPostsContainer.innerHTML = `<div class="glass-card"><p>Failed to load feed: ${err.message}</p></div>`;
  }
}

// B. Explore Creators Loader
async function loadExplore(page) {
  explorePage = page;
  const gridContainer = document.getElementById('explore-users-grid');
  gridContainer.innerHTML = getSkeletonHtml(3);

  try {
    const data = await window.api.getUsers(page);
    gridContainer.innerHTML = '';
    
    if (data.users.length === 0) {
      gridContainer.innerHTML = '<div class="glass-card" style="grid-column: 1/-1"><p>No creators discovered yet.</p></div>';
      return;
    }

    data.users.forEach(user => {
      // Don't show current logged in user in explore creator grid
      if (user._id === currentUser?._id) return;

      const isFollowing = currentUser?.following?.includes(user._id);
      const card = document.createElement('div');
      card.className = 'glass-card creator-card';
      
      card.innerHTML = `
        <a href="#/profile/${user.username}">
          <img src="${user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}" alt="avatar" class="avatar avatar-lg">
        </a>
        <a href="#/profile/${user.username}" class="creator-name Outfit">${user.username}</a>
        <p class="creator-bio">${user.bio || 'This creator hasn\'t written a bio yet.'}</p>
        <div class="profile-stats">
          <span class="stat-pill"><strong>${user.followers.length}</strong> Followers</span>
        </div>
        <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-follow-toggle btn-block" data-user-id="${user._id}" data-following="${isFollowing}">
          ${isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      `;
      gridContainer.appendChild(card);
    });

    // Pagination
    const paginationEl = document.getElementById('explore-pagination');
    document.getElementById('explore-page-num').textContent = `Page ${data.currentPage} of ${data.totalPages || 1}`;
    
    document.getElementById('btn-explore-prev').disabled = data.currentPage <= 1;
    document.getElementById('btn-explore-next').disabled = data.currentPage >= data.totalPages;

    if (data.totalPages > 1) {
      paginationEl.classList.remove('hidden');
    } else {
      paginationEl.classList.add('hidden');
    }
  } catch (err) {
    gridContainer.innerHTML = `<div class="glass-card"><p>Failed to load creators: ${err.message}</p></div>`;
  }
}

// C. User Profile Loader
async function loadUserProfile(username) {
  const detailsContainer = document.getElementById('profile-details-card');
  const postsContainer = document.getElementById('profile-posts');
  
  detailsContainer.innerHTML = getSkeletonHtml(1);
  postsContainer.innerHTML = getSkeletonHtml(2);

  try {
    const data = await window.api.getUserByUsername(username);
    const profileUser = data.user;

    // If API returns no user, show friendly message instead of throwing.
    if (!profileUser) {
      detailsContainer.innerHTML = `<div class="glass-card"><p>User "${username}" not found.</p></div>`;
      postsContainer.innerHTML = '';
      return;
    }

    const isOwnProfile = profileUser._id === currentUser?._id;
    const isFollowing = currentUser?.following?.includes(profileUser._id);

    // Render Stats
    detailsContainer.innerHTML = `
      <div class="profile-card-header">
        <img src="${profileUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}" alt="avatar" class="avatar avatar-lg profile-avatar">
        <div class="profile-info">
          <h2 class="profile-username Outfit">${profileUser.username}</h2>
          <p class="profile-bio">${profileUser.bio || 'No bio written yet.'}</p>
          <div class="profile-stats">
            <span class="stat-pill"><strong>${data.followerCount}</strong> Followers</span>
            <span class="stat-pill"><strong>${data.followingCount}</strong> Following</span>
          </div>
          <div class="profile-actions">
            ${isOwnProfile ? `
              <button id="btn-edit-profile" class="btn btn-secondary">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <span>Edit Profile</span>
              </button>
            ` : `
              <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-follow-toggle" data-user-id="${profileUser._id}" data-following="${isFollowing}">
                ${isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    // Render profile posts list
    renderPosts(data.posts, postsContainer);
  } catch (err) {
    detailsContainer.innerHTML = `<div class="glass-card"><p>Failed to load profile: ${err.message}</p></div>`;
    postsContainer.innerHTML = '';
  }
}

// D. Single Post Detail Loader
async function loadPostDetail(postId) {
  currentPostId = postId;
  const postContainer = document.getElementById('single-post-detail');
  const commentsContainer = document.getElementById('comments-thread');
  
  postContainer.innerHTML = getSkeletonHtml(1);
  commentsContainer.innerHTML = getSkeletonHtml(2);

  try {
    const data = await window.api.getPost(postId);
    const post = data.post;

    // Render single post header card
    const isLiked = post.likes.includes(currentUser?._id);
    const isAuthor = post.authorId._id === currentUser?._id || post.authorId === currentUser?._id;

    postContainer.innerHTML = `
      <div class="glass-card post-card">
        <div class="post-header">
          <a href="#/profile/${post.author.username}">
            <img src="${post.author.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}" alt="avatar" class="avatar avatar-md">
          </a>
          <div class="post-meta">
            <a href="#/profile/${post.author.username}" class="post-author Outfit">${post.author.username}</a>
            <span class="post-time">${new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="post-content Inter">${post.content}</div>
        
        ${post.imageUrl ? `
          <div class="post-image-container">
            <img src="${post.imageUrl}" alt="post attachment" class="post-image">
          </div>
        ` : ''}

        <div class="post-actions">
          <button class="action-btn btn-like ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
            <svg viewBox="0 0 24 24" fill="${isLiked ? '#f43f5e' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span class="like-count">${post.likes.length}</span>
          </button>
          
          ${isAuthor ? `
            <button class="action-btn delete-action-btn btn-delete-post" data-post-id="${post._id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Render Comments Timeline
    commentsContainer.innerHTML = '';
    
    if (data.comments.length === 0) {
      commentsContainer.innerHTML = '<div class="glass-card"><p>No comments on this post yet. Be the first!</p></div>';
      return;
    }

    data.comments.forEach(comment => {
      const isCommentAuthor = comment.authorId._id === currentUser?._id || comment.authorId === currentUser?._id;
      
      const card = document.createElement('div');
      card.className = 'comment-card';
      
      card.innerHTML = `
        <a href="#/profile/${comment.author.username}">
          <img src="${comment.author.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}" alt="avatar" class="avatar avatar-sm">
        </a>
        <div class="comment-body">
          <div class="comment-header">
            <a href="#/profile/${comment.author.username}" class="comment-author Outfit">${comment.author.username}</a>
            <span class="comment-time">${new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="comment-content Inter">${comment.content}</div>
        </div>
        ${isCommentAuthor ? `
          <button class="btn-delete-comment" data-comment-id="${comment._id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        ` : ''}
      `;
      commentsContainer.appendChild(card);
    });

  } catch (err) {
    postContainer.innerHTML = `<div class="glass-card"><p>Failed to load thread details: ${err.message}</p></div>`;
    commentsContainer.innerHTML = '';
  }
}

// Helper to render posts array into target container
function renderPosts(posts, container) {
  container.innerHTML = '';

  if (posts.length === 0) {
    container.innerHTML = '<div class="glass-card"><p>No posts to display.</p></div>';
    return;
  }

  posts.forEach(post => {
    const isLiked = post.likes.includes(currentUser?._id);
    const isAuthor = post.authorId._id === currentUser?._id || post.authorId === currentUser?._id;

    const card = document.createElement('div');
    card.className = 'glass-card post-card';

    card.innerHTML = `
      <div class="post-header">
        <a href="#/profile/${post.author.username}">
          <img src="${post.author.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}" alt="avatar" class="avatar avatar-md">
        </a>
        <div class="post-meta">
          <a href="#/profile/${post.author.username}" class="post-author Outfit">${post.author.username}</a>
          <span class="post-time">${new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="post-content Inter">${post.content}</div>
      
      ${post.imageUrl ? `
        <div class="post-image-container">
          <img src="${post.imageUrl}" alt="post attachment" class="post-image">
        </div>
      ` : ''}

      <div class="post-actions">
        <button class="action-btn btn-like ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
          <svg viewBox="0 0 24 24" fill="${isLiked ? '#f43f5e' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span class="like-count">${post.likes.length}</span>
        </button>
        
        <a href="#/post/${post._id}" class="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Discuss</span>
        </a>

        ${isAuthor ? `
          <button class="action-btn delete-action-btn btn-delete-post" data-post-id="${post._id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// 8. POPUPS, MODALS, TOASTS

// Toast success/error bubble builder
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  
  toast.innerHTML = `
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Clean up toast after 4s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Profile edit Modal openers/closers
function openModal() {
  const modal = document.getElementById('profile-edit-modal');
  modal.classList.remove('hidden');
  
  // Set current profile inputs
  document.getElementById('edit-bio').value = currentUser?.bio || '';
  document.getElementById('edit-avatar').value = currentUser?.avatarUrl || '';
}

function closeModal() {
  document.getElementById('profile-edit-modal').classList.add('hidden');
}

// Skeleton helper HTML builder
function getSkeletonHtml(count) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="glass-card post-card" style="opacity: 0.6">
        <div class="post-header" style="display: flex; gap: var(--space-md); align-items: center">
          <div class="skeleton skeleton-avatar" style="width: 48px; height: 48px;"></div>
          <div style="flex-grow: 1">
            <div class="skeleton skeleton-text" style="width: 120px; height: 14px"></div>
            <div class="skeleton skeleton-text" style="width: 60px; height: 10px"></div>
          </div>
        </div>
        <div class="skeleton skeleton-text" style="height: 14px"></div>
        <div class="skeleton skeleton-text" style="height: 14px; width: 80%"></div>
      </div>
    `;
  }
  return html;
}
