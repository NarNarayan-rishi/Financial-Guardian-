// --- DOM Elements ---
const form = document.getElementById('transactionForm');
const currencyInput = document.getElementById('currencyInput');
const dispRev = document.getElementById('totalRevenueDisplay');
const dispExp = document.getElementById('totalExpenseDisplay');
const dispNet = document.getElementById('netBalanceDisplay');
const historyList = document.getElementById('historyList');
const advisorContent = document.getElementById('advisorContent');
const transType = document.getElementById('transType');
const expectedDateGroup = document.getElementById('expectedDateGroup');
const gstCheckboxRow = document.getElementById('gstCheckboxRow');
const generateGstCheckbox = document.getElementById('generateGstInvoice');
const welcomeOverlay = document.getElementById('welcomeOverlay');
const btnEnterApp = document.getElementById('btnEnterApp');
const notificationModal = document.getElementById('notificationModal');
const notificationContent = document.getElementById('notificationContent');
const gstModal = document.getElementById('gstModal');
const gstModalContent = document.getElementById('gstModalContent');
const presetChips = document.getElementById('presetChips');
const newPresetInput = document.getElementById('newPresetInput');
const newPresetPrice = document.getElementById('newPresetPrice');
const addPresetBtn = document.getElementById('addPresetBtn');
const transDesc = document.getElementById('transDesc');
const suggestionsList = document.getElementById('suggestionsList');
const transQty = document.getElementById('transQty');
const transUnitPrice = document.getElementById('transUnitPrice');
const calcTotalDisplay = document.getElementById('calcTotalDisplay');
let chartInstance = null;
let pieChartInstance = null;

// --- Balance Visibility ---
let balanceHidden = localStorage.getItem('fg_balHidden') === 'true';

function applyBalanceVisibility() {
    const amounts = document.querySelectorAll('#totalRevenueDisplay, #totalExpenseDisplay, #netBalanceDisplay, #futurePayDisplay, #pendingReceiveDisplay');
    amounts.forEach(el => {
        el.style.filter = balanceHidden ? 'blur(8px)' : 'none';
        el.style.userSelect = balanceHidden ? 'none' : '';
    });
    const btn = document.getElementById('balanceToggleBtn');
    if (btn) btn.innerHTML = balanceHidden 
        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}
window.toggleBalanceVisibility = function() {
    balanceHidden = !balanceHidden;
    localStorage.setItem('fg_balHidden', balanceHidden);
    applyBalanceVisibility();
};

// --- Partial Payments ---
let partialPayTarget = null;

window.openPartialPayment = function(id) {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;
    
    // Legacy support: apply old partialPayments directly to amount
    if (t.partialPayments && t.partialPayments.length > 0) {
        const legacyPaid = t.partialPayments.reduce((s, p) => s + p.amount, 0);
        t.amount = Math.max(0, t.amount - legacyPaid);
        if (t.qty === 1) t.unitPrice = t.amount;
        t.partialPayments = []; // Clear
        saveData();
    }

    partialPayTarget = t;
    const remaining = t.amount;
    const isReceive = t.type === 'pending';
    document.getElementById('partialPayTitle').textContent = isReceive ? 'Record Amount Received' : 'Record Amount Paid';
    document.getElementById('partialPayLabel').textContent = isReceive ? 'Amount Received' : 'Amount Paid';
    document.getElementById('partialPayInfo').textContent = `Total Remaining: ${formatMoney(remaining)}`;
    document.getElementById('partialPayAmount').value = '';
    document.getElementById('partialNextDateGroup').style.display = 'none';
    
    const btn = document.querySelector('#partialPayModal .btn-primary');
    btn.textContent = 'Submit';
    btn.onclick = submitPartialPayment;
    
    document.getElementById('partialPayModal').style.display = 'flex';
};

window.submitPartialPayment = function() {
    if (!partialPayTarget) return;
    const amt = parseFloat(document.getElementById('partialPayAmount').value);
    if (!amt || amt <= 0) { alert('Enter a valid amount.'); return; }
    
    if (amt > partialPayTarget.amount) {
        alert('Amount exceeds the remaining balance.');
        return;
    }

    const remaining = partialPayTarget.amount - amt;
    
    // 1. Create a new transaction for the paid amount (Revenue or Expense)
    const paidType = partialPayTarget.type === 'pending' ? 'revenue' : 'expense';
    const newTx = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        type: paidType,
        desc: `[Partial] ${partialPayTarget.desc}`,
        qty: 1,
        unitPrice: amt,
        amount: amt,
        paymentMethod: partialPayTarget.paymentMethod || 'offline',
        status: paidType === 'revenue' ? 'received' : 'paid',
        category: partialPayTarget.category || 'other'
    };
    transactions.push(newTx);

    // 2. Reduce the original transaction amount to remain as unpaid
    partialPayTarget.amount = remaining;
    if (partialPayTarget.qty === 1) {
        partialPayTarget.unitPrice = remaining;
    }

    if (remaining <= 0.01) {
        // Fully settled - Mark the original (now 0 amount) transaction as resolved
        partialPayTarget.status = partialPayTarget.type === 'pending' ? 'received' : 'paid';
        document.getElementById('partialPayModal').style.display = 'none';
        saveData(); updateDashboard();
    } else {
        // Ask for next expected date for the remaining unpaid amount
        document.getElementById('partialNextDateGroup').style.display = 'block';
        document.getElementById('partialPayInfo').textContent = `Remaining unpaid: ${formatMoney(remaining)}. Enter next expected date:`;
        
        const btn = document.querySelector('#partialPayModal .btn-primary');
        btn.textContent = 'Confirm Next Date';
        btn.onclick = function() {
            const nextDate = document.getElementById('partialNextDate').value;
            if (!nextDate) { alert('Enter next expected date.'); return; }
            partialPayTarget.expectedDate = nextDate;
            saveData(); updateDashboard();
            document.getElementById('partialPayModal').style.display = 'none';
            btn.textContent = 'Submit';
            btn.onclick = submitPartialPayment;
        };
        // Save intermediate state in case they reload
        saveData(); updateDashboard();
    }
};

// --- Mode Logic ---
window.cycleQuickMode = function() {
    const current = localStorage.getItem('fg_mode') || 'business';
    let nextMode = 'business';
    if (current === 'business') nextMode = 'employee';
    else if (current === 'employee') nextMode = 'student';
    else if (current === 'student') nextMode = 'business';
    
    localStorage.setItem('fg_mode', nextMode);
    applyMode(nextMode);
    
    const status = document.createElement('div');
    status.style = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--neon-green); color:#000; padding:10px 20px; border-radius:20px; z-index:10000; font-weight:bold;';
    status.innerText = 'Mode Changed to ' + (nextMode.charAt(0).toUpperCase() + nextMode.slice(1));
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 2000);
};

window.selectMode = function(mode) {
    localStorage.setItem('fg_mode', mode);
    document.getElementById('modeSelectModal').style.display = 'none';
    applyMode(mode);
    proceedWithNotifications();
};

