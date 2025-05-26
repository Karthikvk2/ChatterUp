// ChatterUp - Client-side JavaScript
let socket;
let currentUser = null;
let typingTimer;
let isTyping = false;

// DOM elements
const onboardingModal = document.getElementById('onboarding-modal');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username-input');
const welcomeMessage = document.getElementById('welcome-message');
const messagesArea = document.getElementById('messages-area');
const messageInput = document.getElementById('message-input');
const userCount = document.getElementById('user-count');
const usersList = document.getElementById('users-list');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Connect to Socket.IO server
    socket = io();
    
    // Set up event listeners
    setupEventListeners();
    setupSocketListeners();
    
    // Initialize users dropdown
    initializeUsersDropdown();
    
    // Fix input area positioning
    fixInputAreaPosition();
    
    // Focus on username input
    usernameInput.focus();
});

// Set up DOM event listeners
function setupEventListeners() {
    // Username input - Enter key to join
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinChat();
        }
    });
    
    // Message input - Enter key to send
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Typing indicators
    messageInput.addEventListener('input', () => {
        if (!isTyping) {
            isTyping = true;
            socket.emit('typing_start');
        }
        
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            isTyping = false;
            socket.emit('typing_stop');
        }, 1000);
    });
    
    // Auto-scroll messages area
    messagesArea.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = messagesArea;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
        messagesArea.dataset.autoScroll = isAtBottom;
    });
    
    // Users dropdown toggle
    userCount.addEventListener('click', toggleUsersDropdown);
    
    // Window resize handler for responsive input
    window.addEventListener('resize', handleWindowResize);
}

// Set up Socket.IO event listeners
function setupSocketListeners() {
    // Welcome message
    socket.on('welcome_message', (data) => {
        welcomeMessage.textContent = data.message;
        displaySystemMessage(`${data.username} joined the chat!`);
    });
    
    // Chat history
    socket.on('chat_history', (messages) => {
        messages.forEach(message => {
            displayMessage(message, false);
        });
        scrollToBottom();
    });
    
    // New message received
    socket.on('message_received', (data) => {
        displayMessage(data, data.username === currentUser);
        scrollToBottom();
    });
    
    // User joined
    socket.on('user_joined', (data) => {
        if (data.username !== currentUser) {
            displaySystemMessage(`${data.username} joined the chat`);
        }
        updateUserCount(data.userCount);
        updateUsersList(data.userList);
    });
    
    // User left
    socket.on('user_left', (data) => {
        displaySystemMessage(`${data.username} left the chat`);
        updateUserCount(data.userCount);
        updateUsersList(data.userList);
    });
    
    // Typing indicators
    socket.on('user_typing', (data) => {
        handleTypingIndicator(data.username, data.isTyping);
    });
    
    // Connection error handling
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        displaySystemMessage('Connection error. Please refresh the page.');
    });
    
    socket.on('disconnect', () => {
        displaySystemMessage('Disconnected from server. Attempting to reconnect...');
    });
    
    socket.on('reconnect', () => {
        displaySystemMessage('Reconnected to server!');
        if (currentUser) {
            socket.emit('user_join', { username: currentUser });
        }
    });
}

// Join chat function
function joinChat() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Please enter a username!');
        usernameInput.focus();
        return;
    }
    
    if (username.length > 20) {
        alert('Username must be 20 characters or less!');
        return;
    }
    
    // Validate username (alphanumeric and spaces only)
    if (!/^[a-zA-Z0-9\s]+$/.test(username)) {
        alert('Username can only contain letters, numbers, and spaces!');
        return;
    }
    
    currentUser = username;
    
    // Hide onboarding modal and show chat
    onboardingModal.style.display = 'none';
    chatContainer.style.display = 'flex';
    
    // Fix input positioning after chat container is shown
    setTimeout(() => {
        fixInputAreaPosition();
    }, 100);
    
    // Join the chat room
    socket.emit('user_join', { username });
    
    // Focus on message input
    messageInput.focus();
}

// Send message function
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || !currentUser) return;
    
    if (message.length > 500) {
        alert('Message is too long! Maximum 500 characters.');
        return;
    }
    
    // Send message to server
    socket.emit('new_message', { message });
    
    // Clear input
    messageInput.value = '';
    
    // Stop typing indicator
    if (isTyping) {
        isTyping = false;
        socket.emit('typing_stop');
    }
}

