// --- DOM Elements ---
const form = document.getElementById('transactionForm');
const currencyInput = document.getElementById('currencyInput');
const btnIncFont = document.getElementById('increaseFont');
const btnDecFont = document.getElementById('decreaseFont');
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
        } else if (key === 'Enter' || key === '=') {
            calcEval();
        } else if (key === 'Escape') {
            calcModal.style.display = 'none';
        } else if (key === 'Backspace') {
            calcDisplay.value = calcDisplay.value.slice(0, -1);
        }
    }
});

// --- Initialization & Notifications ---
btnEnterApp.addEventListener('click', () => {
    welcomeOverlay.style.display = 'none';
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingAlerts = transactions.filter(t =>
        t.type === 'pending' && t.status === 'awaiting' && t.expectedDate <= todayStr
    );
    if (pendingAlerts.length > 0) {
        playSound('warning');
        showPendingListNotification(pendingAlerts);
    } else {
        playSound('pleasant');
        notificationContent.innerHTML = `
            <h2>All Clear</h2>
            <p>No pending payments are due to be received by you today.</p>
            <div class="modal-actions">
                <button class="btn-primary" onclick="closeNotification()">Excellent</button>
            </div>`;
        notificationModal.style.display = 'flex';
    }
    init();
});

function showPendingListNotification(pendingList) {
    let listHtml = '<div class="pending-list">';
    pendingList.forEach(t => {
        listHtml += `
            <div class="pending-list-item">
                <div class="pending-info">
                    <p><strong>${t.desc}</strong> — ${formatMoney(t.amount)}</p>
                    <span>Due: ${formatDateDisplay(t.expectedDate)}</span>
                </div>
                <div class="pending-actions">
                    <button class="btn-primary" style="background:var(--neon-green);padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="resolvePending(${t.id},'received')">Received</button>
                    <button class="btn-danger" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="resolvePending(${t.id},'loss')">Not Received</button>
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
    const remaining = transactions.filter(tx => tx.type === 'pending' && tx.status === 'awaiting' && tx.expectedDate <= todayStr);
    if (remaining.length > 0) showPendingListNotification(remaining);
    else closeNotification();
};
window.closeNotification = function() { notificationModal.style.display = 'none'; };

window.toggleExpectedDate = function() {
    if (transType.value === 'pending') {
        expectedDateGroup.style.display = 'block';
        document.getElementById('expectedDate').required = true;
    } else {
        expectedDateGroup.style.display = 'none';
        document.getElementById('expectedDate').required = false;
    }
    // GST invoice option is always visible for all transaction types
    gstCheckboxRow.style.display = 'flex';
};

function init() {
    const dInput = document.getElementById('transDate');
    const todayStr = new Date().toISOString().split('T')[0];
    dInput.value = todayStr;
    dInput.min = todayStr;
    currencyInput.value = currentCurrencyCode;
    applySharedFontSize();
    renderPresets();
    updateDashboard();
}

// --- Presets (with price) ---
function renderPresets() {
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
        chip.innerHTML = `${name}${price ? ' <small style="opacity:0.7">(' + formatMoney(price) + ')</small>' : ''}${isUserPreset ? '<span class="remove-preset" data-preset="' + name + '">×</span>' : ''}`;
        chip.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-preset')) {
                presets = presets.filter(pr => (typeof pr === 'object' ? pr.name : pr) !== e.target.dataset.preset);
                savePresets();
                renderPresets();
                return;
            }
            transDesc.value = name;
            if (price) { transUnitPrice.value = price; updateCalcTotal(); }
            transDesc.focus();
        });
        presetChips.appendChild(chip);
    });
}

addPresetBtn.addEventListener('click', () => {
    const val = newPresetInput.value.trim();
    const price = parseFloat(newPresetPrice.value) || null;
    if (val) {
        const existing = presets.find(p => (typeof p === 'object' ? p.name : p) === val);
        if (!existing) {
            presets.push(price ? { name: val, price } : val);
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
    const date = document.getElementById('transDate').value;
    const time = new Date().toLocaleTimeString();
    const type = transType.value;
    const qty = parseInt(transQty.value) || 1;
    const unitPrice = parseFloat(transUnitPrice.value);
    const amount = qty * unitPrice;
    const desc = transDesc.value;
    let expectedDate = null, status = null;
    if (type === 'pending') { expectedDate = document.getElementById('expectedDate').value; status = 'awaiting'; }
    const record = { id: Date.now(), date, time, type, amount, desc, expectedDate, status, qty, unitPrice };
    
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
    toggleExpectedDate();
    calcTotalDisplay.textContent = formatMoney(0);
});

currencyInput.addEventListener('input', function(e) {
    currentCurrencyCode = e.target.value.toUpperCase();
    localStorage.setItem('fg_currency', currentCurrencyCode);
    updateDashboard();
});
btnIncFont.addEventListener('click', () => { if (fontMultiplier < 1.5) fontMultiplier += 0.1; localStorage.setItem('fg_fontSize', fontMultiplier); applySharedFontSize(); });
btnDecFont.addEventListener('click', () => { if (fontMultiplier > 0.7) fontMultiplier -= 0.1; localStorage.setItem('fg_fontSize', fontMultiplier); applySharedFontSize(); });
document.getElementById('clearDataBtn').addEventListener('click', () => { if(confirm("Wipe all financial history? This cannot be undone.")) { transactions = []; saveData(); updateDashboard(); } });

// ================= GST INVOICE (Multi-product, auto-detect, professional) =================

let gstInvoiceItems = [];

function showGstInvoiceForm(triggerRecord) {
    const profile = getProfile();
    gstInvoiceItems = [{
        desc: triggerRecord.desc,
        qty: triggerRecord.qty || 1,
        unitPrice: triggerRecord.unitPrice || triggerRecord.amount,
        gstRate: detectGstRate(triggerRecord.desc),
        discount: 0
    }];
    renderGstForm(profile);
}

function renderGstForm(profile) {
    let itemsHtml = '';
    gstInvoiceItems.forEach((item, i) => {
        itemsHtml += `
        <div style="border:1px solid var(--panel-border);border-radius:8px;padding:0.8rem;margin-bottom:0.8rem;">
            <div class="form-row" style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:0.5rem;">
                <div class="form-group"><label>Product</label><input type="text" value="${item.desc}" onchange="gstInvoiceItems[${i}].desc=this.value; gstInvoiceItems[${i}].gstRate=detectGstRate(this.value); renderGstForm(getProfile())"></div>
                <div class="form-group"><label>Qty</label><input type="number" value="${item.qty}" min="1" onchange="gstInvoiceItems[${i}].qty=parseInt(this.value)||1"></div>
                <div class="form-group"><label>Unit Price</label><input type="number" value="${item.unitPrice}" min="0" step="0.01" onchange="gstInvoiceItems[${i}].unitPrice=parseFloat(this.value)||0"></div>
            </div>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;">
                <div class="form-group"><label>GST % <small>(auto-detected)</small></label><input type="number" value="${item.gstRate}" min="0" max="40" onchange="gstInvoiceItems[${i}].gstRate=parseFloat(this.value)||0"></div>
                <div class="form-group"><label>Discount</label><input type="number" value="${item.discount}" min="0" step="0.01" onchange="gstInvoiceItems[${i}].discount=parseFloat(this.value)||0"></div>
                <div style="display:flex;align-items:flex-end;"><button class="btn-danger" style="padding:0.4rem;font-size:0.8rem;margin:0;" onclick="gstInvoiceItems.splice(${i},1);renderGstForm(getProfile())">Remove</button></div>
            </div>
        </div>`;
    });

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
            <h3 style="color:var(--neon-blue);font-size:0.9rem;margin:1rem 0 0.5rem;">ITEMS</h3>
            ${itemsHtml}
            <button class="btn-icon" style="width:100%;margin-bottom:1rem;" onclick="gstInvoiceItems.push({desc:'',qty:1,unitPrice:0,gstRate:18,discount:0});renderGstForm(getProfile())">+ Add Another Product</button>
            <div class="form-group"><label>Invoice No</label><input type="text" id="gstInvoiceNo" value="INV-${Date.now().toString().slice(-6)}"></div>
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="generateFinalInvoice()">Generate Invoice</button>
            <button class="btn-danger" onclick="closeGstModal()">Cancel</button>
        </div>`;
    gstModal.style.display = 'flex';
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
            <td>${i+1}</td><td>${item.desc}</td><td>${item.qty}</td>
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
    <div class="invoice-preview" id="invoicePreview">
        <h2 style="text-align:center;border:none;margin-bottom:0;">${profile.profCompanyName || 'Your Company Name'}</h2>
        <p style="text-align:center;font-size:0.85rem;margin:0.2rem 0;">${profile.profAddress || 'Address'} | Phone: ${profile.profPhone || ''} | Email: ${profile.profEmail || ''}</p>
        <p style="text-align:center;font-size:0.85rem;margin:0 0 0.5rem;"><strong>GSTIN:</strong> ${(profile.profGstin || 'N/A').toUpperCase()}</p>
        <hr>
        ${paymentStatusHtml}
        <h2 style="text-align:center;">TAX INVOICE</h2>
        <p><strong>Invoice No:</strong> ${invoiceNo} &nbsp;|&nbsp; <strong>Date:</strong> ${today}</p>
        <p><strong>Bill To:</strong> ${buyerName} ${buyerGst ? '&nbsp;|&nbsp; <strong>GSTIN:</strong> ' + buyerGst.toUpperCase() : ''}</p>
        <table>
            <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead>
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
    </div>
    <div class="modal-actions" style="margin-top:1rem;">
        <button class="btn-primary" onclick="printInvoice()">Print / Save as PDF</button>
        <button class="btn-danger" onclick="closeGstModal()">Close</button>
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
    printWin.print();
};
window.closeGstModal = function() { 
    gstModal.style.display = 'none'; 
    if (pendingTransData) {
        saveTransaction(pendingTransData);
        pendingTransData = null;
    }
};

// ================= DASHBOARD =================

function updateDashboard() {
    let totalRev = 0, totalExp = 0;
    const dailyData = {};
    transactions.forEach(t => {
        let effectiveType = t.type;
        if (t.type === 'pending') {
            if (t.status === 'received') effectiveType = 'revenue';
            else if (t.status === 'loss') effectiveType = 'expense';
            else return;
        }
        if(effectiveType === 'revenue') totalRev += t.amount;
        else if (effectiveType === 'expense') totalExp += t.amount;
        if(!dailyData[t.date]) dailyData[t.date] = { rev: 0, exp: 0 };
        if(effectiveType === 'revenue') dailyData[t.date].rev += t.amount;
        else dailyData[t.date].exp += t.amount;
    });
    const net = totalRev - totalExp;
    dispRev.textContent = formatMoney(totalRev);
    dispExp.textContent = formatMoney(totalExp);
    dispNet.textContent = formatMoney(net);
    dispNet.className = 'amount ' + (net > 0 ? 'positive' : (net < 0 ? 'negative' : 'neutral'));
    renderHistory();
    updateChart(dailyData);
    generateVeteranAdvice(totalRev, totalExp, net, Object.keys(dailyData).length);
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
            if (t.type === 'pending') itemClass = 'pending';
            item.className = `history-item ${itemClass}`;
            let sign = '+';
            if (t.type === 'expense') sign = '-';
            else if (t.type === 'pending') sign = '⏳';
            let statusTag = '';
            if (t.type === 'pending') {
                if (t.status === 'awaiting') statusTag = ' <small style="color:var(--neon-yellow);">[Awaiting]</small>';
                else if (t.status === 'received') statusTag = ' <small style="color:var(--neon-green);">[Received]</small>';
                else if (t.status === 'loss') statusTag = ' <small style="color:var(--neon-red);">[Loss]</small>';
            }
            const qtyInfo = (t.qty && t.qty > 1) ? ` <small style="opacity:0.7;">(×${t.qty})</small>` : '';
            item.innerHTML = `<div class="history-details"><p>${t.desc}${qtyInfo}${statusTag}</p><span>${formatDateDisplay(t.date)}</span></div><div class="history-amount">${sign}${formatMoney(t.amount)}</div>`;
            historyList.appendChild(item);
        });
    });
}

