const ledgerBody = document.getElementById('ledgerBody');
const btnExportCsv = document.getElementById('exportCsvBtn');
const btnExportPdf = document.getElementById('exportPdfBtn');

let currentFilter = 'All';

function initLedger() {
    applySharedFontSize();
    
    // Add Filter Bar
    const mode = localStorage.getItem('fg_mode') || 'business';
    const isStudent = (mode === 'student');
    
    const filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:1rem;overflow-x:auto;flex-wrap:wrap;';
    
    let filterHtml = `
        <button class="filter-btn active" data-filter="All">All</button>
        <button class="filter-btn" data-filter="Revenue">Revenue</button>
        <button class="filter-btn" data-filter="Expense">Expense</button>
        <button class="filter-btn" data-filter="Online">Online</button>
        <button class="filter-btn" data-filter="Offline">Offline</button>
        <button class="filter-btn" data-filter="FuturePay">Payment to be made</button>
    `;
    if (!isStudent) {
        filterHtml += `<button class="filter-btn" data-filter="Pending">Payment yet to receive</button>`;
    }
    filterBar.innerHTML = filterHtml;
    
    const tableWrapper = ledgerBody.closest('.glass-panel') || ledgerBody.parentElement;
    tableWrapper.parentElement.insertBefore(filterBar, tableWrapper);
    
    const style = document.createElement('style');
    style.textContent = `
        .filter-btn { background: transparent; border: 1px solid var(--panel-border); color: var(--text-muted); padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; white-space: nowrap; font-family: inherit; }
        .filter-btn.active { background: var(--neon-blue); color: #fff; border-color: var(--neon-blue); }
        .filter-btn:hover { border-color: var(--text-main); color: var(--text-main); }
    `;
    document.head.appendChild(style);
    
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderTable();
        });
    });
    
    if (localStorage.getItem('fg_mode') === 'student') {
        const gstBtn = document.getElementById('gstInvoicesBtn');
        if (gstBtn) gstBtn.style.display = 'none';
    }
    
    renderTable();
}

