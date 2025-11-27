// Messenger Chatbox Functionality

// Import Firebase modules
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    orderBy,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    getFirestore
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    onAuthStateChanged,
    getAuth
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    initializeApp,
    getApps
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Firebase Configuration (same as app.js)
const firebaseConfig = {
    apiKey: "AIzaSyApT0uj8sz3mC8bDtLQeHHodAtZlqfJDns",
    authDomain: "rajjecampaign.firebaseapp.com",
    projectId: "rajjecampaign",
    storageBucket: "rajjecampaign.firebasestorage.app",
    messagingSenderId: "480799282234",
    appId: "1:480799282234:web:a35c084610bcdfc2ed9103",
    measurementId: "G-2K7J967N1V"
};

// Initialize Firebase instances (reuse if already initialized)
let app, auth, db, storage;
const apps = getApps();
if (apps.length > 0) {
    app = apps[0];
} else {
    app = initializeApp(firebaseConfig);
}
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// File attachment state
let attachedFiles = [];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for small files
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

let currentUser = null;
let userEmail = null;
let userSerialNumber = null;
let messengerEnabled = false;
let selectedUserId = null;
let onlineUsers = [];
let unreadCount = 0;

// Initialize Messenger
function initMessenger() {
    // Check if messenger is enabled in localStorage
    const savedSetting = localStorage.getItem('messengerEnabled');
    messengerEnabled = savedSetting === 'true';

    // Check if we're in admin mode
    const isAdminMode = window.location.pathname.includes('admin.html') ||
        (window.currentUser && window.currentUser.email === 'rixaski@gmail.com');

    // Auto-enable messenger for admin
    if (isAdminMode) {
        messengerEnabled = true;
        localStorage.setItem('messengerEnabled', 'true');
    }

    updateMessengerVisibility();

    // Setup event listeners
    setupMessengerListeners();

    // Check if we're in agent portal mode
    const isAgentPortal = window.agentData && window.campaignEmail;

    if (isAgentPortal) {
        // Agent portal: Enable messenger automatically and load Campaign Manager
        messengerEnabled = true;
        updateMessengerVisibility();

        // Set agent email for messaging (use agent ID or name)
        userEmail = `agent_${window.agentData.id}`;
        userSerialNumber = null; // Agents don't use serial numbers

        // Load online users (Campaign Manager + other agents)
        loadOnlineUsers();

        // Listen for messages (agent-specific)
        listenForMessages();
    } else if (isAdminMode) {
        // Admin mode: Enable messenger automatically
        messengerEnabled = true;
        updateMessengerVisibility();

        // Set admin email
        onAuthStateChanged(auth, async (user) => {
            if (user && user.email === 'rixaski@gmail.com') {
                currentUser = user;
                userEmail = user.email;
                userSerialNumber = 'ADMIN'; // Special identifier for admin

                // Setup presence tracking for admin
                await setupPresenceTracking();
                loadOnlineUsers();
                listenForMessages();
            }
        });
    } else {
        // Normal client portal: Use auth state
        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                userEmail = user.email;

                // Get user data including serial number
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.email));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        userSerialNumber = userData.serialNumber;

                        if (messengerEnabled && userSerialNumber) {
                            setupPresenceTracking();
                            loadOnlineUsers();
                            listenForMessages();
                        }
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
        });
    }
}

