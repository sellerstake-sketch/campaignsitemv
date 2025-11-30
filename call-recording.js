// Call Recording Portal JavaScript
// Handles call link access code validation and call recording

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyApT0uj8sz3mC8bDtLQeHHodAtZlqfJDns",
    authDomain: "rajjecampaign.firebaseapp.com",
    projectId: "rajjecampaign",
    storageBucket: "rajjecampaign.firebasestorage.app",
    messagingSenderId: "480799282234",
    appId: "1:480799282234:web:a35c084610bcdfc2ed9103",
    measurementId: "G-2K7J967N1V"
};

import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp,
    updateDoc,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Global variables
let currentLinkData = null;
let linkId = null;

// Get linkId from URL
const urlParams = new URLSearchParams(window.location.search);
linkId = urlParams.get('linkId');

// Initialize call recording portal
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Call Recording] Initializing...');
    console.log('[Call Recording] Link ID from URL:', linkId);

    if (!linkId) {
        showAccessCodeError('Invalid link. No link ID found.');
        return;
    }

    // Sign in anonymously for Firestore access (required for voter queries)
    try {
        const userCredential = await signInAnonymously(auth);
        console.log('[Call Recording] Anonymous authentication successful', {
            uid: userCredential.user.uid,
            isAnonymous: userCredential.user.isAnonymous
        });
    } catch (error) {
        console.error('[Call Recording] Error signing in anonymously:', error);
        // Show error to user if anonymous auth fails
        if (error.code === 'auth/operation-not-allowed') {
            showAccessCodeError('Authentication is not enabled. Please contact your administrator.');
        } else {
            showAccessCodeError('Failed to initialize. Please check your connection and try again.');
        }
        return;
    }

    // Hide loading screen initially, show access code modal
    hideLoading();
    showAccessCodeModal();
});

// Show loading screen
function showLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

// Hide loading screen
function hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

function updateLoadingProgress(percent, subtitle = null) {
    const percentageEl = document.getElementById('loading-percentage');
    const progressBar = document.getElementById('loading-progress-bar');
    const subtitleEl = document.getElementById('loading-subtitle');

    if (percentageEl) percentageEl.textContent = `${percent}%`;
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (subtitleEl && subtitle) {
        subtitleEl.textContent = subtitle;
        subtitleEl.style.display = 'block';
    }
}

// Validate access code and load link data
async function validateAccessCode(accessCode) {
    try {
        updateLoadingProgress(20, 'Validating access code...');

        // Trim and normalize the code
        if (accessCode && typeof accessCode === 'string') {
            accessCode = accessCode.trim();
        }

        // Convert to string if it's a number
        accessCode = String(accessCode);

        // Validate code format (6 digits)
        if (!accessCode || accessCode.length !== 6 || !/^\d{6}$/.test(accessCode)) {
            hideLoading();
            showAccessCodeModal();
            showAccessCodeError('Please enter a valid 6-digit access code.');
            return;
        }

        console.log('[Call Recording] Validating access code:', accessCode);

        // Get the call link document
        const linkRef = doc(db, 'callLinks', linkId);
        const linkSnap = await getDoc(linkRef);

        if (!linkSnap.exists()) {
            console.error('[Call Recording] Link not found:', linkId);
            hideLoading();
            showAccessCodeModal();
            showAccessCodeError('Invalid link. The link may have been deleted or expired.');
            return;
        }

        const linkData = linkSnap.data();
        console.log('[Call Recording] Link data retrieved');

        // Verify access code
        if (linkData.accessCode !== accessCode) {
            console.error('[Call Recording] Invalid access code');
            hideLoading();
            showAccessCodeModal();
            showAccessCodeError('Invalid access code. Please check and try again.');
            return;
        }

        // Store link data globally
        currentLinkData = {
            linkId: linkId,
            accessCode: accessCode,
            callerNames: linkData.callerNames || [],
            campaignEmail: linkData.campaignEmail
        };

        window.callLinkData = currentLinkData;
        window.isCallLinkAccess = true;

        updateLoadingProgress(60, 'Loading call recording interface...');

        // Show call recording interface
        setTimeout(() => {
            hideLoading();
            showCallRecordingInterface();
        }, 500);

    } catch (error) {
        console.error('[Call Recording] Error validating access code:', error);
        hideLoading();
        showAccessCodeModal();
        showAccessCodeError('Failed to validate access code. Please try again.');
    }
}

