let allComplaints = [];
let filteredComplaints = [];

// Function to load and display user complaints
function loadMyComplaints() {
    showLoadingState();
    
    fetch('/my-complaints')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allComplaints = data.complaints;
                filteredComplaints = [...allComplaints];
                displayComplaints(filteredComplaints);
                updateNotificationCounts();
            } else {
                console.error('Error loading complaints:', data.message);
                showErrorState(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorState('Failed to load complaints. Please try again.');
        });
}

function showLoadingState() {
    const complaintList = document.querySelector('.complaint-list');
    complaintList.innerHTML = `
        <div class="filter-loading">
            <div class="loading-spinner"></div>
            <p>Loading your complaints...</p>
        </div>
    `;
}

function showErrorState(message) {
    const complaintList = document.querySelector('.complaint-list');
    complaintList.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error Loading Complaints</h3>
            <p>${message}</p>
            <button onclick="loadMyComplaints()" class="apply-filter-btn" style="margin-top: 16px;">
                <i class="fas fa-refresh"></i> Try Again
            </button>
        </div>
    `;
}

function displayComplaints(complaints) {
    const complaintList = document.querySelector('.complaint-list');
    
    if (complaints.length === 0) {
        complaintList.innerHTML = `
            <div class="no-complaints">
                <div class="no-complaints-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3>No Complaints Found</h3>
                <p>You haven't submitted any complaints yet or no complaints match your current filters.</p>
                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
                    <a href="/complain" class="submit-complaint-btn">
                        <i class="fas fa-plus"></i> Submit Your First Complaint
                    </a>
                    ${filteredComplaints.length !== allComplaints.length ? 
                        '<button onclick="clearFilters()" class="clear-filter-btn"><i class="fas fa-filter"></i> Clear Filters</button>' : ''
                    }
                </div>
            </div>
        `;
        return;
    }

    const complaintsHTML = complaints.map(complaint => {
        const statusColor = getStatusColor(complaint.status);
        const deleteButton = complaint.status.toLowerCase() === 'pending' ? 
            `<button class="delete-btn" onclick="deleteComplaint(${complaint.complaint_id})" title="Delete Complaint">
                <i class="fas fa-trash-alt"></i>
                <span>Delete</span>
            </button>` : '';
        
        const notificationCount = complaint.unread_notifications || 0;
        const notificationBadge = notificationCount > 0 ? 
            `<span class="notification-badge">${notificationCount}</span>` : '';
        
        return `
            <div class="complaint-card" id="complaint-${complaint.complaint_id}">
                <div class="complaint-header">
                    <div class="complaint-title-section">
                        <h4 class="complaint-title">Complaint #${complaint.complaint_id}</h4>
                        <span class="complaint-type">${complaint.complaint_type}</span>
                    </div>
                    <div class="complaint-actions">
                        <span class="status-badge" style="background-color: ${statusColor}">
                            ${complaint.status.toUpperCase()}
                        </span>
                        
                        <div class="notification-icon" onclick="toggleNotifications(${complaint.complaint_id})" title="View Notifications">
                            <i class="fas fa-bell"></i>
                            ${notificationBadge}
                            <div class="notification-panel" id="notifications-${complaint.complaint_id}">
                                <div class="notification-header">
                                    <h4>Notifications</h4>
                                </div>
                                <div class="notification-content" id="notification-content-${complaint.complaint_id}">
                                    <div class="filter-loading">
                                        <div class="loading-spinner"></div>
                                        <p>Loading notifications...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chat-icon" onclick="openChat(${complaint.complaint_id})" title="Chat with Admin">
                            <i class="fas fa-comments"></i>
                        </div>
                        
                        ${deleteButton}
                    </div>
                </div>
                
                <div class="complaint-body">
                    <div class="complaint-description">
                        <p class="description-text">${complaint.description.substring(0, 150)}${complaint.description.length > 150 ? '...' : ''}</p>
                    </div>
                    
                    <div class="complaint-meta">
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${complaint.location_address}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${new Date(complaint.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-paperclip"></i>
                            <span>${complaint.evidence_count} Evidence File${complaint.evidence_count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    complaintList.innerHTML = complaintsHTML;
}

// Filter Functions
function applyFilters() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const locationFilter = document.getElementById('locationFilter').value.toLowerCase();

    filteredComplaints = allComplaints.filter(complaint => {
        // Date filter
        const complaintDate = new Date(complaint.created_at);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && complaintDate < fromDate) return false;
        if (toDate && complaintDate > toDate) return false;
        
        // Status filter
        if (statusFilter && complaint.status !== statusFilter) return false;
        
        // Location filter
        if (locationFilter && !complaint.location_address.toLowerCase().includes(locationFilter)) return false;
        
        return true;
    });

    displayComplaints(filteredComplaints);
}

function clearFilters() {
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('locationFilter').value = '';
    
    filteredComplaints = [...allComplaints];
    displayComplaints(filteredComplaints);
}

// Notification Functions
function toggleNotifications(complaintId) {
    const panel = document.getElementById(`notifications-${complaintId}`);
    const isVisible = panel.classList.contains('show');
    
    // Close all other notification panels
    document.querySelectorAll('.notification-panel').forEach(p => p.classList.remove('show'));
    
    if (!isVisible) {
        panel.classList.add('show');
        loadNotifications(complaintId);
    }
}

function loadNotifications(complaintId) {
    const contentDiv = document.getElementById(`notification-content-${complaintId}`);
    
    fetch(`/complaint-notifications/${complaintId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayNotifications(contentDiv, data.notifications, complaintId);
                markNotificationsAsRead(complaintId);
            } else {
                contentDiv.innerHTML = '<p class="notification-message">Failed to load notifications</p>';
            }
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
            contentDiv.innerHTML = '<p class="notification-message">Error loading notifications</p>';
        });
}

function displayNotifications(container, notifications, complaintId) {
    if (notifications.length === 0) {
        container.innerHTML = '<p class="notification-message" style="padding: 16px; text-align: center; color: #9ca3af;">No notifications yet</p>';
        return;
    }
    
    const notificationsHTML = notifications.map(notification => `
        <div class="notification-item ${!notification.is_read ? 'unread' : ''}" onclick="markAsRead(${notification.notification_id})">
            <div class="notification-content">
                <p class="notification-message">${notification.message}</p>
            </div>
            <div class="notification-time">${formatTimeAgo(notification.created_at)}</div>
        </div>
    `).join('');
    
    container.innerHTML = notificationsHTML;
}

function markNotificationsAsRead(complaintId) {
    fetch(`/mark-notifications-read/${complaintId}`, {
        method: 'POST',
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateNotificationCounts();
        }
    })
    .catch(error => console.error('Error marking notifications as read:', error));
}

function updateNotificationCounts() {
    // Update notification badges
    allComplaints.forEach(complaint => {
        const badge = document.querySelector(`#complaint-${complaint.complaint_id} .notification-badge`);
        if (badge) {
            badge.style.display = 'none';
        }
    });
}