// Setup event listeners
function setupMessengerListeners() {
    // Toggle button - opens chat window with user list
    const toggleBtn = document.getElementById('messenger-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const chatWindow = document.getElementById('messenger-chat-window');

            if (chatWindow) {
                const isOpen = chatWindow.classList.contains('open');
                if (isOpen) {
                    chatWindow.classList.remove('open');
                    selectedUserId = null;
                    // Clear messages when closing
                    const messagesContainer = document.getElementById('chat-messages');
                    if (messagesContainer) {
                        messagesContainer.innerHTML = '';
                    }
                } else {
                    chatWindow.classList.add('open');
                    // Always show user list when opening (if no user selected)
                    if (!selectedUserId) {
                        showUsersInChatWindow();
                    }
                }
            }
        });
    }

    // Close button - closes chat window (handle multiple close buttons)
    const closeBtns = document.querySelectorAll('#messenger-close-btn, #messenger-chat-close-btn, #messenger-container-close-btn');
    closeBtns.forEach(closeBtn => {
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatWindow = document.getElementById('messenger-chat-window');
                if (chatWindow) {
                    chatWindow.classList.remove('open');
                    selectedUserId = null;
                    const messagesContainer = document.getElementById('chat-messages');
                    if (messagesContainer) {
                        messagesContainer.innerHTML = '';
                    }
                }
            });
        }
    });

    // Chat back button - goes back to user list
    const backBtn = document.getElementById('chat-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            selectedUserId = null;
            showUsersInChatWindow();
        });
    }

    // Send message button
    const sendBtn = document.getElementById('chat-send-btn');
    const messageInput = document.getElementById('chat-message-input');

    if (sendBtn && messageInput) {
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // File attachment
    const fileInput = document.getElementById('chat-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Settings toggle
    document.addEventListener('click', (e) => {
        if (e.target.id === 'messenger-enabled-toggle' || e.target.closest('#messenger-enabled-toggle')) {
            const toggle = document.getElementById('messenger-enabled-toggle');
            if (toggle) {
                messengerEnabled = toggle.checked;
                localStorage.setItem('messengerEnabled', messengerEnabled.toString());
                updateMessengerVisibility();

                if (messengerEnabled && userSerialNumber) {
                    setupPresenceTracking();
                    loadOnlineUsers();
                    listenForMessages();
                } else {
                    // Disable presence tracking
                    updateUserPresence(false);
                }
            }
        }
    });

    // Search functionality
    const searchInput = document.getElementById('messenger-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterUsers(e.target.value);
        });
    }
}

// Update messenger visibility based on settings
function updateMessengerVisibility() {
    const toggleBtn = document.getElementById('messenger-toggle-btn');
    const chatWindow = document.getElementById('messenger-chat-window');
    const settingsToggle = document.getElementById('messenger-enabled-toggle');

    if (messengerEnabled) {
        if (toggleBtn) toggleBtn.classList.remove('hidden');
        if (chatWindow) chatWindow.style.display = 'flex';
    } else {
        if (toggleBtn) toggleBtn.classList.add('hidden');
        if (chatWindow) {
            chatWindow.classList.remove('open');
            chatWindow.style.display = 'none';
        }
    }

    if (settingsToggle) {
        settingsToggle.checked = messengerEnabled;
    }
}

