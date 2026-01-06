// Custom Dialog System for Application
// Matches application theme with modern design

// Dialog HTML structure
const dialogHTML = `
    <div id="custom-dialog-overlay" class="custom-dialog-overlay">
        <div class="custom-dialog">
            <div class="custom-dialog-header">
                <span class="custom-dialog-icon"></span>
                <h3 class="custom-dialog-title"></h3>
                <button class="custom-dialog-close" id="dialog-close-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="custom-dialog-body">
                <p class="custom-dialog-message"></p>
            </div>
            <div class="custom-dialog-footer">
                <button class="custom-dialog-btn custom-dialog-btn-secondary" id="dialog-cancel-btn"></button>
                <button class="custom-dialog-btn custom-dialog-btn-primary" id="dialog-confirm-btn"></button>
            </div>
        </div>
    </div>
`;

// Initialize dialog on page load
function initDialog() {
    if (!document.getElementById('custom-dialog-overlay')) {
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        setupDialogEvents();
    }
}

// Setup dialog event listeners
function setupDialogEvents() {
    const overlay = document.getElementById('custom-dialog-overlay');
    const closeBtn = document.getElementById('dialog-close-btn');
    const cancelBtn = document.getElementById('dialog-cancel-btn');

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeDialog();
        });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeDialog();
        }
    });
}

// Show dialog
function showDialog(options = {}) {
    const overlay = document.getElementById('custom-dialog-overlay');
    if (!overlay) {
        initDialog();
        setTimeout(() => showDialog(options), 10);
        return Promise.resolve(false);
    }

    const {
        type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
            title = '',
            message = '',
            confirmText = 'OK',
            cancelText = 'Cancel',
            showCancel = false,
            onConfirm = null,
            onCancel = null,
            buttons = null // Support custom buttons array
    } = options;

    const dialog = overlay.querySelector('.custom-dialog');
    const iconEl = overlay.querySelector('.custom-dialog-icon');
    const titleEl = overlay.querySelector('.custom-dialog-title');
    const messageEl = overlay.querySelector('.custom-dialog-message');
    const footerEl = overlay.querySelector('.custom-dialog-footer');
    const confirmBtn = document.getElementById('dialog-confirm-btn');
    const cancelBtn = document.getElementById('dialog-cancel-btn');

    // Set icon based on type
    iconEl.innerHTML = getIconForType(type);
    iconEl.className = `custom-dialog-icon custom-dialog-icon-${type}`;

    // Set title
    titleEl.textContent = title || getDefaultTitle(type);

    // Set message (support both text and HTML)
    if (options.allowHTML) {
        messageEl.innerHTML = message;
    } else {
        messageEl.textContent = message;
    }

    // Handle custom buttons array
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
        // Clear existing buttons
        footerEl.innerHTML = '';
        
        // Create custom buttons
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text || 'OK';
            
            // Map button classes to dialog button classes
            let btnClass = 'custom-dialog-btn';
            if (button.class) {
                if (button.class.includes('btn-primary') || button.class.includes('primary')) {
                    btnClass += ' custom-dialog-btn-primary';
                } else if (button.class.includes('btn-secondary') || button.class.includes('secondary')) {
                    btnClass += ' custom-dialog-btn-secondary';
                } else {
                    btnClass += ' ' + button.class;
                }
            } else {
                btnClass += ' custom-dialog-btn-primary';
            }
            btn.className = btnClass;
            
            // Add click handler
            btn.addEventListener('click', () => {
                if (button.onclick) {
                    button.onclick();
                } else {
                    closeDialog();
                }
            });
            
            footerEl.appendChild(btn);
        });
        
        footerEl.style.display = 'flex';
    } else {
        // Use default buttons - restore them if they were removed by custom buttons
        if (!confirmBtn || !cancelBtn) {
            footerEl.innerHTML = `
                <button class="custom-dialog-btn custom-dialog-btn-secondary" id="dialog-cancel-btn"></button>
                <button class="custom-dialog-btn custom-dialog-btn-primary" id="dialog-confirm-btn"></button>
            `;
        }
        
        // Get buttons again (they might have been restored)
        const restoredConfirmBtn = document.getElementById('dialog-confirm-btn');
        const restoredCancelBtn = document.getElementById('dialog-cancel-btn');
        
        // Make sure buttons exist before setting text
        if (restoredConfirmBtn) {
            restoredConfirmBtn.textContent = confirmText;
        }
        if (restoredCancelBtn) {
            restoredCancelBtn.textContent = cancelText;
        }

        // Show/hide footer based on type
        if (type === 'confirm' || showCancel) {
            footerEl.style.display = 'flex';
            if (restoredCancelBtn) {
                restoredCancelBtn.style.display = 'inline-flex';
            }
        } else {
            footerEl.style.display = 'flex';
            if (restoredCancelBtn) {
                restoredCancelBtn.style.display = 'none';
            }
        }

        // Remove previous event listeners by cloning
        // Only clone if buttons exist (they might be null if custom buttons were used previously)
        if (restoredConfirmBtn) {
            const clonedConfirmBtn = restoredConfirmBtn.cloneNode(true);
            restoredConfirmBtn.replaceWith(clonedConfirmBtn);
        }
        if (restoredCancelBtn) {
            const clonedCancelBtn = restoredCancelBtn.cloneNode(true);
            restoredCancelBtn.replaceWith(clonedCancelBtn);
        }

        // Add new event listeners (get buttons again after cloning)
        const finalConfirmBtn = document.getElementById('dialog-confirm-btn');
        const finalCancelBtn = document.getElementById('dialog-cancel-btn');
        
        if (finalConfirmBtn) {
            finalConfirmBtn.addEventListener('click', () => {
                closeDialog();
                if (onConfirm) onConfirm();
            });
        }

        if ((showCancel || type === 'confirm') && finalCancelBtn) {
            finalCancelBtn.addEventListener('click', () => {
                closeDialog();
                if (onCancel) onCancel();
            });
        }
    }

    // Show dialog
    overlay.classList.add('active');
    dialog.classList.add('active');

    // Return promise for confirm dialogs
    if (type === 'confirm') {
        return new Promise((resolve) => {
            const confirmBtnForPromise = document.getElementById('dialog-confirm-btn');
            const cancelBtnForPromise = document.getElementById('dialog-cancel-btn');
            
            if (confirmBtnForPromise) {
                confirmBtnForPromise.addEventListener('click', () => {
                    resolve(true);
                }, {
                    once: true
                });
            }
            if (cancelBtnForPromise) {
                cancelBtnForPromise.addEventListener('click', () => {
                    resolve(false);
                }, {
                    once: true
                });
            }
        });
    }

    return Promise.resolve(false);
}

