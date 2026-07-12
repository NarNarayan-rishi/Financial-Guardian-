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

const welcomeOverlay = document.getElementById('welcomeOverlay');
const btnEnterApp = document.getElementById('btnEnterApp');
const notificationModal = document.getElementById('notificationModal');
const notificationContent = document.getElementById('notificationContent');

let chartInstance = null;

// --- Initialization & Notifications ---
btnEnterApp.addEventListener('click', () => {
    welcomeOverlay.style.display = 'none';
    
    // Check for pending payments today
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find a pending payment expected today or earlier that is still awaiting
    const pendingAlert = transactions.find(t => 
        t.type === 'pending' && 
        t.status === 'awaiting' && 
        t.expectedDate <= todayStr
    );
    
    if (pendingAlert) {
        playSound('warning');
        showNotification(pendingAlert);
    } else {
        playSound('pleasant');
        notificationContent.innerHTML = `
            <h2>All Clear</h2>
            <p>No pending payments are due to be received today.</p>
            <div class="modal-actions">
                <button class="btn-primary" onclick="closeNotification()">Excellent</button>
            </div>
        `;
        notificationModal.style.display = 'flex';
    }
    
    init();
});

function showNotification(transaction) {
    notificationContent.innerHTML = `
        <h2 style="color: var(--neon-red);">Payment Due</h2>
        <p>You expected to receive <strong>${formatMoney(transaction.amount)}</strong> for <em>${transaction.desc}</em> by ${transaction.expectedDate}.</p>
        <p>Has this payment been received?</p>
        <div class="modal-actions">
            <button class="btn-primary" style="background: var(--neon-green);" onclick="resolvePending(${transaction.id}, 'received')">Yes, Received</button>
            <button class="btn-danger" onclick="resolvePending(${transaction.id}, 'loss')">No, Mark as Loss</button>
        </div>
    `;
    notificationModal.style.display = 'flex';
}

window.resolvePending = function(id, newStatus) {
    const t = transactions.find(tx => tx.id === id);
    if (t) {
        t.status = newStatus;
        saveData();
        updateDashboard();
    }
    closeNotification();
}

window.closeNotification = function() {
    notificationModal.style.display = 'none';
}

window.toggleExpectedDate = function() {
    if (transType.value === 'pending') {
        expectedDateGroup.style.display = 'block';
        document.getElementById('expectedDate').required = true;
    } else {
        expectedDateGroup.style.display = 'none';
        document.getElementById('expectedDate').required = false;
    }
}

function init() {
    document.getElementById('transDate').valueAsDate = new Date();
    currencyInput.value = currentCurrencyCode;
    applySharedFontSize();
    updateDashboard();
}

// --- Event Listeners ---
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('transDate').value;
    const type = transType.value;
    const amount = parseFloat(document.getElementById('transAmount').value);
    const desc = document.getElementById('transDesc').value;
    let expectedDate = null;
    let status = null;
    
    if (type === 'pending') {
        expectedDate = document.getElementById('expectedDate').value;
        status = 'awaiting';
    }
    
    const record = { id: Date.now(), date, type, amount, desc, expectedDate, status };
    transactions.push(record);
    
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    saveData();
    updateDashboard();
    
    const dateKeep = document.getElementById('transDate').value;
    form.reset();
    document.getElementById('transDate').value = dateKeep;
    toggleExpectedDate();
});

currencyInput.addEventListener('input', function(e) {
    currentCurrencyCode = e.target.value.toUpperCase();
    localStorage.setItem('fg_currency', currentCurrencyCode);
    updateDashboard(); 
});

btnIncFont.addEventListener('click', () => {
    if (fontMultiplier < 1.5) fontMultiplier += 0.1;
    localStorage.setItem('fg_fontSize', fontMultiplier);
    applySharedFontSize();
});

btnDecFont.addEventListener('click', () => {
    if (fontMultiplier > 0.7) fontMultiplier -= 0.1;
    localStorage.setItem('fg_fontSize', fontMultiplier);
    applySharedFontSize();
});

// --- Core Dashboard Functions ---

function updateDashboard() {
    let totalRev = 0;
    let totalExp = 0;
    
    const dailyData = {};
    
    transactions.forEach(t => {
        // Determine effective type for calculations
        let effectiveType = t.type;
        if (t.type === 'pending') {
            if (t.status === 'received') effectiveType = 'revenue';
            else if (t.status === 'loss') effectiveType = 'expense';
            else return; // 'awaiting' doesn't affect current cash flow
        }
        
        if(effectiveType === 'revenue') totalRev += t.amount;
        else if (effectiveType === 'expense') totalExp += t.amount;
        
        if(!dailyData[t.date]) {
            dailyData[t.date] = { rev: 0, exp: 0 };
        }
        if(effectiveType === 'revenue') dailyData[t.date].rev += t.amount;
        else dailyData[t.date].exp += t.amount;
    });
    
    const net = totalRev - totalExp;
    
    dispRev.textContent = formatMoney(totalRev);
    dispExp.textContent = formatMoney(totalExp);
    dispNet.textContent = formatMoney(net);
    dispNet.className = 'amount ' + (net > 0 ? 'positive' : (net < 0 ? 'negative' : 'neutral'));
    
    updateChart(dailyData);
    generateVeteranAdvice(totalRev, totalExp, net, Object.keys(dailyData).length);
}