function applyMode(mode) {
    if (!mode) mode = localStorage.getItem('fg_mode') || 'business';
    const isBusiness = mode === 'business';
    const isEmployee = mode === 'employee';
    const isStudent  = mode === 'student';

    const qBtn = document.getElementById('quickModeBtn');
    if (qBtn) {
        if (isBusiness) { qBtn.innerHTML = '🏢'; qBtn.title = "Business Mode (Click to switch)"; }
        else if (isEmployee) { qBtn.innerHTML = '👔'; qBtn.title = "Employee Mode (Click to switch)"; }
        else if (isStudent) { qBtn.innerHTML = '🎓'; qBtn.title = "Student Mode (Click to switch)"; }
    }

    // GST invoice checkbox — only business
    const gstRow = document.getElementById('gstCheckboxRow');
    if (gstRow) gstRow.style.display = isBusiness ? 'flex' : 'none';

    // Quantity row — hide for employee & student
    const qtyFormRow = document.querySelector('.form-row[data-qty-row]');
    if (qtyFormRow) qtyFormRow.style.display = (isEmployee || isStudent) ? 'none' : '';

    // Transaction Type options
    const transTypeEl = document.getElementById('transType');
    if (transTypeEl) {
        // "Payment yet to be received" — hidden for student
        const pendingOpt = transTypeEl.querySelector('option[value="pending"]');
        if (pendingOpt) pendingOpt.style.display = isStudent ? 'none' : '';
        
        // If current selection is now hidden, reset to revenue
        const selected = transTypeEl.value;
        if (isStudent && selected === 'pending') {
            transTypeEl.value = 'revenue';
            if (window.toggleExpectedDate) toggleExpectedDate();
        }
    }
    
    // Preset Type options
    const newPresetTypeEl = document.getElementById('newPresetType');
    if (newPresetTypeEl) {
        const pendingPresetOpt = newPresetTypeEl.querySelector('option[value="pending"]');
        if (pendingPresetOpt) pendingPresetOpt.style.display = isStudent ? 'none' : '';
        
        if (isStudent && newPresetTypeEl.value === 'pending') {
            newPresetTypeEl.value = 'revenue';
        }
    }
}

// --- Quantity × Price live total ---
function updateCalcTotal() {
    const qty = parseFloat(transQty.value) || 0;
    const price = parseFloat(transUnitPrice.value) || 0;
    calcTotalDisplay.textContent = formatMoney(qty * price);
}
transQty.addEventListener('input', updateCalcTotal);
transUnitPrice.addEventListener('input', updateCalcTotal);

// --- Calculator ---
const calcDisplay = document.getElementById('calcDisplay');
const btnCalc = document.getElementById('btnCalc');
const calcModal = document.getElementById('calcModal');

btnCalc.addEventListener('click', () => {
    calcModal.style.display = 'flex';
    calcDisplay.value = '';
});

window.calcInput = function(val) {
    calcDisplay.value += val;
};
window.calcClear = function() {
    calcDisplay.value = '';
};
window.calcEval = function() {
    try {
        let expr = calcDisplay.value;
        expr = expr.replace(/(\d+\.?\d*)%/g, '($1/100)');
        calcDisplay.value = eval(expr);
    } catch(e) {
        calcDisplay.value = 'Error';
    }
};

document.addEventListener('keydown', (e) => {
    if (calcModal.style.display === 'flex' || calcModal.style.display === 'block') {
        const key = e.key;
        if (/[0-9\+\-\*\/\.\%\(\)]/.test(key)) {
            calcInput(key);
            e.preventDefault();
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calcEval();
        } else if (key === 'Escape') {
            calcModal.style.display = 'none';
            e.preventDefault();
        } else if (key === 'Backspace') {
            calcDisplay.value = calcDisplay.value.slice(0, -1);
            e.preventDefault();
        } else if (key === 'Delete') {
            calcClear();
            e.preventDefault();
        }
    }
});

// --- Initialization & Notifications ---
btnEnterApp.addEventListener('click', () => {
    localStorage.setItem('fg_tos_accepted', 'true');
    welcomeOverlay.style.display = 'none';
    
    if (!localStorage.getItem('fg_mode') && !localStorage.getItem('fg_tour_seen')) {
        document.getElementById('modeSelectModal').style.display = 'flex';
        return;
    }
    
    proceedWithNotifications();
});

function proceedWithNotifications() {
    const mode = localStorage.getItem('fg_mode') || 'business';
    const isStudent = mode === 'student';
    const todayStr = new Date().toISOString().split('T')[0];

    // Students don't get pending payment popups
    if (isStudent) {
        init();
        return;
    }

    const wasPro = localStorage.getItem('fg_was_pro') === 'true';
    const isNowPro = isProUser();
    localStorage.setItem('fg_was_pro', isNowPro ? 'true' : 'false');

    if (wasPro && !isNowPro) {
        init();
        if (typeof showPaywall === 'function') {
            showPaywall('Pro Subscription / Trial Expired');
        }
        return;
    }

    if (!isNowPro) {
        init();
        return;
    }

    const pendingAlerts = transactions.filter(t =>
        (t.type === 'pending' || t.type === 'futurepay') && t.status === 'awaiting' && t.expectedDate <= todayStr
    );
    if (pendingAlerts.length > 0) {
        playSound('warning');
        showPendingListNotification(pendingAlerts);
    } else {
        playSound('pleasant');
        notificationContent.innerHTML = `
            <h2>All Clear</h2>
            <p>No pending payments are due today.</p>
            <div class="modal-actions">
                <button class="btn-primary" onclick="closeNotification()">Excellent</button>
            </div>`;
        notificationModal.style.display = 'flex';
    }
    init();
}

function showPendingListNotification(pendingList) {
    let listHtml = '<div class="pending-list">';
    pendingList.forEach(t => {
        const isReceive = t.type === 'pending';
        const labelStr = isReceive ? 'Payment to Receive' : 'Payment Due';
        const okStr = isReceive ? 'Received' : 'Mark as Paid';
        const failStr = isReceive ? 'Not Received' : 'Not Paid';
        const okStatus = isReceive ? 'received' : 'paid';
        
        const tagText = isReceive ? 'Have to receive' : 'Have to give';
        const tagColor = isReceive ? 'var(--neon-blue)' : 'var(--neon-yellow)';
        const tagHtml = `<span style="display:inline-block; margin-right: 0.5rem; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; background: ${tagColor}; color: #111;">${tagText}</span>`;
        
        listHtml += `
            <div class="pending-list-item">
                <div class="pending-info">
                    <p style="display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap;">${tagHtml} <strong>${t.desc}</strong> — ${formatMoney(t.amount)}</p>
                    <span>${labelStr}. Due: ${formatDateDisplay(t.expectedDate)}</span>
                </div>
                <div class="pending-actions">
                    <button class="btn-primary" style="background:var(--neon-green);padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="resolvePending(${t.id},'${okStatus}')">${okStr}</button>
                    <button class="btn-primary" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="openPartialPayment(${t.id})">Partial</button>
                    <button class="btn-danger" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="resolvePending(${t.id},'loss')">${failStr}</button>
                </div>
            </div>`;
    });
    listHtml += '</div>';
    notificationContent.innerHTML = `
        <h2 style="color:var(--neon-red);">⚠ Pending Payments Due</h2>
        <p>You have <strong>${pendingList.length}</strong> payment(s) expected by today:</p>
        ${listHtml}
        <div class="modal-actions">
            <button class="btn-primary" onclick="closeNotification()">I'll handle them later</button>
        </div>`;
    notificationModal.style.display = 'flex';
}

