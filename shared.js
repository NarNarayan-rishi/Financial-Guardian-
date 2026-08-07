// --- shared.js ---
// Common data and utilities for all pages

let transactions = [];
try { transactions = JSON.parse(localStorage.getItem('fg_transactions')) || []; } catch(e) { console.error(e); }

let currentCurrencyCode = localStorage.getItem('fg_currency') || 'INR';
let fontMultiplier = parseFloat(localStorage.getItem('fg_fontSize'));
if (isNaN(fontMultiplier)) fontMultiplier = 0.8; // Default to 2nd smallest size

let presets = [];
try { presets = JSON.parse(localStorage.getItem('fg_presets')) || []; } catch(e) { console.error(e); }

let descFrequency = {};
try { descFrequency = JSON.parse(localStorage.getItem('fg_descFreq')) || {}; } catch(e) { console.error(e); }

const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
    'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'RUB': '₽',
    'PKR': '₨', 'BDT': '৳', 'LKR': '₨', 'NPR': '₨'
};

function getCurrencySymbol(code) {
    code = code.toUpperCase().trim();
    return currencySymbols[code] || code + ' ';
}

function applySharedFontSize() {
    document.documentElement.style.setProperty('--font-base-size', `${16 * fontMultiplier}px`);
}

document.addEventListener('DOMContentLoaded', () => {
    const btnInc = document.getElementById('increaseFont');
    const btnDec = document.getElementById('decreaseFont');
    if (btnInc) {
        btnInc.addEventListener('click', () => { 
            if (fontMultiplier < 1.5) fontMultiplier += 0.1; 
            localStorage.setItem('fg_fontSize', fontMultiplier); 
            applySharedFontSize(); 
        });
    }
    if (btnDec) {
        btnDec.addEventListener('click', () => { 
            if (fontMultiplier > 0.7) fontMultiplier -= 0.1; 
            localStorage.setItem('fg_fontSize', fontMultiplier); 
            applySharedFontSize(); 
        });
    }
});

// ================= GLOBAL TOUR SYSTEM =================
let currentTourStep = 0;
let globalTourSteps = [];

