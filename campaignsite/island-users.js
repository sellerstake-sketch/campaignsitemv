// Island User Management Functions

// Load island users
async function loadIslandUsers() {
    if (!window.db || !window.userEmail) {
        console.error('Cannot load island users: db or userEmail not available');
        const tbody = document.getElementById('island-users-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--danger-color);">Database not initialized. Please refresh the page.</td></tr>';
        }
        return;
    }

    // Check if user is an island user - island users shouldn't access this page
    if (window.isIslandUser) {
        const tbody = document.getElementById('island-users-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--danger-color);">Access denied. Island users cannot manage other users.</td></tr>';
        }
        return;
    }

    const tbody = document.getElementById('island-users-table-body');
    if (!tbody) {
        console.warn('Island users table body not found');
        return;
    }
    
    // Show loading state
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light);">Loading users...</td></tr>';

    try {
        const {
            collection,
            query,
            where,
            getDocs,
            orderBy
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        let snapshot;
        
        // Try query with orderBy first (requires index)
        try {
            const islandUsersQuery = query(
                collection(window.db, 'islandUsers'),
                where('campaignEmail', '==', window.userEmail),
                orderBy('createdAt', 'desc')
            );
            snapshot = await getDocs(islandUsersQuery);
        } catch (orderByError) {
            // If orderBy fails (index not deployed), try without orderBy
            if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
                console.warn('Index not found, querying without orderBy:', orderByError);
                const islandUsersQuery = query(
                    collection(window.db, 'islandUsers'),
                    where('campaignEmail', '==', window.userEmail)
                );
                snapshot = await getDocs(islandUsersQuery);
                
                // Sort client-side by createdAt if available
                const users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Sort by createdAt descending (newest first)
                users.sort((a, b) => {
                    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds || 0) * 1000;
                    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds || 0) * 1000;
                    return bTime - aTime; // Descending order
                });
                
                renderIslandUsersTable(users);
                return;
            } else {
                throw orderByError;
            }
        }

        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderIslandUsersTable(users);
    } catch (error) {
        console.error('Error loading island users:', error);
        
        // Show more specific error message
        let errorMessage = 'Error loading users';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check Firestore rules.';
        } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
        }
        
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--danger-color);">${errorMessage}</td></tr>`;
    }
}

// Render island users table
function renderIslandUsersTable(users) {
    const tbody = document.getElementById('island-users-table-body');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light);">No island users added yet</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${user.constituency || 'N/A'}</td>
            <td>${user.island || 'N/A'}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" title="Refresh Password" onclick="refreshIslandUserPassword('${user.id}', '${user.email}')" style="color: var(--primary-color);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                    <button class="icon-btn" title="Edit" onclick="editIslandUser('${user.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn" title="Delete" onclick="deleteIslandUser('${user.id}')" style="color: var(--danger-color);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Open island user modal
function openIslandUserModal(userId = null) {
    if (window.openModal) {
        window.openModal('island-user', userId);
        
        // Setup island dropdown - use longer timeout to ensure it runs after any other initialization
        setTimeout(() => {
            setupIslandUserIslandDropdown();
            
            // Multiple aggressive checks to ensure field stays enabled
            const enableIslandField = () => {
                const islandSelect = document.getElementById('island-user-island');
                if (islandSelect) {
                    islandSelect.disabled = false;
                    islandSelect.removeAttribute('disabled');
                    islandSelect.removeAttribute('readonly');
                    islandSelect.style.cursor = 'pointer';
                    islandSelect.style.opacity = '1';
                    islandSelect.style.pointerEvents = 'auto';
                    islandSelect.setAttribute('aria-disabled', 'false');
                    islandSelect.title = '';
                }
            };
            
            // Check immediately
            enableIslandField();
            
            // Check after 50ms
            setTimeout(enableIslandField, 50);
            
            // Check after 100ms
            setTimeout(enableIslandField, 100);
            
            // Check after 200ms (in case of very slow scripts)
            setTimeout(enableIslandField, 200);
            
            // Check after 500ms (catch any late-running scripts)
            setTimeout(enableIslandField, 500);
            
            // If editing, populate form (this will hide password field)
            if (userId) {
                populateIslandUserEditForm(userId);
                // Re-enable after form population
                setTimeout(enableIslandField, 150);
            } else {
                // When creating, ensure password field is visible
                const passwordGroup = document.getElementById('island-user-password-group');
                if (passwordGroup) {
                    passwordGroup.style.display = 'block';
                }
                const passwordField = document.getElementById('island-user-password');
                if (passwordField) {
                    passwordField.setAttribute('required', 'required');
                    passwordField.value = '';
                }
            }
        }, 100);
    }
}