// Close dialog
function closeDialog() {
    const overlay = document.getElementById('custom-dialog-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        const dialog = overlay.querySelector('.custom-dialog');
        if (dialog) {
            dialog.classList.remove('active');
        }
    }
}

// Get icon for dialog type
function getIconForType(type) {
    const icons = {
        info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
        success: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        confirm: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };
    return icons[type] || icons.info;
}

// Get default title for dialog type
function getDefaultTitle(type) {
    const titles = {
        info: 'Information',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
        confirm: 'Confirm'
    };
    return titles[type] || 'Information';
}

// Convenience functions
function showAlert(message, title = 'Information') {
    return showDialog({
        type: 'info',
        title,
        message
    });
}

function showSuccess(message, title = 'Success') {
    return showDialog({
        type: 'success',
        title,
        message
    });
}

function showWarning(message, title = 'Warning') {
    return showDialog({
        type: 'warning',
        title,
        message
    });
}

function showError(message, title = 'Error') {
    return showDialog({
        type: 'error',
        title,
        message
    });
}

function showConfirm(message, title = 'Confirm') {
    return showDialog({
        type: 'confirm',
        title,
        message,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });
}

// Make functions globally available
window.showDialog = showDialog;
window.showAlert = showAlert;
window.showSuccess = showSuccess;
window.showWarning = showWarning;
window.showErrorDialog = showError;
window.showConfirm = showConfirm;
window.closeDialog = closeDialog;

// Initialize immediately (for synchronous loading)
initDialog();

// Also initialize on DOM ready if DOM not ready yet
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDialog);
}