document.addEventListener('DOMContentLoaded', () => {
    // Inject Tour DOM Elements if they don't exist
    if (!document.getElementById('tourOverlay')) {
        const tourHtml = `
            <div id="tourOverlay" class="tour-overlay"></div>
            <div id="tourDialog" class="tour-dialog glass-panel">
                <h2 id="tourTitle" style="color: var(--neon-blue); margin-bottom: 0.5rem; font-size: 1.2rem;">Step</h2>
                <p id="tourDesc" style="font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;"></p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn-icon" style="color: var(--text-muted);" onclick="endTour()">Skip Tour</button>
                    <button id="tourNextBtn" class="btn-primary" onclick="nextTourStep()">Next</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', tourHtml);
    }
});

window.startTour = function(steps = null) {
    if (steps && steps.length > 0) globalTourSteps = steps;
    if (globalTourSteps.length === 0) return;
    
    document.getElementById('tourOverlay').style.display = 'block';
    document.getElementById('tourDialog').style.display = 'block';
    currentTourStep = 0;
    showTourStep(currentTourStep);
};

window.showTourStep = function(index) {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    
    if (index >= globalTourSteps.length) {
        endTour();
        return;
    }
    
    const step = globalTourSteps[index];
    const targetEl = document.querySelector(step.target);
    if (targetEl) {
        targetEl.classList.add('tour-highlight');
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    document.getElementById('tourTitle').innerText = `Step ${index + 1} of ${globalTourSteps.length}: ${step.title}`;
    document.getElementById('tourDesc').innerText = step.desc;
    document.getElementById('tourNextBtn').innerText = (index === globalTourSteps.length - 1) ? 'Finish' : 'Next';
};

window.nextTourStep = function() {
    currentTourStep++;
    showTourStep(currentTourStep);
};

window.endTour = function() {
    document.getElementById('tourOverlay').style.display = 'none';
    document.getElementById('tourDialog').style.display = 'none';
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    localStorage.setItem('fg_tour_seen', 'true');
};

function saveData() {
    localStorage.setItem('fg_transactions', JSON.stringify(transactions));
}

function savePresets() {
    localStorage.setItem('fg_presets', JSON.stringify(presets));
}

function saveDescFrequency() {
    localStorage.setItem('fg_descFreq', JSON.stringify(descFrequency));
}

function trackDescription(desc) {
    if (!desc) return;
    const key = desc.trim();
    descFrequency[key] = (descFrequency[key] || 0) + 1;
    saveDescFrequency();
}

function getTopDescriptions(limit) {
    return Object.entries(descFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit || 5)
        .map(e => e[0]);
}

function getProfile() {
    return JSON.parse(localStorage.getItem('fg_profile')) || {};
}

function formatMoney(amount) {
    const num = parseFloat(amount) || 0;
    const symbol = getCurrencySymbol(currentCurrencyCode);
    let formattedNum;
    const indianCurrencies = ['INR', 'PKR', 'BDT', 'LKR', 'NPR'];
    if (indianCurrencies.includes(currentCurrencyCode)) {
        formattedNum = num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        formattedNum = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return `${symbol}${formattedNum}`;
}

function formatDateDisplay(isoDate) {
    if (!isoDate) return '';
    const dateStr = String(isoDate);
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// --- GST Auto-Detection (based on bajajfinserv.in/gst-rates-in-india) ---
// Updated per GST 2.0 reforms (Sept 2025): slabs are 0%, 5%, 18%, 40%
const gstKeywordMap = [
    // 0% - Essentials & fresh produce
    { keywords: ['milk','curd','lassi','paneer','eggs','fresh vegetables','fresh fruits','wheat','rice','flour','atta','maida','bread','salt','jaggery','gur','contraceptives','stamps','judicial papers','printed books','newspaper','bangles','handloom','charcoal','slate pencils','chalk','roti','paratha','honey','live animals','meat fresh','fish fresh','cereals','seeds','plants','water','prasad','blood','vaccines','human hair','kajal','children drawing books'], rate: 0 },
    // 5% - Common household & packaged goods
    { keywords: ['sugar','tea','coffee','spices','cashew nuts','raisin','oil edible','ghee','butter','cheese','pizza bread','rusk','namkeen','sabudana','ice','coal','fertilizer','agarbatti','incense','kite','insulin','medicines','drugs','stent','footwear','apparel','clothes','readymade garments','fabric','cotton','jute','silk','coir','blanket','umbrella','toys','sports goods','broom','stamp','hearing aid','disabled vehicle','kerosene','lng','bio diesel','walking stick','fly ash','marble rubble','natural sand','transport goods','cab','taxi','small restaurant','take away food','newspaper ad','toothpaste','soap','shampoo','hair oil','detergent','biscuits','cream','deodorant','chips','noodles','pasta','ketchup','jam','sauce','pickle','squash','cold drink powder','tooth powder','mosquito repellent','matchbox'], rate: 5 },
    // 18% - Standard rate (most goods & services)
    { keywords: ['mobile phone','computer','laptop','monitor','printer','camera','speaker','headphone','earphone','television','tv','fridge','refrigerator','washing machine','air conditioner','ac','microwave','oven','mixer grinder','iron box','water heater','geyser','fan','cooler','vacuum cleaner','sewing machine','motor','pump','generator','transformer','wire','cable','switch','socket','led','bulb','tube light','tyre','tire','battery','paint','varnish','cement','steel','iron rod','tmx bar','plywood','glass','ceramic tiles','sanitary ware','plastic','rubber','paper','notebook','stationery','pen','furniture','mattress','pillow','curtain','carpet','kitchenware','utensil','aluminium','copper','brass','tinplate','chocolate','ice cream','cafe','restaurant','hotel','beauty parlour','gym','club','movie','cinema','consulting','legal service','accounting','software','it services','advertising','courier','telecom','banking','financial service','insurance','warehouse','storage','office supplies','rent commercial','maintenance','repair','construction','interior design','architect','photography','printing','packaging','logistics','freight','air travel economy','railway catering'], rate: 18 },
    // 40% - Luxury & sin goods
    { keywords: ['tobacco','cigarette','cigar','bidi','pan masala','gutka','aerated drinks','cola','soda','pepsi','energy drink','luxury car','suv','yacht','private aircraft','race club','casino','betting','gambling','lottery','online gaming','hookah','large motorcycle','motorcycle above 350cc'], rate: 40 }
];

function detectGstRate(productName) {
    if (!productName) return 18; // default
    const lower = productName.toLowerCase().trim();
    for (const group of gstKeywordMap) {
        for (const kw of group.keywords) {
            if (lower.includes(kw) || kw.includes(lower)) {
                return group.rate;
            }
        }
    }
    return 18; // default standard rate
}

// --- Global Input Protection (XSS Prevention) ---
document.addEventListener('input', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const val = e.target.value;
        // Simple regex to catch script tags or javascript pseudoprotocol
        if (/<script/i.test(val) || /javascript:/i.test(val) || /on\w+\s*=/i.test(val)) {
            e.target.value = '';
            alert("Can't run the code");
        }
    }
});

// --- Privacy / Screenshot Protection ---
// Disable right-click and screenshots on all pages EXCEPT the full ledger (transactions.html)
if (!window.location.pathname.includes('transactions.html')) {
    // Disable right click menu
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Deter print screen keyboard shortcut
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            try { navigator.clipboard.writeText(''); } catch(err) {}
            alert("Screenshots are disabled on this page for security.");
        }
    });
    
    // Add CSS to disable text selection and highlight
    document.head.insertAdjacentHTML('beforeend', '<style>body { -webkit-user-select: none; user-select: none; }</style>');
}

// --- Audio System (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === 'warning') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.2);
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'pleasant') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof translateDOM === 'function') {
        translateDOM();
    }
});

// --- File System Storage (IndexedDB) ---
const dbName = 'FinancialGuardianDB';
const storeName = 'Handles';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

window.saveDirectoryHandle = async function(handle) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(handle, 'invoiceDir');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

window.getDirectoryHandle = async function() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get('invoiceDir');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