// Setup presence tracking
async function setupPresenceTracking() {
    if (!currentUser || !userEmail) return;

    // For admin, use special handling
    const isAdminMode = userSerialNumber === 'ADMIN' || userEmail === 'rixaski@gmail.com';

    if (isAdminMode) {
        // Ensure admin user document exists
        const userRef = doc(db, 'users', userEmail);
        try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    email: userEmail,
                    name: 'Support',
                    isOnline: true,
                    lastSeen: serverTimestamp(),
                    serialNumber: 'ADMIN'
                });
            } else {
                await updateDoc(userRef, {
                    isOnline: true,
                    lastSeen: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error setting up admin presence:', error);
        }
    } else if (userSerialNumber) {
        const userRef = doc(db, 'users', userEmail);

        // Set user as online
        await updateDoc(userRef, {
            isOnline: true,
            lastSeen: serverTimestamp()
        });
    }

    // Update when user goes offline
    window.addEventListener('beforeunload', async () => {
        try {
            const userRef = doc(db, 'users', userEmail);
            await updateDoc(userRef, {
                isOnline: false,
                lastSeen: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating offline status:', error);
        }
    });
}

// Update user presence
async function updateUserPresence(isOnline) {
    if (!currentUser || !userEmail) return;

    try {
        const userRef = doc(db, 'users', userEmail);
        await updateDoc(userRef, {
            isOnline: isOnline,
            lastSeen: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating presence:', error);
    }
}

// Load online users with same serial number
async function loadOnlineUsers() {
    // Check if we're in agent portal mode
    const isAgentPortal = window.agentData && window.campaignEmail;

    if (isAgentPortal) {
        // Agent portal mode: Load Campaign Manager and other agents
        await loadOnlineUsersForAgent();
    } else if (userSerialNumber) {
        // Normal client portal mode: Load users by serial number
        await loadOnlineUsersBySerialNumber();
    }
}

// Load online users for agent portal
async function loadOnlineUsersForAgent() {
    if (!window.campaignEmail) return;

    try {
        // Set up real-time listener for Campaign Manager
        const campaignManagerRef = doc(db, 'users', window.campaignEmail);
        onSnapshot(campaignManagerRef, (managerDoc) => {
            if (managerDoc.exists()) {
                const managerData = managerDoc.data();
                // Update or add Campaign Manager to online users
                const existingIndex = onlineUsers.findIndex(u => u.id === window.campaignEmail);
                const managerUser = {
                    id: window.campaignEmail,
                    email: window.campaignEmail,
                    name: managerData.name || window.campaignEmail.split('@')[0] || 'Campaign Manager',
                    isOnline: managerData.isOnline || false,
                    agentCode: null,
                    isCampaignManager: true,
                    lastSeen: managerData.lastSeen
                };

                if (existingIndex >= 0) {
                    onlineUsers[existingIndex] = managerUser;
                } else {
                    onlineUsers.push(managerUser);
                }

                updateOnlineCount();
                const chatWindow = document.getElementById('messenger-chat-window');
                if (chatWindow && chatWindow.classList.contains('open') && !selectedUserId) {
                    showUsersInChatWindow();
                }
            }
        });

        // Set up real-time listener for agents
        const agentsQuery = query(
            collection(db, 'agents'),
            where('email', '==', window.campaignEmail)
        );

        onSnapshot(agentsQuery, (agentsSnapshot) => {
            // Remove all agents from onlineUsers (we'll re-add them)
            onlineUsers = onlineUsers.filter(u => !u.isAgent);

            agentsSnapshot.forEach((agentDoc) => {
                const agentData = agentDoc.data();
                // Don't include current agent
                if (window.agentData && agentData.agentAccessCode === window.agentData.agentAccessCode) {
                    return;
                }

                // Get agent presence from agents collection
                onlineUsers.push({
                    id: `agent_${agentDoc.id}`,
                    email: agentData.email || window.campaignEmail,
                    name: agentData.name || 'Agent',
                    isOnline: agentData.isOnline || false, // Get online status from agent document
                    agentCode: agentData.agentId || agentData.agentAccessCode || null,
                    isCampaignManager: false,
                    isAgent: true,
                    lastSeen: agentData.lastSeen || null
                });
            });

            updateOnlineCount();
            const chatWindow = document.getElementById('messenger-chat-window');
            if (chatWindow && chatWindow.classList.contains('open') && !selectedUserId) {
                showUsersInChatWindow();
            }
        });

    } catch (error) {
        console.error('Error loading online users for agent:', error);
    }
}

// Load online users by serial number (normal client portal mode)
async function loadOnlineUsersBySerialNumber() {
    // Check if admin mode
    const isAdminMode = userSerialNumber === 'ADMIN' || userEmail === 'rixaski@gmail.com';

    if (isAdminMode) {
        // Admin mode: Load all clients
        await loadOnlineUsersForAdmin();
        return;
    }

    if (!userSerialNumber) return;

    try {
        const usersQuery = query(
            collection(db, 'users'),
            where('serialNumber', '==', userSerialNumber),
            where('email', '!=', userEmail)
        );

        onSnapshot(usersQuery, (snapshot) => {
            onlineUsers = [];
            snapshot.forEach((doc) => {
                const userData = doc.data();
                onlineUsers.push({
                    id: doc.id,
                    email: doc.id,
                    name: userData.email.split('@')[0] || 'User',
                    isOnline: userData.isOnline || false,
                    agentCode: userData.agentCode || null,
                    isCampaignManager: false,
                    isAdmin: false,
                    lastSeen: userData.lastSeen
                });
            });

            // Add admin to online users if admin is online
            addAdminToOnlineUsers();

            // Update online count in header
            updateOnlineCount();

            // Show users in chat window if it's open
            const chatWindow = document.getElementById('messenger-chat-window');
            if (chatWindow && chatWindow.classList.contains('open') && !selectedUserId) {
                showUsersInChatWindow();
            }
        });
    } catch (error) {
        console.error('Error loading online users:', error);
    }
}

// Load online users for admin (all clients)
async function loadOnlineUsersForAdmin() {
    try {
        // Get all clients from clients collection
        const clientsQuery = query(collection(db, 'clients'));
        const clientsSnapshot = await getDocs(clientsQuery);

        onlineUsers = [];

        clientsSnapshot.forEach((clientDoc) => {
            const clientData = clientDoc.data();
            const clientEmail = clientData.email || clientDoc.id;

            // Get user data to check online status
            getDoc(doc(db, 'users', clientEmail)).then((userDoc) => {
                const userData = userDoc.exists() ? userDoc.data() : {};

                onlineUsers.push({
                    id: clientEmail,
                    email: clientEmail,
                    name: clientData.name || clientEmail.split('@')[0] || 'Client',
                    isOnline: userData.isOnline || false,
                    agentCode: null,
                    isCampaignManager: false,
                    isAdmin: false,
                    lastSeen: userData.lastSeen || null
                });

                updateOnlineCount();

                // Show users in chat window if it's open
                const chatWindow = document.getElementById('messenger-chat-window');
                if (chatWindow && chatWindow.classList.contains('open') && !selectedUserId) {
                    showUsersInChatWindow();
                }
            }).catch(error => {
                console.warn('Error loading user data for client:', error);
            });
        });
    } catch (error) {
        console.error('Error loading online users for admin:', error);
    }
}

// Add admin to online users list
async function addAdminToOnlineUsers() {
    try {
        const adminEmail = 'rixaski@gmail.com';
        const adminDoc = await getDoc(doc(db, 'users', adminEmail));

        if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            const adminExists = onlineUsers.some(u => u.email === adminEmail);

            if (!adminExists) {
                onlineUsers.push({
                    id: adminEmail,
                    email: adminEmail,
                    name: 'Support',
                    isOnline: adminData.isOnline || false,
                    agentCode: null,
                    isCampaignManager: false,
                    isAdmin: true,
                    lastSeen: adminData.lastSeen
                });

                updateOnlineCount();

                // Show users in chat window if it's open
                const chatWindow = document.getElementById('messenger-chat-window');
                if (chatWindow && chatWindow.classList.contains('open') && !selectedUserId) {
                    showUsersInChatWindow();
                }
            }
        }
    } catch (error) {
        console.warn('Error adding admin to online users:', error);
    }
}

// Update online count in header
function updateOnlineCount() {
    const chatUserStatus = document.getElementById('chat-user-status');
    const onlineCountEl = document.getElementById('messenger-online-count');
    const onlineCount = onlineUsers.filter(u => u.isOnline).length;

    if (chatUserStatus) {
        chatUserStatus.textContent = `${onlineCount} online`;
    }
    if (onlineCountEl) {
        onlineCountEl.textContent = `${onlineCount} online`;
    }
}

// Show users in chat window
function showUsersInChatWindow() {
    const messagesContainer = document.getElementById('chat-messages');
    const chatUserName = document.getElementById('chat-user-name');
    const chatUserStatus = document.getElementById('chat-user-status');
    const chatUserAvatar = document.getElementById('chat-user-avatar');
    const chatBackBtn = document.getElementById('chat-back-btn');
    const chatInputArea = document.querySelector('.chat-input-area');
    const chatPreviewArea = document.getElementById('chat-preview-area');

    if (!messagesContainer) return;

    // Hide input when showing user list
    if (chatInputArea) chatInputArea.style.display = 'none';
    if (chatPreviewArea) chatPreviewArea.style.display = 'none';

    // Update header
    if (chatUserName) chatUserName.textContent = 'Messages';
    if (chatUserStatus) {
        const onlineCount = onlineUsers.filter(u => u.isOnline).length;
        chatUserStatus.textContent = `${onlineCount} online`;
    }
    if (chatUserAvatar) chatUserAvatar.innerHTML = '';
    if (chatBackBtn) chatBackBtn.style.display = 'none';

    // Filter users
    const filteredUsers = onlineUsers;

    if (filteredUsers.length === 0) {
        messagesContainer.innerHTML = `
            <div class="messenger-empty" style="padding: 40px 20px; text-align: center; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text-light);">No online users</p>
                <small style="font-size: 12px; color: var(--text-muted);">Users from your license will appear here when online</small>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = filteredUsers.map(user => {
        const initials = user.name.substring(0, 2).toUpperCase();
        let displayName = user.name;

        // Add agent code if present
        if (user.agentCode) {
            displayName += ` (${user.agentCode})`;
        }

        // Check if Campaign Manager
        const isCampaignManager = user.isCampaignManager === true;
        const isAdmin = user.isAdmin === true;

        return `
            <div class="messenger-user-item" data-user-id="${user.id}" style="margin: 0; border-bottom: 1px solid var(--border-light); cursor: pointer; position: relative;">
                <div class="messenger-user-avatar ${user.isOnline ? 'online' : ''}">${initials}</div>
                <div class="messenger-user-info" style="flex: 1;">
                    <div class="messenger-user-name" style="display: flex; align-items: center; gap: 6px;">
                        <span>${displayName}</span>
                        ${isAdmin ? `
                            <span class="support-badge" style="display: inline-flex; align-items: center; padding: 2px 8px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                Support
                            </span>
                        ` : isCampaignManager ? `
                            <span class="campaign-manager-badge" style="display: inline-flex; align-items: center; padding: 2px 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                Campaign Manager
                            </span>
                        ` : ''}
                    </div>
                    <div class="messenger-user-status-text">${user.isOnline ? 'Online' : 'Offline'}</div>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners
    messagesContainer.querySelectorAll('.messenger-user-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = item.dataset.userId;
            openChat(userId);
        });
    });
}

// Render users list (kept for compatibility but not used)
function renderUsersList(filter = '') {
    // This function is no longer used as we show users in chat window
    showUsersInChatWindow();
}

// Filter users
function filterUsers(searchTerm) {
    renderUsersList(searchTerm);
}

// Open chat with user
async function openChat(userId) {
    selectedUserId = userId;
    const user = onlineUsers.find(u => u.id === userId);
    if (!user) return;

    // Ensure chat window is open
    const chatWindow = document.getElementById('messenger-chat-window');
    if (chatWindow) {
        chatWindow.classList.add('open');
    }

    // Show input area
    const chatInputArea = document.querySelector('.chat-input-area');
    const chatPreviewArea = document.getElementById('chat-preview-area');
    if (chatInputArea) chatInputArea.style.display = 'flex';
    if (chatPreviewArea) chatPreviewArea.style.display = 'block';

    // Update chat header
    const chatUserName = document.getElementById('chat-user-name');
    const chatUserStatus = document.getElementById('chat-user-status');
    const chatUserAvatar = document.getElementById('chat-user-avatar');
    const chatBackBtn = document.getElementById('chat-back-btn');

    if (chatUserName) {
        let displayName = user.name;
        if (user.agentCode) {
            displayName += ` (${user.agentCode})`;
        }

        // Show Campaign Manager badge in chat header
        if (user.isAdmin) {
            chatUserName.innerHTML = `
                <span>${displayName}</span>
                <span class="support-badge" style="display: inline-flex; align-items: center; padding: 2px 8px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 8px;">
                    Support
                </span>
            `;
        } else if (user.isAdmin) {
            chatUserName.innerHTML = `
                <span>${displayName}</span>
                <span class="support-badge" style="display: inline-flex; align-items: center; padding: 2px 8px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 8px;">
                    Support
                </span>
            `;
        } else if (user.isCampaignManager) {
            chatUserName.innerHTML = `
                <span>${displayName}</span>
                <span class="campaign-manager-badge" style="display: inline-flex; align-items: center; padding: 2px 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 8px;">
                    Campaign Manager
                </span>
            `;
        } else {
            chatUserName.textContent = displayName;
        }
    }
    if (chatUserStatus) {
        chatUserStatus.textContent = user.isOnline ? 'Online' : 'Offline';
    }
    if (chatUserAvatar) {
        const initials = user.name.substring(0, 2).toUpperCase();
        chatUserAvatar.textContent = initials;
    }
    if (chatBackBtn) {
        chatBackBtn.style.display = 'flex';
    }

    // Load messages
    loadMessages(userId);
}

// Load messages for a conversation
async function loadMessages(otherUserId) {
    if (!userEmail || !otherUserId) return;

    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [userEmail, otherUserId].sort().join('_');

    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

        onSnapshot(messagesQuery, (snapshot) => {
            messagesContainer.innerHTML = '';
            snapshot.forEach((doc) => {
                const message = doc.data();
                renderMessage(message, message.senderId === userEmail);
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Render a message
function renderMessage(message, isSent) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isSent ? 'sent' : 'received'}`;

    const time = message.timestamp && message.timestamp.toDate ?
        message.timestamp.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }) :
        'Now';

    let contentHTML = '';

    // Render files/images
    if (message.files && message.files.length > 0) {
        message.files.forEach(file => {
            const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

            if (isImage) {
                contentHTML += `<img src="${file.url}" alt="${file.name}" class="chat-message-image" onclick="window.open('${file.url}', '_blank')">`;
            } else {
                contentHTML += `
                    <div class="chat-message-file">
                        <a href="${file.url}" target="_blank" class="chat-file-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chat-file-icon">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span class="chat-file-name">${file.name}</span>
                        </a>
                    </div>
                `;
            }
        });
    }

    // Render text
    if (message.text) {
        contentHTML += `<div class="chat-message-bubble">${escapeHtml(message.text)}</div>`;
    }

    messageDiv.innerHTML = `
        ${contentHTML}
        <div class="chat-message-time">${time}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            if (window.showErrorDialog) {
                window.showErrorDialog(`File "${file.name}" is too large. Maximum size is 5MB.`, 'File Too Large');
            } else {
                alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
            }
            return;
        }

        // Validate file type
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isAllowedFile = ALLOWED_FILE_TYPES.includes(file.type);

        if (!isImage && !isAllowedFile) {
            if (window.showErrorDialog) {
                window.showErrorDialog(`File type "${file.type}" is not allowed. Please select images, PDF, DOC, DOCX, or TXT files.`, 'Invalid File Type');
            } else {
                alert(`File type "${file.type}" is not allowed. Please select images, PDF, DOC, DOCX, or TXT files.`);
            }
            return;
        }

        // Add to attached files
        attachedFiles.push(file);
        displayFilePreview(file);
    });

    // Reset input
    e.target.value = '';
}

// Display file preview
function displayFilePreview(file) {
    const previewArea = document.getElementById('chat-preview-area');
    if (!previewArea) return;

    previewArea.classList.add('show');

    const fileDiv = document.createElement('div');
    fileDiv.className = 'chat-file-preview';
    fileDiv.dataset.fileName = file.name;

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
            fileDiv.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}" class="chat-file-preview-image">
                <div class="chat-file-preview-info">
                    <div class="chat-file-preview-name">${file.name}</div>
                    <div class="chat-file-preview-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="chat-file-preview-remove" onclick="removeFilePreview('${file.name}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        fileDiv.innerHTML = `
            <div class="chat-file-preview-info">
                <div class="chat-file-preview-name">${file.name}</div>
                <div class="chat-file-preview-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="chat-file-preview-remove" onclick="removeFilePreview('${file.name}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
    }

    previewArea.appendChild(fileDiv);
}

// Remove file preview
window.removeFilePreview = function(fileName) {
    attachedFiles = attachedFiles.filter(f => f.name !== fileName);

    const previewArea = document.getElementById('chat-preview-area');
    if (!previewArea) return;

    const fileDiv = previewArea.querySelector(`[data-file-name="${fileName}"]`);
    if (fileDiv) {
        fileDiv.remove();
    }

    if (attachedFiles.length === 0) {
        previewArea.classList.remove('show');
    }
};

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Upload file to Firebase Storage
async function uploadFile(file, conversationId) {
    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const fileRef = ref(storage, `chat-files/${conversationId}/${fileName}`);

        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            url: downloadURL,
            name: file.name,
            type: file.type,
            size: file.size
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('chat-send-btn');

    if (!messageInput || !selectedUserId || !userEmail) return;

    const text = messageInput.value.trim();

    // Check if there's text or files to send
    if (!text && attachedFiles.length === 0) return;

    // Disable input
    if (sendBtn) sendBtn.disabled = true;

    try {
        // Create conversation ID
        const conversationId = [userEmail, selectedUserId].sort().join('_');

        // Upload files if any
        const fileData = [];
        if (attachedFiles.length > 0) {
            for (const file of attachedFiles) {
                try {
                    const uploadedFile = await uploadFile(file, conversationId);
                    fileData.push(uploadedFile);
                } catch (error) {
                    console.error('Error uploading file:', error);
                    if (window.showErrorDialog) {
                        window.showErrorDialog(`Failed to upload ${file.name}. Please try again.`, 'Upload Failed');
                    } else {
                        alert(`Failed to upload ${file.name}`);
                    }
                }
            }
        }

        // Add message
        const messageData = {
            senderId: userEmail,
            receiverId: selectedUserId,
            timestamp: serverTimestamp(),
            read: false
        };

        if (text) {
            messageData.text = text;
        }

        if (fileData.length > 0) {
            messageData.files = fileData;
        }

        await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

        // Clear input and files
        messageInput.value = '';
        attachedFiles = [];

        // Clear preview
        const previewArea = document.getElementById('chat-preview-area');
        if (previewArea) {
            previewArea.innerHTML = '';
            previewArea.classList.remove('show');
        }

        if (sendBtn) sendBtn.disabled = false;
        messageInput.focus();
    } catch (error) {
        console.error('Error sending message:', error);
        if (window.showErrorDialog) {
            window.showErrorDialog('Failed to send message. Please try again.', 'Send Failed');
        } else {
            alert('Failed to send message. Please try again.');
        }
        if (sendBtn) sendBtn.disabled = false;
    }
}

// Listen for new messages
function listenForMessages() {
    if (!userEmail || !userSerialNumber) return;

    // This will be handled per conversation when opened
    // We can also set up a global listener for unread counts
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initMessenger, 500);
    });
} else {
    setTimeout(initMessenger, 500);
}

// Make functions available globally
window.initMessenger = initMessenger;