// Show call recording interface
async function showCallRecordingInterface() {
    const modal = document.getElementById('access-code-modal');
    const container = document.getElementById('call-recording-container');
    const mainContent = document.getElementById('call-recording-main');

    if (modal) modal.style.display = 'none';
    if (container) container.style.display = 'block';

    // Load call form (await to ensure it completes)
    if (mainContent && currentLinkData) {
        await loadCallForm(mainContent);
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to exit?')) {
                window.location.href = 'index.html';
            }
        });
    }
}

// Load call form
async function loadCallForm(container) {
    if (!currentLinkData || !currentLinkData.callerNames || currentLinkData.callerNames.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: var(--text-light); font-size: 16px;">No caller names configured for this link.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: var(--text-color); font-family: 'Poppins', sans-serif;">Record a Call</h2>
            <p style="margin: 0; color: var(--text-light); font-size: 14px;">Fill in the details below to record a call</p>
        </div>

        <form id="call-recording-form" class="modal-form">
            <div class="form-group" style="position: relative;">
                <label for="call-voter-name">Voter Name *</label>
                <input type="text" id="call-voter-name" name="call-voter-name" placeholder="Search voter by name, ID, phone..." autocomplete="off" required>
                <input type="hidden" id="call-voter-id-hidden" name="call-voter-id-hidden">
                <div id="call-voter-dropdown" class="dropdown-list" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 2px solid var(--border-color); border-radius: 12px; max-height: 300px; overflow-y: auto; z-index: 1000; margin-top: 5px; box-shadow: var(--shadow-lg);">
                    <!-- Dropdown options will be populated here -->
                </div>
                <small style="color: var(--text-light); font-size: 12px; margin-top: 5px; display: block;">Start typing to search for a voter</small>
            </div>

            <div class="form-group">
                <label for="call-voter-id">Voter ID</label>
                <input type="text" id="call-voter-id" name="call-voter-id" readonly class="readonly-input">
            </div>

            <div class="form-group">
                <label for="call-voter-phone">Phone Number</label>
                <input type="tel" id="call-voter-phone" name="call-voter-phone" readonly class="readonly-input">
            </div>

            <div class="form-group">
                <label for="call-voter-island">Island</label>
                <input type="text" id="call-voter-island" name="call-voter-island" readonly class="readonly-input">
            </div>

            <div class="form-group">
                <label for="call-voter-address">Address</label>
                <input type="text" id="call-voter-address" name="call-voter-address" readonly class="readonly-input">
            </div>

            <div class="form-group">
                <label for="call-caller-name">Caller Name *</label>
                <select id="call-caller-name-dropdown" name="call-caller-name" required style="width: 100%; padding: 12px 16px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif; color: var(--text-color); background: var(--white); transition: var(--transition); box-sizing: border-box;">
                    <option value="">Select caller name</option>
                    ${currentLinkData.callerNames.map(name => `<option value="${name}">${name}</option>`).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="call-date">Call Date *</label>
                <input type="date" id="call-date" name="call-date" required>
            </div>

            <div class="form-group">
                <label for="call-status">Call Status *</label>
                <select id="call-status" name="call-status" required>
                    <option value="">Select status</option>
                    <option value="answered">Answered</option>
                    <option value="no-answer">No Answer</option>
                    <option value="busy">Busy</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            <div class="form-group">
                <label for="call-notes">Notes</label>
                <textarea id="call-notes" name="call-notes" rows="4" placeholder="Enter any additional notes about the call"></textarea>
            </div>

            <div id="call-recording-error" class="error-message" style="display: none;"></div>

            <div class="modal-footer" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <button type="button" class="btn-secondary btn-compact" onclick="resetCallForm()">Clear</button>
                <button type="submit" class="btn-primary btn-compact">Record Call</button>
            </div>
        </form>
    `;

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('call-date');
    if (dateInput) {
        dateInput.value = today;
    }

    // Setup voter name search (await to ensure voters are loaded)
    await setupVoterSearch();

    // Setup form submission
    const form = document.getElementById('call-recording-form');
    if (form) {
        form.addEventListener('submit', handleCallSubmission);
    }
}

// Global variable to store all voters
let allVotersForCall = [];

// Setup voter search with dropdown
async function setupVoterSearch() {
    const voterInput = document.getElementById('call-voter-name');
    const voterDropdown = document.getElementById('call-voter-dropdown');
    const voterIdInput = document.getElementById('call-voter-id');
    const voterPhoneInput = document.getElementById('call-voter-phone');
    const voterIslandInput = document.getElementById('call-voter-island');
    const voterAddressInput = document.getElementById('call-voter-address');
    const voterIdHidden = document.getElementById('call-voter-id-hidden');

    if (!voterInput || !voterDropdown) return;

    // Load all voters for the campaign
    await loadVotersForCall();

    // Debounce function for search
    let searchTimeout;

    function debounceSearch(func, delay) {
        return function(...args) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Filter and display voters
    function filterVoters(searchTerm) {
        console.log('[Call Recording] Filtering voters with term:', searchTerm);
        console.log('[Call Recording] Total voters available:', allVotersForCall.length);

        if (!searchTerm || searchTerm.trim() === '') {
            voterDropdown.style.display = 'none';
            return;
        }

        const term = searchTerm.toLowerCase().trim();
        const filtered = allVotersForCall.filter(voter => {
            const name = (voter.name || '').toLowerCase();
            const voterId = (voter.voterId || voter.idNumber || '').toLowerCase();
            const phone = (voter.phone || voter.phoneNumber || voter.mobile || '').toLowerCase();
            const island = (voter.island || voter.constituency || '').toLowerCase();
            const address = (voter.address || voter.permanentAddress || '').toLowerCase();

            return name.includes(term) ||
                voterId.includes(term) ||
                phone.includes(term) ||
                island.includes(term) ||
                address.includes(term);
        }).slice(0, 20); // Limit to 20 results for performance

        console.log('[Call Recording] Filtered voters:', filtered.length);

        if (filtered.length === 0) {
            voterDropdown.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-light);">No voters found</div>';
            voterDropdown.style.display = 'block';
            return;
        }

        // Render dropdown options
        voterDropdown.innerHTML = filtered.map(voter => {
            const name = voter.name || 'N/A';
            const idNumber = voter.voterId || voter.idNumber || 'N/A';
            const phone = voter.phone || voter.phoneNumber || voter.mobile || '';
            const island = voter.island || voter.constituency || '';
            const address = (voter.address || voter.permanentAddress || '').replace(/"/g, '&quot;');

            return `
                <div class="dropdown-option" 
                     data-voter-id="${voter.id}" 
                     data-voter-name="${name.replace(/"/g, '&quot;')}" 
                     data-voter-idnumber="${idNumber}" 
                     data-voter-phone="${phone}" 
                     data-voter-island="${island}" 
                     data-voter-address="${address}" 
                     style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border-light); transition: background 0.2s;">
                    <div style="font-weight: 600; color: var(--text-color); margin-bottom: 4px;">${name}</div>
                    <div style="font-size: 12px; color: var(--text-light);">
                        ID: ${idNumber}${phone ? ` • Phone: ${phone}` : ''}${island ? ` • ${island}` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        voterDropdown.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', () => {
                const voterId = option.dataset.voterId;
                const voterName = option.dataset.voterName;
                const voterIdNumber = option.dataset.voterIdnumber;
                const voterPhone = option.dataset.voterPhone || '';
                const voterIsland = option.dataset.voterIsland || '';
                const voterAddress = option.dataset.voterAddress || '';

                // Fill all form fields
                voterInput.value = voterName;
                if (voterIdInput) voterIdInput.value = voterIdNumber;
                if (voterPhoneInput) voterPhoneInput.value = voterPhone;
                if (voterIslandInput) voterIslandInput.value = voterIsland;
                if (voterAddressInput) voterAddressInput.value = voterAddress;
                if (voterIdHidden) voterIdHidden.value = voterId;

                voterDropdown.style.display = 'none';
            });

            option.addEventListener('mouseenter', () => {
                option.style.background = 'var(--light-color)';
            });
            option.addEventListener('mouseleave', () => {
                option.style.background = 'white';
            });
        });

        voterDropdown.style.display = 'block';
    }

    // Search input handler with debounce
    const debouncedFilter = debounceSearch(filterVoters, 300);

    // Remove any existing listeners by cloning the input
    const newVoterInput = voterInput.cloneNode(true);
    voterInput.parentNode.replaceChild(newVoterInput, voterInput);
    const updatedVoterInput = document.getElementById('call-voter-name');

    if (updatedVoterInput) {
        updatedVoterInput.addEventListener('input', (e) => {
            console.log('[Call Recording] Search input changed:', e.target.value);
            debouncedFilter(e.target.value);
        });

        updatedVoterInput.addEventListener('focus', () => {
            console.log('[Call Recording] Voter input focused');
            if (updatedVoterInput.value.trim()) {
                filterVoters(updatedVoterInput.value);
            }
        });
    }

    // Close dropdown when clicking outside
    const clickOutsideHandler = (e) => {
        const updatedInput = document.getElementById('call-voter-name');
        const updatedDropdown = document.getElementById('call-voter-dropdown');
        if (updatedInput && updatedDropdown &&
            !updatedInput.contains(e.target) &&
            !updatedDropdown.contains(e.target)) {
            updatedDropdown.style.display = 'none';
        }
    };

    // Use a single document-level listener
    document.removeEventListener('click', clickOutsideHandler); // Remove if exists
    document.addEventListener('click', clickOutsideHandler);

    console.log('[Call Recording] Voter search setup completed. Voters loaded:', allVotersForCall.length);
}