window.resolvePending = function(id, newStatus) {
    const t = transactions.find(tx => tx.id === id);
    if (t) { t.status = newStatus; saveData(); updateDashboard(); }
    const todayStr = new Date().toISOString().split('T')[0];
    const remaining = transactions.filter(tx => (tx.type === 'pending' || tx.type === 'futurepay') && tx.status === 'awaiting' && tx.expectedDate <= todayStr);
    if (remaining.length > 0) showPendingListNotification(remaining);
    else closeNotification();
};
window.closeNotification = function() { 
    notificationModal.style.display = 'none'; 
    if (transactions.length === 0 && !localStorage.getItem('fg_tour_seen')) {
        setTimeout(startTour, 400);
    }
};

window.toggleExpectedDate = function() {
    if (transType.value === 'pending' || transType.value === 'futurepay') {
        expectedDateGroup.style.display = 'block';
        document.getElementById('expectedDate').required = true;
    } else {
        expectedDateGroup.style.display = 'none';
        document.getElementById('expectedDate').required = false;
    }
    // GST invoice option is always visible for all transaction types
    gstCheckboxRow.style.display = 'flex';
};

window.toggleCategory = function() {
    const catSelect = document.getElementById('transCategory');
    const btn = document.getElementById('toggleCategoryBtn');
    if (catSelect.style.display === 'none') {
        catSelect.style.display = 'block';
        btn.textContent = '- Remove Category';
        btn.style.color = 'var(--neon-red)';
    } else {
        catSelect.style.display = 'none';
        btn.textContent = '+ Add Category';
        btn.style.color = 'var(--neon-blue)';
        catSelect.value = 'other'; // reset
    }
};

function init() {
    const dInput = document.getElementById('transDate');
    const expectedDateInput = document.getElementById('expectedDate');
    const todayStr = new Date().toISOString().split('T')[0];
    dInput.value = todayStr;
    dInput.min = todayStr;
    if (expectedDateInput) expectedDateInput.min = todayStr;
    currencyInput.value = currentCurrencyCode;
    applySharedFontSize();
    renderPresets();
    applyMode();
    applyBalanceVisibility();
    updateDashboard();
}

// --- Presets (with price) ---
function renderPresets() {
    if (!isProUser()) {
        presetChips.innerHTML = '<div style="color:var(--neon-blue);cursor:pointer;padding:0.5rem;border:1px dashed var(--neon-blue);border-radius:4px;text-align:center;font-size:0.9rem;" onclick="showPaywall(\'Quick Presets\')">🔒 Quick Presets are a Pro Feature. Click to Upgrade!</div>';
        return;
    }
    presetChips.innerHTML = '';
    const topDescs = getTopDescriptions(3);
    const allPresetNames = presets.map(p => (typeof p === 'object') ? p.name : p);
    const combined = [...new Set([...allPresetNames, ...topDescs])];
    combined.forEach(name => {
        const chip = document.createElement('span');
        chip.className = 'preset-chip';
        const presetObj = presets.find(p => (typeof p === 'object' ? p.name : p) === name);
        const isUserPreset = !!presetObj;
        const price = (presetObj && typeof presetObj === 'object') ? presetObj.price : null;
        chip.innerHTML = `${name}${price ? ' <small style="opacity:0.7">(' + formatMoney(price) + ')</small>' : ''}${presetObj && typeof presetObj === 'object' && presetObj.type ? ' <small style="opacity:0.5;font-size:0.7em">[' + presetObj.type + ']</small>' : ''}${isUserPreset ? '<span class="remove-preset" data-preset="' + name + '">×</span>' : ''}`;
        chip.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-preset')) {
                presets = presets.filter(pr => (typeof pr === 'object' ? pr.name : pr) !== e.target.dataset.preset);
                savePresets();
                renderPresets();
                return;
            }
            transDesc.value = name;
            if (price) { transUnitPrice.value = price; updateCalcTotal(); }
            // Apply saved type if preset has one
            if (presetObj && typeof presetObj === 'object' && presetObj.type) {
                transType.value = presetObj.type;
                toggleExpectedDate();
            }
            transDesc.focus();
        });
        presetChips.appendChild(chip);
    });
}

addPresetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isProUser()) {
        showPaywall('Create Custom Presets');
        return;
    }
    const val = newPresetInput.value.trim();
    const price = parseFloat(newPresetPrice.value) || null;
    const type = document.getElementById('newPresetType')?.value || null;
    if (val) {
        const existing = presets.find(p => (typeof p === 'object' ? p.name : p) === val);
        if (!existing) {
            presets.push({ name: val, price, type });
            savePresets();
            renderPresets();
            newPresetInput.value = '';
            newPresetPrice.value = '';
        }
    }
});

// --- Autocomplete ---
transDesc.addEventListener('input', () => {
    const val = transDesc.value.trim().toLowerCase();
    if (val.length < 1) { suggestionsList.classList.remove('active'); return; }
    const topDescs = getTopDescriptions(10);
    const presetNames = presets.map(p => typeof p === 'object' ? p.name : p);
    const allSuggestions = [...new Set([...presetNames, ...topDescs])];
    const filtered = allSuggestions.filter(s => s.toLowerCase().includes(val));
    if (filtered.length === 0) { suggestionsList.classList.remove('active'); return; }
    suggestionsList.innerHTML = '';
    filtered.forEach(s => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = s;
        item.addEventListener('click', () => {
            transDesc.value = s;
            const presetObj = presets.find(p => (typeof p === 'object' ? p.name : p) === s);
            if (presetObj && typeof presetObj === 'object' && presetObj.price) {
                transUnitPrice.value = presetObj.price;
                updateCalcTotal();
            }
            suggestionsList.classList.remove('active');
        });
        suggestionsList.appendChild(item);
    });
    suggestionsList.classList.add('active');
});
document.addEventListener('click', (e) => { if (!e.target.closest('.desc-wrapper')) suggestionsList.classList.remove('active'); });

// --- Form Submit ---
let pendingTransData = null;

