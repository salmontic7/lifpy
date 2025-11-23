import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, query, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// --- DOM Elements ---
const loginModal = document.getElementById('login-modal');
const loginForm = document.querySelector('#login-modal form');
const logoutBtn = document.getElementById('logout-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const prayerList = document.getElementById('prayer-list');
const accountsList = document.getElementById('accounts-list');
const transactionList = document.getElementById('transaction-list');
const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const loadingOverlay = document.getElementById('loading-overlay');


let currentUser = null;

// --- Loading Overlay ---
function forceHideLoader() {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
    }, 300); // Match animation duration
}
window.forceHideLoader = forceHideLoader;


// --- Navigation ---
const views = {
    prayer: document.getElementById('view-prayer'),
    history: document.getElementById('view-history'),
    finance: document.getElementById('view-finance')
};
const navButtons = {
    prayer: document.getElementById('nav-prayer'),
    history: document.getElementById('nav-history'),
    finance: document.getElementById('nav-finance')
}
const headerTitle = document.getElementById('header-title');
const mainHeader = document.getElementById('main-header');

function switchTab(tab) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[tab].classList.remove('hidden');

    Object.values(navButtons).forEach(b => b.classList.remove('text-emerald-600', 'text-indigo-600', 'active'));
    Object.values(navButtons).forEach(b => b.classList.add('text-slate-400'));
    
    if(tab === 'finance') {
        navButtons[tab].classList.add('text-indigo-600', 'active');
        headerTitle.classList.remove('text-emerald-600');
        headerTitle.classList.add('text-indigo-600');
        headerTitle.innerText = 'My Wallet';
        mainHeader.classList.add('border-indigo-100');
    } else {
        navButtons[tab].classList.add('text-emerald-600', 'active');
        headerTitle.classList.remove('text-indigo-600');
        headerTitle.classList.add('text-emerald-600');
        headerTitle.innerText = 'Sajda';
        mainHeader.classList.remove('border-indigo-100');
    }
}
window.switchTab = switchTab;


// --- Firebase Auth ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        document.getElementById('login-error').innerText = "Invalid credentials.";
        document.getElementById('login-error').classList.remove('hidden');
    }
});

logoutBtn.addEventListener('click', () => { 
    signOut(auth); 
    toggleSettings(); // Close settings modal on logout
});

onAuthStateChanged(auth, user => {
    forceHideLoader();
    if (user) {
        currentUser = user;
        // Update UI for logged-in user
        userEmailDisplay.innerText = user.email;
        document.getElementById('user-id-display').innerText = user.uid;
        document.getElementById('header-login-btn').classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        
        closeLoginModal();
        
        // Load user data
        loadAndListenPrayers();
        listenToFinanceData();
        switchTab('prayer');
    } else {
        // User is logged out, force login
        currentUser = null;
        
        // Reset UI to a clean logged-out state
        userEmailDisplay.innerText = 'Guest';
        document.getElementById('user-id-display').innerText = 'Not logged in';
        logoutBtn.classList.add('hidden');
        document.getElementById('header-login-btn').classList.remove('hidden');
        
        // Clear all personal data from the screen
        prayerList.innerHTML = '';
        accountsList.innerHTML = '';
        transactionList.innerHTML = '';
        updateProgress(0); // Reset progress circle
        
        // Show the login modal
        openLoginModal();
    }
});

// --- Prayer Tracker ---
const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
let selectedDate = new Date();

function changeDate(offset) {
    selectedDate.setDate(selectedDate.getDate() + offset);
    loadAndListenPrayers();
    updateDateDisplay();
}
window.changeDate = changeDate;