function generateVeteranAdvice(rev, exp, net, daysTracked) {
    let adviceHtml = '';
    if (transactions.length === 0) {
        adviceHtml = `<p>Welcome. A business without numbers is just a hobby. Start recording your daily income and expenses, and I'll tell you the brutal truth about your trajectory.</p>`;
    } else if (daysTracked < 3) {
        adviceHtml = `<p>You've got some data in, which is good. But I need to see a pattern. Keep tracking consistently so we can see the real trend.</p>`;
    } else {
        const profitMargin = rev > 0 ? (net / rev) * 100 : 0;
        if (net < 0) {
            adviceHtml = `<p class="highlight-bad">Listen closely, you are bleeding cash. Net loss of ${formatMoney(Math.abs(net))}.</p>
            <ul><li>Halt all non-essential spending. Review every recurring subscription.</li>
            <li>Focus on your core product. Stop experimenting until you're in the green.</li>
            <li>If expenses (${formatMoney(exp)}) can't be reduced, you have a pricing problem.</li></ul>`;
        } else if (profitMargin > 0 && profitMargin < 15) {
            adviceHtml = `<p class="highlight-warn">Razor-thin margin (${profitMargin.toFixed(1)}%). You're surviving, not thriving.</p>
            <ul><li>Optimize operations and reduce that ${formatMoney(exp)} in expenses.</li>
            <li>Do not take on debt now. Your margins cannot support it.</li></ul>`;
        } else if (profitMargin >= 15 && profitMargin < 40) {
            adviceHtml = `<p class="highlight-good">Solid ${profitMargin.toFixed(1)}% margin. You have a viable business.</p>
            <ul><li>Take 30% of net (${formatMoney(net)}) and build a 6-month runway.</li>
            <li>Reinvest systematically. Don't scale expenses faster than revenue.</li></ul>`;
        } else {
            adviceHtml = `<p class="highlight-good">Exceptional ${profitMargin.toFixed(1)}% margins. Boom phase.</p>
            <ul><li>Competitors will enter your space. Build a moat immediately.</li>
            <li>Keep fixed costs low. Cash is king when the bubble bursts.</li></ul>`;
        }
    }
    advisorContent.innerHTML = adviceHtml;
}

function updateChart(dailyData) {
    const ctx = document.getElementById('financialChart').getContext('2d');
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
}