function saveTransaction(record) {
    transactions.push(record);
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    trackDescription(record.desc);
    saveData();
    updateDashboard();
    renderPresets();
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const type = transType.value;
    
    if (type === 'pending' && !isProUser()) {
        const pendingCount = transactions.filter(t => t.type === 'pending').length;
        if (pendingCount >= 3) {
            showPaywall('Unlimited Pending Transactions (Free tier is limited to 3)');
            return;
        }
    }
    const date = document.getElementById('transDate').value;
    const time = new Date().toLocaleTimeString();
    const qty = parseInt(transQty.value) || 1;
    const unitPrice = parseFloat(transUnitPrice.value);
    const amount = qty * unitPrice;
    const desc = transDesc.value;
    const catSelect = document.getElementById('transCategory');
    const category = catSelect.style.display === 'none' ? 'other' : catSelect.value;
    const pmRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = pmRadio ? pmRadio.value : 'online';
    
    let expectedDate = null, status = null;
    if (type === 'pending' || type === 'futurepay') { expectedDate = document.getElementById('expectedDate').value; status = 'awaiting'; }
    const record = { id: Date.now(), date, time, type, amount, desc, category, expectedDate, status, qty, unitPrice, paymentMethod };
    
    const shouldGst = generateGstCheckbox.checked;
    
    if (shouldGst) {
        pendingTransData = record;
        showGstInvoiceForm(record);
    } else {
        saveTransaction(record);
    }
    
    const dateKeep = document.getElementById('transDate').value;
    form.reset();
    transQty.value = 1;
    document.getElementById('transDate').value = dateKeep;
    
    // Reset category toggle
    document.getElementById('transCategory').style.display = 'none';
    document.getElementById('toggleCategoryBtn').textContent = '+ Add Category';
    document.getElementById('toggleCategoryBtn').style.color = 'var(--neon-blue)';

    toggleExpectedDate();
    calcTotalDisplay.textContent = formatMoney(0);
});

currencyInput.addEventListener('input', function(e) {
    currentCurrencyCode = e.target.value.toUpperCase();
    localStorage.setItem('fg_currency', currentCurrencyCode);
    updateDashboard();
});


// ================= GST INVOICE (Multi-product, auto-detect, professional) =================

let gstInvoiceItems = [];

function showGstInvoiceForm(transData = null) {
    if (!isProUser()) {
        const gstCount = (localStorage.getItem('fg_gst_count') ? parseInt(localStorage.getItem('fg_gst_count')) : 0);
        if (gstCount >= 10) {
            showPaywall('Unlimited GST Invoices (Free tier is limited to 10)');
            return;
        }
    }

    if (transData) {
        pendingTransData = transData;
        gstInvoiceItems = [{
            desc: transData.desc,
            hsn: '',
            qty: parseFloat(transData.qty) || 1,
            unitPrice: parseFloat(transData.unitPrice) || 0,
            gstRate: detectGstRate(transData.desc),
            discount: 0
        }];
    }
    renderGstForm(getProfile());
}

