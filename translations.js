const translations = {
    "en": {
        "app_title": "Financial Guardian",
        "app_subtitle": "Veteran Insight for Modern Business",
        "lang_select_title": "Choose Language / भाषा चुनें",
        "lang_select_desc": "Please select your preferred language to continue.",
        "btn_english": "English",
        "btn_hindi": "हिंदी",
        
        // Welcome Flow
        "welcome_title": "Welcome",
        "welcome_desc": "Are you using this app for business or personal/student use?",
        "btn_business": "Business (Shop/Company)",
        "btn_student": "Student (Personal)",
        "welcome_back_title": "Welcome Back",
        "welcome_back_desc": "Click below to open your dashboard and check for pending payments.",
        "btn_enter_app": "Enter Dashboard",

        // Dashboard Summary
        "fin_summary": "Financial Summary",
        "total_revenue": "Total Revenue",
        "total_expenses": "Total Expenses",
        "net_balance": "Net Balance",
        "payment_to_make": "Payment to be made",
        "payment_to_receive": "Payment yet to receive",

        // Controls
        "currency_label": "Currency",
        "text_size": "Text Size",

        // Record Transaction
        "record_tx": "Record Transaction",
        "quick_presets": "Quick Presets",
        "preset_name": "Preset name",
        "price": "Price",
        "type_revenue": "Revenue",
        "type_expense": "Expense",
        "type_pending": "Payment yet to be received",
        "type_futurepay": "Payment to be made in future",
        "btn_add_preset": "Add",
        
        "lbl_date": "Date",
        "lbl_type": "Type",
        "lbl_amount": "Total Amount",
        "lbl_desc": "Description (What was this for?)",
        "lbl_payment_mode": "Payment Mode",
        "mode_cash": "Offline / Cash",
        "mode_online": "Online / UPI",
        
        "gen_gst_label": "Generate GST Invoice for this transaction",
        "btn_add_tx": "Add Transaction",
        
        // Advice
        "advice_title": "Accountant's Advice",

        // History
        "your_tx": "Your Transactions",
        "btn_open_ledger": "Open Full Ledger",
        
        // Ledger
        "ledger_title": "Full Transaction Ledger",
        "ledger_subtitle": "Complete Financial History",
        "btn_export_csv": "Export to Spreadsheet (CSV)",
        "btn_export_pdf": "Export to PDF (Clean)",
        "btn_back_dash": "Back to Dashboard",
        "btn_gst_invoices": "GST Invoices",
        
        // Ledger Table
        "col_date": "Date & Time",
        "col_desc": "Description",
        "col_qty": "Qty",
        "col_type": "Type",
        "col_amount": "Amount",
        "col_status": "Status",
        "col_action": "Action",
        
        // Profile
        "profile_title": "Business Profile",
        "profile_subtitle": "Your details will auto-fill into GST invoices",
        "ent_details": "Enterprise Details",
        "contact_details": "Contact Details",
        "bank_details": "Bank Details",
        "btn_save_profile": "Save Profile",
        
        // Profile Labels
        "lbl_comp_name": "Enterprise / Company Name",
        "lbl_gstin": "GSTIN",
        "lbl_address": "Billing Address",
        "lbl_phone": "Phone Number",
        "lbl_email": "Email ID",
        "lbl_bank": "Bank Name",
        "lbl_acc_no": "Account Number",
        "lbl_ifsc": "IFSC Code",
        "lbl_acc_name": "Account Holder Name",
        
        // GST Invoices
        "gst_dir_title": "GST Invoices Directory",
        "gst_dir_subtitle": "All Auto-Generated Tax Documents",
        "btn_back_ledger": "← Back to Ledger",
        
        "col_inv_no": "Invoice No",
        "col_buyer": "Buyer Name",
        "col_total": "Total Amount",
        
        // Generics
        "btn_close": "Close",
        "btn_submit": "Submit",
        "btn_cancel": "Cancel",
        "btn_print": "Print / Save PDF",
        
        // Category
        "lbl_category": "Category",
        "btn_add_category": "+ Add Category",
        "cat_sales": "Sales & Revenue",
        "cat_salary": "Salary & Wages",
        "cat_food": "Food & Dining",
        "cat_rent": "Rent & Utilities",
        "cat_tech": "Software & Tech",
        "cat_marketing": "Marketing",
        "cat_transport": "Transportation",
        "cat_taxes": "Taxes",
        "cat_other": "Other",
        
        // Extra Inputs
        "lbl_expected_date": "Expected Date of Payment",
        "lbl_qty": "Quantity",
        "lbl_price": "Price per Unit",
        "lbl_total": "Total Amount: ",
        
        // Insights
        "advice_default": "I've seen the markets rise and fall for 20 years. Enter your financial data, and I'll give you a straight assessment of where your business stands.",
        "advice_no_data": "Welcome. A business without numbers is just a hobby. Start recording your daily income and expenses, and I'll tell you the brutal truth about your trajectory.",
        "advice_need_data": "You've got some data in, which is good. But I need to see a pattern. Keep tracking consistently so we can see the real trend.",
        "advice_loss": "Listen closely, you are bleeding cash. Net loss of {0}.",
        "advice_loss_tips": "<ul><li>Halt all non-essential spending. Review every recurring subscription.</li><li>Focus on your core product. Stop experimenting until you're in the green.</li><li>If expenses ({0}) can't be reduced, you have a pricing problem.</li></ul>",
        "advice_thin": "Razor-thin margin ({0}%). You're surviving, not thriving.",
        "advice_thin_tips": "<ul><li>Optimize operations and reduce that {0} in expenses.</li><li>Do not take on debt now. Your margins cannot support it.</li></ul>",
        "advice_solid": "Solid {0}% margin. You have a viable business.",
        "advice_solid_tips": "<ul><li>Take 30% of net ({0}) and build a 6-month runway.</li><li>Reinvest systematically. Don't scale expenses faster than revenue.</li></ul>",
        "advice_boom": "Exceptional {0}% margins. Boom phase.",
        "advice_boom_tips": "<ul><li>Competitors will enter your space. Build a moat immediately.</li><li>Keep fixed costs low. Cash is king when the bubble bursts.</li></ul>",
        "advice_warn_rent": "Warning: Your rent/facilities expenses are over 30% of total expenses. This overhead is dangerously high.",
        "advice_warn_zero_rev": "Critical: You are burning cash with zero revenue. Stop spending immediately unless it directly acquires customers.",
        "advice_warn_trans": "Warning: High transportation costs. Consider renegotiating logistics or travel policies.",
        "advice_warn_pending": "Cash Flow Alert: Uncollected receivables are over 20% of your revenue. Collect your money now.",
        "advice_warn_future": "Obligations: You have {0} in upcoming payouts. Ensure you have cash on hand.",
        "advice_reality_glass": "Reality Glass",
        "advice_pseudo_warn": "Your revenue is not entirely for growing your business; a portion of it is pseudo-revenue reserved for paying outstanding payments.",
        "advice_true_rev": "True Revenue",
        "advice_pseudo_rev": "Pseudo-Revenue (Reserved)",
        "advice_leak_1": "Financial Leak Detected: You have marked {0} worth of expenses as 'Unnecessary'. ",
        "advice_leak_2": "You bought '{0}' {1} times, wasting {2} total. Break this habit immediately.",
        "advice_leak_3": "Your biggest unnecessary drain was '{0}' ({1}). Trim the fat.",
        
        "insights_summary": "How general businesses lose money",
        "ins_1": "<strong>Poor Cash Flow Management:</strong> Waiting too long for receivables while payables are due.",
        "ins_2": "<strong>Over-expansion:</strong> Expanding operations or hiring too quickly before revenue supports it.",
        "ins_3": "<strong>Pricing Issues:</strong> Underpricing products to gain market share but destroying margins.",
        "ins_4": "<strong>Ignoring Small Expenses:</strong> Death by a thousand cuts — subscriptions and minor fees add up.",
        "ins_5": "<strong>Lack of Emergency Fund:</strong> No buffer for economic downturns or supply chain shocks.",
        
        // Charts
        "chart_title": "Financial Overview",
        "cat_exp_chart": "Expenses by Category",
        
        // Tour
        "btn_skip": "Skip Tour",
        "btn_next": "Next",
        
        // Mode Select
        "mode_select_title": "How will you use Financial Guardian?",
        "mode_select_desc": "Choose your mode. You can change this later in your Profile.",
        "col_feature": "Feature",
        "col_business": "🏢 Business",
        "col_employee": "👔 Employee",
        "col_student": "🎓 Student",
        "row_gst": "GST Invoice Generation",
        "row_alerts": "Payment Yet to Receive Alerts",
        "row_rev": "Revenue / Savings Tracking",
        "row_exp": "Expense Tracking",
        "row_profile": "Enterprise / GSTIN Profile",
        "row_ledger": "Full Ledger with Invoice Column",
        "row_ai": "Accountant AI Advice",
        "btn_business_select": "🏢 Business / Employer",
        "btn_employee_select": "👔 Employee",
        "btn_student_select": "🎓 Student",
        
        // Calc
        "calc_title": "Calculator"
    },
    "hi": {
        "app_title": "फाइनेंशियल गार्जियन",
        "app_subtitle": "आपके व्यापार का आसान मुनीम",
        "lang_select_title": "Choose Language / भाषा चुनें",
        "lang_select_desc": "Please select your preferred language to continue.",
        "btn_english": "English",
        "btn_hindi": "हिंदी",
        
        // Welcome Flow
        "welcome_title": "स्वागत है",
        "welcome_desc": "क्या आप इस ऐप का उपयोग व्यापार (दुकान/कंपनी) के लिए कर रहे हैं या निजी/छात्र उपयोग के लिए?",
        "btn_business": "व्यापार (दुकान/कंपनी)",
        "btn_student": "छात्र (निजी)",
        "welcome_back_title": "वापसी पर स्वागत है",
        "welcome_back_desc": "अपना डैशबोर्ड खोलने और बाकी भुगतानों की जांच करने के लिए नीचे क्लिक करें।",
        "btn_enter_app": "डैशबोर्ड खोलें",

        // Dashboard Summary
        "fin_summary": "पैसे का हिसाब",
        "total_revenue": "कुल कमाई",
        "total_expenses": "कुल खर्चा",
        "net_balance": "बचा हुआ पैसा",
        "payment_to_make": "देने बाकी",
        "payment_to_receive": "आने बाकी",

        // Controls
        "currency_label": "मुद्रा",
        "text_size": "अक्षर का आकार",

        // Record Transaction
        "record_tx": "नया हिसाब लिखें",
        "quick_presets": "जल्दी भरने वाले",
        "preset_name": "नाम",
        "price": "दाम",
        "type_revenue": "कमाई",
        "type_expense": "खर्चा",
        "type_pending": "आने बाकी",
        "type_futurepay": "देने बाकी",
        "btn_add_preset": "जोड़ें",
        
        "lbl_date": "तारीख",
        "lbl_type": "प्रकार",
        "lbl_amount": "कुल रकम",
        "lbl_desc": "विवरण (यह किस लिए था?)",
        "lbl_payment_mode": "भुगतान का तरीका",
        "mode_cash": "नकद (Offline)",
        "mode_online": "ऑनलाइन (UPI)",
        
        "gen_gst_label": "इस लेन-देन का GST बिल बनाएं",
        "btn_add_tx": "हिसाब जोड़ें",
        
        // Advice
        "advice_title": "मुनीम की सलाह",

        // History
        "your_tx": "आपके लेन-देन",
        "btn_open_ledger": "पूरा बहीखाता खोलें",
        
        // Ledger
        "ledger_title": "पूरा बहीखाता",
        "ledger_subtitle": "पैसे का पूरा इतिहास",
        "btn_export_csv": "एक्सेल (CSV) डाउनलोड करें",
        "btn_export_pdf": "PDF डाउनलोड करें",
        "btn_back_dash": "डैशबोर्ड पर वापस",
        "btn_gst_invoices": "GST बिल",
        
        // Ledger Table
        "col_date": "तारीख और समय",
        "col_desc": "विवरण",
        "col_qty": "मात्रा",
        "col_type": "प्रकार",
        "col_amount": "रकम",
        "col_status": "स्थिति",
        "col_action": "क्रिया",
        
        // Profile
        "profile_title": "व्यापार की जानकारी",
        "profile_subtitle": "आपकी जानकारी GST बिल में अपने आप भर जाएगी",
        "ent_details": "दुकान/कंपनी की जानकारी",
        "contact_details": "संपर्क विवरण",
        "bank_details": "बैंक खाता विवरण",
        "btn_save_profile": "जानकारी सेव करें",
        
        // Profile Labels
        "lbl_comp_name": "दुकान/कंपनी का नाम",
        "lbl_gstin": "GSTIN",
        "lbl_address": "पूरा पता",
        "lbl_phone": "फ़ोन नंबर",
        "lbl_email": "ईमेल",
        "lbl_bank": "बैंक का नाम",
        "lbl_acc_no": "खाता संख्या",
        "lbl_ifsc": "IFSC कोड",
        "lbl_acc_name": "खाता धारक का नाम",
        
        // GST Invoices
        "gst_dir_title": "GST बिल की सूची",
        "gst_dir_subtitle": "सभी बनाए गए टैक्स बिल",
        "btn_back_ledger": "← बहीखाता पर वापस",
        
        "col_inv_no": "बिल नंबर",
        "col_buyer": "खरीदार का नाम",
        "col_total": "कुल रकम",
        
        // Generics
        "btn_close": "बंद करें",
        "btn_submit": "जमा करें",
        "btn_cancel": "रद्द करें",
        "btn_print": "प्रिंट / PDF सेव करें",

        // Category
        "lbl_category": "श्रेणी (Category)",
        "btn_add_category": "+ श्रेणी जोड़ें",
        "cat_sales": "बिक्री और कमाई",
        "cat_salary": "वेतन और मजदूरी",
        "cat_food": "खाना-पीना",
        "cat_rent": "किराया और बिजली",
        "cat_tech": "सॉफ्टवेयर और तकनीक",
        "cat_marketing": "मार्केटिंग (प्रचार)",
        "cat_transport": "आवागमन (Transportation)",
        "cat_taxes": "टैक्स",
        "cat_other": "अन्य (Other)",
        
        // Extra Inputs
        "lbl_expected_date": "पैसे मिलने/देने की तारीख",
        "lbl_qty": "मात्रा (Qty)",
        "lbl_price": "एक पीस का दाम",
        "lbl_total": "कुल रकम: ",
        
        // Insights
        "advice_default": "अपना हिसाब डालें और मैं आपको आपके व्यापार की सही स्थिति बताऊंगा।",
        "advice_no_data": "स्वागत है। बिना हिसाब के व्यापार सिर्फ एक शौक है। अपनी रोज़ की कमाई और खर्चा लिखना शुरू करें, फिर मैं आपको आपकी सही स्थिति बताऊंगा।",
        "advice_need_data": "आपने कुछ हिसाब डाला है, जो अच्छी बात है। लेकिन मुझे और जानकारी चाहिए। लगातार लिखते रहें ताकि हम सही स्थिति देख सकें।",
        "advice_loss": "ध्यान से सुनें, आपका पैसा डूब रहा है। {0} का नुकसान हुआ है।",
        "advice_loss_tips": "<ul><li>फालतू के खर्चे तुरंत बंद करें।</li><li>अपने मुख्य काम पर ध्यान दें। जब तक मुनाफा न हो, नए प्रयोग न करें।</li><li>अगर खर्चे ({0}) कम नहीं हो सकते, तो आपको दाम बढ़ाने होंगे।</li></ul>",
        "advice_thin": "बहुत कम मुनाफा ({0}%)। आप बस गुज़ारा कर रहे हैं, आगे नहीं बढ़ रहे।",
        "advice_thin_tips": "<ul><li>काम का तरीका सुधारें और अपने {0} के खर्चे कम करें।</li><li>अभी कर्ज़ा बिलकुल न लें।</li></ul>",
        "advice_solid": "अच्छा मुनाफा ({0}%)। आपका व्यापार सही चल रहा है।",
        "advice_solid_tips": "<ul><li>मुनाफे ({0}) का 30% बचाकर रखें ताकि बुरे वक़्त में 6 महीने काम चल सके।</li><li>कमाई के हिसाब से ही खर्चा बढ़ाएं।</li></ul>",
        "advice_boom": "बहुत बढ़िया मुनाफा ({0}%)। आपका व्यापार तेज़ी से बढ़ रहा है।",
        "advice_boom_tips": "<ul><li>बाज़ार में और लोग आएंगे। अपने व्यापार को और मज़बूत करें।</li><li>ज़रूरी खर्चे कम ही रखें। बुरा समय आने पर पैसा ही काम आता है।</li></ul>",
        "advice_warn_rent": "चेतावनी: आपके किराए/सुविधाओं का खर्चा कुल खर्चे का 30% से ज़्यादा है। यह बहुत खतरनाक है।",
        "advice_warn_zero_rev": "खतरा: आपकी कमाई शून्य है पर खर्चे चालू हैं। तुरंत खर्चे बंद करें।",
        "advice_warn_trans": "चेतावनी: आने-जाने (Transportation) का खर्चा बहुत ज़्यादा है। इसे कम करने का तरीका सोचें।",
        "advice_warn_pending": "पैसों की कमी का खतरा: आपकी कमाई का 20% से ज़्यादा पैसा बाज़ार में फंसा है। उसे जल्द से जल्द वसूलें।",
        "advice_warn_future": "देनदारी: आपको आने वाले समय में {0} देने हैं। पैसे का इंतज़ाम रखें।",
        "advice_reality_glass": "सच्चाई का आईना (Reality Glass)",
        "advice_pseudo_warn": "आपकी पूरी कमाई व्यापार बढ़ाने के लिए नहीं है; इसमें से कुछ हिस्सा आपके बाकी भुगतानों को चुकाने के लिए रखा हुआ छद्म-पैसा (Pseudo-Revenue) है।",
        "advice_true_rev": "असली कमाई",
        "advice_pseudo_rev": "बाकी भुगतानों के लिए पैसा",
        "advice_leak_1": "खर्चों में लीकेज: आपने {0} के खर्चे को 'फालतू' बताया है। ",
        "advice_leak_2": "आपने '{0}' को {1} बार खरीदा, जिससे कुल {2} का नुकसान हुआ। यह आदत तुरंत छोड़ें।",
        "advice_leak_3": "आपका सबसे बड़ा फालतू खर्चा '{0}' ({1}) था। इसे बंद करें।",
        
        "insights_summary": "व्यापार में घाटा क्यों होता है",
        "ins_1": "<strong>नकदी की समस्या:</strong> आने वाले पैसे में देरी होना और देनदारी सिर पर होना।",
        "ins_2": "<strong>जल्दबाजी में विस्तार:</strong> कमाई बढ़ने से पहले ही खर्चे बढ़ा लेना।",
        "ins_3": "<strong>गलत दाम:</strong> बाजार में टिकने के लिए बहुत सस्ते में बेचना।",
        "ins_4": "<strong>छोटे खर्चों को अनदेखा करना:</strong> छोटे-छोटे खर्चे मिलकर बहुत बड़े बन जाते हैं।",
        "ins_5": "<strong>बचत न होना:</strong> बुरे समय के लिए पैसे बचाकर न रखना।",
        
        // Charts
        "chart_title": "पैसे का चित्र (Graph)",
        "cat_exp_chart": "श्रेणी के अनुसार खर्चा",
        
        // Tour
        "btn_skip": "स्किप करें (Skip)",
        "btn_next": "आगे बढ़ें (Next)",
        
        // Mode Select
        "mode_select_title": "आप ऐप का उपयोग कैसे करेंगे?",
        "mode_select_desc": "अपना तरीका चुनें। आप इसे बाद में प्रोफाइल से बदल सकते हैं।",
        "col_feature": "सुविधा (Feature)",
        "col_business": "🏢 व्यापार",
        "col_employee": "👔 नौकरीपेशा",
        "col_student": "🎓 छात्र (निजी)",
        "row_gst": "GST बिल बनाना",
        "row_alerts": "बाकी पैसे याद दिलाना",
        "row_rev": "कमाई का हिसाब",
        "row_exp": "खर्च का हिसाब",
        "row_profile": "व्यापार की जानकारी",
        "row_ledger": "पूरा बहीखाता और बिल",
        "row_ai": "मुनीम की सलाह",
        "btn_business_select": "🏢 व्यापार",
        "btn_employee_select": "👔 नौकरीपेशा",
        "btn_student_select": "🎓 छात्र",
        
        // Calc
        "calc_title": "कैलकुलेटर"
    }
};

function getLanguage() {
    return localStorage.getItem('fg_lang') || 'en';
}

function setLanguage(lang) {
    localStorage.setItem('fg_lang', lang);
    translateDOM();
}

function t(key) {
    const lang = getLanguage();
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key];
    }
    return key;
}

function translateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = t(key);
        } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            // Usually not used for setting textContent directly on inputs
        } else {
            el.innerHTML = t(key);
        }
    });
    
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}

window.toggleLanguage = function() {
    const currentLang = getLanguage();
    const newLang = currentLang === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
};
