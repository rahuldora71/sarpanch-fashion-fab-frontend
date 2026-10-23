/**
 * ============================================================================
 * WORKER VOCABULARY & CUSTOM WORD MAPPING FILE (LOW-LITERACY FRIENDLY)
 * ============================================================================
 *
 * PURPOSE:
 * Standard literal translations (e.g. "अग्रिम राशि" for Advance, or "परिधान" for Garment)
 * are difficult for tailoring workshop workers (कारीगर / मास्टर जी / दर्जी) to read.
 *
 * In this file, you can map ANY English word, measurement field, garment name,
 * or status to its exact everyday workshop Hindi (`hi`) or Punjabi (`pa`) meaning.
 *
 * HOW TO ADD A NEW WORD:
 * Simply add a new line inside `WORKER_WORD_MAP`:
 *   "English Word": {
 *     hi: "सरल हिंदी शब्द",
 *     pa: "ਸਰਲ ਪੰਜਾਬੀ ਸ਼ਬਦ",
 *   },
 *
 * Note: Lookup is case-insensitive! Adding "Chest" will automatically match
 * "chest", "Chest", and "CHEST".
 * ============================================================================
 */

export interface WorkerTermTranslation {
  /** Simple, everyday workshop Hindi (Devanagari) for low-literacy workers */
  hi: string;
  /** Optional Punjabi (Gurmukhi) workshop meaning */
  pa?: string;
  /** Optional English display override */
  en?: string;
}