function renderGstForm(profile) {
    let itemsHtml = '';
    gstInvoiceItems.forEach((item, i) => {
        itemsHtml += `
        <div style="border:1px solid var(--panel-border);border-radius:8px;padding:0.8rem;margin-bottom:0.8rem;">
            <div class="form-row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0.5rem;">
                <div class="form-group"><label>Product</label><input type="text" value="${item.desc}" onchange="gstInvoiceItems[${i}].desc=this.value; gstInvoiceItems[${i}].gstRate=detectGstRate(this.value); renderGstForm(getProfile())"></div>
                <div class="form-group"><label>HSN/SAC</label><input type="text" value="${item.hsn || ''}" onchange="gstInvoiceItems[${i}].hsn=this.value"></div>
                <div class="form-group"><label>Qty</label><input type="number" value="${item.qty}" min="1" onchange="gstInvoiceItems[${i}].qty=parseInt(this.value)||1"></div>
                <div class="form-group"><label>Unit Price</label><input type="number" value="${item.unitPrice}" min="0" step="0.01" onchange="gstInvoiceItems[${i}].unitPrice=parseFloat(this.value)||0"></div>
            </div>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;">
                <div class="form-group">
                    <label>GST % <small>(auto-detected)</small></label>
                    <input type="number" value="${item.gstRate}" min="0" max="40" onchange="gstInvoiceItems[${i}].gstRate=parseFloat(this.value)||0">
                    <label style="font-size:0.8rem;display:flex;align-items:center;gap:0.3rem;margin-top:0.3rem;"><input type="checkbox" id="disableGst_${i}" ${item.gstRate===0?'checked':''} onchange="if(this.checked){gstInvoiceItems[${i}].gstRate=0;}else{gstInvoiceItems[${i}].gstRate=detectGstRate(gstInvoiceItems[${i}].desc);} renderGstForm(getProfile())"> Disable GST (set to 0%)</label>
                </div>
                <div class="form-group"><label>Discount</label><input type="number" value="${item.discount}" min="0" step="0.01" onchange="gstInvoiceItems[${i}].discount=parseFloat(this.value)||0"></div>
                <div style="display:flex;align-items:flex-end;"><button class="btn-danger" style="padding:0.4rem;font-size:0.8rem;margin:0;margin-bottom:1.5rem;" onclick="gstInvoiceItems.splice(${i},1);renderGstForm(getProfile())">Remove</button></div>
            </div>
        </div>`;
    });

    const presetCps = presets.map(p => {
        const name = typeof p === 'object' ? p.name : p;
        const price = (typeof p === 'object') ? p.price : null;
        return `<span style="cursor:pointer;padding:0.2rem 0.6rem;background:var(--panel-border);border-radius:20px;font-size:0.8rem;margin:0.2rem;display:inline-block;" onclick="gstInvoiceItems.push({desc:'${name}',hsn:'',qty:1,unitPrice:${price||0},gstRate:detectGstRate('${name}'),discount:0});renderGstForm(getProfile())">${name}${price?' ('+formatMoney(price)+')':''}</span>`;
    }).join('');

    const newInvNo = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${new Date().toTimeString().slice(0,8).replace(/:/g,'')}`;

    gstModalContent.innerHTML = `
        <h2>Generate GST Invoice</h2>
        <p style="font-size:0.85rem;color:var(--text-muted);">
            <a href="https://www.bajajfinserv.in/gst-rates-in-india" target="_blank" style="color:var(--neon-blue);">📋 View GST rates on all products (Bajaj Finance)</a>
        </p>
        <div class="gst-form" style="text-align:left;">
            <h3 style="color:var(--neon-blue);font-size:0.9rem;margin-bottom:0.5rem;">BUYER / RECEIVER DETAILS</h3>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                <div class="form-group"><label>Buyer Name</label><input type="text" id="gstBuyerName" placeholder="Buyer / Client" oninput="this.value = this.value.replace(/[^a-zA-Z\\s]/g, '')"></div>
                <div class="form-group"><label>Buyer GSTIN</label><input type="text" id="gstBuyerGst" placeholder="GSTIN (optional)" style="text-transform:uppercase;"></div>
            </div>
            <div style="margin-bottom:0.5rem;margin-top:1rem;"><strong style="font-size:0.8rem;">Presets:</strong> ${presetCps || '<span style="color:var(--text-muted);font-size:0.8rem;">No presets saved</span>'}</div>
            <h3 style="color:var(--neon-blue);font-size:0.9rem;margin:0.5rem 0 0.5rem;">ITEMS</h3>
            ${itemsHtml}
            <button class="btn-icon" style="width:100%;margin-bottom:1rem;" onclick="gstInvoiceItems.push({desc:'',hsn:'',qty:1,unitPrice:0,gstRate:18,discount:0});renderGstForm(getProfile())">+ Add Another Product</button>
            <div class="form-group"><label>Invoice No</label><input type="text" id="gstInvoiceNo" value="${newInvNo}"></div>
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="generateFinalInvoice()">Generate Invoice</button>
            <button class="btn-danger" onclick="closeGstModal()">Cancel</button>
        </div>`;
    gstModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.generateFinalInvoice = function() {
    const profile = getProfile();
    const buyerName = document.getElementById('gstBuyerName').value || 'N/A';
    const buyerGst = document.getElementById('gstBuyerGst').value || '';
    const invoiceNo = document.getElementById('gstInvoiceNo').value;
    const today = formatDateDisplay(new Date().toISOString().split('T')[0]);

    let rowsHtml = '';
    let grandTotal = 0, totalTax = 0, totalDiscount = 0;
    gstInvoiceItems.forEach((item, i) => {
        const lineTotal = item.qty * item.unitPrice;
        const discAmt = item.discount || 0;
        const taxable = lineTotal - discAmt;
        const gstAmt = taxable * (item.gstRate / 100);
        const cgst = gstAmt / 2;
        const sgst = gstAmt / 2;
        const itemTotal = taxable + gstAmt;
        grandTotal += itemTotal;
        totalTax += gstAmt;
        totalDiscount += discAmt;
        rowsHtml += `<tr>
            <td>${i+1}</td><td>${item.desc}</td><td>${item.hsn || '-'}</td><td>${item.qty}</td>
            <td>${formatMoney(item.unitPrice)}</td><td>${formatMoney(discAmt)}</td>
            <td>${item.gstRate}%</td><td>${formatMoney(cgst)}</td><td>${formatMoney(sgst)}</td>
            <td><strong>${formatMoney(itemTotal)}</strong></td></tr>`;
    });

    let paymentStatusHtml = '';
    let signatureHtml = '<p style="border-top:1px solid #999;padding-top:0.3rem;">Signature & Stamp</p>';

    if (pendingTransData && pendingTransData.type === 'pending') {
        const expectedDateDisp = formatDateDisplay(pendingTransData.expectedDate);
        paymentStatusHtml = `<p style="text-align:center;color:var(--neon-red);font-weight:bold;margin-bottom:0.2rem;">PAYMENT STATUS: NOT MADE YET</p>
                             <p style="text-align:center;font-size:0.9rem;margin-bottom:1rem;">Expected Date of Payment: ${expectedDateDisp}</p>`;
        signatureHtml = '<p style="border-top:1px solid #999;padding-top:0.3rem;">Sign only if payment received</p>';
    }

    const invoiceHtml = `
    <div class="invoice-preview" id="invoicePreview" 
         data-invoice-no="${invoiceNo}"
         data-buyer-name="${buyerName}"
         data-total-tax="${totalTax}"
         data-grand-total="${grandTotal}"
         data-date="${new Date().toISOString()}">
        <h2 style="text-align:center;border:none;margin-bottom:0;">${profile.profCompanyName || 'Your Company Name'}</h2>
        <p style="text-align:center;font-size:0.85rem;margin:0.2rem 0;">${profile.profAddress || 'Address'} | Phone: ${profile.profPhone || ''} | Email: ${profile.profEmail || ''}</p>
        <p style="text-align:center;font-size:0.85rem;margin:0 0 0.5rem;"><strong>GSTIN:</strong> ${(profile.profGstin || 'N/A').toUpperCase()}</p>
        <hr>
        ${paymentStatusHtml}
        <h2 style="text-align:center;">TAX INVOICE</h2>
        <p><strong>Invoice No:</strong> ${invoiceNo} &nbsp;|&nbsp; <strong>Date:</strong> ${today}</p>
        <p><strong>Bill To:</strong> ${buyerName} ${buyerGst ? '&nbsp;|&nbsp; <strong>GSTIN:</strong> ' + buyerGst.toUpperCase() : ''}</p>
        <table>
            <thead><tr><th>#</th><th>Description</th><th>HSN/SAC</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        ${totalDiscount > 0 ? '<p><strong>Total Discount:</strong> ' + formatMoney(totalDiscount) + '</p>' : ''}
        <p><strong>Total Tax (GST):</strong> ${formatMoney(totalTax)}</p>
        <p style="font-size:1.1rem;"><strong>Grand Total: ${formatMoney(grandTotal)}</strong></p>
        <hr style="margin:1.5rem 0;">
        <table style="width:100%;border:none;">
            <tr>
                <td style="border:1px solid #ccc;padding:0.5rem;vertical-align:top;width:50%;">
                    <strong>Bank Details</strong><br>
                    Bank: ${profile.profBankName || '___'}<br>
                    A/C No: ${profile.profAccountNo || '___'}<br>
                    IFSC: ${(profile.profIfsc || '___').toUpperCase()}<br>
                    Name: ${profile.profAccHolder || '___'}
                </td>
                <td style="border:none;width:50%;"></td>
            </tr>
        </table>
        <div style="display:flex;justify-content:space-between;margin-top:2rem;">
            <div style="text-align:center;">
                <br><br><br><br>
                <p><strong>${profile.profCompanyName || 'Company Name'}</strong></p>
                <br><br><br><br>
                <p style="border-top:1px solid #999;padding-top:0.3rem;">Authorised Signatory</p>
            </div>
            <div style="text-align:center;">
                <br><br><br><br>
                <p><strong>Receiver / Buyer</strong></p>
                <br><br><br><br>
                ${signatureHtml}
            </div>
        </div>
        <p style="text-align:center; font-size: 0.75rem; color: var(--text-muted); margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed var(--panel-border);">Generated instantly via Financial Guardian.</p>
    </div>
    <div class="modal-actions" style="margin-top:1rem;">
        <button class="btn-primary" onclick="printInvoice()">Print</button>
        <button class="btn-danger" onclick="closeGstModal()">Cancel</button>
        <a href="gst_invoices.html" class="btn-primary" style="background: var(--text-muted); color: var(--bg-dark); text-decoration: none;">View in Invoices</a>
    </div>`;
    
    // Save items if not already saved
    if (pendingTransData) {
        gstInvoiceItems.forEach((item, index) => {
            const discAmt = item.discount || 0;
            const taxable = (item.qty * item.unitPrice) - discAmt;
            const gstAmt = taxable * (item.gstRate / 100);
            const itemTotal = taxable + gstAmt;
            
            const tr = {
                id: Date.now() + index,
                date: pendingTransData.date,
                time: pendingTransData.time,
                type: pendingTransData.type,
                qty: item.qty,
                unitPrice: item.unitPrice,
                amount: itemTotal,
                desc: item.desc,
                status: pendingTransData.status,
                expectedDate: pendingTransData.expectedDate,
                invoiceNo: invoiceNo,
                gstAmt: gstAmt,
                buyerName: buyerName
            };
            transactions.push(tr);
            trackDescription(item.desc);
        });
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveData();
        updateDashboard();
        renderPresets();
        pendingTransData = null; // Mark as saved
    }

    gstModalContent.innerHTML = invoiceHtml;
    saveGstHistory(document.getElementById('invoicePreview'), 'saved');
};



window.printInvoice = function() {
    const invoiceEl = document.getElementById('invoicePreview');
    const printWin = window.open('', '_blank');
    printWin.document.write(`<html><head><title>GST Invoice</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        body{font-family:'Outfit',sans-serif;padding:1.5rem;color:#111;}
        h2{border-bottom:2px solid #111;padding-bottom:0.5rem;}
        table{width:100%;border-collapse:collapse;margin:1rem 0;}
        th,td{border:1px solid #ccc;padding:0.5rem;text-align:left;font-size:0.85rem;}
        th{background:#f3f4f6;}
        @media print{@page{margin:0.5in;}}
    </style></head><body>${invoiceEl.innerHTML}</body></html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 500);
};

function saveGstHistory(invoiceEl, saveMode) {
    if (!invoiceEl) return;
    const history = JSON.parse(localStorage.getItem('fg_gst_history')) || [];
    
    // Prevent saving duplicates if user clicks button multiple times
    const invoiceNo = invoiceEl.dataset.invoiceNo;
    if (history.find(h => h.invoiceNo === invoiceNo)) return;

    history.push({
        invoiceNo: invoiceNo,
        buyerName: invoiceEl.dataset.buyerName,
        totalTax: parseFloat(invoiceEl.dataset.totalTax),
        grandTotal: parseFloat(invoiceEl.dataset.grandTotal),
        date: invoiceEl.dataset.date,
        saveMode: saveMode,
        htmlContent: invoiceEl.innerHTML
    });
    localStorage.setItem('fg_gst_history', JSON.stringify(history));
    
    let gstCount = (localStorage.getItem('fg_gst_count') ? parseInt(localStorage.getItem('fg_gst_count')) : 0);
    localStorage.setItem('fg_gst_count', gstCount + 1);
}

window.closeGstModal = function() { 
    gstModal.style.display = 'none'; 
    document.body.style.overflow = ''; 
    if (pendingTransData) {
        saveTransaction(pendingTransData);
        pendingTransData = null;
    }
};

// ================= TOUR / TUTORIAL =================
const tourSteps = [
    { target: '.summary-cards', title: 'Dashboard Summary & Eye Icon', desc: 'Displays your real-time total Savings, total Expenses, and Pending Accounts. You can click the Eye Icon below to hide or reveal these sensitive numbers from prying eyes.' },
    { target: '#quickModeBtn', title: 'Quick Mode Switcher', desc: 'Instantly toggle between Business, Employee, and Student mode. This changes what features and transaction types are available to you.' },
    { target: '.input-section', title: 'Transaction Types', desc: 'Select Revenue (money in), Expense (money out), Payment to be made (you owe money/credit), or Payment yet to receive (someone owes you).' },
    { target: '#payOffline', title: 'Payment Mode', desc: 'Track whether this transaction was done in cash (Offline) or digitally via UPI/Bank (Online).' },
    { target: '#scanBillBtn', title: 'Scan Handwritten Bills (AI OCR)', desc: 'Click this camera icon to snap a photo of a handwritten bill or price tag. The AI will read the image and automatically extract the price into the field!' },
    { target: '#gstCheckboxRow', title: 'Generate GST Invoice', desc: 'Check this box to instantly build and save a professional GST tax invoice. You can set the Auto-Save folder in your Business Profile.' },
    { target: '.presets-section', title: 'Quick Presets', desc: 'Save time! Your most frequently entered descriptions will show here. Click one to auto-fill the form instantly.' },
    { target: '.accountant-advice', title: "Accountant's Advice", desc: 'Expand this section to read valuable tips and common pitfalls to avoid losing money in your business.' },
    { target: '.history-section', title: 'Your Transactions', desc: 'A quick look at your recent entries. Click "Open Full Ledger" to view all history, bulk-delete transactions by date, and more.' }
];

window.startDashboardTour = function() {
    startTour(tourSteps);
};
// ================= DASHBOARD =================

function updateDashboard() {
    let totalRev = 0, totalExp = 0, totalFuturePay = 0, totalPendingReceive = 0;
    const dailyData = {};
    transactions.forEach(t => {
        let effectiveType = t.type;
        if (t.type === 'pending') {
            if (t.status === 'received') effectiveType = 'revenue';
            else if (t.status === 'loss') effectiveType = 'expense';
            else {
                if (t.status === 'awaiting') totalPendingReceive += t.amount;
                return; // Awaiting - don't count in revenue/expense
            }
        }
        if (t.type === 'futurepay') {
            if (t.status === 'paid') effectiveType = 'expense';
            else if (t.status === 'loss') return; 
            else {
                if (t.status === 'awaiting') {
                    totalFuturePay += t.amount;
                }
                return; 
            }
        }
        
        if(effectiveType === 'revenue') totalRev += t.amount;
        else if (effectiveType === 'expense') totalExp += t.amount;
        
        if(effectiveType === 'revenue' || effectiveType === 'expense') {
            if(!dailyData[t.date]) dailyData[t.date] = { rev: 0, exp: 0 };
            if(effectiveType === 'revenue') dailyData[t.date].rev += t.amount;
            else dailyData[t.date].exp += t.amount;
        }
    });
    const net = totalRev - totalExp;
    dispRev.textContent = formatMoney(totalRev);
    dispExp.textContent = formatMoney(totalExp);
    dispNet.textContent = formatMoney(net);
    dispNet.className = 'amount ' + (net > 0 ? 'positive' : (net < 0 ? 'negative' : 'neutral'));
    
    const futurePayDisplay = document.getElementById('futurePayDisplay');
    if (futurePayDisplay) futurePayDisplay.textContent = formatMoney(totalFuturePay);
    
    const pendingReceiveDisplay = document.getElementById('pendingReceiveDisplay');
    if (pendingReceiveDisplay) pendingReceiveDisplay.textContent = formatMoney(totalPendingReceive);
    
    const receiveCardWrapper = document.getElementById('receiveCardWrapper');
    if (receiveCardWrapper) {
        receiveCardWrapper.style.display = localStorage.getItem('fg_mode') === 'student' ? 'none' : 'block';
    }
    
    renderHistory();
    updateChart(dailyData);
    generateVeteranAdvice(totalRev, totalExp, net, Object.keys(dailyData).length);
    applyBalanceVisibility();
}

function renderHistory() {
    historyList.innerHTML = '';
    const grouped = {};
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach(t => { if (!grouped[t.date]) grouped[t.date] = []; grouped[t.date].push(t); });
    Object.keys(grouped).forEach(date => {
        const heading = document.createElement('div');
        heading.className = 'date-group-heading';
        heading.textContent = formatDateDisplay(date);
        historyList.appendChild(heading);
        grouped[date].forEach(t => {
            const item = document.createElement('div');
            let itemClass = t.type;
            if (t.type === 'pending' || t.type === 'futurepay') itemClass = 'pending';
            item.className = `history-item ${itemClass}`;
            let sign = '+';
            if (t.type === 'expense' || (t.type === 'futurepay' && t.status === 'paid')) sign = '-';
            else if (t.type === 'pending' || (t.type === 'futurepay' && t.status === 'awaiting')) sign = '⏳';
            let statusTag = '';
            if (t.type === 'pending' || t.type === 'futurepay') {
                if (t.status === 'awaiting') statusTag = ' <small style="color:var(--neon-yellow);">[Awaiting]</small>';
                else if (t.status === 'received' || t.status === 'paid') statusTag = ' <small style="color:var(--neon-green);">[' + (t.status==='paid'?'Paid':'Received') + ']</small>';
                else if (t.status === 'loss') statusTag = ' <small style="color:var(--neon-red);">[Loss]</small>';
            }
            const qtyInfo = (t.qty && t.qty > 1) ? ` <small style="opacity:0.7;">(×${t.qty})</small>` : '';
            item.innerHTML = `<div class="history-details"><p>${t.desc}${qtyInfo}${statusTag}</p><span>${formatDateDisplay(t.date)}</span></div><div class="history-amount">${sign}${formatMoney(t.amount)}</div>`;
            item.style.cursor = 'pointer';
            item.onclick = () => window.open(`transactions.html#tx-${t.id}`, '_blank');
            historyList.appendChild(item);
        });
    });
}

function generateVeteranAdvice(rev, exp, net, daysTracked) {
    let adviceHtml = '';
    if (transactions.length === 0) {
        adviceHtml = `<p>${t('advice_no_data')}</p>`;
    } else if (daysTracked < 3) {
        adviceHtml = `<p>${t('advice_need_data')}</p>`;
    } else {
        const profitMargin = rev > 0 ? (net / rev) * 100 : 0;
        if (net < 0) {
            adviceHtml = `<p class="highlight-bad">${t('advice_loss').replace('{0}', formatMoney(Math.abs(net)))}</p>` +
            t('advice_loss_tips').replace('{0}', formatMoney(exp));
        } else if (profitMargin > 0 && profitMargin < 15) {
            adviceHtml = `<p class="highlight-warn">${t('advice_thin').replace('{0}', profitMargin.toFixed(1))}</p>` +
            t('advice_thin_tips').replace('{0}', formatMoney(exp));
        } else if (profitMargin >= 15 && profitMargin < 40) {
            adviceHtml = `<p class="highlight-good">${t('advice_solid').replace('{0}', profitMargin.toFixed(1))}</p>` +
            t('advice_solid_tips').replace('{0}', formatMoney(net));
        } else {
            adviceHtml = `<p class="highlight-good">${t('advice_boom').replace('{0}', profitMargin.toFixed(1))}</p>` +
            t('advice_boom_tips');
        }
        
        // Additional checks:
        const rentExpense = transactions.filter(tx => tx.type === 'expense' && tx.category === 'rent').reduce((s,tx) => s+tx.amount, 0);
        if (exp > 0 && (rentExpense / exp) > 0.3) {
            adviceHtml += `<p class="highlight-warn" style="margin-top:0.5rem">${t('advice_warn_rent')}</p>`;
        }
        
        if (rev === 0 && exp > 0) {
            adviceHtml += `<p class="highlight-bad" style="margin-top:0.5rem">${t('advice_warn_zero_rev')}</p>`;
        }
        
        const transExpense = transactions.filter(tx => tx.type === 'expense' && tx.category === 'transportation').reduce((s,tx) => s+tx.amount, 0);
        if (exp > 0 && (transExpense / exp) > 0.2) {
            adviceHtml += `<p class="highlight-warn" style="margin-top:0.5rem">${t('advice_warn_trans')}</p>`;
        }
        
        const pendingReceivables = transactions.filter(tx => tx.type === 'pending' && tx.status === 'awaiting').reduce((s,tx) => s+tx.amount, 0);
        if (rev > 0 && (pendingReceivables / rev) > 0.2) {
            adviceHtml += `<p class="highlight-warn" style="margin-top:0.5rem">${t('advice_warn_pending')}</p>`;
        }
        
        const futurePayObligations = transactions.filter(tx => tx.type === 'futurepay' && tx.status === 'awaiting').reduce((s,tx) => s+tx.amount, 0);
        if (futurePayObligations > 0) {
            adviceHtml += `<p class="highlight-warn" style="margin-top:0.5rem">${t('advice_warn_future').replace('{0}', formatMoney(futurePayObligations))}</p>`;
            
            if (rev > 0) {
                const pseudoRev = Math.min(rev, futurePayObligations);
                const trueRev = rev - pseudoRev;
                const pseudoPct = (pseudoRev / rev) * 100;
                const truePct = (trueRev / rev) * 100;
                
                adviceHtml += `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                    <h4 style="color: var(--neon-blue); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        ${t('advice_reality_glass')}
                    </h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${t('advice_pseudo_warn')}</p>
                    <div style="width: 100%; height: 24px; border-radius: 12px; display: flex; overflow: hidden; background: #333;">
                        <div style="width: ${truePct}%; background: var(--neon-green); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; color: #000;" title="${t('advice_true_rev')}: ${formatMoney(trueRev)}">
                            ${truePct > 10 ? formatMoney(trueRev) : ''}
                        </div>
                        <div style="width: ${pseudoPct}%; background: var(--neon-yellow); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; color: #000;" title="${t('advice_pseudo_rev')}: ${formatMoney(pseudoRev)}">
                            ${pseudoPct > 10 ? formatMoney(pseudoRev) : ''}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-top: 0.5rem;">
                        <span style="color: var(--neon-green);">■ ${t('advice_true_rev')}</span>
                        <span style="color: var(--neon-yellow);">■ ${t('advice_pseudo_rev')}</span>
                    </div>
                </div>`;
            }
        }
        
        // --- Unnecessary Expense Algorithmic Analysis ---
        const unnecessaryExpenses = transactions.filter(t => t.type === 'expense' && t.expenseTag === 'Unnecessary');
        if (unnecessaryExpenses.length > 0) {
            const wasteTotal = unnecessaryExpenses.reduce((s, t) => s + t.amount, 0);
            
            // Group by item description (case-insensitive)
            const itemCounts = {};
            unnecessaryExpenses.forEach(t => {
                const itemName = (t.desc || 'Unknown Item').trim().toLowerCase();
                if (!itemCounts[itemName]) itemCounts[itemName] = { name: (t.desc || 'Unknown Item').trim(), count: 0, amount: 0 };
                itemCounts[itemName].count += 1;
                itemCounts[itemName].amount += t.amount;
            });
            
            // Sort to find the biggest offender by amount
            const topWastes = Object.values(itemCounts).sort((a, b) => b.amount - a.amount);
            const worstOffender = topWastes[0];
            
            adviceHtml += `<p class="highlight-bad" style="margin-top:0.5rem">${t('advice_leak_1').replace('{0}', formatMoney(wasteTotal))}`;
            
            if (worstOffender.count >= 2) {
                adviceHtml += t('advice_leak_2').replace('{0}', worstOffender.name).replace('{1}', worstOffender.count).replace('{2}', formatMoney(worstOffender.amount)) + `</p>`;
            } else {
                adviceHtml += t('advice_leak_3').replace('{0}', worstOffender.name).replace('{1}', formatMoney(worstOffender.amount)) + `</p>`;
            }
        }
    }
    advisorContent.innerHTML = adviceHtml;
}

function updateChart(dailyData) {
    const chartContainer = document.getElementById('financialChart');
    const pieContainer = document.getElementById('expensePieChart');
    
    if (!isProUser()) {
        if(chartContainer) chartContainer.parentElement.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.02);border:1px dashed var(--neon-blue);border-radius:8px;cursor:pointer;flex-direction:column;" onclick="showPaywall(\'Financial Graphs & Analytics\')"><span style="font-size:2rem;margin-bottom:0.5rem;">📊</span><span style="color:var(--neon-blue);">Pro Analytics Locked</span></div>';
        if(pieContainer) pieContainer.parentElement.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.02);border:1px dashed var(--neon-blue);border-radius:8px;cursor:pointer;flex-direction:column;" onclick="showPaywall(\'Expense Pie Chart\')"><span style="font-size:2rem;margin-bottom:0.5rem;">🥧</span><span style="color:var(--neon-blue);">Pro Analytics Locked</span></div>';
        return;
    }

    const ctx = chartContainer.getContext('2d');
    const dates = Object.keys(dailyData).sort();
    const revData = [], expData = [], netTrend = [];
    let cumulative = 0;
    dates.forEach(date => {
        const r = dailyData[date].rev, e = dailyData[date].exp;
        revData.push(r); expData.push(e);
        cumulative += (r - e); netTrend.push(cumulative);
    });
    if(chartInstance) chartInstance.destroy();
    const displayDates = dates.map(d => formatDateDisplay(d));
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#9ba3af';
    const gridColor = 'rgba(255,255,255,0.05)';
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: displayDates, datasets: [
            { type:'line', label:'Cumulative Net', data:netTrend, borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.1)', borderWidth:2, tension:0.3, fill:true, yAxisID:'y' },
            { label:'Revenue', data:revData, backgroundColor:'#10b981', borderRadius:4 },
            { label:'Expenses', data:expData, backgroundColor:'#ef4444', borderRadius:4 }
        ]},
        options: { responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
            plugins:{ legend:{labels:{color:textColor}}, tooltip:{callbacks:{label:function(c){let l=c.dataset.label||'';if(l)l+=': ';if(c.parsed.y!==null)l+=formatMoney(c.parsed.y);return l;}}}},
            scales:{ x:{grid:{color:gridColor},ticks:{color:textColor}}, y:{grid:{color:gridColor},ticks:{color:textColor,callback:function(v){return formatMoney(v);}}}}
        }
    });

    // --- Pie Chart for Expenses ---
    const pieCtx = document.getElementById('expensePieChart').getContext('2d');
    const categoryTotals = {};
    let totalExpenseForPie = 0;
    
    transactions.forEach(t => {
        if (t.type === 'expense' || (t.type === 'futurepay' && t.status === 'paid')) {
            const cat = t.category || 'other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
            totalExpenseForPie += t.amount;
        }
    });

    if (pieChartInstance) pieChartInstance.destroy();
    
    const catLabels = Object.keys(categoryTotals).map(c => c.charAt(0).toUpperCase() + c.slice(1));
    const catData = Object.values(categoryTotals);
    const catColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b', '#a8a29e'];

    pieChartInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: catLabels.length ? catLabels : ['No Expenses'],
            datasets: [{
                data: catData.length ? catData : [1],
                backgroundColor: catData.length ? catColors : ['rgba(255,255,255,0.05)'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'right', labels: { color: textColor, font: { size: 10 }, boxWidth: 12 } },
                tooltip: {
                    callbacks: {
                        label: function(c) {
                            if (!catData.length) return ' No data';
                            const val = c.parsed;
                            const percent = ((val / totalExpenseForPie) * 100).toFixed(1);
                            return ` ${formatMoney(val)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ================= HELP GUIDE =================

window.toggleHelp = function(e) {
    e.stopPropagation();
    const tooltip = document.getElementById('helpTooltip');
    tooltip.classList.toggle('show');
    const infoTooltip = document.getElementById('infoTooltip');
    if (infoTooltip) infoTooltip.classList.remove('show');
};

window.toggleInfo = function(e) {
    e.stopPropagation();
    const tooltip = document.getElementById('infoTooltip');
    tooltip.classList.toggle('show');
    const helpTooltip = document.getElementById('helpTooltip');
    if (helpTooltip) helpTooltip.classList.remove('show');
};

document.addEventListener('click', function(e) {
    const tooltip = document.getElementById('helpTooltip');
    const helpIcon = document.getElementById('helpIcon');
    const infoTooltip = document.getElementById('infoTooltip');
    const infoIcon = document.getElementById('infoIcon');
    
    if (tooltip && tooltip.classList.contains('show')) {
        if (!helpIcon.contains(e.target) && !tooltip.contains(e.target)) {
            tooltip.classList.remove('show');
        }
    }
    
    if (infoTooltip && infoTooltip.classList.contains('show')) {
        if (!infoIcon.contains(e.target) && !infoTooltip.contains(e.target)) {
            infoTooltip.classList.remove('show');
        }
    }
});

// Sync dashboard across tabs
window.addEventListener('storage', function(e) {
    if (e.key === 'fg_transactions') {
        try {
            transactions = JSON.parse(e.newValue) || [];
            updateDashboard();
        } catch(err) {
            console.error(err);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('fg_lang')) {
        const welcomeOverlay = document.getElementById('welcomeOverlay');
        const langOverlay = document.getElementById('langOverlay');
        if (welcomeOverlay) welcomeOverlay.style.display = 'none';
        if (langOverlay) langOverlay.style.display = 'flex';
    }
});

window.selectInitialLanguage = function(lang) {
    if(typeof setLanguage === 'function') setLanguage(lang);
    document.getElementById('langOverlay').style.display = 'none';
    document.getElementById('welcomeOverlay').style.display = 'flex';
};

// ================= OCR HANDWRITTEN PRICE SCANNER =================
window.processOcrImage = async function(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const btn = document.getElementById('scanBillBtn');
    const originalContent = btn.innerHTML;
    const amountInput = document.getElementById('transUnitPrice');
    
    // Set loading state
    btn.innerHTML = '⏳';
    btn.disabled = true;
    
    try {
        const result = await Tesseract.recognize(file, 'eng');
        const text = result.data.text;
        console.log("OCR Extracted Text:", text);
        
        // Find all numbers that look like prices/amounts (e.g., 100, 100.50, 1,000.00)
        const matches = text.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/g);
        
        if (matches && matches.length > 0) {
            // Clean strings, convert to floats, and find the max value
            const numbers = matches.map(m => parseFloat(m.replace(/,/g, ''))).filter(n => !isNaN(n));
            if (numbers.length > 0) {
                const maxAmount = Math.max(...numbers);
                amountInput.value = maxAmount.toFixed(2);
                
                // Show success on button briefly
                btn.innerHTML = '✅';
                setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
            } else {
                throw new Error("No valid numbers parsed.");
            }
        } else {
            throw new Error("No numbers found in text.");
        }
    } catch (e) {
        console.error("OCR Error:", e);
        alert("Could not cleanly read a price from this image. Please try again or enter manually.");
        btn.innerHTML = '❌';
        setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
    } finally {
        btn.disabled = false;
        input.value = ''; // Reset file input
    }
};