// Display message in chat
function displayMessage(data, isOwnMessage = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwnMessage ? 'own' : ''}`;
    
    const timestamp = new Date(data.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <img src="${data.profilePic}" alt="${data.username}" class="profile-pic" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
        <div class="message-content">
            <div class="message-header">
                <span class="username">${escapeHtml(data.username)}</span>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="message-text">${escapeHtml(data.message)}</div>
        </div>
    `;
    
    messagesArea.appendChild(messageDiv);
    
    // Remove old messages if too many (keep last 100)
    const messages = messagesArea.querySelectorAll('.message');
    if (messages.length > 100) {
        messages[0].remove();
    }
}

// Display system message
function displaySystemMessage(message) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.textContent = message;
    messagesArea.appendChild(systemDiv);
}

// Handle typing indicators
function handleTypingIndicator(username, isTyping) {
    const typingId = `typing-${username}`;
    let typingDiv = document.getElementById(typingId);
    
    if (isTyping) {
        if (!typingDiv) {
            typingDiv = document.createElement('div');
            typingDiv.id = typingId;
            typingDiv.className = 'typing-indicator';
            typingDiv.textContent = `${username} is typing...`;
            messagesArea.appendChild(typingDiv);
            scrollToBottom();
        }
    } else {
        if (typingDiv) {
            typingDiv.remove();
        }
    }
}

// Update user count
function updateUserCount(count) {
    userCount.innerHTML = `
        <span>Connected Users: ${count}</span>
        <span class="dropdown-arrow" id="dropdown-arrow">▼</span>
    `;
    userCount.style.cursor = 'pointer';
    userCount.title = 'Click to show/hide online users';
}

// Toggle users dropdown
function toggleUsersDropdown() {
    const onlineUsersSection = document.querySelector('.online-users');
    const dropdownArrow = document.getElementById('dropdown-arrow');
    
    if (onlineUsersSection.style.display === 'none') {
        onlineUsersSection.style.display = 'block';
        dropdownArrow.textContent = '▼';
        dropdownArrow.style.transform = 'rotate(0deg)';
    } else {
        onlineUsersSection.style.display = 'none';
        dropdownArrow.textContent = '▶';
        dropdownArrow.style.transform = 'rotate(-90deg)';
    }
}

// Initialize users dropdown (collapsed by default)
function initializeUsersDropdown() {
    const onlineUsersSection = document.querySelector('.online-users');
    onlineUsersSection.style.display = 'none';
    updateUserCount(0);
}

// Fix input area positioning
function fixInputAreaPosition() {
    const inputArea = document.querySelector('.input-area');
    const messagesArea = document.querySelector('.messages-area');
    const header = document.querySelector('.header');
    
    // Make input area fixed at bottom
    inputArea.style.position = 'fixed';
    inputArea.style.bottom = '0';
    inputArea.style.left = '0';
    inputArea.style.right = '300px'; // Account for sidebar width
    inputArea.style.zIndex = '200';
    inputArea.style.borderTop = '2px solid #eee';
    inputArea.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
    
    // Adjust messages area to account for fixed input
    const inputHeight = inputArea.offsetHeight || 70; // Default height if not rendered yet
    messagesArea.style.paddingBottom = `${inputHeight + 20}px`;
    
    // Adjust for mobile
    if (window.innerWidth <= 768) {
        inputArea.style.right = '0';
    }
}

// Handle window resize for responsive input positioning
function handleWindowResize() {
    const inputArea = document.querySelector('.input-area');
    if (window.innerWidth <= 768) {
        inputArea.style.right = '0';
    } else {
        inputArea.style.right = '300px';
    }
}

// Update users list
function updateUsersList(users) {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <img src="${user.profilePic}" alt="${user.username}" class="user-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
            <div class="user-info">
                <div class="user-name">${escapeHtml(user.username)}</div>
            </div>
            <span class="online-indicator"></span>
        `;
        usersList.appendChild(userDiv);
    });
}

// Scroll to bottom of messages
function scrollToBottom() {
    // Only auto-scroll if user is at or near the bottom
    if (messagesArea.dataset.autoScroll !== 'false') {
        setTimeout(() => {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 100);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Handle window focus/blur for notifications
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could implement notifications here
    } else {
        // Page is visible, clear any notification badges
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (socket && currentUser) {
        socket.disconnect();
    }
});

// Error handling for profile picture loading
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('profile-pic')) {
        e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
    }
}, true);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to focus message input
    if (e.key === 'Escape' && currentUser) {
        messageInput.focus();
    }
    
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize auto-scroll tracking
messagesArea.dataset.autoScroll = 'true';