export const WORKER_WORD_MAP: Record<string, WorkerTermTranslation> = {
  // ==========================================================================
  // 1. NAVIGATION & MAIN SECTIONS
  // ==========================================================================
  "Dashboard": {
    hi: "होम / मुख्य पेज (Dashboard)",
    pa: "ਮੁੱਖ ਪੰਨਾ (Dashboard)",
  },
  "Customers": {
    hi: "ग्राहक (Customers)",
    pa: "ਗਾਹਕ (Customers)",
  },
  "Orders": {
    hi: "ऑर्डर लिस्ट (Orders)",
    pa: "ਆਰਡਰ ਲਿਸਟ (Orders)",
  },
  "Cutting Queue": {
    hi: "कटाई लिस्ट (Cutting Queue)",
    pa: "ਕਟਾਈ ਲਿਸਟ (Cutting Queue)",
  },
  "Cutting Workspace": {
    hi: "कटाई टेबल (Cutting Workspace)",
    pa: "ਕਟਾਈ ਟੇਬਲ (Cutting Workspace)",
  },
  "Measurements": {
    hi: "नाप (Measurements)",
    pa: "ਨਾਪ (Measurements)",
  },
  "Services & Pricing": {
    hi: "सिलाई और रेट (Services)",
    pa: "ਸਿਲਾਈ ਅਤੇ ਰੇਟ (Services)",
  },
  "Add-ons": {
    hi: "डिज़ाइन / एक्स्ट्रा काम (Add-ons)",
    pa: "ਡਿਜ਼ਾਈਨ / ਵਾਧੂ ਕੰਮ (Add-ons)",
  },
  "Production Calendar": {
    hi: "काम का कैलेंडर (Calendar)",
    pa: "ਕੰਮ ਦਾ ਕੈਲੰਡਰ (Calendar)",
  },
  "Checkout": {
    hi: "बिल और पेमेंट (Checkout)",
    pa: "ਬਿੱਲ ਅਤੇ ਪੇਮੈਂਟ (Checkout)",
  },
  "New Order": {
    hi: "नया ऑर्डर",
    pa: "ਨਵਾਂ ਆਰਡਰ",
  },
  "Create New Order": {
    hi: "नया ऑर्डर बनाएं (New Order)",
    pa: "ਨਵਾਂ ਆਰਡਰ ਬਣਾਓ (New Order)",
  },
  "Edit Order": {
    hi: "ऑर्डर बदलें (Edit Order)",
    pa: "ਆਰਡਰ ਬਦਲੋ (Edit Order)",
  },
  "Logout": {
    hi: "लॉगआउट (बाहर निकलें)",
    pa: "ਲੌਗਆਊਟ",
  },

  // ==========================================================================
  // 2. MEASUREMENT FIELDS (नाप के शब्द - कारीगरों के लिए सरल भाषा)
  // ==========================================================================
  "Length": {
    hi: "लंबाई (Length)",
    pa: "ਲੰਬਾਈ (Length)",
  },
  "Full Length": {
    hi: "पूरी लंबाई (Full Length)",
    pa: "ਪੂਰੀ ਲੰਬਾਈ (Full Length)",
  },
  "Front Length": {
    hi: "आगे की लंबाई (Front Length)",
    pa: "ਅੱਗੇ ਦੀ ਲੰਬਾਈ",
  },
  "Back Length": {
    hi: "पीछे की लंबाई (Back Length)",
    pa: "ਪਿੱਛे ਦੀ ਲੰਬਾਈ",
  },
  "Chest": {
    hi: "छाती / सीना (Chest)",
    pa: "ਛਾਤੀ (Chest)",
  },
  "Upper Chest": {
    hi: "ऊपरी छाती (Upper Chest)",
    pa: "ਉੱਪਰਲੀ ਛਾਤੀ",
  },
  "Waist": {
    hi: "कमर / पेट (Waist)",
    pa: "ਕਮਰ / ਪੇਟ (Waist)",
  },
  "Stomach": {
    hi: "पेट / घेरा (Stomach)",
    pa: "ਪੇਟ (Stomach)",
  },
  "Shoulder": {
    hi: "तीरा / कंधा (Shoulder)",
    pa: "ਤੀਰਾ / ਮੋਢਾ (Shoulder)",
  },
  "Cross Back": {
    hi: "पिछला तीरा (Cross Back)",
    pa: "ਪਿਛਲਾ ਤੀਰਾ",
  },
  "Sleeve": {
    hi: "बाजू / आस्तीन (Sleeve)",
    pa: "ਬਾਹਾਂ / ਆਸਤੀਨ (Sleeve)",
  },
  "Sleeve Length": {
    hi: "बाजू की लंबाई (Sleeve Length)",
    pa: "ਬਾਂਹ ਦੀ ਲੰਬਾਈ",
  },
  "Neck": {
    hi: "गला / कॉलर (Neck)",
    pa: "ਗਲਾ / ਕਾਲਰ (Neck)",
  },
  "Collar": {
    hi: "कॉलर (Collar)",
    pa: "ਕਾਲਰ (Collar)",
  },
  "Cuff": {
    hi: "कफ (Cuff)",
    pa: "ਕਫ਼ (Cuff)",
  },
  "Hip": {
    hi: "हिप / सीट (Hip)",
    pa: "ਹਿਪ / ਸੀਟ (Hip)",
  },
  "Seat": {
    hi: "सीट / हिप (Seat)",
    pa: "ਸੀਟ / ਹਿਪ",
  },
  "Thigh": {
    hi: "पट / जांघ (Thigh)",
    pa: "ਪੱਟ (Thigh)",
  },
  "Knee": {
    hi: "घुटना (Knee)",
    pa: "ਗੋਡਾ (Knee)",
  },
  "Calf": {
    hi: "पिंडली (Calf)",
    pa: "ਪਿੰਡਲੀ (Calf)",
  },
  "Bottom": {
    hi: "मोहरी / बॉटम (Bottom)",
    pa: "ਮੋਹਰੀ / ਬੌਟਮ (Bottom)",
  },
  "Mohri": {
    hi: "मोहरी (Mohri)",
    pa: "ਮੋਹਰੀ (Mohri)",
  },
  "Inseam": {
    hi: "आसन / अंदर की सिलाई (Inseam)",
    pa: "ਆਸਨ (Inseam)",
  },
  "Crotch": {
    hi: "आसन / लटक (Crotch)",
    pa: "ਆਸਨ / ਲਟਕ (Crotch)",
  },
  "Rise": {
    hi: "आसन / लटक (Rise)",
    pa: "ਆਸਨ (Rise)",
  },
  "Armhole": {
    hi: "मुड्ढा / आर्महोल (Armhole)",
    pa: "ਮੁੱਢਾ (Armhole)",
  },
  "Bicep": {
    hi: "डोला / बाजू गोलाई (Bicep)",
    pa: "ਡੋਲਾ (Bicep)",
  },
  "Forearm": {
    hi: "कोहनी के आगे (Forearm)",
    pa: "ਕੂਹਣੀ ਤੋਂ ਅੱਗੇ",
  },
  "Wrist": {
    hi: "कलाई / कफ गोलाई (Wrist)",
    pa: "ਗੁੱਟ (Wrist)",
  },
  "Slit": {
    hi: "चाक (Slit)",
    pa: "ਚਾਕ (Slit)",
  },
  "Pocket": {
    hi: "जेब / पॉकेट (Pocket)",
    pa: "ਜੇਬ (Pocket)",
  },
  "Fitting": {
    hi: "फिटिंग (ढिला / टाइट)",
    pa: "ਫਿਟਿੰਗ",
  },

  // ==========================================================================
  // 3. PRODUCTION STATUS & STAGES (काम की स्थिति)
  // ==========================================================================
  "FABRIC_CUT": {
    hi: "कटाई बाकी है (Pending Cutting)",
    pa: "ਕਟਾਈ ਬਾਕੀ ਹੈ",
  },
  "Pending Cutting": {
    hi: "कटाई बाकी है (Pending Cutting)",
    pa: "ਕਟਾਈ ਬਾਕੀ ਹੈ",
  },
  "CUTTING": {
    hi: "कटाई चल रही है (Cutting)",
    pa: "ਕਟਾਈ ਚੱਲ ਰਹੀ ਹੈ",
  },
  "In Cutting": {
    hi: "कटाई चालू (In Cutting)",
    pa: "ਕਟਾਈ ਚਾਲੂ",
  },
  "STITCHING": {
    hi: "सिलाई चल रही है (Stitching)",
    pa: "ਸਿਲਾਈ ਚੱਲ ਰਹੀ ਹੈ",
  },
  "WASHING": {
    hi: "धुलाई में है (Washing)",
    pa: "ਧੁਲਾਈ ਵਿੱਚ ਹੈ",
  },
  "IRONING": {
    hi: "प्रेस / इस्त्री में (Ironing)",
    pa: "ਪ੍ਰੈਸ ਵਿੱਚ (Ironing)",
  },
  "READY": {
    hi: "कपड़ा तैयार है (Ready)",
    pa: "ਕੱਪੜਾ ਤਿਆਰ ਹੈ (Ready)",
  },
  "DELIVERED": {
    hi: "ग्राहक को दे दिया (Delivered)",
    pa: "ਗਾਹਕ ਨੂੰ ਦੇ ਦਿੱਤਾ",
  },
  "ALTERATION": {
    hi: "ऑल्टरेशन / सुधार (Alteration)",
    pa: "ਅਲਟਰੇਸ਼ਨ (Alteration)",
  },
  "CANCELLED": {
    hi: "रद्द किया गया (Cancelled)",
    pa: "ਰੱਦ ਕੀਤਾ ਗਿਆ",
  },

  // ==========================================================================
  // 4. COMMON GARMENT TYPES (कपड़ों के नाम)
  // ==========================================================================
  "Garment": {
    hi: "कपड़ा / सूट (Garment)",
    pa: "ਕੱਪੜਾ / ਸੂਟ",
  },
  "Garments": {
    hi: "कपड़े / सूट (Garments)",
    pa: "ਕੱਪੜੇ / ਸੂਟ",
  },
  "Garment Type": {
    hi: "कपड़े का प्रकार (Garment Type)",
    pa: "ਕੱਪੜੇ ਦੀ ਕਿਸਮ",
  },
  "Shirt": {
    hi: "शर्ट / कमीज (Shirt)",
    pa: "ਸ਼ਰਟ / ਕਮੀਜ਼",
  },
  "Pant": {
    hi: "पैंट (Pant)",
    pa: "ਪੈਂਟ (Pant)",
  },
  "Trouser": {
    hi: "पैंट / ट्राउज़र (Trouser)",
    pa: "ਪੈਂਟ / ਟਰਾਊਜ਼ਰ",
  },
  "Kurta": {
    hi: "कुर्ता (Kurta)",
    pa: "ਕੁੜਤਾ (Kurta)",
  },
  "Pajama": {
    hi: "पायजामा (Pajama)",
    pa: "ਪਜਾਮਾ (Pajama)",
  },
  "Kurta Pajama": {
    hi: "कुर्ता पायजामा (Kurta Pajama)",
    pa: "ਕੁੜਤਾ ਪਜਾਮਾ",
  },
  "Coat": {
    hi: "कोट (Coat)",
    pa: "ਕੋਟ (Coat)",
  },
  "Suit": {
    hi: "सूट (Suit)",
    pa: "ਸੂਟ (Suit)",
  },
  "Blazer": {
    hi: "ब्लेज़र / कोट (Blazer)",
    pa: "ਬਲੇਜ਼ਰ / ਕੋਟ",
  },
  "Safari Suit": {
    hi: "सफारी सूट (Safari Suit)",
    pa: "ਸਫਾਰੀ ਸੂਟ",
  },
  "Sherwani": {
    hi: "शेरवानी (Sherwani)",
    pa: "ਸ਼ੇਰਵਾਨੀ",
  },
  "Waistcoat": {
    hi: "बंडी / मोदी जैकेट (Waistcoat)",
    pa: "ਬੰਡੀ / ਵੇਸਟਕੋਟ",
  },

  // ==========================================================================
  // 5. WORKSHOP & ORDER TERMS (ऑर्डर और हिसाब के शब्द)
  // ==========================================================================
  "Sample Number": {
    hi: "सैंपल नंबर (Sample No.)",
    pa: "ਸੈਂਪਲ ਨੰਬਰ",
  },
  "Sample Book Page Number": {
    hi: "सैंपल बुक पेज नंबर (Book Page)",
    pa: "ਸੈਂਪਲ ਬੁੱਕ ਪੇਜ ਨੰਬਰ",
  },
  "Due Date": {
    hi: "देने की तारीख (Due Date)",
    pa: "ਦੇਣ ਦੀ ਤਾਰੀਖ (Due Date)",
  },
  "Delivery Date": {
    hi: "डिलीवरी तारीख (देने की तारीख)",
    pa: "ਡਿਲੀਵਰੀ ਤਾਰੀਖ",
  },
  "All Garment Due Date": {
    hi: "सभी कपड़ों की डिलीवरी तारीख",
    pa: "ਸਾਰੇ ਕੱਪੜਿਆਂ ਦੀ ਡਿਲੀਵਰੀ ਤਾਰੀਖ",
  },
  "Order Date": {
    hi: "ऑर्डर आने की तारीख (Order Date)",
    pa: "ਆਰਡਰ ਤਾਰੀਖ",
  },
  "Try Date": {
    hi: "ट्रायल तारीख (Trial Date)",
    pa: "ਟ੍ਰਾਇਲ ਤਾਰੀਖ",
  },
  "Advance": {
    hi: "बयाना / एडवांस पैसे (Advance)",
    pa: "ਬਿਆਨਾ / ਐਡਵਾਂਸ ਪੈਸੇ",
  },
  "Advance Amount": {
    hi: "बयाना / एडवांस रकम (Advance)",
    pa: "ਐਡਵਾਂਸ ਰਕਮ",
  },
  "Advance Payment": {
    hi: "बयाना / एडवांस पेमेंट",
    pa: "ਐਡਵਾਂਸ ਪੇਮੈਂਟ",
  },
  "Balance Due": {
    hi: "बाकी बकाया पैसे (Balance Due)",
    pa: "ਬਾਕੀ ਬਕਾਇਆ ਪੈਸੇ",
  },
  "Remaining Balance Due": {
    hi: "बाकी बचे पैसे (Remaining Balance)",
    pa: "ਬਾਕੀ ਬਚੇ ਪੈਸੇ",
  },
  "Grand Total": {
    hi: "कुल बिल रकम (Grand Total)",
    pa: "ਕੁੱਲ ਬਿੱਲ ਰਕਮ",
  },
  "Subtotal": {
    hi: "कपड़ों का जोड़ (Subtotal)",
    pa: "ਕੱਪੜਿਆਂ ਦਾ ਜੋੜ",
  },
  "Order Discount": {
    hi: "छूट / डिस्काउंट (Discount)",
    pa: "ਛੋਟ / ਡਿਸਕਾਊਂਟ",
  },
  "Additional Charges": {
    hi: "ऊपरी खर्च / एक्स्ट्रा चार्ज",
    pa: "ਵਾਧੂ ਖਰਚੇ",
  },
  "Payment Method": {
    hi: "पैसे लेने का तरीका (Cash / UPI)",
    pa: "ਪੈਸੇ ਲੈਣ ਦਾ ਤਰੀਕਾ",
  },
  "Instructions / Notes": {
    hi: "कारीगर के लिए निर्देश / नोट्स",
    pa: "ਕਾਰੀਗਰ ਲਈ ਹਦਾਇਤਾਂ / ਨੋਟਸ",
  },
  "Measurement Note": {
    hi: "नाप का खास नोट (Measurement Note)",
    pa: "ਨਾਪ ਦਾ ਖਾਸ ਨੋਟ",
  },
  "Alteration Note": {
    hi: "ऑल्टरेशन / सुधार नोट (Alteration Note)",
    pa: "ਅਲਟਰੇਸ਼ਨ ਨੋਟ",
  },
  "Start Cutting": {
    hi: "कटाई शुरू करें (Start Cutting)",
    pa: "ਕਟਾਈ ਸ਼ੁਰੂ ਕਰੋ",
  },
  "Mark as Cut": {
    hi: "कटाई पूरी हो गई (Mark Cut)",
    pa: "ਕਟਾਈ ਪੂਰੀ ਹੋ ਗਈ",
  },
  "Open Cutting Workspace": {
    hi: "कटाई पेज खोलें (Open Workspace)",
    pa: "ਕਟਾਈ ਪੇਜ ਖੋਲ੍ਹੋ",
  },
  "Back": {
    hi: "पीछे जाएं (Back)",
    pa: "ਪਿੱਛੇ ਜਾਓ",
  },
  "Next": {
    hi: "आगे बढ़ें (Next)",
    pa: "ਅੱਗੇ ਵਧੋ",
  },
  "Cancel": {
    hi: "रद्द करें (Cancel)",
    pa: "ਰੱਦ ਕਰੋ",
  },
  "Save Changes": {
    hi: "बदलाव सेव करें (Save Changes)",
    pa: "ਬਦਲਾਅ ਸੇਵ ਕਰੋ",
  },
  "Confirm Order": {
    hi: "ऑर्डर पक्का करें (Confirm)",
    pa: "ਆਰਡਰ ਪੱਕਾ ਕਰੋ",
  },
  "Confirm Order Changes": {
    hi: "बदलाव पक्का करें (Confirm Changes)",
    pa: "ਬਦਲਾਅ ਪੱਕਾ ਕਰੋ",
  },
  "Start over": {
    hi: "शुरू से करें (Start Over)",
    pa: "ਸ਼ੁਰੂ ਤੋਂ ਕਰੋ",
  },
  "Cancel Edit": {
    hi: "बदलाव छोड़ें (Cancel Edit)",
    pa: "ਬਦਲਾਅ ਛੱਡੋ",
  },
  "Customer": {
    hi: "ग्राहक (Customer)",
    pa: "ਗਾਹਕ (Customer)",
  },
  "Fabric & Garments": {
    hi: "कपड़ा और सिलाई (Garments)",
    pa: "ਕੱਪੜਾ ਅਤੇ ਸਿਲਾਈ",
  },
  "Payment": {
    hi: "पेमेंट / हिसाब (Payment)",
    pa: "ਪੇਮੈਂਟ / ਹਿਸਾਬ",
  },
  "Confirm": {
    hi: "पक्का करें (Confirm)",
    pa: "ਪੱਕਾ ਕਰੋ (Confirm)",
  },
  "Order Summary": {
    hi: "ऑर्डर का हिसाब (Order Summary)",
    pa: "ਆਰਡਰ ਦਾ ਹਿਸਾਬ",
  },
  "Add": {
    hi: "जोड़ें",
    pa: "ਜੋੜੋ",
  },
  "This date applies to every editable garment unless an individual date is enabled.": {
    hi: "यह डिलीवरी तारीख सभी कपड़ों पर लागू होगी (जब तक किसी कपड़े की अलग तारीख न चुनी जाए)।",
    pa: "ਇਹ ਡਿਲੀਵਰੀ ਤਾਰੀਖ ਸਾਰੇ ਕੱਪੜਿਆਂ ਤੇ ਲਾਗੂ ਹੋਵੇਗੀ।",
  },
  "This is saved once on the order, not separately on each garment.": {
    hi: "यह पूरे ऑर्डर के लिए एक बार सेव होता है, हर कपड़े के लिए अलग नहीं।",
    pa: "ਇਹ ਪੂਰੇ ਆਰਡਰ ਲਈ ਇੱਕ ਵਾਰ ਸੇਵ ਹੁੰਦਾ ਹੈ।",
  },
  "Defaults to this garment's add order.": {
    hi: "कपड़े के क्रम के हिसाब से अपने आप सेट होता है।",
    pa: "ਕੱਪੜੇ ਦੇ ਕ੍ਰਮ ਅਨੁਸਾਰ ਆਪਣੇ ਆਪ ਸੈੱਟ ਹੁੰਦਾ ਹੈ।",
  },
  "Search and add optional work to this garment.": {
    hi: "इस कपड़े में डिज़ाइन या एक्स्ट्रा काम खोजें और जोड़ें।",
    pa: "ਇਸ ਕੱਪੜੇ ਵਿੱਚ ਡਿਜ਼ਾਈਨ ਜਾਂ ਵਾਧੂ ਕੰਮ ਖੋਜੋ ਅਤੇ ਜੋੜੋ।",
  },
  "Search add-ons...": {
    hi: "डिज़ाइन / एक्स्ट्रा काम खोजें...",
    pa: "ਡਿਜ਼ਾਈਨ / ਵਾਧੂ ਕੰਮ ਖੋਜੋ...",
  },
  "Selected add-ons for this garment": {
    hi: "इस कपड़े के लिए चुने गए डिज़ाइन / काम",
    pa: "ਇਸ ਕੱਪੜੇ ਲਈ ਚੁਣੇ ਗਏ ਡਿਜ਼ਾਈਨ / ਕੰਮ",
  },
  "e.g. 4826": {
    hi: "जैसे: 4826",
    pa: "ਜਿਵੇਂ: 4826",
  },
  'e.g. Regular fit, +2" length': {
    hi: 'जैसे: रेगुलर फिट, +2" लंबाई',
    pa: 'ਜਿਵੇਂ: ਰੈਗੂਲਰ ਫਿੱਟ, +2" ਲੰਬਾਈ',
  },
  "Use latest": {
    hi: "पिछला नाप लगाएं (Use Latest)",
    pa: "ਪਿਛਲਾ ਨਾਪ ਲਗਾਓ",
  },
  "Copy from garment": {
    hi: "दूसरे कपड़े से नाप कॉपी करें",
    pa: "ਦੂਜੇ ਕੱਪੜੇ ਤੋਂ ਨਾਪ ਕਾਪੀ ਕਰੋ",
  },
  "Copy from old measurement": {
    hi: "पुराने नाप से कॉपी करें",
    pa: "ਪੁਰਾਣੇ ਨਾਪ ਤੋਂ ਕਾਪੀ ਕਰੋ",
  },
  "Enter individual due date": {
    hi: "इस कपड़े की अलग डिलीवरी तारीख दें",
    pa: "ਇਸ ਕੱਪੜੇ ਦੀ ਵੱਖਰੀ ਤਾਰੀਖ ਦਿਓ",
  },
  "Garment Due Date": {
    hi: "इस कपड़े की डिलीवरी तारीख",
    pa: "ਇਸ ਕੱਪੜੇ ਦੀ ਡਿਲੀਵਰੀ ਤਾਰੀਖ",
  },
  "Price (₹)": {
    hi: "सिलाई रेट (₹)",
    pa: "ਸਿਲਾਈ ਰੇਟ (₹)",
  },
  "Select garment type": {
    hi: "कपड़ा चुनें (जैसे शर्ट, पैंट, कुर्ता)",
    pa: "ਕੱਪੜਾ ਚੁਣੋ",
  },
  "Minimum Advance": {
    hi: "कम से कम बयाना (Minimum Advance)",
    pa: "ਘੱਟੋ-ਘੱਟ ਬਿਆਨਾ",
  },
  "Advance Received": {
    hi: "मिला हुआ बयाना (Advance Received)",
    pa: "ਮਿਲਿਆ ਹੋਇਆ ਬਿਆਨਾ",
  },
  "Already Paid (Preserved)": {
    hi: "पहले से जमा पैसे (Already Paid)",
    pa: "ਪਹਿਲਾਂ ਤੋਂ ਜਮ੍ਹਾਂ ਪੈਸੇ",
  },
  "New Payment Amount (Optional)": {
    hi: "आज जमा किए नए पैसे (New Payment)",
    pa: "ਅੱਜ ਜਮ੍ਹਾਂ ਕੀਤੇ ਨਵੇਂ ਪੈਸੇ",
  },
  "Preserved Payment History": {
    hi: "पुरानी पेमेंट का रिकॉर्ड (Payment History)",
    pa: "ਪੁਰਾਣੀ ਪੇਮੈਂਟ ਦਾ ਰਿਕਾਰਡ",
  },
  "Back to Cutting Queue": {
    hi: "कटाई लिस्ट पर वापस जाएं",
    pa: "ਕਟਾਈ ਲਿਸਟ ਤੇ ਵਾਪਸ ਜਾਓ",
  },
  "Customer Information": {
    hi: "ग्राहक की जानकारी (Customer Info)",
    pa: "ਗਾਹਕ ਦੀ ਜਾਣਕਾਰੀ",
  },
  "Order": {
    hi: "ऑर्डर (Order)",
    pa: "ਆਰਡਰ (Order)",
  },
  "Status": {
    hi: "स्थिति (Status)",
    pa: "ਸਥਿਤੀ (Status)",
  },
  "Actions": {
    hi: "काम / बटन (Actions)",
    pa: "ਐਕਸ਼ਨ (Actions)",
  },
  "Print": {
    hi: "प्रिंट करें (Print)",
    pa: "ਪ੍ਰਿੰਟ ਕਰੋ (Print)",
  },

  // ==========================================================================
  // 8. ADDRESS, LANDMARK & NAME OVERRIDES (पता, शहर और नाम के शब्द)
  // ==========================================================================
  // Note: Dynamic customer names (e.g. "Rahul Sharma", "Harpreet Singh") and
  // addresses (e.g. "Shop 12, Model Town, Near Bus Stand, Ludhiana") are also
  // automatically transliterated by `src/i18n/transliterate.ts`.
  // You can add any custom name, village, or landmark override below:
  "Address": {
    hi: "पता (Address)",
    pa: "ਪਤਾ (Address)",
  },
  "Customer Name": {
    hi: "ग्राहक का नाम",
    pa: "ਗਾਹਕ ਦਾ ਨਾਮ",
  },
  "Full Name": {
    hi: "पूरा नाम (Full Name)",
    pa: "ਪੂਰਾ ਨਾਮ (Full Name)",
  },
  "Phone": {
    hi: "फ़ोन नंबर",
    pa: "ਫ਼ੋਨ ਨੰਬਰ",
  },
  "Phone Number": {
    hi: "फ़ोन नंबर (Phone)",
    pa: "ਫ਼ੋਨ ਨੰਬਰ (Phone)",
  },
  "Mobile": {
    hi: "मोबाइल नंबर",
    pa: "ਮੋਬਾਈਲ ਨੰਬਰ",
  },
  "City": {
    hi: "शहर (City)",
    pa: "ਸ਼ਹਿਰ (City)",
  },
  "Village": {
    hi: "गाँव / पिंड",
    pa: "ਪਿੰਡ (Village)",
  },
  "Near": {
    hi: "के पास",
    pa: "ਦੇ ਨੇੜੇ",
  },
  "Opposite": {
    hi: "के सामने",
    pa: "ਦੇ ਸਾਹਮਣੇ",
  },
  "Behind": {
    hi: "के पीछे",
    pa: "ਦੇ ਪਿੱਛੇ",
  },
  "Street": {
    hi: "गली",
    pa: "ਗਲੀ",
  },
  "Road": {
    hi: "रोड / सड़क",
    pa: "ਰੋਡ / ਸੜਕ",
  },
  "Shop": {
    hi: "दुकान",
    pa: "ਦੁਕਾਨ",
  },
  "House": {
    hi: "मकान / घर",
    pa: "ਮਕਾਨ / ਘਰ",
  },
  "Market": {
    hi: "मार्केट / बाज़ार",
    pa: "ਮਾਰਕੀਟ / ਬਾਜ਼ਾਰ",
  },
  "Sarpanch Fashion Fab": {
    hi: "सरपंच फैशन फैब",
    pa: "ਸਰਪੰਚ ਫੈਸ਼ਨ ਫੈਬ",
  },

  // ==========================================================================
  // 9. STANDALONE UI BUTTONS, HEADERS & BILLING LABELS (बटन, हिसाब और स्थिति)
  // ==========================================================================
  "Total": {
    hi: "कुल",
    pa: "ਕੁੱਲ",
  },
  "Total:": {
    hi: "कुल:",
    pa: "ਕੁੱਲ:",
  },
  "Due": {
    hi: "बाकी",
    pa: "ਬਾਕੀ",
  },
  "Due:": {
    hi: "बाकी:",
    pa: "ਬਾਕੀ:",
  },
  "Paid": {
    hi: "जमा",
    pa: "ਜਮ੍ਹਾਂ",
  },
  "Paid:": {
    hi: "जमा:",
    pa: "ਜਮ੍ਹਾਂ:",
  },
  "Balance": {
    hi: "बाकी",
    pa: "ਬਾਕੀ",
  },
  "Balance:": {
    hi: "बाकी:",
    pa: "ਬਾਕੀ:",
  },
  "Advance:": {
    hi: "बयाना:",
    pa: "ਬਿਆਨਾ:",
  },
  "Total Spent": {
    hi: "कुल बिक्री / खर्च",
    pa: "ਕੁੱਲ ਖਰਚ",
  },
  "Total Paid": {
    hi: "कुल जमा पैसे",
    pa: "ਕੁੱਲ ਜਮ੍ਹਾਂ ਪੈਸੇ",
  },
  "Combined Total": {
    hi: "सारे कपड़ों का कुल",
    pa: "ਸਾਰੇ ਕੱਪੜਿਆਂ ਦਾ ਕੁੱਲ",
  },
  "Combined Summary": {
    hi: "सारे ऑर्डरों का हिसाब",
    pa: "ਸਾਰੇ ਆਰਡਰਾਂ ਦਾ ਹਿਸਾਬ",
  },
  "Discount": {
    hi: "छूट (Discount)",
    pa: "ਛੋਟ (Discount)",
  },
  "Amount": {
    hi: "रकम (Amount)",
    pa: "ਰਕਮ (Amount)",
  },
  "Edit": {
    hi: "बदलें",
    pa: "ਬਦਲੋ",
  },
  "Edit Customer": {
    hi: "ग्राहक की जानकारी बदलें",
    pa: "ਗਾਹਕ ਦੀ ਜਾਣਕਾਰੀ ਬਦਲੋ",
  },
  "Customer Details": {
    hi: "ग्राहक की जानकारी",
    pa: "ਗਾਹਕ ਦੀ ਜਾਣਕਾਰੀ",
  },
  "Create New Customer": {
    hi: "+ नया ग्राहक जोड़ें",
    pa: "+ ਨਵਾਂ ਗਾਹਕ ਜੋੜੋ",
  },
  "Alternate Phone": {
    hi: "दूसरा फ़ोन नंबर",
    pa: "ਦੂਜਾ ਫ਼ੋਨ ਨੰਬਰ",
  },
  "Item": {
    hi: "कपड़ा / सामान",
    pa: "ਕੱਪੜਾ / ਸਾਮਾਨ",
  },
  "Items": {
    hi: "कपड़े",
    pa: "ਕੱਪੜੇ",
  },
  "Garment:": {
    hi: "कपड़ा:",
    pa: "ਕੱਪੜਾ:",
  },
  "Due Date:": {
    hi: "डिलीवरी तारीख:",
    pa: "ਡਿਲੀਵਰੀ ਤਾਰੀਖ:",
  },
  "Order Date:": {
    hi: "ऑर्डर तारीख:",
    pa: "ਆਰਡਰ ਤਾਰੀਖ:",
  },
  "Last Order": {
    hi: "पिछला ऑर्डर",
    pa: "ਪਿਛਲਾ ਆਰਡਰ",
  },
  "Created": {
    hi: "तारीख",
    pa: "ਤਾਰੀਖ",
  },
  "Delivery": {
    hi: "डिलीवरी",
    pa: "ਡਿਲੀਵਰੀ",
  },
  "Date": {
    hi: "तारीख (Date)",
    pa: "ਤਾਰੀਖ (Date)",
  },
  "Note": {
    hi: "नोट",
    pa: "ਨੋਟ",
  },
  "Notes": {
    hi: "नोट्स",
    pa: "ਨੋਟਸ",
  },
  "Code": {
    hi: "कोड",
    pa: "ਕੋਡ",
  },
  "Name": {
    hi: "नाम",
    pa: "ਨਾਮ",
  },
  "Email": {
    hi: "ईमेल",
    pa: "ਈਮੇਲ",
  },
  "View": {
    hi: "देखें",
    pa: "ਵੇਖੋ",
  },
  "Delete": {
    hi: "हटाएं",
    pa: "ਹਟਾਓ",
  },
  "Remove": {
    hi: "हटाएं",
    pa: "ਹਟਾਓ",
  },
  "Save": {
    hi: "सेव करें",
    pa: "ਸੇਵ ਕਰੋ",
  },
  "Update": {
    hi: "अपडेट करें",
    pa: "ਅੱਪਡੇਟ ਕਰੋ",
  },
  "Close": {
    hi: "बंद करें",
    pa: "ਬੰਦ ਕਰੋ",
  },
  "Retry": {
    hi: "दोबारा कोशिश करें",
    pa: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
  },
  "Select": {
    hi: "चुनें",
    pa: "ਚੁਣੋ",
  },
  "Copy": {
    hi: "कॉपी करें",
    pa: "ਕਾਪੀ ਕਰੋ",
  },
  "Lock": {
    hi: "लॉक करें",
    pa: "ਲਾਕ ਕਰੋ",
  },
  "Locked": {
    hi: "लॉक है",
    pa: "ਲਾਕ ਹੈ",
  },
  "Cut": {
    hi: "कटाई पूरी",
    pa: "ਕਟਾਈ ਪੂਰੀ",
  },
  "Cutting": {
    hi: "कटाई",
    pa: "ਕਟਾਈ",
  },
  "Summary": {
    hi: "हिसाब / समरी",
    pa: "ਹਿਸਾਬ / ਸਮਰੀ",
  },
  "History": {
    hi: "रिकॉर्ड / हिस्ट्री",
    pa: "ਰਿਕਾਰਡ / ਹਿਸਟਰੀ",
  },
  "Profile": {
    hi: "प्रोफ़ाइल",
    pa: "ਪ੍ਰੋਫਾਈਲ",
  },
  "Account": {
    hi: "खाता / अकाउंट",
    pa: "ਖਾਤਾ / ਅਕਾਊਂਟ",
  },
  "No customers found": {
    hi: "कोई ग्राहक नहीं मिला",
    pa: "ਕੋਈ ਗਾਹਕ ਨਹੀਂ ਮਿਲਿਆ",
  },
  "No orders yet.": {
    hi: "अभी तक कोई ऑर्डर नहीं है",
    pa: "ਹਾਲੇ ਕੋਈ ਆਰਡਰ ਨਹੀਂ ਹੈ",
  },
  "Orders Confirmed!": {
    hi: "ऑर्डर पक्का हो गया!",
    pa: "ਆਰਡਰ ਪੱਕਾ ਹੋ ਗਿਆ!",
  },
  "Measurements Locked": {
    hi: "नाप लॉक है (कटाई शुरू हो चुकी है)",
    pa: "ਨਾਪ ਲਾਕ ਹੈ (ਕਟਾਈ ਸ਼ੁਰੂ ਹੋ ਚੁੱਕੀ ਹੈ)",
  },
  "Mark garment as cut?": {
    hi: "क्या इस कपड़े की कटाई पूरी हो गई?",
    pa: "ਕੀ ਇਸ ਕੱਪੜੇ ਦੀ ਕਟਾਈ ਪੂਰੀ ਹੋ ਗਈ?",
  },
  "Revert cut status?": {
    hi: "क्या कटाई वापस पेंडिंग करनी है?",
    pa: "ਕੀ ਕਟਾਈ ਵਾਪਸ ਪੈਂਡਿੰਗ ਕਰਨੀ ਹੈ?",
  },
  "Pending Cutting (FABRIC_CUT)": {
    hi: "कटाई पेंडिंग",
    pa: "ਕਟਾਈ ਪੈਂਡਿੰਗ",
  },
  "Lock Delivery Date": {
    hi: "डिलीवरी तारीख लॉक करें",
    pa: "ਡਿਲੀਵਰੀ ਤਾਰੀਖ ਲਾਕ ਕਰੋ",
  },
  "Lock Date": {
    hi: "तारीख लॉक करें",
    pa: "ਤਾਰੀਖ ਲਾਕ ਕਰੋ",
  },
  "Review and confirm customer orders": {
    hi: "ग्राहक के ऑर्डर चेक करें और पक्का करें",
    pa: "ਗਾਹਕ ਦੇ ਆਰਡਰ ਚੈੱਕ ਕਰੋ ਅਤੇ ਪੱਕਾ ਕਰੋ",
  },
  "Update customer contact and address details.": {
    hi: "ग्राहक का फ़ोन और पता अपडेट करें",
    pa: "ਗਾਹਕ ਦਾ ਫ਼ੋਨ ਅਤੇ ਪਤਾ ਅੱਪਡੇਟ ਕਰੋ",
  },
  "Please keep this invoice for your records.": {
    hi: "कृपया इस बिल को अपने पास संभाल कर रखें।",
    pa: "ਕਿਰਪਾ ਕਰਕੇ ਇਸ ਬਿੱਲ ਨੂੰ ਸੰਭਾਲ ਕੇ ਰੱਖੋ।",
  },
  "Loading workspace...": {
    hi: "कटाई टेबल लोड हो रहा है...",
    pa: "ਕਟਾਈ ਟੇਬਲ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
  },
  "No blocked dates.": {
    hi: "कोई छुट्टी या ब्लॉक तारीख नहीं है।",
    pa: "ਕੋਈ ਛੁੱਟੀ ਜਾਂ ਬਲਾਕ ਤਾਰੀਖ ਨਹੀਂ ਹੈ।",
  },
  "No holidays configured.": {
    hi: "कोई छुट्टी सेट नहीं है।",
    pa: "ਕੋਈ ਛੁੱਟੀ ਸੈੱਟ ਨਹੀਂ ਹੈ।",
  },
  "No Delivery": {
    hi: "डिलीवरी बंद",
    pa: "ਡਿਲੀਵਰੀ ਬੰਦ",
  },
  "Workers Off": {
    hi: "कारीगरों की छुट्टी",
    pa: "ਕਾਰੀਗਰਾਂ ਦੀ ਛੁੱਟੀ",
  },
  "Workers working?": {
    hi: "क्या कारीगर काम करेंगे?",
    pa: "ਕੀ ਕਾਰੀਗਰ ਕੰਮ ਕਰਨਗੇ?",
  },
  "Delivery allowed?": {
    hi: "क्या डिलीवरी दे सकते हैं?",
    pa: "ਕੀ ਡਿਲੀਵਰੀ ਦੇ ਸਕਦੇ ਹੋ?",
  },
  "Delivery not allowed": {
    hi: "डिलीवरी बंद है",
    pa: "ਡਿਲੀਵਰੀ ਬੰਦ ਹੈ",
  },
  "Recurring yearly?": {
    hi: "हर साल दोहराएं?",
    pa: "ਹਰ ਸਾਲ ਦੁਹਰਾਓ?",
  },
  "No garments due on this date.": {
    hi: "इस तारीख को कोई कपड़ा डिलीवर नहीं होना।",
    pa: "ਇਸ ਤਾਰੀਖ ਨੂੰ ਕੋਈ ਕੱਪੜਾ ਡਿਲੀਵਰ ਨਹੀਂ ਹੋਣਾ।",
  },
  "No garments pending cutting": {
    hi: "कटाई के लिए कोई कपड़ा पेंडिंग नहीं है",
    pa: "ਕਟਾਈ ਲਈ ਕੋਈ ਕੱਪੜਾ ਪੈਂਡਿੰਗ ਨਹੀਂ ਹੈ",
  },
};

