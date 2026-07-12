// --- shared.js ---
// Common data and utilities for both index.html and transactions.html

let transactions = JSON.parse(localStorage.getItem('fg_transactions')) || [];
let currentCurrencyCode = localStorage.getItem('fg_currency') || 'USD';
let fontMultiplier = parseFloat(localStorage.getItem('fg_fontSize')) || 1.0;

const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
    'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'RUB': '₽'
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

// --- Audio System (Web Audio API for reliability without external files) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'warning') {
        // Harsh alarm sound
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
        // Soft chime sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.6);
    }
}
