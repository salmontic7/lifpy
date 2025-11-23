// ================= TAB SWITCHING =================
function switchTab(tab) {
    document.querySelectorAll("main").forEach(m => m.classList.add("hidden"));
    document.getElementById(`view-${tab}`).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(`nav-${tab}`).classList.add("active");
}

// ================= MODALS =================
function openTransactionModal() {
    document.getElementById("transaction-modal").classList.remove("hidden");
}

function closeTransactionModal() {
    document.getElementById("transaction-modal").classList.add("hidden");
}

function closeLoginModal() {
    document.getElementById("login-modal").classList.add("hidden");
}

// ================= LOGIN (Placeholder) =================
function handleLoginSubmit(e) {
    e.preventDefault();
    document.getElementById("login-error").classList.remove("hidden");
}

// ================= FINANCE LOGIC =================
let transactions = [];

function submitTransaction(e) {
    e.preventDefault();

    const form = new FormData(e.target);
    const item = {
        title: form.get("title"),
        amount: parseFloat(form.get("amount")),
        type: form.get("type")
    };

    transactions.push(item);
    renderTransactions();
    closeTransactionModal();
}

function renderTransactions() {
    const list = document.getElementById("transaction-list");
    list.innerHTML = "";

    let income = 0, expense = 0;

    transactions.forEach(t => {
        const div = document.createElement("div");
        div.className = "bg-white p-4 rounded-xl shadow";
        div.innerHTML = `
            <div class="flex justify-between">
                <span>${t.title}</span>
                <span class="${t.type === "income" ? "text-emerald-600" : "text-rose-600"}">৳${t.amount}</span>
            </div>
        `;
        list.appendChild(div);

        if (t.type === "income") income += t.amount;
        else expense += t.amount;
    });

    document.getElementById("total-income").textContent = `৳${income}`;
    document.getElementById("total-expense").textContent = `৳${expense}`;
    document.getElementById("total-balance").textContent = `৳${income - expense}`;
}

function clearTransactions() {
    transactions = [];
    renderTransactions();
}