import { translateTextWithNamesAndAddresses } from "./transliterate";

// Case-insensitive lookup index built automatically from WORKER_WORD_MAP
const LOWERCASE_INDEX: Record<string, WorkerTermTranslation> = Object.fromEntries(
  Object.entries(WORKER_WORD_MAP).map(([key, value]) => [
    key.trim().toLowerCase(),
    value,
  ]),
);

/**
 * Direct lookup helper in `WORKER_WORD_MAP` (returns null if not explicitly mapped)
 */
export function lookupExplicitWorkerWord(
  word: string,
  langCode: string,
): string | null {
  const clean = word.trim().toLowerCase();
  const match = LOWERCASE_INDEX[clean];
  if (match) {
    if (langCode === "hi" && match.hi) return match.hi;
    if (langCode === "pa" && match.pa) return match.pa;
    return match.hi || null;
  }

  // Handle trailing ':' or '*'
  if (clean.endsWith(":") || clean.endsWith("*")) {
    const punct = clean.slice(-1);
    const base = clean.slice(0, -1).trim();
    const baseMatch = LOWERCASE_INDEX[base];
    if (baseMatch) {
      const translatedBase =
        langCode === "pa" && baseMatch.pa ? baseMatch.pa : baseMatch.hi;
      return translatedBase ? `${translatedBase}${punct === "*" ? " *" : ":"}` : null;
    }
  }

  return null;
}