// Load all voters for the campaign
async function loadVotersForCall() {
    try {
        if (!currentLinkData || !currentLinkData.campaignEmail) {
            console.warn('[Call Recording] No campaign email available for voter loading');
            allVotersForCall = [];
            return;
        }

        console.log('[Call Recording] Loading voters for campaign:', currentLinkData.campaignEmail);

        const {
            collection,
            query,
            where,
            getDocs
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const votersQuery = query(
            collection(db, 'voters'),
            where('campaignEmail', '==', currentLinkData.campaignEmail)
        );

        const snapshot = await getDocs(votersQuery);
        console.log('[Call Recording] Voters query result:', snapshot.size, 'documents');

        allVotersForCall = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'N/A',
                voterId: data.voterId || data.idNumber || '',
                idNumber: data.idNumber || data.voterId || '',
                phone: data.phone || data.phoneNumber || data.mobile || data.contact || data.number || '',
                island: data.island || data.constituency || '',
                address: data.address || data.permanentAddress || data.location || ''
            };
        });

        console.log(`[Call Recording] Successfully loaded ${allVotersForCall.length} voters for campaign`);

        if (allVotersForCall.length === 0) {
            console.warn('[Call Recording] No voters found for this campaign. Check if campaignEmail matches.');
        }
    } catch (error) {
        console.error('[Call Recording] Error loading voters:', error);
        console.error('[Call Recording] Error details:', error.message, error.code);
        allVotersForCall = [];

        // Show user-friendly error if possible
        if (window.showError) {
            window.showError('Failed to load voters. Please check your connection and try again.', 'Error');
        }
    }
}