// Setup island dropdown for island user form
function setupIslandUserIslandDropdown() {
    const islandSelect = document.getElementById('island-user-island');
    if (!islandSelect) return;

    const constituency = window.campaignData && window.campaignData.constituency ? window.campaignData.constituency : '';
    
    // For island users, show only their designated island
    if (window.isIslandUser && window.islandUserData && window.islandUserData.island) {
        const designatedIsland = window.islandUserData.island;
        islandSelect.innerHTML = '<option value="">Select island</option>';
        const option = document.createElement('option');
        option.value = designatedIsland;
        option.textContent = designatedIsland;
        option.selected = true; // Pre-select the designated island
        islandSelect.appendChild(option);
    } else if (constituency && window.maldivesData && window.maldivesData.constituencyIslands && window.maldivesData.constituencyIslands[constituency]) {
        // For campaign managers, show all islands in the constituency
        const islands = window.maldivesData.constituencyIslands[constituency];
        islandSelect.innerHTML = '<option value="">Select island</option>';
        islands.sort().forEach(island => {
            const option = document.createElement('option');
            option.value = island;
            option.textContent = island;
            islandSelect.appendChild(option);
        });
    } else {
        islandSelect.innerHTML = '<option value="">Select island</option>';
    }
    
    // AGGRESSIVELY ENSURE FIELD IS ALWAYS ENABLED - NO EXCEPTIONS
    // Force enable the field immediately and remove all possible disabling mechanisms
    islandSelect.disabled = false;
    islandSelect.removeAttribute('disabled');
    islandSelect.removeAttribute('readonly');
    islandSelect.style.cursor = 'pointer';
    islandSelect.style.opacity = '1';
    islandSelect.style.pointerEvents = 'auto';
    islandSelect.title = '';
    islandSelect.setAttribute('aria-disabled', 'false');
    
    // Setup MutationObserver to watch for any disabled attribute changes and immediately revert them
    // This aggressively prevents any code from disabling this field
    if (!islandSelect._disableWatcher) {
        islandSelect._disableWatcher = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && (mutation.attributeName === 'disabled' || mutation.attributeName === 'readonly')) {
                    if (islandSelect.hasAttribute('disabled') || islandSelect.disabled) {
                        console.log('[Island User Modal] Detected disabled attribute change, re-enabling island-user-island field');
                        islandSelect.disabled = false;
                        islandSelect.removeAttribute('disabled');
                        islandSelect.removeAttribute('readonly');
                        islandSelect.style.cursor = 'pointer';
                        islandSelect.style.opacity = '1';
                        islandSelect.style.pointerEvents = 'auto';
                        islandSelect.setAttribute('aria-disabled', 'false');
                    }
                }
            });
        });
        islandSelect._disableWatcher.observe(islandSelect, {
            attributes: true,
            attributeFilter: ['disabled', 'readonly', 'style'],
            attributeOldValue: true
        });
    }
    
    // Also set up a periodic check as a backup (runs every 100ms for 2 seconds)
    if (!islandSelect._enableInterval) {
        let checkCount = 0;
        const maxChecks = 20; // 2 seconds at 100ms intervals
        islandSelect._enableInterval = setInterval(() => {
            if (islandSelect.disabled || islandSelect.hasAttribute('disabled')) {
                console.log('[Island User Modal] Periodic check detected disabled field, re-enabling');
                islandSelect.disabled = false;
                islandSelect.removeAttribute('disabled');
                islandSelect.removeAttribute('readonly');
                islandSelect.style.cursor = 'pointer';
                islandSelect.style.opacity = '1';
                islandSelect.style.pointerEvents = 'auto';
            }
            checkCount++;
            if (checkCount >= maxChecks) {
                clearInterval(islandSelect._enableInterval);
                islandSelect._enableInterval = null;
            }
        }, 100);
    }
}