// Chat Functions
function openChat(complaintId) {
    const modal = document.getElementById('chatModal') || createChatModal();
    const messagesContainer = modal.querySelector('.chat-messages');
    const chatTitle = modal.querySelector('.chat-title');
    
    chatTitle.textContent = `Chat - Complaint #${complaintId}`;
    modal.setAttribute('data-complaint-id', complaintId);
    modal.classList.add('show');
    
    loadChatMessages(complaintId, messagesContainer);
}

function createChatModal() {
    const modal = document.createElement('div');
    modal.id = 'chatModal';
    modal.className = 'chat-modal';
    modal.innerHTML = `
        <div class="chat-container">
            <div class="chat-header">
                <h3 class="chat-title">Chat</h3>
                <button class="chat-close" onclick="closeChat()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input-area">
                <div class="chat-input-container">
                    <textarea class="chat-input" id="chatInput" placeholder="Type your message..." rows="1"></textarea>
                    <button class="chat-send-btn" onclick="sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-resize textarea
    const textarea = modal.querySelector('.chat-input');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });
    
    // Send message on Enter
    textarea.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    return modal;
}

function closeChat() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function loadChatMessages(complaintId, container) {
    container.innerHTML = '<div class="filter-loading"><div class="loading-spinner"></div><p>Loading messages...</p></div>';
    
    fetch(`/complaint-chat/${complaintId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayChatMessages(container, data.messages);
            } else {
                container.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Failed to load messages</p>';
            }
        })
        .catch(error => {
            console.error('Error loading chat messages:', error);
            container.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Error loading messages</p>';
        });
}

