let currentComplaintId = null;
let currentUsername = null;
let messagePollingInterval = null;

/**
 * Opens the admin chat modal for a specific complaint
 * @param {number} complaintId - The ID of the complaint
 * @param {string} username - The username of the user
 */
function openAdminChat(complaintId, username) {
    console.log('Opening chat for complaint:', complaintId, 'user:', username);
    
    currentComplaintId = complaintId;
    currentUsername = username;
    
    // Update modal header
    document.getElementById('currentComplaintId').textContent = complaintId;
    
    // Show modal
    const modal = document.getElementById('chatModal');
    modal.classList.add('show');
    
    // Load existing messages
    loadAdminChatMessages();
    
    // Setup auto-refresh for new messages
    startMessagePolling();
    
    // Focus on input
    setTimeout(() => {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.focus();
        }
    }, 300);
    
    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Closes the admin chat modal
 */
function closeAdminChat() {
    const modal = document.getElementById('chatModal');
    modal.classList.remove('show');
    
    // Clear current complaint data
    currentComplaintId = null;
    currentUsername = null;
    
    // Stop polling for messages
    stopMessagePolling();
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
    
    // Clear messages container
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
}

/**
 * Handles escape key press to close modal
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeAdminChat();
    }
}

/**
 * Loads chat messages for the current complaint
 */
async function loadAdminChatMessages() {
    if (!currentComplaintId) return;
    
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
        <div class="chat-loading">
            <i class="fas fa-spinner fa-spin"></i>
            Loading messages...
        </div>
    `;
    
    try {
        console.log('Fetching messages for complaint:', currentComplaintId);
        
        const response = await fetch(`/admin/chat/messages/${currentComplaintId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin' // Include session cookies
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.success) {
            displayAdminChatMessages(data.messages || []);
        } else {
            showChatError('Failed to load messages: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showChatError('Failed to load messages. Please check your connection and try again.');
    }
}

/**
 * Displays chat messages in the modal
 * @param {Array} messages - Array of message objects
 */
function displayAdminChatMessages(messages) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comments"></i>
                <h4>No messages yet</h4>
                <p>Start the conversation by sending a message</p>
            </div>
        `;
        return;
    }
    
    const messagesHTML = messages.map(message => {
        const messageTime = new Date(message.sent_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="message ${message.sender_type}">
                <div class="message-content">${escapeHtml(message.message)}</div>
                <div class="message-time">${messageTime}</div>
            </div>
        `;
    }).join('');
    
    messagesContainer.innerHTML = messagesHTML;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Sends a message from admin to user
 */
async function sendAdminMessage() {
    const input = document.getElementById('chatInput');
    const sendButton = document.getElementById('chatSend');
    
    if (!input || !sendButton) return;
    
    const message = input.value.trim();
    
    if (!message || !currentComplaintId) return;
    
    // Disable send button
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        console.log('Sending message:', message, 'for complaint:', currentComplaintId);
        
        const response = await fetch('/admin/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin', // Include session cookies
            body: JSON.stringify({
                complaint_id: currentComplaintId,
                message: message,
                sender_type: 'admin'
            })
        });
        
        const data = await response.json();
        console.log('Send response:', data);
        
        if (data.success) {
            // Clear input
            input.value = '';
            
            // Auto-resize textarea
            input.style.height = 'auto';
            
            // Reload messages to show the new message
            loadAdminChatMessages();
        } else {
            showChatError('Failed to send message: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showChatError('Failed to send message. Please try again.');
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        // Focus back on input
        input.focus();
    }
}

/**
 * Shows an error message in the chat
 * @param {string} errorMessage - The error message to display
 */
function showChatError(errorMessage) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--danger);">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>${errorMessage}</p>
            <button onclick="loadAdminChatMessages()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-blue); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                Try Again
            </button>
        </div>
    `;
}

/**
 * Starts polling for new messages
 */
function startMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    messagePollingInterval = setInterval(() => {
        if (currentComplaintId) {
            loadAdminChatMessages();
        }
    }, 5000); // Poll every 5 seconds
}

/**
 * Stops polling for new messages
 */
function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

/**
 * Escapes HTML characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handles input events for the chat textarea
 */
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    
    if (chatInput) {
        // Auto-resize textarea
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        // Send message on Enter (but not Shift+Enter)
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAdminMessage();
            }
        });
    }
    
    // Close modal when clicking outside
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.addEventListener('click', function(e) {
            if (e.target === chatModal) {
                closeAdminChat();
            }
        });
    }
});

// Export functions for global access
window.openAdminChat = openAdminChat;
window.closeAdminChat = closeAdminChat;
window.sendAdminMessage = sendAdminMessage;