function renderTable() {
    ledgerBody.innerHTML = '';
    
    let filtered = transactions.filter(t => {
        if (!t) return false;
        if (currentFilter === 'All') return true;
        if (currentFilter === 'Revenue' && t.type === 'revenue') return true;
        if (currentFilter === 'Expense' && t.type === 'expense') return true;
        if (currentFilter === 'Online' && (t.paymentMethod === 'online' || !t.paymentMethod)) return true;
        if (currentFilter === 'Offline' && t.paymentMethod === 'offline') return true;
        if (currentFilter === 'Pending' && t.type === 'pending') return true;
        if (currentFilter === 'FuturePay' && t.type === 'futurepay') return true;
        return false;
    });
    
    // Sort transactions by date descending (newest first), then by time
    const sorted = [...filtered].sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return (b.id || 0) - (a.id || 0);
    });
    
    // Group by date and calculate daily totals
    const dailyTotals = {};
    sorted.forEach(t => {
        if (!t) return;
        if (!dailyTotals[t.date]) dailyTotals[t.date] = { rev: 0, exp: 0 };
        if (t.type === 'revenue' || t.status === 'received') dailyTotals[t.date].rev += t.amount;
        if (t.type === 'expense' || t.status === 'paid') dailyTotals[t.date].exp += t.amount;
    });

    let lastDate = null;
    
    sorted.forEach(t => {
        if (!t) return;
        // Insert date separator row
        if (t.date !== lastDate) {
            lastDate = t.date;
            const totals = dailyTotals[t.date];
            const totalHtml = `<span style="float:right; font-size: 0.85rem; font-weight:normal; letter-spacing: 0;">Rev: <span style="color:var(--neon-green)">${formatMoney(totals.rev)}</span> &nbsp;|&nbsp; Exp: <span style="color:var(--neon-red)">${formatMoney(totals.exp)}</span></span>`;
            
            const sepRow = document.createElement('tr');
            sepRow.className = 'date-separator';
            sepRow.innerHTML = `
                <td class="selection-col" style="display:${window.selectionModeActive ? 'table-cell' : 'none'};">
                    <input type="checkbox" class="date-checkbox" data-date="${t.date}" onchange="toggleDateSelection('${t.date}', this.checked)">
                </td>
                <td colspan="${window.selectionModeActive ? '8' : '8'}">📅 ${formatDateDisplay(t.date)} ${totalHtml}</td>
            `;
            ledgerBody.appendChild(sepRow);
        }
        
        const row = document.createElement('tr');
        row.id = `tx-${t.id}`;
        
        // Yellow highlight for pending rows
        if (t.type === 'pending' || t.type === 'futurepay') {
            row.className = 'pending-row';
        }
        
        let statusBadge = '';
        let actionHtml = '';
        
        if (t.type === 'revenue') {
            statusBadge = `<span class="status-badge bg-green">Received</span>`;
        } else if (t.type === 'expense') {
            statusBadge = `<span class="status-badge bg-red">Paid</span>`;
            let selectedTag = t.expenseTag || '';
            actionHtml = `
                <select onchange="updateExpenseTag(${t.id}, this.value)" style="background: transparent; color: var(--text-main); border: 1px solid var(--panel-border); border-radius: 4px; padding: 0.2rem; font-size: 0.8rem; margin-right: 0.5rem; outline: none;">
                    <option value="" style="background: var(--bg-dark);" ${selectedTag === '' ? 'selected' : ''}>Tag...</option>
                    <option value="Necessary" style="background: var(--bg-dark);" ${selectedTag === 'Necessary' ? 'selected' : ''}>Necessary</option>
                    <option value="Unnecessary" style="background: var(--bg-dark);" ${selectedTag === 'Unnecessary' ? 'selected' : ''}>Unnecessary</option>
                </select>
            `;
        } else if (t.type === 'pending' || t.type === 'futurepay') {
            const isReceive = t.type === 'pending';
            const okStr = isReceive ? 'Mark Received' : 'Mark Paid';
            
            if (t.status === 'received' || t.status === 'paid') {
                statusBadge = `<span class="status-badge bg-green">${t.status === 'paid' ? 'Paid' : 'Received'}</span>`;
            } else if (t.status === 'loss') {
                statusBadge = `<span class="status-badge bg-red">Loss</span>`;
                actionHtml = `<label><input type="checkbox" onchange="markReceived(${t.id})"> ${okStr}</label>`;
            } else {
                statusBadge = `<span class="status-badge bg-yellow">Awaiting by ${formatDateDisplay(t.expectedDate)}</span>`;
                actionHtml = `<label><input type="checkbox" onchange="markReceived(${t.id})"> ${okStr}</label>`;
            }
            
            if (t.status !== 'received' && t.status !== 'paid' && t.status !== 'loss') {
                actionHtml += `<button class="btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; margin-left: 0.5rem;" onclick="if(window.openPartialPayment) window.openPartialPayment(${t.id})">Partial</button>`;
            }
        }
        
        // Add delete bin button
        actionHtml = `
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                ${actionHtml}
                <button class="btn-delete" title="Delete Transaction" onclick="deleteTransaction(${t.id})">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
        
        let invoiceHtml = `<span class="status-badge bg-gray">N/A</span>`;
        if (t.invoiceNo) {
            const gstInfo = t.gstAmt ? ` (GST: ${formatMoney(t.gstAmt)})` : '';
            invoiceHtml = `
                <div style="font-size: 0.8rem; line-height: 1.4;">
                    <strong>${t.invoiceNo}</strong><br>
                    <span class="invoice-link no-print" onclick="viewInvoice(${t.id})">View Details</span>${gstInfo}
                </div>
            `;
        }
        
        row.innerHTML = `
            <td class="selection-col" style="display:${window.selectionModeActive ? 'table-cell' : 'none'};">
                <input type="checkbox" class="tx-checkbox tx-checkbox-${t.date}" value="${t.id}" onchange="updateSelectedCount()">
            </td>
            <td>
                <div>${formatDateDisplay(t.date)}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${t.time || '--:--'}</div>
                <div style="font-size: 0.75rem; color: ${t.paymentMethod === 'offline' ? 'var(--neon-yellow)' : 'var(--neon-blue)'}; text-transform: uppercase; margin-top: 0.2rem; font-weight: 600;">${t.paymentMethod === 'offline' ? 'Offline' : 'Online'}</div>
            </td>
            <td>${t.desc}</td>
            <td>${t.qty || 1}</td>
            <td style="text-transform: capitalize;">${t.type === 'pending' ? 'Acct. Receivable' : t.type}</td>
            <td>${statusBadge}</td>
            <td>${invoiceHtml}</td>
            <td style="font-weight: 600;">${formatMoney(t.amount)}</td>
            <td class="no-print">${actionHtml}</td>
        `;
        
        ledgerBody.appendChild(row);
    });
}

window.markReceived = function(id) {
    const t = transactions.find(tx => tx.id === id);
    if (t) {
        t.status = t.type === 'futurepay' ? 'paid' : 'received';
        saveData();
        renderTable();
    }
}

window.updateExpenseTag = function(id, tag) {
    const t = transactions.find(tx => tx.id === id);
    if (t) {
        t.expenseTag = tag;
        localStorage.setItem('fg_transactions', JSON.stringify(transactions));
        renderTable();
    }
}

window.deleteTransaction = function(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        transactions = transactions.filter(tx => tx.id !== id);
        saveData();
        renderTable();
    }
}

// --- Invoice Viewing ---
window.viewInvoice = function(id) {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;
    
    const content = document.getElementById('viewInvoiceContent');
    content.innerHTML = `
        <div id="printSimpleInvoiceArea" style="background: #111; padding: 1rem; border-radius: 8px;">
            <p><strong>Invoice No:</strong> ${t.invoiceNo}</p>
            <p><strong>Buyer:</strong> ${t.buyerName || 'N/A'}</p>
            <p><strong>Item:</strong> ${t.desc}</p>
            <p><strong>Quantity:</strong> ${t.qty}</p>
            <p><strong>Unit Price:</strong> ${formatMoney(t.unitPrice)}</p>
            <hr style="margin: 0.5rem 0; border-color: #333;">
            <p><strong>GST Charged:</strong> ${t.gstAmt ? formatMoney(t.gstAmt) : '0.00'}</p>
            <p style="font-size: 1.1rem; margin-top: 0.5rem;"><strong>Total Amount: ${formatMoney(t.amount)}</strong></p>
        </div>
    `;
    
    document.getElementById('viewInvoiceModal').style.display = 'flex';
}

window.printSimpleInvoice = function() {
    const content = document.getElementById('printSimpleInvoiceArea').innerHTML;
    const printWin = window.open('', '_blank');
    printWin.document.write(`<html><head><title>Invoice Details</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        body{font-family:'Outfit',sans-serif;padding:2rem;color:#111;}
        hr{border: 1px solid #ccc;}
    </style></head><body>
    <h2>Invoice Summary</h2>
    ${content}
    </body></html>`);
    printWin.document.close();
    printWin.print();
}

// --- Exports ---
btnExportCsv.addEventListener('click', () => {
    if (transactions.length === 0) return alert("No transactions to export.");
    let csvContent = "data:text/csv;charset=utf-8,Date,Time,Type,Description,Qty,Unit Price,Amount,Status,Expected Date,Invoice No,GST Amt,Buyer\n";
    transactions.forEach(t => {
        csvContent += `${formatDateDisplay(t.date)},${t.time||''},${t.type},"${t.desc.replace(/"/g, '""')}",${t.qty||1},${t.unitPrice||t.amount},${t.amount},${t.status||''},${t.expectedDate?formatDateDisplay(t.expectedDate):''},${t.invoiceNo||''},${t.gstAmt||''},"${(t.buyerName||'').replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_guardian_ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- Bulk Clear Data Functions ---
window.selectionModeActive = false;

window.toggleSelectionMode = function() {
    window.selectionModeActive = !window.selectionModeActive;
    
    // Toggle table columns
    const cols = document.querySelectorAll('.selection-col');
    cols.forEach(c => c.style.display = window.selectionModeActive ? 'table-cell' : 'none');
    
    // Toggle buttons
    document.getElementById('clearDataBtn').style.display = window.selectionModeActive ? 'none' : 'inline-block';
    document.getElementById('clearDataActions').style.display = window.selectionModeActive ? 'flex' : 'none';
    
    if (window.selectionModeActive) {
        updateSelectedCount();
    } else {
        // uncheck all
        const checkboxes = document.querySelectorAll('.tx-checkbox, .date-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        const selectAllCb = document.getElementById('selectAllCheckbox');
        if (selectAllCb) selectAllCb.checked = false;
    }
}

window.toggleSelectAll = function() {
    const isChecked = document.getElementById('selectAllCheckbox').checked;
    const checkboxes = document.querySelectorAll('.tx-checkbox, .date-checkbox');
    checkboxes.forEach(cb => cb.checked = isChecked);
    updateSelectedCount();
}

window.toggleDateSelection = function(dateStr, isChecked) {
    const checkboxes = document.querySelectorAll(`.tx-checkbox-${dateStr}`);
    checkboxes.forEach(cb => cb.checked = isChecked);
    updateSelectedCount();
}

window.updateSelectedCount = function() {
    const count = document.querySelectorAll('.tx-checkbox:checked').length;
    document.getElementById('selectedCountDisplay').textContent = `${count} Selected`;
}

window.bulkDeleteUI = function() {
    const checkedBoxes = document.querySelectorAll('.tx-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert("No transactions selected to delete.");
        return;
    }
    
    if (!confirm(`deleting data is irreversible since we only use local storage. Do you want to proceed`)) return;
    
    const idsToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));
    transactions = transactions.filter(t => !idsToDelete.includes(t.id));
    saveData();
    renderTable();
    toggleSelectionMode(); 
}

btnExportPdf.addEventListener('click', () => {
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');
    
    const element = document.getElementById('printableLedger');
    
    const opt = {
        margin:       0.5,
        filename:     'financial_ledger.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f1115' },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        noPrintElements.forEach(el => el.style.display = '');
    });
});