function displayChatMessages(container, messages) {
    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No messages yet. Start the conversation!</p>';
        return;
    }
    
    const messagesHTML = messages.map(message => `
        <div class="chat-message ${message.sender_type}">
            <div class="message-bubble">
                ${message.message}
            </div>
            <div class="message-time">
                ${message.sender_type === 'admin' ? 'Admin' : 'You'} • ${formatTimeAgo(message.sent_at)}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = messagesHTML;
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const modal = document.getElementById('chatModal');
    const complaintId = modal.getAttribute('data-complaint-id');
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const sendBtn = modal.querySelector('.chat-send-btn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="loading-spinner"></div>';
    
    fetch('/send-chat-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            complaint_id: complaintId,
            message: message
        }),
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            input.value = '';
            input.style.height = 'auto';
            loadChatMessages(complaintId, modal.querySelector('.chat-messages'));
        } else {
            showNotification('Failed to send message: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        showNotification('Error sending message. Please try again.', 'error');
    })
    .finally(() => {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    });
}

// Helper Functions
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
}

function deleteComplaint(complaintId) {
    const result = confirm('⚠️ Delete Complaint\n\nAre you sure you want to delete this complaint?\nThis action cannot be undone and all associated data will be permanently removed.');
    
    if (result) {
        const deleteBtn = document.querySelector(`#complaint-${complaintId} .delete-btn`);
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            deleteBtn.disabled = true;
        }

        fetch(`/delete-complaint/${complaintId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const complaintCard = document.getElementById(`complaint-${complaintId}`);
                if (complaintCard) {
                    complaintCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    complaintCard.style.opacity = '0';
                    complaintCard.style.transform = 'translateX(100%)';
                    
                    setTimeout(() => {
                        complaintCard.remove();
                        
                        // Remove from arrays
                        allComplaints = allComplaints.filter(c => c.complaint_id !== complaintId);
                        filteredComplaints = filteredComplaints.filter(c => c.complaint_id !== complaintId);
                        
                        if (filteredComplaints.length === 0) {
                            displayComplaints(filteredComplaints);
                        }
                    }, 300);
                }
                
                showNotification('Complaint deleted successfully!', 'success');
            } else {
                showNotification('Error deleting complaint: ' + data.message, 'error');
                if (deleteBtn) {
                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> <span>Delete</span>';
                    deleteBtn.disabled = false;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error deleting complaint. Please try again.', 'error');
            if (deleteBtn) {
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> <span>Delete</span>';
                deleteBtn.disabled = false;
            }
        });
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'pending': return '#f39c12';
        case 'verifying': return '#3498db';
        case 'investigating': return '#e67e22';
        case 'resolved': return '#27ae60';
        case 'rejected': return '#e74c3c';
        default: return '#95a5a6';
    }
}

// Close notification panels when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.notification-icon')) {
        document.querySelectorAll('.notification-panel').forEach(panel => {
            panel.classList.remove('show');
        });
    }
});

// Load complaints when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const complaintsTab = document.querySelector('[data-tab="complaints"]');
    if (complaintsTab) {
        complaintsTab.addEventListener('click', loadMyComplaints);
    }
    
    // Add filter event listeners
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');
    
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
});