// Populate island user edit form
async function populateIslandUserEditForm(userId) {
    if (!window.db) return;

    try {
        const {
            doc,
            getDoc
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const userRef = doc(window.db, 'islandUsers', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            if (window.showErrorDialog) {
                window.showErrorDialog('User not found.', 'Error');
            }
            return;
        }

        const data = userSnap.data();

        // Verify the user belongs to the current campaign
        if (data.campaignEmail !== window.userEmail) {
            if (window.showErrorDialog) {
                window.showErrorDialog('You do not have permission to edit this user.', 'Access Denied');
            }
            return;
        }

        // Set form dataset
        const form = document.getElementById('modal-form');
        if (form) {
            form.dataset.editIslandUserId = userId;
        }

        // Update modal title
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Island User';
        }

        // Hide password field when editing (password cannot be changed here, use refresh password feature)
        const passwordGroup = document.getElementById('island-user-password-group');
        if (passwordGroup) {
            passwordGroup.style.display = 'none';
        }
        const passwordField = document.getElementById('island-user-password');
        if (passwordField) {
            passwordField.removeAttribute('required');
            passwordField.value = '';
        }

        // Populate form fields
        const nameField = document.getElementById('island-user-name');
        const emailField = document.getElementById('island-user-email');
        const phoneField = document.getElementById('island-user-phone');
        const constituencyField = document.getElementById('island-user-constituency');
        const islandField = document.getElementById('island-user-island');

        if (nameField) nameField.value = data.name || '';
        if (emailField) emailField.value = data.email || '';
        if (phoneField) phoneField.value = data.phone || '';
        if (constituencyField) constituencyField.value = data.constituency || (window.campaignData && window.campaignData.constituency ? window.campaignData.constituency : '');
        
        // Setup island dropdown and set value
        if (islandField) {
            setupIslandUserIslandDropdown();
            setTimeout(() => {
                if (islandField && data.island) {
                    islandField.value = data.island;
                }
                // AGGRESSIVELY ENSURE FIELD STAYS ENABLED AFTER SETTING VALUE
                islandField.disabled = false;
                islandField.removeAttribute('disabled');
                islandField.removeAttribute('readonly');
                islandField.style.cursor = 'pointer';
                islandField.style.opacity = '1';
                islandField.style.pointerEvents = 'auto';
                islandField.setAttribute('aria-disabled', 'false');
            }, 100);
            // Also check after longer delay to catch any late-running scripts
            setTimeout(() => {
                if (islandField) {
                    islandField.disabled = false;
                    islandField.removeAttribute('disabled');
                    islandField.removeAttribute('readonly');
                    islandField.style.cursor = 'pointer';
                    islandField.style.opacity = '1';
                    islandField.style.pointerEvents = 'auto';
                }
            }, 300);
        }
    } catch (error) {
        console.error('Error loading island user for edit:', error);
        if (window.showErrorDialog) {
            window.showErrorDialog('Failed to load user. Please try again.', 'Error');
        }
    }
}

// Edit island user
window.editIslandUser = async function(userId) {
    openIslandUserModal(userId);
};