function updateDateDisplay() {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    document.getElementById('current-date-display').innerText = isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

async function loadAndListenPrayers() {
    if (!currentUser) {
        // Now does nothing for logged out users, preventing the empty list.
        return;
    };
    updateDateDisplay();

    const dateString = selectedDate.toISOString().slice(0, 10);
    const prayerDocRef = doc(db, 'users', currentUser.uid, 'prayers', dateString);

    onSnapshot(prayerDocRef, (docSnap) => {
        const prayerData = docSnap.exists() ? docSnap.data() : {};
        let completedCount = 0;
        prayerList.innerHTML = '';
        prayers.forEach(p => {
            const isCompleted = prayerData[p];
            if(isCompleted) completedCount++;

            const card = document.createElement('div');
            card.className = `prayer-card bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100 ${isCompleted ? 'text-emerald-600 font-bold' : 'text-slate-600'} fade-in`;
            card.innerHTML = `
                <span>${p}</span>
                <i class="fa-solid ${isCompleted ? 'fa-check-circle' : 'fa-circle'} text-xl"></i>
            `;
            card.onclick = () => togglePrayer(p, !isCompleted);
            prayerList.appendChild(card);
        });
        updateProgress(completedCount);
    });
}

// This function is no longer called but is kept to avoid breaking other parts.
function renderGuestPrayerUI() {
    prayerList.innerHTML = '';
    prayers.forEach(p => {
        const card = document.createElement('div');
        card.className = 'prayer-card bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100 text-slate-400';
        card.innerHTML = `
            <span>${p}</span>
            <i class="fa-solid fa-circle text-xl"></i>
        `;
        card.onclick = openLoginModal;
        prayerList.appendChild(card);
    });
    updateProgress(0);
}


async function togglePrayer(prayerName, isCompleted) {
    if (!currentUser) return;
    const dateString = selectedDate.toISOString().slice(0, 10);
    const prayerDocRef = doc(db, 'users', currentUser.uid, 'prayers', dateString);
    const updateData = {};
    updateData[prayerName] = isCompleted;
    await setDoc(prayerDocRef, updateData, { merge: true });
}

function updateProgress(completed) {
    const progressRing = document.getElementById('progress-ring');
    const progressText = document.getElementById('progress-text');
    const motivationalText = document.getElementById('motivational-text');
    const total = prayers.length;
    const circumference = 2 * Math.PI * 28; // 2 * pi * radius
    const offset = circumference - (completed / total) * circumference;
    
    progressRing.style.strokeDashoffset = offset;
    progressText.innerText = `${completed}/${total}`;
    
    if(completed === 0) motivationalText.innerText = "Start with Bismillah";
    else if(completed < total) motivationalText.innerText = "Keep going, you're doing great!";
    else motivationalText.innerText = "Alhamdulillah! All prayers completed.";
}


// --- Finance Tracker ---
let transactions = [];
let accounts = [];

function listenToFinanceData() {
    if (!currentUser) return;

    const accsQuery = collection(db, 'users', currentUser.uid, 'accounts');
    onSnapshot(accsQuery, (snapshot) => {
        accounts = [];
        accountsList.innerHTML = '';
        snapshot.forEach(doc => {
            const account = { id: doc.id, ...doc.data() };
            accounts.push(account);
            const div = document.createElement('div');
            div.classList.add('account-card');
            div.innerHTML = `<strong>${account.name}</strong>`;
            accountsList.appendChild(div);
        });
    });

    const transQuery = query(collection(db, 'users', currentUser.uid, 'transactions'));
    onSnapshot(transQuery, (snapshot) => {
        transactions = [];
        snapshot.docs.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        updateFinanceUI();
    });
}

window.addTransaction = async function(type, account, amount, note) {
    if (!currentUser) {
        alert("You must be logged in to add a transaction.");
        return;
    }
    await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
        type,
        account,
        amount: parseFloat(amount),
        note,
        date: new Date()
    });
}

function updateFinanceUI() {
    if (!currentUser) return;
    let income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    let expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    totalIncomeEl.innerText = `৳${income}`;
    totalExpenseEl.innerText = `৳${expense}`;
    totalBalanceEl.innerText = `৳${income - expense}`;

    transactionList.innerHTML = '';
    transactions.sort((a,b) => b.date.toDate() - a.date.toDate()).forEach(t => {
        const div = document.createElement('div');
        div.classList.add('transaction-card');
        div.innerText = `${t.account} - ${t.type} - ৳${t.amount} - ${t.note}`;
        transactionList.appendChild(div);
    });
}

// --- Modals --- 
const loginModalEl = document.getElementById('login-modal');
const settingsModalEl = document.getElementById('settings-modal');
const transactionModalEl = document.getElementById('transaction-modal');

function openLoginModal() { 
    loginModalEl.classList.remove('hidden');
    setTimeout(() => { loginModalEl.style.opacity = 1; loginModalEl.querySelector('div').style.transform = 'scale(1)'; }, 10);
}
window.openLoginModal = openLoginModal;

function closeLoginModal() {
    loginModalEl.style.opacity = 0;
    loginModalEl.querySelector('div').style.transform = 'scale(0.95)';
    setTimeout(() => { loginModalEl.classList.add('hidden'); }, 200);
}
window.closeLoginModal = closeLoginModal;

function toggleSettings() {
    const isOpen = !settingsModalEl.classList.contains('hidden');
    if(isOpen) {
        settingsModalEl.style.opacity = 0;
        settingsModalEl.querySelector('div').style.transform = 'translateY(100%)';
        setTimeout(() => { settingsModalEl.classList.add('hidden'); }, 300);
    } else {
        settingsModalEl.classList.remove('hidden');
        setTimeout(() => { 
            settingsModalEl.style.opacity = 1; 
            settingsModalEl.querySelector('div').style.transform = 'translateY(0)';
        }, 10);
    }
}
window.toggleSettings = toggleSettings;


function handleTransactionSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const type = formData.get('type');
    const amount = formData.get('amount');
    const account = formData.get('account');
    const note = formData.get('note');

    if(currentUser && amount && account) {
        addTransaction(type, account, amount, note);
        closeTransactionModal();
        event.target.reset();
    } else {
        alert('Please fill all fields');
    }
}
window.handleTransactionSubmit = handleTransactionSubmit;


function openTransactionModal() { 
    transactionModalEl.classList.remove('hidden');
    setTimeout(() => { transactionModalEl.style.opacity = 1; transactionModalEl.querySelector('div').style.transform = 'translateY(0)'; }, 10);
}
window.openTransactionModal = openTransactionModal;

function closeTransactionModal() {
    transactionModalEl.style.opacity = 0;
    transactionModalEl.querySelector('div').style.transform = 'translateY(100%)';
    setTimeout(() => { transactionModalEl.classList.add('hidden'); }, 300);
}
window.closeTransactionModal = closeTransactionModal;