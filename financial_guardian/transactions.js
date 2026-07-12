const ledgerBody = document.getElementById('ledgerBody');
const btnExportCsv = document.getElementById('exportCsvBtn');
const btnExportPdf = document.getElementById('exportPdfBtn');

function initLedger() {
    applySharedFontSize();
    renderTable();
}

function renderTable() {
    ledgerBody.innerHTML = '';
    
    // Sort transactions by date descending (newest first)
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(t => {
        const row = document.createElement('tr');
        
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
                statusBadge = `<span class="status-badge bg-red">Loss (Not Received)</span>`;
                actionHtml = `<label><input type="checkbox" onchange="markReceived(${t.id})"> Mark Received</label>`;
            } else {
                statusBadge = `<span class="status-badge bg-blue">Awaiting by ${t.expectedDate}</span>`;
                actionHtml = `<label><input type="checkbox" onchange="markReceived(${t.id})"> Mark Received</label>`;
            }
        }
        
        row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.desc}</td>
            <td style="text-transform: capitalize;">${t.type === 'pending' ? 'Accounts Receivable' : t.type}</td>
            <td>${statusBadge}</td>
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

// --- Exports ---
btnExportCsv.addEventListener('click', () => {
    if (transactions.length === 0) return alert("No transactions to export.");
    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Description,Status,ExpectedDate,Amount\n";
    transactions.forEach(t => {
        csvContent += `${t.date},${t.type},"${t.desc.replace(/"/g, '""')}",${t.status || ''},${t.expectedDate || ''},${t.amount}\n`;
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
    // Hide UI elements we don't want in the PDF
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');
    
    const element = document.getElementById('printableLedger');
    
    // HTML2PDF options
    const opt = {
        margin:       0.5,
        filename:     'financial_ledger.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Restore UI elements after generation
        noPrintElements.forEach(el => el.style.display = '');
    });
});

initLedger();