// Handle call submission
async function handleCallSubmission(e) {
    e.preventDefault();

    const form = e.target;
    const errorDiv = document.getElementById('call-recording-error');
    errorDiv.style.display = 'none';

    const formData = new FormData(form);
    const voterName = formData.get('call-voter-name');
    const callerName = formData.get('call-caller-name');
    const callDate = formData.get('call-date');
    const callStatus = formData.get('call-status');
    const callNotes = formData.get('call-notes');
    const voterId = formData.get('call-voter-id');
    const voterDocumentId = formData.get('call-voter-id-hidden');
    const voterPhone = formData.get('call-voter-phone');
    const voterIsland = formData.get('call-voter-island');
    const voterAddress = formData.get('call-voter-address');

    if (!voterName || !voterName.trim()) {
        showFormError('Voter name is required.');
        return;
    }

    if (!callerName || !callerName.trim()) {
        showFormError('Caller name is required.');
        return;
    }

    if (!callStatus || !callStatus.trim()) {
        showFormError('Call status is required.');
        return;
    }

    try {
        updateLoadingProgress(50, 'Recording call...');

        const callData = {
            voterName: voterName.trim(),
            voterId: voterId || '',
            voterDocumentId: voterDocumentId || '',
            phone: voterPhone || '',
            island: voterIsland || '',
            address: voterAddress || '',
            caller: callerName.trim(),
            callDate: callDate ? new Date(callDate) : serverTimestamp(),
            status: callStatus.trim(),
            notes: callNotes || '',
            campaignEmail: currentLinkData.campaignEmail,
            callLinkId: linkId,
            createdAt: serverTimestamp()
        };

        // Save call to Firestore
        const callsRef = collection(db, 'calls');
        await addDoc(callsRef, callData);

        // Increment call count for the link
        const linkRef = doc(db, 'callLinks', linkId);
        await updateDoc(linkRef, {
            callsMade: increment(1)
        });

        updateLoadingProgress(100, 'Call recorded successfully!');

        // Show success and reset form
        setTimeout(() => {
            hideLoading();
            if (window.showSuccess) {
                window.showSuccess('Call recorded successfully!', 'Success');
            } else {
                alert('Call recorded successfully!');
            }
            resetCallForm();
        }, 500);

    } catch (error) {
        console.error('[Call Recording] Error recording call:', error);
        hideLoading();
        showFormError('Failed to record call. Please try again.');
    }
}

