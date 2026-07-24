// --- shared.js ---
// Common data and utilities for all pages

let transactions = JSON.parse(localStorage.getItem('fg_transactions')) || [];
let currentCurrencyCode = localStorage.getItem('fg_currency') || 'USD';
let fontMultiplier = parseFloat(localStorage.getItem('fg_fontSize')) || 1.0;
let presets = JSON.parse(localStorage.getItem('fg_presets')) || [];
let descFrequency = JSON.parse(localStorage.getItem('fg_descFreq')) || {};

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
    const symbol = getCurrencySymbol(currentCurrencyCode);
    let formattedNum;
    const indianCurrencies = ['INR', 'PKR', 'BDT', 'LKR', 'NPR'];
    if (indianCurrencies.includes(currentCurrencyCode)) {
        formattedNum = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        formattedNum = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return `${symbol}${formattedNum}`;
}

function formatDateDisplay(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
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
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'pleasant') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.6);
    }
}
