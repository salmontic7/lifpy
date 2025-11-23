import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, query, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// --- DOM Elements ---
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const prayerList = document.getElementById('prayer-list');
const accountsList = document.getElementById('accounts-list');
const transactionList = document.getElementById('transaction-list');
const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');

const prayerTabBtn = document.getElementById('prayer-tab-btn');
const financeTabBtn = document.getElementById('finance-tab-btn');
const prayerSection = document.getElementById('prayer-section');
const financeSection = document.getElementById('finance-section');

let currentUser = null;

// --- Navigation ---
prayerTabBtn.addEventListener('click', () => {
    prayerTabBtn.classList.add('active');
    financeTabBtn.classList.remove('active');
    prayerSection.classList.add('active');
    financeSection.classList.remove('active');
});

financeTabBtn.addEventListener('click', () => {
    financeTabBtn.classList.add('active');
    prayerTabBtn.classList.remove('active');
    financeSection.classList.add('active');
    prayerSection.classList.remove('active');
});


// --- Firebase Auth ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        alert(err.message);
    }
});

logoutBtn.addEventListener('click', () => { signOut(auth); });

onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        userEmailDisplay.innerText = user.email;
        logoutBtn.style.display = 'block';
        loginModal.classList.remove('active');
        loadAndListenPrayers();
        listenToFinanceData();

        // Show default tab
        prayerTabBtn.classList.add('active');
        financeTabBtn.classList.remove('active');
        prayerSection.classList.add('active');
        financeSection.classList.remove('active');

    } else {
        currentUser = null;
        userEmailDisplay.innerText = 'Guest';
        logoutBtn.style.display = 'none';
        prayerList.innerHTML = '';
        accountsList.innerHTML = '';
        transactionList.innerHTML = '';
        loginModal.classList.add('active');
    }
});

// --- Prayer Tracker ---
const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

async function loadAndListenPrayers() {
    if (!currentUser) return;

    const prayerDocRef = doc(db, 'users', currentUser.uid, 'prayers', today);

    onSnapshot(prayerDocRef, (docSnap) => {
        const prayerData = docSnap.exists() ? docSnap.data() : {};
        prayerList.innerHTML = '';
        prayers.forEach(p => {
            const div = document.createElement('div');
            div.classList.add('prayer-card');
            div.innerHTML = `<span>${p}</span><input type="checkbox" class="prayer-checkbox" data-prayer="${p}">`;
            const checkbox = div.querySelector('.prayer-checkbox');
            if (prayerData[p]) {
                checkbox.checked = true;
            }
            checkbox.addEventListener('change', async (e) => {
                const prayerName = e.target.dataset.prayer;
                const isChecked = e.target.checked;
                const updateData = {};
                updateData[prayerName] = isChecked;
                await setDoc(prayerDocRef, updateData, { merge: true });
            });
            prayerList.appendChild(div);
        });
    });
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

// This function needs to be callable from outside, e.g. from a form
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