// Reset call form
function resetCallForm() {
    const form = document.getElementById('call-recording-form');
    if (form) {
        form.reset();
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('call-date');
        if (dateInput) {
            dateInput.value = today;
        }
        // Clear error
        const errorDiv = document.getElementById('call-recording-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
}

// Show form error
function showFormError(message) {
    const errorDiv = document.getElementById('call-recording-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Show access code verification modal
function showAccessCodeModal() {
    const modal = document.getElementById('access-code-modal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Clear input
    const input = document.getElementById('access-code-input');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
    }

    // Hide any previous errors
    hideAccessCodeError();

    // Handle form submission
    const form = document.getElementById('access-code-form');
    if (form) {
        // Remove existing listeners by cloning
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Add new listener
        const updatedForm = document.getElementById('access-code-form');
        const updatedInput = document.getElementById('access-code-input');

        updatedForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let code = updatedInput.value.trim();
            code = code.replace(/\D/g, ''); // Remove non-digits

            if (code.length > 6) {
                code = code.substring(0, 6);
                updatedInput.value = code;
            }

            if (code.length === 6 && /^\d{6}$/.test(code)) {
                modal.style.display = 'none';
                showLoading();
                hideAccessCodeError();
                await validateAccessCode(code);
            } else {
                showAccessCodeError('Please enter a valid 6-digit code');
            }
        });

        // Auto-submit on 6 digits entered
        if (updatedInput) {
            updatedInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 6) {
                    value = value.substring(0, 6);
                }
                e.target.value = value;
            });

            updatedInput.addEventListener('input', (e) => {
                const code = e.target.value.trim();
                if (code.length === 6 && /^\d{6}$/.test(code)) {
                    setTimeout(() => {
                        updatedForm.dispatchEvent(new Event('submit'));
                    }, 300);
                }
            });
        }
    }
}

// Show access code error
function showAccessCodeError(message) {
    const errorEl = document.getElementById('access-code-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Hide access code error
function hideAccessCodeError() {
    const errorEl = document.getElementById('access-code-error');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}