// Delete island user
window.deleteIslandUser = async function(userId) {
    if (!window.db || !window.userEmail) {
        if (window.showErrorDialog) {
            window.showErrorDialog('Database not initialized. Please refresh the page.');
        }
        return;
    }

    // Use custom confirm dialog
    let confirmed = false;
    if (window.showConfirm) {
        try {
            confirmed = await window.showConfirm(
                'Are you sure you want to delete this island user? This action cannot be undone.',
                'Delete Island User'
            );
        } catch (error) {
            console.error('Error showing confirm dialog:', error);
            confirmed = false;
        }
    } else {
        // Fallback to browser confirm if custom dialog not available
        confirmed = confirm('Are you sure you want to delete this island user? This action cannot be undone.');
    }
    
    if (!confirmed) {
        return;
    }

    try {
        const {
            doc,
            getDoc,
            deleteDoc
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const userRef = doc(window.db, 'islandUsers', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            if (window.showErrorDialog) {
                window.showErrorDialog('User not found.', 'Error');
            }
            return;
        }

        const userData = userSnap.data();

        // Verify the user belongs to the current campaign
        if (userData.campaignEmail !== window.userEmail) {
            if (window.showErrorDialog) {
                window.showErrorDialog('You do not have permission to delete this user.', 'Access Denied');
            }
            return;
        }

        await deleteDoc(userRef);

        if (window.showSuccess) {
            window.showSuccess('Island user deleted successfully!', 'Success');
        }

        // Reload users table
        loadIslandUsers();
    } catch (error) {
        console.error('Error deleting island user:', error);
        if (window.showErrorDialog) {
            window.showErrorDialog('Failed to delete user. Please try again.', 'Error');
        }
    }
};

// Refresh island user password
window.refreshIslandUserPassword = async function(userId, userEmail) {
    if (!window.db || !window.userEmail) {
        if (window.showErrorDialog) {
            window.showErrorDialog('Database not initialized. Please refresh the page.');
        }
        return;
    }

    // Use custom confirm dialog
    let confirmed = false;
    if (window.showConfirm) {
        try {
            confirmed = await window.showConfirm(
                'Are you sure you want to generate a new temporary password for this user? The old password will no longer work.',
                'Refresh Password'
            );
        } catch (error) {
            console.error('Error showing confirm dialog:', error);
            confirmed = false;
        }
    } else {
        // Fallback to browser confirm if custom dialog not available
        confirmed = confirm('Are you sure you want to generate a new temporary password for this user? The old password will no longer work.');
    }
    
    if (!confirmed) {
        return;
    }

    try {
        const {
            doc,
            getDoc,
            updateDoc,
            serverTimestamp
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const {
            getAuth,
            updatePassword,
            signInWithEmailAndPassword
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

        // Get user document
        const userRef = doc(window.db, 'islandUsers', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            if (window.showErrorDialog) {
                window.showErrorDialog('User not found.', 'Error');
            }
            return;
        }

        const userData = userSnap.data();

        // Verify the user belongs to the current campaign
        if (userData.campaignEmail !== window.userEmail) {
            if (window.showErrorDialog) {
                window.showErrorDialog('You do not have permission to update this user.', 'Access Denied');
            }
            return;
        }

        // Get the old password from Firestore before updating
        const oldPassword = userData.tempPassword;
        
        if (!oldPassword) {
            if (window.showErrorDialog) {
                window.showErrorDialog('Cannot refresh password: Old password not found in database. Please contact support.', 'Error');
            }
            return;
        }

        // Generate new temporary password
        const newPassword = generateIslandUserPassword(12);

        // Update password in Firebase Auth
        const firebaseAuth = getAuth();
        
        // Store current user before attempting password update
        const currentUserBeforeUpdate = firebaseAuth.currentUser;
        const currentUserEmail = currentUserBeforeUpdate?.email;
        
        // Set flag to prevent auth state handler from processing during password update
        window.isCreatingIslandUser = true;
        
        let authUpdateSuccess = false;
        
        try {
            // Sign in as the island user with the old password
            await signInWithEmailAndPassword(firebaseAuth, userEmail, oldPassword);
            
            // Update the password to the new one
            const { updatePassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const currentAuthUser = firebaseAuth.currentUser;
            if (currentAuthUser) {
                await updatePassword(currentAuthUser, newPassword);
                authUpdateSuccess = true;
            }
            
            // Sign out the island user
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            await signOut(firebaseAuth);
            
            // Wait a moment for sign out to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // If we had a previous user session, try to restore it
            // Note: This won't work without the password, but at least we tried
            // The campaign manager will need to sign in again manually
            
        } catch (authError) {
            console.error('Error updating Firebase Auth password:', authError);
            
            // If sign-in fails, the old password doesn't match what's in Firebase Auth
            // This could happen if:
            // 1. The password was changed manually in Firebase Console
            // 2. The password in Firestore is incorrect
            // 3. The user changed their password themselves
            
            if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
                // Old password doesn't work - we can't update Auth, but we'll still update Firestore
                // Show a warning that the user will need password reset
                console.warn('Old password does not match Firebase Auth. Cannot update Auth password. User will need password reset.');
            } else {
                // Other error - log it but continue
                console.error('Unexpected error updating password:', authError);
            }
        } finally {
            window.isCreatingIslandUser = false;
        }
        
        // Update Firestore document with new password (always do this, even if Auth update failed)
        await updateDoc(userRef, {
            tempPassword: newPassword,
            passwordGeneratedAt: serverTimestamp()
        });
        
        // Build dialog message based on whether Auth update succeeded
        let dialogMessage = `
            <div style="padding: 20px 0;">
                <p style="margin-bottom: 16px; font-size: 14px; color: var(--text-color);">A new temporary password has been generated for this user:</p>
                <div style="background: var(--light-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-light); margin-bottom: 4px; text-transform: uppercase;">Email</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="text" id="refresh-email-display" value="${userEmail}" readonly style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: white; font-family: monospace; font-size: 13px; cursor: text;">
                            <button onclick="copyRefreshEmail()" class="icon-btn-sm" title="Copy Email" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; background: white; cursor: pointer;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-light); margin-bottom: 4px; text-transform: uppercase;">New Temporary Password</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="text" id="refresh-password-display" value="${newPassword}" readonly style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: white; font-family: monospace; font-size: 13px; cursor: text;">
                            <button onclick="copyRefreshPassword()" class="icon-btn-sm" title="Copy Password" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; background: white; cursor: pointer;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>`;
        
        if (!authUpdateSuccess) {
            dialogMessage += `
                <div style="background: #ff9800; color: white; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">⚠️ Important Notice</p>
                    <p style="font-size: 12px; margin: 0;">The password has been updated in the database, but could not be updated in the authentication system because the old password did not match. The user will need to use the "Forgot Password" feature to reset their password, or you may need to update it manually in Firebase Console.</p>
                </div>`;
        }
        
        dialogMessage += `
                <p style="font-size: 12px; color: var(--text-light); margin: 0;">⚠️ Please save these credentials. The password will not be shown again.</p>`;
        
        if (authUpdateSuccess) {
            dialogMessage += `
                <p style="font-size: 11px; color: var(--warning-color); margin-top: 8px; margin-bottom: 0;">Note: The user will need to use this password to log in. If they are currently logged in, they will need to log out and log back in with the new password.</p>`;
        }
        
        dialogMessage += `
            </div>
        `;

        // Show new password to campaign manager
        if (window.showDialog) {
            window.showDialog({
                type: 'info',
                title: 'Password Refreshed',
                allowHTML: true,
                message: dialogMessage,
                buttons: [
                    {
                        text: 'Close',
                        class: 'btn-primary',
                        onclick: () => {
                            if (window.closeDialog) window.closeDialog();
                        }
                    }
                ]
            });
        }

        // Store password temporarily for copy functions
        window.refreshPasswordData = {
            email: userEmail,
            password: newPassword
        };

        // Reload users table
        loadIslandUsers();
    } catch (error) {
        console.error('Error refreshing password:', error);
        if (window.showErrorDialog) {
            window.showErrorDialog('Failed to refresh password. Please try again.', 'Error');
        }
    }
};

// Generate random password for island users
function generateIslandUserPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Copy refresh email
window.copyRefreshEmail = function() {
    if (window.refreshPasswordData) {
        const emailInput = document.getElementById('refresh-email-display');
        if (emailInput) {
            emailInput.select();
            document.execCommand('copy');
            if (window.showSuccess) {
                window.showSuccess('Email copied to clipboard!', 'Copied');
            }
        }
    }
};

// Copy refresh password
window.copyRefreshPassword = function() {
    if (window.refreshPasswordData) {
        const passwordInput = document.getElementById('refresh-password-display');
        if (passwordInput) {
            passwordInput.select();
            document.execCommand('copy');
            if (window.showSuccess) {
                window.showSuccess('Password copied to clipboard!', 'Copied');
            }
        }
    }
};

// Expose functions globally
window.loadIslandUsers = loadIslandUsers;
window.openIslandUserModal = openIslandUserModal;
window.setupIslandUserIslandDropdown = setupIslandUserIslandDropdown;
window.editIslandUser = editIslandUser;
window.deleteIslandUser = deleteIslandUser;