initLedger();

// Ledger Help Modal & Tour
const ledgerHelpIcon = document.getElementById('ledgerHelpIcon');
const ledgerHelpModal = document.getElementById('ledgerHelpModal');
if (ledgerHelpIcon && ledgerHelpModal) {
    ledgerHelpIcon.addEventListener('click', () => {
        ledgerHelpModal.style.display = 'flex';
    });
    
    if (!localStorage.getItem('fg_tour_ledger')) {
        ledgerHelpModal.style.display = 'flex';
        localStorage.setItem('fg_tour_ledger', 'true');
    }
}

// --- Partial Payments ---
let partialPayTarget = null;

window.openPartialPayment = function(id) {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;
    
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
    
    // 1. Create a new transaction for the paid amount
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

    // 2. Reduce the original transaction amount
    partialPayTarget.amount = remaining;
    if (partialPayTarget.qty === 1) {
        partialPayTarget.unitPrice = remaining;
    }

    if (remaining <= 0.01) {
        partialPayTarget.status = partialPayTarget.type === 'pending' ? 'received' : 'paid';
        document.getElementById('partialPayModal').style.display = 'none';
        localStorage.setItem('fg_transactions', JSON.stringify(transactions));
        renderTable();
    } else {
        document.getElementById('partialNextDateGroup').style.display = 'block';
        document.getElementById('partialPayInfo').textContent = `Remaining unpaid: ${formatMoney(remaining)}. Enter next expected date:`;
        
        const btn = document.querySelector('#partialPayModal .btn-primary');
        btn.textContent = 'Confirm Next Date';
        btn.onclick = function() {
            const nextDate = document.getElementById('partialNextDate').value;
            if (!nextDate) { alert('Enter next expected date.'); return; }
            partialPayTarget.expectedDate = nextDate;
            localStorage.setItem('fg_transactions', JSON.stringify(transactions));
            renderTable();
            const futurePayBtn = document.getElementById('futurePayBtn');
            if (futurePayBtn) futurePayBtn.style.display = 'none';
            document.getElementById('partialPayModal').style.display = 'none';
            
            if (localStorage.getItem('fg_mode') === 'student') {
                const gstBtn = document.getElementById('gstInvoicesBtn');
                if (gstBtn) gstBtn.style.display = 'none';
            }

            btn.textContent = 'Submit';
            btn.onclick = submitPartialPayment;
        };
        localStorage.setItem('fg_transactions', JSON.stringify(transactions));
        renderTable();
    }
};
