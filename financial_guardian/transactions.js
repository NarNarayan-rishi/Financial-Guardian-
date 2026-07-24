const ledgerBody = document.getElementById('ledgerBody');
const btnExportCsv = document.getElementById('exportCsvBtn');
const btnExportPdf = document.getElementById('exportPdfBtn');

function initLedger() {
    applySharedFontSize();
    renderTable();
}

function renderTable() {
    ledgerBody.innerHTML = '';
    
    // Sort transactions by date descending (newest first), then by time
    const sorted = [...transactions].sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        // if same date, sort by id (which is timestamp based) descending
        return b.id - a.id;
    });
    
    // Group by date
    let lastDate = null;
    
    sorted.forEach(t => {
        // Insert date separator row
        if (t.date !== lastDate) {
            lastDate = t.date;
            const sepRow = document.createElement('tr');
            sepRow.className = 'date-separator';
            sepRow.innerHTML = `<td colspan="8">📅 ${formatDateDisplay(t.date)}</td>`;
            ledgerBody.appendChild(sepRow);
        }
        
        const row = document.createElement('tr');
        
        // Yellow highlight for pending rows
        if (t.type === 'pending') {
            row.className = 'pending-row';
        }
        
        let statusBadge = '';
        let actionHtml = '';
        
        if (t.type === 'revenue') {
            statusBadge = `<span class="status-badge bg-green">Received</span>`;
        } else if (t.type === 'expense') {
            statusBadge = `<span class="status-badge bg-red">Paid</span>`;
        } else if (t.type === 'pending') {
            if (t.status === 'received') {
                statusBadge = `<span class="status-badge bg-green">Received</span>`;
            } else if (t.status === 'loss') {
                statusBadge = `<span class="status-badge bg-red">Loss</span>`;
                actionHtml = `<label><input type="checkbox" onchange="markReceived(${t.id})"> Mark Received</label>`;
            } else {
                statusBadge = `<span class="status-badge bg-yellow">Awaiting by ${formatDateDisplay(t.expectedDate)}</span>`;
                actionHtml = `<label><input type="checkbox" onchange="markReceived(${t.id})"> Mark Received</label>`;
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
            <td>
                <div>${formatDateDisplay(t.date)}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${t.time || '--:--'}</div>
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
        t.status = 'received';
        saveData();
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
    link.setAttribute("download", "financial_ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

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