/**
 * Translates any English word, phrase, Customer Name, Worker Name, or Address:
 * 1. Checks `WORKER_WORD_MAP` for an exact custom workshop translation first.
 * 2. Automatically translates address terms/cities and phonetically transliterates
 *    names and places into Hindi (Devanagari) or Punjabi (Gurmukhi) for low-literacy workers.
 */
export function translateWorkerWord(
  word: string | null | undefined,
  language = "en",
): string {
  if (!word) return "";
  const trimmed = word.trim();
  if (!trimmed) return word;

  const langCode = language.toLowerCase().split("-")[0];
  if (langCode === "en") {
    return LOWERCASE_INDEX[trimmed.toLowerCase()]?.en ?? word;
  }

  // 1. Direct match in WORKER_WORD_MAP (including trailing ':' or '*')
  const directMatch = lookupExplicitWorkerWord(trimmed, langCode);
  if (directMatch) {
    return directMatch;
  }

  // 2. Multi-word Name, Address, City & Phonetic Transliteration (Hindi / Punjabi)
  if (langCode === "hi" || langCode === "pa") {
    return translateTextWithNamesAndAddresses(
      trimmed,
      langCode,
      lookupExplicitWorkerWord,
    );
  }

  return word;
}

/**
 * Generates flat i18next translation dictionary for a target language
 * from `WORKER_WORD_MAP`.
 */
export function buildWordMapTranslations(lang: "en" | "hi" | "pa"): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [englishKey, translations] of Object.entries(WORKER_WORD_MAP)) {
    if (lang === "en") {
      result[englishKey] = translations.en ?? englishKey;
    } else if (lang === "hi") {
      result[englishKey] = translations.hi || englishKey;
    } else if (lang === "pa") {
      result[englishKey] = translations.pa || translations.hi || englishKey;
    }
  }
  return result;
}
