import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

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

// --- Firebase Auth ---
loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginModal.classList.remove('active');
    } catch(err) {
        alert(err.message);
    }
});

logoutBtn.addEventListener('click', ()=>{ signOut(auth); });

onAuthStateChanged(auth, user=>{
    if(user){
        userEmailDisplay.innerText = user.email;
        logoutBtn.style.display = 'flex';
        loadPrayers();
        loadAccounts();
    } else {
        userEmailDisplay.innerText = 'Guest';
        logoutBtn.style.display = 'none';
        prayerList.innerHTML = '';
        accountsList.innerHTML = '';
        transactionList.innerHTML = '';
    }
});

// --- Prayer Tracker ---
const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
async function loadPrayers(){
    prayerList.innerHTML = '';
    prayers.forEach(p=>{
        const div = document.createElement('div');
        div.classList.add('prayer-card');
        div.innerHTML = `<span>${p}</span><input type="checkbox" class="prayer-checkbox">`;
        prayerList.appendChild(div);
    });
}

// --- Finance Tracker ---
let accounts = ['Bkash','Nagad','EBL','IFIC'];
let transactions = [];

function loadAccounts(){
    accountsList.innerHTML = '';
    accounts.forEach(a=>{
        const div = document.createElement('div');
        div.classList.add('account-card');
        div.innerHTML = `<strong>${a}</strong>`;
        accountsList.appendChild(div);
    });
    updateFinance();
}

function addTransaction(type, account, amount, note){
    transactions.push({type, account, amount:parseFloat(amount), note});
    updateFinance();
}

function updateFinance(){
    let income = transactions.filter(t=>t.type==='income').reduce((sum,t)=>sum+t.amount,0);
    let expense = transactions.filter(t=>t.type==='expense').reduce((sum,t)=>sum+t.amount,0);
    totalIncomeEl.innerText = `৳${income}`;
    totalExpenseEl.innerText = `৳${expense}`;
    totalBalanceEl.innerText = `৳${income-expense}`;

    transactionList.innerHTML = '';
    transactions.forEach(t=>{
        const div = document.createElement('div');
        div.classList.add('transaction-card');
        div.innerText = `${t.account} - ${t.type} - ৳${t.amount} - ${t.note}`;
        transactionList.appendChild(div);
    });
}