function generateVeteranAdvice(rev, exp, net, daysTracked) {
    let adviceHtml = '';
    
    if (transactions.length === 0) {
        adviceHtml = `<p>Welcome. A business without numbers is just a hobby. Start recording your daily income and expenses, and I'll tell you the brutal truth about your trajectory.</p>`;
    } 
    else if (daysTracked < 3) {
        adviceHtml = `<p>You've got some data in, which is good. But I need to see a pattern. The market doesn't care about a couple of good or bad days. Keep tracking consistently so we can see the real trend.</p>`;
    }
    else {
        const profitMargin = rev > 0 ? (net / rev) * 100 : 0;
        
        if (net < 0) {
            adviceHtml = `<p class="highlight-bad">Listen closely, you are bleeding cash. You're operating at a net loss of ${formatMoney(Math.abs(net))}.</p>
            <p>I've seen companies go under for less. When the ship is taking on water, you don't paint the deck. <strong>Here is your action plan:</strong></p>
            <ul>
                <li>Halt all non-essential spending immediately. Review every recurring subscription.</li>
                <li>Focus entirely on your core product/service. Stop experimenting until you're in the green.</li>
                <li>If your expenses (${formatMoney(exp)}) cannot be reduced, you have a severe pricing or volume problem.</li>
            </ul>`;
        } 
        else if (profitMargin > 0 && profitMargin < 15) {
            adviceHtml = `<p class="highlight-warn">You're making a profit, but your margin is razor-thin (${profitMargin.toFixed(1)}%). You're surviving, not thriving.</p>
            <p>One bad month, a supply chain hiccup, or an economic downturn, and you're in the red.</p>
            <ul>
                <li>You need breathing room. Look for ways to optimize operations and reduce that ${formatMoney(exp)} in expenses.</li>
                <li>Do not take on debt right now. Your margins cannot support heavy interest payments.</li>
            </ul>`;
        }
        else if (profitMargin >= 15 && profitMargin < 40) {
            adviceHtml = `<p class="highlight-good">Solid numbers. A ${profitMargin.toFixed(1)}% margin is respectable. You have a viable business.</p>
            <p>Now is the time for discipline, not luxury. I've seen entrepreneurs buy sports cars at this stage only to go bankrupt a year later.</p>
            <ul>
                <li>Take 30% of your net (${formatMoney(net)}) and put it in a liquid emergency fund. Build a 6-month runway.</li>
                <li>Reinvest the rest systematically. Don't scale expenses faster than revenue.</li>
            </ul>`;
        }
        else {
            adviceHtml = `<p class="highlight-good">Exceptional margins (${profitMargin.toFixed(1)}%). You are in a boom phase.</p>
            <p>A word of warning from a veteran: <strong class="highlight-warn">Euphoria is dangerous.</strong> The dot-com bubble was built on numbers like these before reality hit.</p>
            <ul>
                <li>Competitors will see these margins and enter your space. Build a moat around your business immediately.</li>
                <li>Do not let your lifestyle inflate. Keep your fixed costs low.</li>
                <li>Prepare for a market correction. Cash is king when the bubble bursts. Stash your war chest now.</li>
            </ul>`;
        }
    }
    
    advisorContent.innerHTML = adviceHtml;
}

function updateChart(dailyData) {
    const ctx = document.getElementById('financialChart').getContext('2d');
    const dates = Object.keys(dailyData).sort();
    
    const revData = [];
    const expData = [];
    const netTrend = [];
    
    let cumulative = 0;
    
    dates.forEach(date => {
        const r = dailyData[date].rev;
        const e = dailyData[date].exp;
        revData.push(r);
        expData.push(e);
        
        cumulative += (r - e);
        netTrend.push(cumulative);
    });
    
    if(chartInstance) {
        chartInstance.destroy();
    }
    
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#9ba3af';
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    type: 'line',
                    label: 'Cumulative Net',
                    data: netTrend,
                    borderColor: '#3b82f6', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue',
                    data: revData,
                    backgroundColor: '#10b981', 
                    borderRadius: 4
                },
                {
                    label: 'Expenses',
                    data: expData,
                    backgroundColor: '#ef4444', 
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += formatMoney(context.parsed.y);
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        callback: function(value) { return formatMoney(value); }
                    }
                }
            }
        }
    });
}
