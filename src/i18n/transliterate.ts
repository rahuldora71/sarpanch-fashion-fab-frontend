/**
 * ============================================================================
 * INDIAN NAME, ADDRESS & PHONETIC TRANSLITERATION ENGINE (EN -> HI / PA)
 * ============================================================================
 *
 * Designed for low-literacy tailoring workshop workers (कारीगर / दर्जी) so that
 * dynamic customer names (e.g., "Rahul Sharma", "Harpreet Singh"), worker names,
 * and addresses (e.g., "Shop 12, Model Town, Near Bus Stand, Ludhiana") are
 * automatically converted into readable Hindi (Devanagari) and Punjabi (Gurmukhi).
 *
 * Priority Order:
 * 1. Custom mapping in `WORKER_WORD_MAP` (`workerWordMap.ts`)
 * 2. Built-in Dictionary of Indian Names, Surnames, Cities, States & Address terms
 * 3. Algorithmic Phonetic Syllabic Transliteration (Roman -> Devanagari / Gurmukhi)
 */

export interface BilingualEntry {
  hi: string;
  pa: string;
}

/**
 * Multi-word address & location phrases matched BEFORE word-by-word splitting
 */
export const MULTI_WORD_ADDRESS_PHRASES: Record<string, BilingualEntry> = {
  "near bus stand": { hi: "बस स्टैंड के पास", pa: "ਬੱਸ ਸਟੈਂਡ ਦੇ ਨੇੜੇ" },
  "near railway station": { hi: "रेलवे स्टेशन के पास", pa: "ਰੇਲਵੇ ਸਟੇਸ਼ਨ ਦੇ ਨੇੜੇ" },
  "bus stand": { hi: "बस स्टैंड", pa: "ਬੱਸ ਸਟੈਂਡ" },
  "railway station": { hi: "रेलवे स्टेशन", pa: "ਰੇਲਵੇ ਸਟੇਸ਼ਨ" },
  "police station": { hi: "पुलिस थाना", pa: "ਪੁਲਿਸ ਥਾਣਾ" },
  "post office": { hi: "डाकघर (पोस्ट ऑफिस)", pa: "ਡਾਕਘਰ (ਪੋਸਟ ਆਫਿਸ)" },
  "petrol pump": { hi: "पेट्रोल पंप", pa: "ਪੈਟਰੋਲ ਪੰਪ" },
  "water tank": { hi: "पानी की टंकी", pa: "ਪਾਣੀ ਦੀ ਟੈਂਕੀ" },
  "model town": { hi: "मॉडल टाउन", pa: "ਮਾਡਲ ਟਾਊਨ" },
  "civil lines": { hi: "सिविल लाइन्स", pa: "ਸਿਵਲ ਲਾਈਨਜ਼" },
  "urban estate": { hi: "अर्बन एस्टेट", pa: "ਅਰਬਨ ਅਸਟੇਟ" },
  "industrial area": { hi: "इंडस्ट्रियल एरिया", pa: "ਇੰਡਸਟਰੀਅਲ ਏਰੀਆ" },
  "focal point": { hi: "फोकल प्वाइंट", pa: "ਫੋਕਲ ਪੁਆਇੰਟ" },
  "sarabha nagar": { hi: "सराभा नगर", pa: "ਸਰਾਭਾ ਨਗਰ" },
  "sadar bazaar": { hi: "सदर बाज़ार", pa: "ਸਦਰ ਬਾਜ਼ਾਰ" },
  "sadar bazar": { hi: "सदर बाज़ार", pa: "ਸਦਰ ਬਾਜ਼ਾਰ" },
  "main market": { hi: "मेन मार्केट (मुख्य बाज़ार)", pa: "ਮੇਨ ਮਾਰਕੀਟ (ਮੁੱਖ ਬਾਜ਼ਾਰ)" },
  "main road": { hi: "मेन रोड", pa: "ਮੇਨ ਰੋਡ" },
  "gt road": { hi: "जी.टी. रोड", pa: "ਜੀ.ਟੀ. ਰੋਡ" },
  "g.t. road": { hi: "जी.टी. रोड", pa: "ਜੀ.ਟੀ. ਰੋਡ" },
  "link road": { hi: "लिंक रोड", pa: "ਲਿੰਕ ਰੋਡ" },
  "circular road": { hi: "सर्कुलर रोड", pa: "ਸਰਕੂਲਰ ਰੋਡ" },
  "ring road": { hi: "रिंग रोड", pa: "ਰਿੰਗ ਰੋਡ" },
  "bypass road": { hi: "बाईपास रोड", pa: "ਬਾਈਪਾਸ ਰੋਡ" },
  "ground floor": { hi: "नीचे की मंजिल (ग्राउंड फ्लोर)", pa: "ਹੇਠਲੀ ਮੰਜ਼ਿਲ (ਗ੍ਰਾਊਂਡ ਫਲੋਰ)" },
  "first floor": { hi: "पहली मंजिल", pa: "ਪਹਿਲੀ ਮੰਜ਼ਿਲ" },
  "second floor": { hi: "दूसरी मंजिल", pa: "ਦੂਜੀ ਮੰਜ਼ਿਲ" },
  "third floor": { hi: "तीसरी मंजिल", pa: "ਤੀਜੀ ਮੰਜ਼ਿਲ" },
  "house no": { hi: "मकान नंबर", pa: "ਮਕਾਨ ਨੰਬਰ" },
  "house number": { hi: "मकान नंबर", pa: "ਮਕਾਨ ਨੰਬਰ" },
  "shop no": { hi: "दुकान नंबर", pa: "ਦੁਕਾਨ ਨੰਬਰ" },
  "shop number": { hi: "दुकान नंबर", pa: "ਦੁਕਾਨ ਨੰਬਰ" },
  "street no": { hi: "गली नंबर", pa: "ਗਲੀ ਨੰਬਰ" },
  "street number": { hi: "गली नंबर", pa: "ਗਲੀ ਨੰਬਰ" },
  "gali no": { hi: "गली नंबर", pa: "ਗਲੀ ਨੰਬਰ" },
  "ward no": { hi: "वार्ड नंबर", pa: "ਵਾਰਡ ਨੰਬਰ" },
  "plot no": { hi: "प्लॉट नंबर", pa: "ਪਲਾਟ ਨੰਬਰ" },
  "flat no": { hi: "फ्लैट नंबर", pa: "ਫਲੈਟ ਨੰਬਰ" },
  "new delhi": { hi: "नई दिल्ली", pa: "ਨਵੀਂ ਦਿੱਲੀ" },
  "uttar pradesh": { hi: "उत्तर प्रदेश", pa: "ਉੱਤਰ ਪ੍ਰਦੇਸ਼" },
  "himachal pradesh": { hi: "हिमाचल प्रदेश", pa: "ਹਿਮਾਚਲ ਪ੍ਰਦੇਸ਼" },
  "madhya pradesh": { hi: "मध्य प्रदेश", pa: "ਮੱਧ ਪ੍ਰਦੇਸ਼" },
  "tarn taran": { hi: "तरन तारन", pa: "ਤਰਨ ਤਾਰਨ" },
  "fatehgarh sahib": { hi: "फतेहगढ़ साहिब", pa: "ਫ਼ਤਹਿਗੜ੍ਹ ਸਾਹਿਬ" },
  "sri muktsar sahib": { hi: "श्री मुक्तसर साहिब", pa: "ਸ੍ਰੀ ਮੁਕਤਸਰ ਸਾਹਿਬ" },
  "total spent": { hi: "कुल खर्च", pa: "ਕੁੱਲ ਖਰਚ" },
  "total paid": { hi: "कुल जमा", pa: "ਕੁੱਲ ਜਮ੍ਹਾਂ" },
  "balance due": { hi: "बाकी पैसे", pa: "ਬਾਕੀ ਪੈਸੇ" },
  "grand total": { hi: "कुल बिल", pa: "ਕੁੱਲ ਬਿੱਲ" },
  "combined total": { hi: "कुल बिल", pa: "ਕੁੱਲ ਬਿੱਲ" },
  "combined summary": { hi: "कुल हिसाब", pa: "ਕੁੱਲ ਹਿਸਾਬ" },
  "last order": { hi: "पिछला ऑर्डर", pa: "ਪਿਛਲਾ ਆਰਡਰ" },
  "due date": { hi: "डिलीवरी तारीख", pa: "ਡਿਲੀਵਰੀ ਤਾਰੀਖ" },
  "order date": { hi: "ऑर्डर तारीख", pa: "ਆਰਡਰ ਤਾਰੀਖ" },
  "additional charges": { hi: "एक्स्ट्रा चार्ज", pa: "ਵਾਧੂ ਖਰਚੇ" },
  "order discount": { hi: "छूट (Discount)", pa: "ਛੋਟ (Discount)" },
  "garment type": { hi: "कपड़े का प्रकार", pa: "ਕੱਪੜੇ ਦੀ ਕਿਸਮ" },
  "sample number": { hi: "सैंपल नंबर", pa: "ਸੈਂਪਲ ਨੰਬਰ" },
  "alternate phone": { hi: "दूसरा फ़ोन नंबर", pa: "ਦੂਜਾ ਫ਼ੋਨ ਨੰਬਰ" },
  "new order": { hi: "नया ऑर्डर", pa: "ਨਵਾਂ ਆਰਡਰ" },
  "edit order": { hi: "ऑर्डर बदलें", pa: "ਆਰਡਰ ਬਦਲੋ" },
  "edit customer": { hi: "ग्राहक बदलें", pa: "ਗਾਹਕ ਬਦਲੋ" },
  "customer details": { hi: "ग्राहक की जानकारी", pa: "ਗਾਹਕ ਦੀ ਜਾਣਕਾਰੀ" },
  "order details": { hi: "ऑर्डर की जानकारी", pa: "ਆਰਡਰ ਦੀ ਜਾਣਕਾਰੀ" },
  "cutting queue": { hi: "कटाई लिस्ट", pa: "ਕਟਾਈ ਲਿਸਟ" },
  "cutting workspace": { hi: "कटाई टेबल", pa: "ਕਟਾਈ ਟੇਬਲ" },
};

/**
 * Single-word dictionary covering:
 * 1. UI, Billing, Actions, Months & Days (so UI words NEVER get phonetically mis-transliterated)
 * 2. Address & Location terms
 * 3. Common Indian Cities & States
 * 4. Common First Names & Surnames (North India / Punjab / Hindi belt)
 */
export const NAME_AND_ADDRESS_WORD_DICTIONARY: Record<string, BilingualEntry> = {
  // --- UI, Billing & Action Words ---
  total: { hi: "कुल", pa: "ਕੁੱਲ" },
  due: { hi: "बाकी", pa: "ਬਾਕੀ" },
  paid: { hi: "जमा", pa: "ਜਮ੍ਹਾਂ" },
  balance: { hi: "बाकी", pa: "ਬਾਕੀ" },
  spent: { hi: "खर्च", pa: "ਖਰਚ" },
  advance: { hi: "बयाना", pa: "ਬਿਆਨਾ" },
  discount: { hi: "छूट", pa: "ਛੋਟ" },
  subtotal: { hi: "कच्चा बिल", pa: "ਸਬ-ਟੋਟਲ" },
  amount: { hi: "रकम", pa: "ਰਕਮ" },
  price: { hi: "रेट", pa: "ਰੇਟ" },
  rate: { hi: "रेट", pa: "ਰੇਟ" },
  charges: { hi: "चार्ज", pa: "ਚਾਰਜ" },
  additional: { hi: "एक्स्ट्रा", pa: "ਵਾਧੂ" },
  edit: { hi: "बदलें", pa: "ਬਦਲੋ" },
  view: { hi: "देखें", pa: "ਵੇਖੋ" },
  delete: { hi: "हटाएं", pa: "ਹਟਾਓ" },
  remove: { hi: "हटाएं", pa: "ਹਟਾਓ" },
  save: { hi: "सेव करें", pa: "ਸੇਵ ਕਰੋ" },
  update: { hi: "अपडेट करें", pa: "ਅੱਪਡੇਟ ਕਰੋ" },
  cancel: { hi: "रद्द करें", pa: "ਰੱਦ ਕਰੋ" },
  close: { hi: "बंद करें", pa: "ਬੰਦ ਕਰੋ" },
  confirm: { hi: "पक्का करें", pa: "ਪੱਕਾ ਕਰੋ" },
  confirmed: { hi: "पक्का", pa: "ਪੱਕਾ" },
  retry: { hi: "दोबारा कोशिश करें", pa: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ" },
  select: { hi: "चुनें", pa: "ਚੁਣੋ" },
  copy: { hi: "कॉपी", pa: "ਕਾਪੀ" },
  create: { hi: "बनाएं", pa: "ਬਣਾਓ" },
  created: { hi: "तारीख", pa: "ਤਾਰੀਖ" },
  delivery: { hi: "डिलीवरी", pa: "ਡਿਲੀਵਰੀ" },
  order: { hi: "ऑर्डर", pa: "ਆਰਡਰ" },
  orders: { hi: "ऑर्डर", pa: "ਆਰਡਰ" },
  customer: { hi: "ग्राहक", pa: "ਗਾਹਕ" },
  customers: { hi: "ग्राहक", pa: "ਗਾਹਕ" },
  garment: { hi: "कपड़ा", pa: "ਕੱਪੜਾ" },
  garments: { hi: "कपड़े", pa: "ਕੱਪੜੇ" },
  item: { hi: "कपड़ा", pa: "ਕੱਪੜਾ" },
  items: { hi: "कपड़े", pa: "ਕੱਪੜੇ" },
  pending: { hi: "पेंडिंग", pa: "ਪੈਂਡਿੰਗ" },
  cutting: { hi: "कटाई", pa: "ਕਟਾਈ" },
  cut: { hi: "कटाई", pa: "ਕਟਾਈ" },
  stitching: { hi: "सिलाई", pa: "ਸਿਲਾਈ" },
  ready: { hi: "तैयार", pa: "ਤਿਆਰ" },
  delivered: { hi: "डिलीवर", pa: "ਡਿਲੀਵਰ" },
  completed: { hi: "पूरा", pa: "ਪੂਰਾ" },
  status: { hi: "स्थिति", pa: "ਸਥਿਤੀ" },
  date: { hi: "तारीख", pa: "ਤਾਰੀਖ" },
  dates: { hi: "तारीखें", pa: "ਤਾਰੀਖਾਂ" },
  name: { hi: "नाम", pa: "ਨਾਮ" },
  phone: { hi: "फ़ोन", pa: "ਫ਼ੋਨ" },
  email: { hi: "ईमेल", pa: "ਈਮੇਲ" },
  code: { hi: "कोड", pa: "ਕੋਡ" },
  note: { hi: "नोट", pa: "ਨੋਟ" },
  notes: { hi: "नोट्स", pa: "ਨੋਟਸ" },
  details: { hi: "जानकारी", pa: "ਜਾਣਕਾਰੀ" },
  summary: { hi: "हिसाब", pa: "ਹਿਸਾਬ" },
  history: { hi: "रिकॉर्ड", pa: "ਰਿਕਾਰਡ" },
  profile: { hi: "प्रोफ़ाइल", pa: "ਪ੍ਰੋਫਾਈਲ" },
  account: { hi: "खाता", pa: "ਖਾਤਾ" },
  measurement: { hi: "नाप", pa: "ਨਾਪ" },
  measurements: { hi: "नाप", pa: "ਨਾਪ" },
  sample: { hi: "सैंपल", pa: "ਸੈਂਪਲ" },
  book: { hi: "बुक", pa: "ਬੁੱਕ" },
  page: { hi: "पेज", pa: "ਪੇਜ" },
  lock: { hi: "लॉक", pa: "ਲਾਕ" },
  locked: { hi: "लॉक", pa: "ਲਾਕ" },
  print: { hi: "प्रिंट", pa: "ਪ੍ਰਿੰਟ" },
  invoice: { hi: "बिल", pa: "ਬਿੱਲ" },
  checkout: { hi: "बिल", pa: "ਬਿੱਲ" },
  workspace: { hi: "टेबल", pa: "ਟੇਬਲ" },
  queue: { hi: "लिस्ट", pa: "ਲਿਸਟ" },
  calendar: { hi: "कैलेंडर", pa: "ਕੈਲੰਡਰ" },
  optional: { hi: "जरूरी नहीं", pa: "ਜ਼ਰੂਰੀ ਨਹੀਂ" },

  // --- Months & Days of Week ---
  jan: { hi: "जनवरी", pa: "ਜਨਵਰੀ" },
  january: { hi: "जनवरी", pa: "ਜਨਵਰੀ" },
  feb: { hi: "फ़रवरी", pa: "ਫ਼ਰਵਰੀ" },
  february: { hi: "फ़रवरी", pa: "ਫ਼ਰਵਰੀ" },
  mar: { hi: "मार्च", pa: "ਮਾਰਚ" },
  march: { hi: "मार्च", pa: "ਮਾਰਚ" },
  apr: { hi: "अप्रैल", pa: "ਅਪ੍ਰੈਲ" },
  april: { hi: "अप्रैल", pa: "ਅਪ੍ਰੈਲ" },
  may: { hi: "मई", pa: "ਮਈ" },
  jun: { hi: "जून", pa: "ਜੂਨ" },
  june: { hi: "जून", pa: "ਜੂਨ" },
  jul: { hi: "जुलाई", pa: "ਜੁਲਾਈ" },
  july: { hi: "जुलाई", pa: "ਜੁਲਾਈ" },
  aug: { hi: "अगस्त", pa: "ਅਗਸਤ" },
  august: { hi: "अगस्त", pa: "ਅਗਸਤ" },
  sep: { hi: "सितंबर", pa: "ਸਤੰਬਰ" },
  sept: { hi: "सितंबर", pa: "ਸਤੰਬਰ" },
  september: { hi: "सितंबर", pa: "ਸਤੰਬਰ" },
  oct: { hi: "अक्टूबर", pa: "ਅਕਤੂਬਰ" },
  october: { hi: "अक्टूबर", pa: "ਅਕਤੂਬਰ" },
  nov: { hi: "नवंबर", pa: "ਨਵੰਬਰ" },
  november: { hi: "नवंबर", pa: "ਨਵੰਬਰ" },
  dec: { hi: "दिसंबर", pa: "ਦਸੰਬਰ" },
  december: { hi: "दिसंबर", pa: "ਦਸੰਬਰ" },
  mon: { hi: "सोमवार", pa: "ਸੋਮਵਾਰ" },
  monday: { hi: "सोमवार", pa: "ਸੋਮਵਾਰ" },
  tue: { hi: "मंगलवार", pa: "ਮੰਗਲਵਾਰ" },
  tuesday: { hi: "मंगलवार", pa: "ਮੰਗਲਵਾਰ" },
  wed: { hi: "बुधवार", pa: "ਬੁੱਧਵਾਰ" },
  wednesday: { hi: "बुधवार", pa: "ਬੁੱਧਵਾਰ" },
  thu: { hi: "वीरवार", pa: "ਵੀਰਵਾਰ" },
  thursday: { hi: "वीरवार", pa: "ਵੀਰਵਾਰ" },
  fri: { hi: "शुक्रवार", pa: "ਸ਼ੁੱਕਰਵਾਰ" },
  friday: { hi: "शुक्रवार", pa: "ਸ਼ੁੱਕਰਵਾਰ" },
  sat: { hi: "शनिवार", pa: "ਸ਼ਨੀਵਾਰ" },
  saturday: { hi: "शनिवार", pa: "ਸ਼ਨੀਵਾਰ" },
  sun: { hi: "रविवार", pa: "ਐਤਵਾਰ" },
  sunday: { hi: "रविवार", pa: "ਐਤਵਾਰ" },
  today: { hi: "आज", pa: "ਅੱਜ" },
  tomorrow: { hi: "कल", pa: "ਕੱਲ੍ਹ" },

  // --- Address & Direction Words ---
  address: { hi: "पता", pa: "ਪਤਾ" },
  near: { hi: "के पास", pa: "ਦੇ ਨੇੜੇ" },
  opposite: { hi: "के सामने", pa: "ਦੇ ਸਾਹਮਣੇ" },
  opp: { hi: "के सामने", pa: "ਦੇ ਸਾਹਮਣੇ" },
  behind: { hi: "के पीछे", pa: "ਦੇ ਪਿੱਛੇ" },
  beside: { hi: "के बगल में", pa: "ਦੇ ਨਾਲ" },
  adjacent: { hi: "के साथ", pa: "ਦੇ ਨਾਲ" },
  front: { hi: "सामने", pa: "ਸਾਹਮਣੇ" },
  back: { hi: "पीछे", pa: "ਪਿੱਛੇ" },
  inside: { hi: "अंदर", pa: "ਅੰਦਰ" },
  outside: { hi: "बाहर", pa: "ਬਾਹਰ" },
  above: { hi: "ऊपर", pa: "ਉੱਪਰ" },
  below: { hi: "नीचे", pa: "ਹੇਠਾਂ" },
  shop: { hi: "दुकान", pa: "ਦੁਕਾਨ" },
  store: { hi: "स्टोर / दुकान", pa: "ਸਟੋਰ / ਦੁਕਾਨ" },
  showroom: { hi: "शोरूम", pa: "ਸ਼ੋਰੂਮ" },
  house: { hi: "मकान", pa: "ਮਕਾਨ / ਘਰ" },
  home: { hi: "घर", pa: "ਘਰ" },
  kothi: { hi: "कोठी", pa: "ਕੋਠੀ" },
  flat: { hi: "फ्लैट", pa: "ਫਲੈਟ" },
  apartment: { hi: "अपार्टमेंट", pa: "ਅਪਾਰਟਮੈਂਟ" },
  plot: { hi: "प्लॉट", pa: "ਪਲਾਟ" },
  booth: { hi: "बूथ", pa: "ਬੂਥ" },
  sco: { hi: "एस.सी.ओ.", pa: "ਐਸ.ਸੀ.ਓ." },
  scf: { hi: "एस.सी.एफ.", pa: "ਐਸ.ਸੀ.ਐਫ." },
  building: { hi: "बिल्डिंग", pa: "ਬਿਲਡਿੰਗ" },
  tower: { hi: "टावर", pa: "ਟਾਵਰ" },
  complex: { hi: "कॉम्प्लेक्स", pa: "ਕੰਪਲੈਕਸ" },
  plaza: { hi: "प्लाज़ा", pa: "ਪਲਾਜ਼ਾ" },
  arcade: { hi: "आर्केड", pa: "ਆਰਕੇਡ" },
  mall: { hi: "मॉल", pa: "ਮਾਲ" },
  market: { hi: "मार्केट / बाज़ार", pa: "ਮਾਰਕੀਟ / ਬਾਜ਼ਾਰ" },
  bazaar: { hi: "बाज़ार", pa: "ਬਾਜ਼ਾਰ" },
  bazar: { hi: "बाज़ार", pa: "ਬਾਜ਼ਾਰ" },
  mandi: { hi: "मंडी", pa: "ਮੰਡੀ" },
  chowk: { hi: "चौक", pa: "ਚੌਕ" },
  chauraha: { hi: "चौराहा", pa: "ਚੌਰਾਹਾ" },
  crossing: { hi: "फाटक / क्रॉसिंग", pa: "ਫਾਟਕ / ਕ੍ਰਾਸਿੰਗ" },
  phatak: { hi: "फाटक", pa: "ਫਾਟਕ" },
  corner: { hi: "कॉर्नर / कोना", pa: "ਕਾਰਨਰ / ਕੋਨਾ" },
  mor: { hi: "मोड़", pa: "ਮੋੜ" },
  turn: { hi: "मोड़", pa: "ਮੋੜ" },
  circle: { hi: "सर्कल", pa: "ਸਰਕਲ" },
  road: { hi: "रोड / सड़क", pa: "ਰੋਡ / ਸੜਕ" },
  rd: { hi: "रोड", pa: "ਰੋਡ" },
  marg: { hi: "मार्ग", pa: "ਮਾਰਗ" },
  street: { hi: "गली", pa: "ਗਲੀ" },
  st: { hi: "गली", pa: "ਗਲੀ" },
  gali: { hi: "गली", pa: "ਗਲੀ" },
  lane: { hi: "गली / लेन", pa: "ਗਲੀ / ਲੇਨ" },
  highway: { hi: "हाईवे", pa: "ਹਾਈਵੇਅ" },
  bypass: { hi: "बाईपास", pa: "ਬਾਈਪਾਸ" },
  bridge: { hi: "पुल", pa: "ਪੁਲ" },
  pul: { hi: "पुल", pa: "ਪੁਲ" },
  flyover: { hi: "फ्लाईओवर", pa: "ਫਲਾਈਓਵਰ" },
  canal: { hi: "नहर", pa: "ਨਹਿਰ" },
  nahar: { hi: "नहर", pa: "ਨਹਿਰ" },
  nagar: { hi: "नगर", pa: "ਨਗਰ" },
  colony: { hi: "कॉलोनी", pa: "ਕਾਲੋਨੀ" },
  enclave: { hi: "एन्क्लेव", pa: "ਇਨਕਲੇਵ" },
  vihar: { hi: "विहार", pa: "ਵਿਹਾਰ" },
  kunj: { hi: "कुंज", pa: "ਕੁੰਜ" },
  puram: { hi: "पुरम", pa: "ਪੁਰਮ" },
  pura: { hi: "पुरा", pa: "ਪੁਰਾ" },
  pur: { hi: "पुर", pa: "ਪੁਰ" },
  garh: { hi: "गढ़", pa: "ਗੜ੍ਹ" },
  kot: { hi: "कोट", pa: "ਕੋਟ" },
  wala: { hi: "वाला", pa: "ਵਾਲਾ" },
  wali: { hi: "वाली", pa: "ਵਾਲੀ" },
  park: { hi: "पार्क", pa: "ਪਾਰਕ" },
  garden: { hi: "गार्डन / बाग़", pa: "ਗਾਰਡਨ / ਬਾਗ਼" },
  bagh: { hi: "बाग़", pa: "ਬਾਗ਼" },
  phase: { hi: "फेज़", pa: "ਫੇਜ਼" },
  sector: { hi: "सेक्टर", pa: "ਸੈਕਟਰ" },
  sec: { hi: "सेक्टर", pa: "ਸੈਕਟਰ" },
  block: { hi: "ब्लॉक", pa: "ਬਲਾਕ" },
  pocket: { hi: "पॉकेट", pa: "ਪਾਕੇਟ" },
  ward: { hi: "वार्ड", pa: "ਵਾਰਡ" },
  mohalla: { hi: "मोहल्ला", pa: "ਮੁਹੱਲਾ" },
  basti: { hi: "बस्ती", pa: "ਬਸਤੀ" },
  patti: { hi: "पत्ती", pa: "ਪੱਤੀ" },
  abadi: { hi: "आबादी", pa: "ਆਬਾਦੀ" },
  extension: { hi: "एक्सटेंशन", pa: "ਐਕਸਟੈਂਸ਼ਨ" },
  ext: { hi: "एक्सटेंशन", pa: "ਐਕਸਟੈਂਸ਼ਨ" },
  town: { hi: "टाउन", pa: "ਟਾਊਨ" },
  city: { hi: "सिटी / शहर", pa: "ਸਿਟੀ / ਸ਼ਹਿਰ" },
  village: { hi: "गाँव", pa: "ਪਿੰਡ (Village)" },
  vill: { hi: "गाँव", pa: "ਪਿੰਡ" },
  vpo: { hi: "गाँव व डाकघर (VPO)", pa: "ਪਿੰਡ ਅਤੇ ਡਾਕਘਰ (VPO)" },
  pind: { hi: "पिंड / गाँव", pa: "ਪਿੰਡ" },
  tehsil: { hi: "तहसील", pa: "ਤਹਿਸੀਲ" },
  district: { hi: "ज़िला", pa: "ਜ਼ਿਲ੍ਹਾ" },
  distt: { hi: "ज़िला", pa: "ਜ਼ਿਲ੍ਹਾ" },
  dist: { hi: "ज़िला", pa: "ਜ਼ਿਲ੍ਹਾ" },
  state: { hi: "राज्य", pa: "ਰਾਜ / ਸੂਬਾ" },
  floor: { hi: "मंजिल", pa: "ਮੰਜ਼ਿਲ" },
  ground: { hi: "ग्राउंड / नीचे", pa: "ਗ੍ਰਾਊਂਡ / ਹੇਠਾਂ" },
  first: { hi: "पहला", pa: "ਪਹਿਲਾ" },
  second: { hi: "दूसरा", pa: "ਦੂਜਾ" },
  third: { hi: "तीसरा", pa: "ਤੀਜਾ" },
  fourth: { hi: "चौथा", pa: "ਚੌਥਾ" },
  basement: { hi: "बेसमेंट / तहखाना", pa: "ਬੇਸਮੈਂਟ" },
  gate: { hi: "गेट / दरवाज़ा", pa: "ਗੇਟ / ਦਰਵਾਜ਼ਾ" },
  no: { hi: "नंबर", pa: "ਨੰਬਰ" },
  number: { hi: "नंबर", pa: "ਨੰਬਰ" },
  main: { hi: "मेन / मुख्य", pa: "ਮੇਨ / ਮੁੱਖ" },
  new: { hi: "नया / न्यू", pa: "ਨਵਾਂ / ਨਿਊ" },
  old: { hi: "पुराना / ओल्ड", pa: "ਪੁਰਾਣਾ / ਓਲਡ" },
  east: { hi: "पूर्वी (East)", pa: "ਪੂਰਬੀ (East)" },
  west: { hi: "पश्चिमी (West)", pa: "ਪੱਛਮੀ (West)" },
  north: { hi: "उत्तरी (North)", pa: "ਉੱਤਰੀ (North)" },
  south: { hi: "दक्षिणी (South)", pa: "ਦੱਖਣੀ (South)" },
  central: { hi: "सेंट्रल", pa: "ਸੈਂਟਰਲ" },
  upper: { hi: "ऊपरी", pa: "ਉੱਪਰਲਾ" },
  lower: { hi: "निचला", pa: "ਹੇਠਲਾ" },
  gurudwara: { hi: "गुरुद्वारा", pa: "ਗੁਰਦੁਆਰਾ" },
  gurdwara: { hi: "गुरुद्वारा", pa: "ਗੁਰਦੁਆਰਾ" },
  sahib: { hi: "साहिब", pa: "ਸਾਹਿਬ" },
  mandir: { hi: "मंदिर", pa: "ਮੰਦਿਰ" },
  temple: { hi: "मंदिर", pa: "ਮੰਦਿਰ" },
  masjid: { hi: "मस्जिद", pa: "ਮਸਜਿਦ" },
  mosque: { hi: "मस्जिद", pa: "ਮਸਜਿਦ" },
  church: { hi: "चर्च", pa: "ਚਰਚ" },
  school: { hi: "स्कूल", pa: "ਸਕੂਲ" },
  college: { hi: "कॉलेज", pa: "ਕਾਲਜ" },
  hospital: { hi: "अस्पताल (हॉस्पिटल)", pa: "ਹਸਪਤਾਲ" },
  clinic: { hi: "क्लिनिक", pa: "ਕਲੀਨਿਕ" },
  bank: { hi: "बैंक", pa: "ਬੈਂਕ" },
  thana: { hi: "थाना", pa: "ਥਾਣਾ" },
  chowki: { hi: "चौकी", pa: "ਚੌਕੀ" },
  adda: { hi: "अड्डा", pa: "ਅੱਡਾ" },
  station: { hi: "स्टेशन", pa: "ਸਟੇਸ਼ਨ" },
  stand: { hi: "स्टैंड", pa: "ਸਟੈਂਡ" },
  bus: { hi: "बस", pa: "ਬੱਸ" },
  railway: { hi: "रेलवे", pa: "ਰੇਲਵੇ" },
  metro: { hi: "मेट्रो", pa: "ਮੈਟਰੋ" },
  mill: { hi: "मिल", pa: "ਮਿੱਲ" },
  factory: { hi: "फैक्ट्री", pa: "ਫੈਕਟਰੀ" },
  dharamshala: { hi: "धर्मशाला", pa: "ਧਰਮਸ਼ਾਲਾ" },
  bhawan: { hi: "भवन", pa: "ਭਵਨ" },

  // --- Major Cities, Towns & States (Punjab, Haryana, North India) ---
  punjab: { hi: "पंजाब", pa: "ਪੰਜਾਬ" },
  haryana: { hi: "हरियाणा", pa: "ਹਰਿਆਣਾ" },
  delhi: { hi: "दिल्ली", pa: "ਦਿੱਲੀ" },
  chandigarh: { hi: "चंडीगढ़", pa: "ਚੰਡੀਗੜ੍ਹ" },
  rajasthan: { hi: "राजस्थान", pa: "ਰਾਜਸਥਾਨ" },
  himachal: { hi: "हिमाचल", pa: "ਹਿਮਾਚਲ" },
  jammu: { hi: "जम्मू", pa: "ਜੰਮੂ" },
  kashmir: { hi: "कश्मीर", pa: "ਕਸ਼ਮੀਰ" },
  india: { hi: "भारत (India)", pa: "ਭਾਰਤ (India)" },
  ludhiana: { hi: "लुधियाना", pa: "ਲੁਧਿਆਣਾ" },
  amritsar: { hi: "अमृतसर", pa: "ਅੰਮ੍ਰਿਤਸਰ" },
  jalandhar: { hi: "जालंधर", pa: "ਜਲੰਧਰ" },
  patiala: { hi: "पटियाला", pa: "ਪਟਿਆਲਾ" },
  bathinda: { hi: "बठिंडा", pa: "ਬਠਿੰਡਾ" },
  bhatinda: { hi: "बठिंडा", pa: "ਬਠਿੰਡਾ" },
  mohali: { hi: "मोहाली", pa: "ਮੋਹਾਲੀ" },
  kharar: { hi: "खरड़", pa: "ਖਰੜ" },
  zirakpur: { hi: "ज़ीरकपुर", pa: "ਜ਼ੀਰਕਪੁਰ" },
  moga: { hi: "मोगा", pa: "ਮੋਗਾ" },
  hoshiarpur: { hi: "होशियारपुर", pa: "ਹੁਸ਼ਿਆਰਪੁਰ" },
  pathankot: { hi: "पठानकोट", pa: "ਪਠਾਨਕੋਟ" },
  phagwara: { hi: "फगवाड़ा", pa: "ਫਗਵਾੜਾ" },
  khanna: { hi: "खन्ना", pa: "ਖੰਨਾ" },
  barnala: { hi: "बरनाला", pa: "ਬਰਨਾਲਾ" },
  sangrur: { hi: "संगरूर", pa: "ਸੰਗਰੂਰ" },
  faridkot: { hi: "फरीदकोट", pa: "ਫ਼ਰੀਦਕੋਟ" },
  muktsar: { hi: "मुक्तसर", pa: "ਮੁਕਤਸਰ" },
  ferozepur: { hi: "फिरोज़पुर", pa: "ਫ਼ਿਰੋਜ਼ਪੁਰ" },
  firozpur: { hi: "फिरोज़पुर", pa: "ਫ਼ਿਰੋਜ਼ਪੁਰ" },
  gurdaspur: { hi: "गुरदासपुर", pa: "ਗੁਰਦਾਸਪੁਰ" },
  kapurthala: { hi: "कपूरथला", pa: "ਕਪੂਰਥਲਾ" },
  rupnagar: { hi: "रूपनगर", pa: "ਰੂਪਨਗਰ" },
  ropar: { hi: "रोपड़", pa: "ਰੋਪੜ" },
  mansa: { hi: "मानसा", pa: "ਮਾਨਸਾ" },
  fazilka: { hi: "फाज़िल्का", pa: "ਫ਼ਾਜ਼ਿਲਕਾ" },
  malerkotla: { hi: "मलेरकोटला", pa: "ਮਲੇਰਕੋਟਲਾ" },
  nawanshahr: { hi: "नवांशहर", pa: "ਨਵਾਂਸ਼ਹਿਰ" },
  rajpura: { hi: "राजपुरा", pa: "ਰਾਜਪੁਰਾ" },
  nabha: { hi: "नाभा", pa: "ਨਾਭਾ" },
  samana: { hi: "समाना", pa: "ਸਮਾਣਾ" },
  sirhind: { hi: "सरहिंद", pa: "ਸਰਹਿੰਦ" },
  gobindgarh: { hi: "गोबिंदगढ़", pa: "ਗੋਬਿੰਦਗੜ੍ਹ" },
  jagraon: { hi: "जगराओं", pa: "ਜਗਰਾਉਂ" },
  samrala: { hi: "समराला", pa: "ਸਮਰਾਲਾ" },
  raikot: { hi: "रायकोट", pa: "ਰਾਏਕੋਟ" },
  machhiwara: { hi: "माछीवाड़ा", pa: "ਮਾਛੀਵਾੜਾ" },
  doraha: { hi: "दोराहा", pa: "ਦੋਰਾਹਾ" },
  payal: { hi: "पायल", pa: "ਪਾਇਲ" },
  mullanpur: { hi: "मुल्लांपुर", pa: "ਮੁੱਲਾਂਪੁਰ" },
  sahnewal: { hi: "साहनेवाल", pa: "ਸਾਹਨੇਵਾਲ" },
  phillaur: { hi: "फिल्लौर", pa: "ਫਿਲੌਰ" },
  nakodar: { hi: "नकोदर", pa: "ਨਕੋਦਰ" },
  shahkot: { hi: "शाहकोट", pa: "ਸ਼ਾਹਕੋਟ" },
  kartarpur: { hi: "करतारपुर", pa: "ਕਰਤਾਰਪੁਰ" },
  banga: { hi: "बंगा", pa: "ਬੰਗਾ" },
  garshankar: { hi: "गढ़शंकर", pa: "ਗੜ੍ਹਸ਼ੰਕਰ" },
  dasuya: { hi: "दसूहा", pa: "ਦਸੂਹਾ" },
  mukerian: { hi: "मुकेरियां", pa: "ਮੁਕੇਰੀਆਂ" },
  batala: { hi: "बटाला", pa: "ਬਟਾਲਾ" },
  abohar: { hi: "अबोहर", pa: "ਅਬੋਹਰ" },
  malout: { hi: "मलोट", pa: "ਮਲੋਟ" },
  gidderbaha: { hi: "गिद्दड़बाहा", pa: "ਗਿੱਦੜਬਾਹਾ" },
  kotkapura: { hi: "कोटकपूरा", pa: "ਕੋਟਕਪੂਰਾ" },
  jaitu: { hi: "जैतो", pa: "ਜੈਤੋ" },
  rampura: { hi: "रामपुरा", pa: "ਰਾਮਪੁਰਾ" },
  phul: { hi: "फूल", pa: "ਫੂਲ" },
  sunam: { hi: "सुनाम", pa: "ਸੁਨਾਮ" },
  dhuri: { hi: "धूरी", pa: "ਧੂਰੀ" },
  lehragaga: { hi: "लहरागागा", pa: "ਲਹਿਰਾਗਾਗਾ" },
  moonak: { hi: "मूनक", pa: "ਮੂਨਕ" },
  patran: { hi: "पातड़ां", pa: "ਪਾਤੜਾਂ" },
  dugri: { hi: "दुगरी", pa: "ਦੁਗਰੀ" },
  haibowal: { hi: "हैबोवाल", pa: "ਹੈਬੋਵਾਲ" },
  jamalpur: { hi: "जमालपुर", pa: "ਜਮਾਲਪੁਰ" },
  ambala: { hi: "अंबाला", pa: "ਅੰਬਾਲਾ" },
  panipat: { hi: "पानीपत", pa: "ਪਾਣੀਪਤ" },
  karnal: { hi: "करनाल", pa: "ਕਰਨਾਲ" },
  kurukshetra: { hi: "कुरुक्षेत्र", pa: "ਕੁਰੂਕਸ਼ੇਤਰ" },
  yamunanagar: { hi: "यमुनानगर", pa: "ਯਮੁਨਾਨਗਰ" },
  panchkula: { hi: "पंचकूला", pa: "ਪੰਚਕੂਲਾ" },
  hisar: { hi: "हिसार", pa: "ਹਿਸਾਰ" },
  rohtak: { hi: "रोहतक", pa: "ਰੋਹਤਕ" },
  sonipat: { hi: "सोनीपत", pa: "ਸੋਨੀਪਤ" },
  sirsa: { hi: "सिरसा", pa: "ਸਿਰਸਾ" },
  kaithal: { hi: "कैथल", pa: "ਕੈਥਲ" },
  jind: { hi: "जींद", pa: "ਜੀਂਦ" },
  gurgaon: { hi: "गुड़गांव", pa: "ਗੁੜਗਾਓਂ" },
  gurugram: { hi: "गुरुग्राम", pa: "ਗੁਰੂਗ੍ਰਾਮ" },
  noida: { hi: "नोएडा", pa: "ਨੋਇਡਾ" },
  faridabad: { hi: "फरीदाबाद", pa: "ਫਰੀਦਾਬਾਦ" },
  ghaziabad: { hi: "गाज़ियाबाद", pa: "ਗਾਜ਼ੀਆਬਾਦ" },
  jaipur: { hi: "जयपुर", pa: "ਜੈਪੁਰ" },
  ganganagar: { hi: "गंगानगर", pa: "ਗੰਗਾਨਗਰ" },
  hanumangarh: { hi: "हनुमानगढ़", pa: "ਹਨੂੰਮਾਨਗੜ੍ਹ" },
  bikaner: { hi: "बीकानेर", pa: "ਬੀਕਾਨੇਰ" },
  mumbai: { hi: "मुंबई", pa: "ਮੁੰਬਈ" },
  pune: { hi: "पुणे", pa: "ਪੁਣੇ" },
  ahmedabad: { hi: "अहमदाबाद", pa: "ਅਹਿਮਦਾਬਾਦ" },
  surat: { hi: "सूरत", pa: "ਸੂਰਤ" },
  lucknow: { hi: "लखनऊ", pa: "ਲਖਨਊ" },
  kanpur: { hi: "कानपुर", pa: "ਕਾਨਪੁਰ" },
  agra: { hi: "आगरा", pa: "ਆਗਰਾ" },
  meerut: { hi: "मेरठ", pa: "ਮੇਰਠ" },
  saharanpur: { hi: "सहारनपुर", pa: "ਸਹਾਰਨਪੁਰ" },
  dehradun: { hi: "देहरादून", pa: "ਦੇਹਰਾਦੂਨ" },
  haridwar: { hi: "हरिद्वार", pa: "ਹਰਿਦੁਆਰ" },
  shimla: { hi: "शिमला", pa: "ਸ਼ਿਮਲਾ" },
  solan: { hi: "सोलन", pa: "ਸੋਲਨ" },
  baddi: { hi: "बद्दी", pa: "ਬੱਦੀ" },
  una: { hi: "ऊना", pa: "ਊਨਾ" },
  kangra: { hi: "कांगड़ा", pa: "ਕਾਂਗੜਾ" },

  // --- Titles, Honorifics & Surnames ---
  mr: { hi: "श्री", pa: "ਸ੍ਰੀ" },
  mrs: { hi: "श्रीमती", pa: "ਸ੍ਰੀਮਤੀ" },
  ms: { hi: "सुश्री", pa: "ਕੁਮਾਰੀ" },
  shri: { hi: "श्री", pa: "ਸ੍ਰੀ" },
  smt: { hi: "श्रीमती", pa: "ਸ੍ਰੀਮਤੀ" },
  sardar: { hi: "सरदार", pa: "ਸਰਦਾਰ" },
  sardarni: { hi: "सरदारनी", pa: "ਸਰਦਾਰਨੀ" },
  bhai: { hi: "भाई", pa: "ਭਾਈ" },
  baba: { hi: "बाबा", pa: "ਬਾਬਾ" },
  gyani: { hi: "ज्ञानी", pa: "ਗਿਆਨੀ" },
  master: { hi: "मास्टर", pa: "ਮਾਸਟਰ" },
  ustad: { hi: "उस्ताद", pa: "ਉਸਤਾਦ" },
  ji: { hi: "जी", pa: "ਜੀ" },
  sarpanch: { hi: "सरपंच", pa: "ਸਰਪੰਚ" },
  singh: { hi: "सिंह", pa: "ਸਿੰਘ" },
  kaur: { hi: "कौर", pa: "ਕੌਰ" },
  sharma: { hi: "शर्मा", pa: "ਸ਼ਰਮਾ" },
  verma: { hi: "वर्मा", pa: "ਵਰਮਾ" },
  varma: { hi: "वर्मा", pa: "ਵਰਮਾ" },
  gupta: { hi: "गुप्ता", pa: "ਗੁਪਤਾ" },
  kumar: { hi: "कुमार", pa: "ਕੁਮਾਰ" },
  kumari: { hi: "कुमारी", pa: "ਕੁਮਾਰੀ" },
  devi: { hi: "देवी", pa: "ਦੇਵੀ" },
  gill: { hi: "गिल", pa: "ਗਿੱਲ" },
  sandhu: { hi: "संधू", pa: "ਸੰਧੂ" },
  sidhu: { hi: "सिद्धू", pa: "ਸਿੱਧੂ" },
  dhillon: { hi: "ढिल्लों", pa: "ਢਿੱਲੋਂ" },
  grewal: { hi: "ग्रेवाल", pa: "ਗਰੇਵਾਲ" },
  brar: { hi: "बराड़", pa: "ਬਰਾੜ" },
  bajwa: { hi: "बाजवा", pa: "ਬਾਜਵਾ" },
  cheema: { hi: "चीमा", pa: "ਚੀਮਾ" },
  randhawa: { hi: "रंधावा", pa: "ਰੰਧਾਵਾ" },
  virk: { hi: "विर्क", pa: "ਵਿਰਕ" },
  mann: { hi: "मान", pa: "ਮਾਨ" },
  maan: { hi: "मान", pa: "ਮਾਨ" },
  bains: { hi: "बैंस", pa: "ਬੈਂਸ" },
  chahal: { hi: "चहल", pa: "ਚਾਹਲ" },
  deol: { hi: "देओल", pa: "ਦਿਓਲ" },
  aulakh: { hi: "औलख", pa: "ਔਲਖ" },
  sekhon: { hi: "सेखों", pa: "ਸੇਖੋਂ" },
  tiwana: { hi: "तिवाना", pa: "ਟਿਵਾਣਾ" },
  bhullar: { hi: "भुल्लर", pa: "ਭੁੱਲਰ" },
  hundal: { hi: "हुंदल", pa: "ਹੁੰਦਲ" },
  pannu: { hi: "पन्नू", pa: "ਪੰਨੂ" },
  kahlon: { hi: "काहलों", pa: "ਕਾਹਲੋਂ" },
  dhaliwal: { hi: "धालीवाल", pa: "ਧਾਲੀਵਾਲ" },
  sohal: { hi: "सोहल", pa: "ਸੋਹਲ" },
  saini: { hi: "सैनी", pa: "ਸੈਣੀ" },
  kamboj: { hi: "कंबोज", pa: "ਕੰਬੋਜ" },
  ramgarhia: { hi: "रामगढ़िया", pa: "ਰਾਮਗੜ੍ਹੀਆ" },
  arora: { hi: "अरोड़ा", pa: "ਅਰੋੜਾ" },
  bhatia: { hi: "भाटिया", pa: "ਭਾਟੀਆ" },
  chawla: { hi: "चावला", pa: "ਚਾਵਲਾ" },
  malhotra: { hi: "मल्होत्रा", pa: "ਮਲਹੋਤਰਾ" },
  kapoor: { hi: "कपूर", pa: "ਕਪੂਰ" },
  kapur: { hi: "कपूर", pa: "ਕਪੂਰ" },
  chopra: { hi: "चोपड़ा", pa: "ਚੋਪੜਾ" },
  mehta: { hi: "मेहता", pa: "ਮਹਿਤਾ" },
  ahuja: { hi: "आहूजा", pa: "ਆਹੂਜਾ" },
  aneja: { hi: "अनेजा", pa: "ਅਨੇਜਾ" },
  taneja: { hi: "तनेजा", pa: "ਤਨੇਜਾ" },
  abrol: { hi: "अबरोल", pa: "ਅਬਰੋਲ" },
  bedi: { hi: "बेदी", pa: "ਬੇਦੀ" },
  sodhi: { hi: "सोढ़ी", pa: "ਸੋਢੀ" },
  sethi: { hi: "सेठी", pa: "ਸੇਠੀ" },
  kohli: { hi: "कोहली", pa: "ਕੋਹਲੀ" },
  anand: { hi: "आनंद", pa: "ਆਨੰਦ" },
  chadha: { hi: "चड्ढा", pa: "ਚੱਢਾ" },
  grover: { hi: "ग्रोवर", pa: "ਗਰੋਵਰ" },
  sachdeva: { hi: "सचदेवा", pa: "ਸਚਦੇਵਾ" },
  saluja: { hi: "सलूजा", pa: "ਸਲੂਜਾ" },
  batra: { hi: "बत्रा", pa: "ਬੱਤਰਾ" },
  kalra: { hi: "कालरा", pa: "ਕਾਲੜਾ" },
  nagpal: { hi: "नागपाल", pa: "ਨਾਗਪਾਲ" },
  narang: { hi: "नारंग", pa: "ਨਾਰੰਗ" },
  duggal: { hi: "दुग्गल", pa: "ਦੁੱਗਲ" },
  uri: { hi: "उरी", pa: "ਉਰੀ" },
  puri: { hi: "पुरी", pa: "ਪੁਰੀ" },
  suri: { hi: "सूरी", pa: "ਸੂਰੀ" },
  thapar: { hi: "थापर", pa: "ਥਾਪਰ" },
  handa: { hi: "हांडा", pa: "ਹਾਂਡਾ" },
  bajaj: { hi: "बजाज", pa: "ਬਜਾਜ" },
  aggarwal: { hi: "अग्रवाल", pa: "ਅਗਰਵਾਲ" },
  agarwal: { hi: "अग्रवाल", pa: "ਅਗਰਵਾਲ" },
  garg: { hi: "गर्ग", pa: "ਗਰਗ" },
  goyal: { hi: "गोयल", pa: "ਗੋਇਲ" },
  goel: { hi: "गोयल", pa: "ਗੋਇਲ" },
  bansal: { hi: "बंसल", pa: "ਬੰਸਲ" },
  mittal: { hi: "मित्तल", pa: "ਮਿੱਤਲ" },
  jindal: { hi: "जिंदल", pa: "ਜਿੰਦਲ" },
  singla: { hi: "सिंगला", pa: "ਸਿੰਗਲਾ" },
  kansal: { hi: "कंसल", pa: "ਕੰਸਲ" },
  mangla: { hi: "मंगला", pa: "ਮੰਗਲਾ" },
  mahajan: { hi: "महाजन", pa: "ਮਹਾਜਨ" },
  jain: { hi: "जैन", pa: "ਜੈਨ" },
  joshi: { hi: "जोशी", pa: "ਜੋਸ਼ੀ" },
  tiwari: { hi: "तिवारी", pa: "ਤਿਵਾੜੀ" },
  mishra: { hi: "मिश्रा", pa: "ਮਿਸ਼ਰਾ" },
  pandey: { hi: "पांडे", pa: "ਪਾਂਡੇ" },
  shukla: { hi: "शुक्ला", pa: "ਸ਼ੁਕਲਾ" },
  dubey: { hi: "दुबे", pa: "ਦੂਬੇ" },
  chaudhary: { hi: "चौधरी", pa: "ਚੌਧਰੀ" },
  choudhary: { hi: "चौधरी", pa: "ਚੌਧਰੀ" },
  yadav: { hi: "यादव", pa: "ਯਾਦਵ" },
  patel: { hi: "पटेल", pa: "ਪਟੇਲ" },
  shah: { hi: "शाह", pa: "ਸ਼ਾਹ" },
  rajput: { hi: "राजपूत", pa: "ਰਾਜਪੂਤ" },
  rana: { hi: "राणा", pa: "ਰਾਣਾ" },
  thakur: { hi: "ठाकुर", pa: "ਠਾਕੁਰ" },
  chauhan: { hi: "चौहान", pa: "ਚੌਹਾਨ" },
  rathore: { hi: "राठौड़", pa: "ਰਾਠੌਰ" },
  khan: { hi: "खान", pa: "ਖਾਨ" },
  ali: { hi: "अली", pa: "ਅਲੀ" },
  ahmed: { hi: "अहमद", pa: "ਅਹਿਮਦ" },
  ansari: { hi: "अंसारी", pa: "ਅੰਸਾਰੀ" },
  malik: { hi: "मलिक", pa: "ਮਲਿਕ" },
  sheikh: { hi: "शेख", pa: "ਸ਼ੇਖ" },
  mohammad: { hi: "मोहम्मद", pa: "ਮੁਹੰਮਦ" },
  mohammed: { hi: "मोहम्मद", pa: "ਮੁਹੰਮਦ" },

  // --- Common Indian First Names (Punjabi / Hindi) ---
  rahul: { hi: "राहुल", pa: "ਰਾਹੁਲ" },
  rohit: { hi: "रोहित", pa: "ਰੋਹਿਤ" },
  mohit: { hi: "मोहित", pa: "ਮੋਹਿਤ" },
  amit: { hi: "अमित", pa: "ਅਮਿਤ" },
  sumit: { hi: "सुमित", pa: "ਸੁਮਿਤ" },
  aman: { hi: "अमन", pa: "ਅਮਨ" },
  raman: { hi: "रमन", pa: "ਰਮਨ" },
  chaman: { hi: "चमन", pa: "ਚਮਨ" },
  gagan: { hi: "गगन", pa: "ਗਗਨ" },
  karan: { hi: "करण", pa: "ਕਰਨ" },
  arjun: { hi: "अर्जुन", pa: "ਅਰਜੁਨ" },
  varun: { hi: "वरुण", pa: "ਵਰੁਣ" },
  tarun: { hi: "तरुण", pa: "ਤਰੁਣ" },
  ankit: { hi: "अंकित", pa: "ਅੰਕਿਤ" },
  vikas: { hi: "विकास", pa: "ਵਿਕਾਸ" },
  vishal: { hi: "विशाल", pa: "ਵਿਸ਼ਾਲ" },
  vivek: { hi: "विवेक", pa: "ਵਿਵੇਕ" },
  vinod: { hi: "विनोद", pa: "ਵਿਨੋਦ" },
  vijay: { hi: "विजय", pa: "ਵਿਜੇ" },
  ajay: { hi: "अजय", pa: "ਅਜੇ" },
  sanjay: { hi: "संजय", pa: "ਸੰਜੇ" },
  sandeep: { hi: "संदीप", pa: "ਸੰਦੀਪ" },
  kuldeep: { hi: "कुलदीप", pa: "ਕੁਲਦੀਪ" },
  mandeep: { hi: "मनदीप", pa: "ਮਨਦੀਪ" },
  amandeep: { hi: "अमनदीप", pa: "ਅਮਨਦੀਪ" },
  gagandeep: { hi: "गगनदीप", pa: "ਗਗਨਦੀਪ" },
  ramandeep: { hi: "रमनदीप", pa: "ਰਮਨਦੀਪ" },
  pawandeep: { hi: "पवनदीप", pa: "ਪਵਨਦੀਪ" },
  hardeep: { hi: "हरदीप", pa: "ਹਰਦੀਪ" },
  navdeep: { hi: "नवदीप", pa: "ਨਵਦੀਪ" },
  pradeep: { hi: "प्रदीप", pa: "ਪ੍ਰਦੀਪ" },
  deepak: { hi: "दीपक", pa: "ਦੀਪਕ" },
  harpreet: { hi: "हरप्रीत", pa: "ਹਰਪ੍ਰੀਤ" },
  gurpreet: { hi: "गुरप्रीत", pa: "ਗੁਰਪ੍ਰੀਤ" },
  manpreet: { hi: "मनप्रीत", pa: "ਮਨਪ੍ਰੀਤ" },
  jaspreet: { hi: "जसप्रीत", pa: "ਜਸਪ੍ਰੀਤ" },
  lovepreet: { hi: "लवप्रीत", pa: "ਲਵਪ੍ਰੀਤ" },
  dilpreet: { hi: "दिलप्रीत", pa: "ਦਿਲਪ੍ਰੀਤ" },
  navpreet: { hi: "नवप्रीत", pa: "ਨਵਪ੍ਰੀਤ" },
  inderpreet: { hi: "इंदरप्रीत", pa: "ਇੰਦਰਪ੍ਰੀਤ" },
  simran: { hi: "सिमरन", pa: "ਸਿਮਰਨ" },
  simranjit: { hi: "सिमरनजीत", pa: "ਸਿਮਰਨਜੀਤ" },
  harjit: { hi: "हरजीत", pa: "ਹਰਜੀਤ" },
  gurjit: { hi: "गुरजीत", pa: "ਗੁਰਜੀਤ" },
  manjit: { hi: "मनजीत", pa: "ਮਨਜੀਤ" },
  jasjit: { hi: "जसजीत", pa: "ਜਸਜੀਤ" },
  baljit: { hi: "बलजीत", pa: "ਬਲਜੀਤ" },
  daljit: { hi: "दलजीत", pa: "ਦਲਜੀਤ" },
  diljit: { hi: "दिलजीत", pa: "ਦਿਲਜੀਤ" },
  paramjit: { hi: "परमजीत", pa: "ਪਰਮਜੀਤ" },
  charanjit: { hi: "चरणजीत", pa: "ਚਰਨਜੀਤ" },
  sarabjit: { hi: "सरबजीत", pa: "ਸਰਬਜੀਤ" },
  amarjit: { hi: "अमरजीत", pa: "ਅਮਰਜੀਤ" },
  inderjit: { hi: "इंदरजीत", pa: "ਇੰਦਰਜੀਤ" },
  ranjit: { hi: "रणजीत", pa: "ਰਣਜੀਤ" },
  surjit: { hi: "सुरजीत", pa: "ਸੁਰਜੀਤ" },
  kuljit: { hi: "कुलजीत", pa: "ਕੁਲਜੀਤ" },
  navjot: { hi: "नवजोत", pa: "ਨਵਜੋਤ" },
  harjot: { hi: "हरजोत", pa: "ਹਰਜੋਤ" },
  gurjot: { hi: "गुरजोत", pa: "ਗੁਰਜੋਤ" },
  manjot: { hi: "मनजोत", pa: "ਮਨਜੋਤ" },
  prabhjot: { hi: "प्रभजोत", pa: "ਪ੍ਰਭਜੋਤ" },
  sukhwinder: { hi: "सुखविंदर", pa: "ਸੁਖਵਿੰਦਰ" },
  gurwinder: { hi: "गुरविंदर", pa: "ਗੁਰਵਿੰਦਰ" },
  harwinder: { hi: "हरविंदर", pa: "ਹਰਵਿੰਦਰ" },
  kulwinder: { hi: "कुलविंदर", pa: "ਕੁਲਵਿੰਦਰ" },
  balwinder: { hi: "बलविंदर", pa: "ਬਲਵਿੰਦਰ" },
  palwinder: { hi: "पलविंदर", pa: "ਪਲਵਿੰਦਰ" },
  jaswinder: { hi: "जसविंदर", pa: "ਜਸਵਿੰਦਰ" },
  rajwinder: { hi: "राजविंदर", pa: "ਰਾਜਵਿੰਦਰ" },
  manwinder: { hi: "मनविंदर", pa: "ਮਨਵਿੰਦਰ" },
  talwinder: { hi: "तलविंदर", pa: "ਤਲਵਿੰਦਰ" },
  lakhwinder: { hi: "लखविंदर", pa: "ਲਖਵਿੰਦਰ" },
  davinder: { hi: "दविंदर", pa: "ਦਵਿੰਦਰ" },
  ravinder: { hi: "रविंदर", pa: "ਰਵਿੰਦਰ" },
  surinder: { hi: "सुरिंदर", pa: "ਸੁਰਿੰਦਰ" },
  narinder: { hi: "नरिंदर", pa: "ਨਰਿੰਦਰ" },
  varinder: { hi: "वरिंदर", pa: "ਵਰਿੰਦਰ" },
  parminder: { hi: "परमिंदर", pa: "ਪਰਮਿੰਦਰ" },
  rupinder: { hi: "रुपिंदर", pa: "ਰੁਪਿੰਦਰ" },
  bhupinder: { hi: "भूपिंदर", pa: "ਭੁਪਿੰਦਰ" },
  joginder: { hi: "जोगिंदर", pa: "ਜੋਗਿੰਦਰ" },
  mohinder: { hi: "मोहिंदर", pa: "ਮਹਿੰਦਰ" },
  mahinder: { hi: "महिंदर", pa: "ਮਹਿੰਦਰ" },
  rajinder: { hi: "राजिंदर", pa: "ਰਜਿੰਦਰ" },
  harjinder: { hi: "हरजिंदर", pa: "ਹਰਜਿੰਦਰ" },
  gurjinder: { hi: "गुरजिंदर", pa: "ਗੁਰਜਿੰਦਰ" },
  baljinder: { hi: "बलजिंदर", pa: "ਬਲਜਿੰਦਰ" },
  manjinder: { hi: "मनजिंदर", pa: "ਮਨਜਿੰਦਰ" },
  satwinder: { hi: "सतविंदर", pa: "ਸਤਵਿੰਦਰ" },
  sukhdev: { hi: "सुखदेव", pa: "ਸੁਖਦੇਵ" },
  gurdev: { hi: "गुरदेव", pa: "ਗੁਰਦੇਵ" },
  baldev: { hi: "बलदेव", pa: "ਬਲਦੇਵ" },
  hardev: { hi: "हरदेव", pa: "ਹਰਦੇਵ" },
  jaydev: { hi: "जयदेव", pa: "ਜੈਦੇਵ" },
  sukhbir: { hi: "सुखबीर", pa: "ਸੁਖਬੀਰ" },
  jasbir: { hi: "जसबीर", pa: "ਜਸਬੀਰ" },
  harbir: { hi: "हरबीर", pa: "ਹਰਬੀਰ" },
  ranbir: { hi: "रणबीर", pa: "ਰਣਬੀਰ" },
  karamjit: { hi: "करमजीत", pa: "ਕਰਮਜੀਤ" },
  bikram: { hi: "बिक्रम", pa: "ਬਿਕਰਮ" },
  vikram: { hi: "विक्रम", pa: "ਵਿਕਰਮ" },
  gurnam: { hi: "गुरनाम", pa: "ਗੁਰਨਾਮ" },
  satnam: { hi: "सतनाम", pa: "ਸਤਨਾਮ" },
  avtar: { hi: "अवतार", pa: "ਅਵਤਾਰ" },
  balkar: { hi: "बलकार", pa: "ਬਲਕਾਰ" },
  jagtar: { hi: "जगतार", pa: "ਜਗਤਾਰ" },
  kartar: { hi: "करतार", pa: "ਕਰਤਾਰ" },
  gulzar: { hi: "गुलज़ार", pa: "ਗੁਲਜ਼ਾਰ" },
  didar: { hi: "दीदार", pa: "ਦੀਦਾਰ" },
  jujhar: { hi: "जुझार", pa: "ਜੁਝਾਰ" },
  onkar: { hi: "ओंकार", pa: "ਓਂਕਾਰ" },
  sansar: { hi: "संसार", pa: "ਸੰਸਾਰ" },
  gurbachan: { hi: "गुरबचन", pa: "ਗੁਰਬਚਨ" },
  harbachan: { hi: "हरबचन", pa: "ਹਰਬਚਨ" },
  gurmail: { hi: "गुरमेल", pa: "ਗੁਰਮੇਲ" },
  jarnail: { hi: "जरनैल", pa: "ਜਰਨੈਲ" },
  karnail: { hi: "करनैल", pa: "ਕਰਨੈਲ" },
  shamsher: { hi: "शमशेर", pa: "ਸ਼ਮਸ਼ੇਰ" },
  dilbagh: { hi: "दिलबाग़", pa: "ਦਿਲਬਾਗ" },
  gurतेज: { hi: "गुरतेज", pa: "ਗੁਰਤੇਜ" },
  gurtej: { hi: "गुरतेज", pa: "ਗੁਰਤੇਜ" },
  hartej: { hi: "हरतेज", pa: "ਹਰਤੇਜ" },
  sukhchain: { hi: "सुखचैन", pa: "ਸੁਖਚੈਨ" },
  sukhpal: { hi: "सुखपाल", pa: "ਸੁਖਪਾਲ" },
  gurpal: { hi: "गुरपाल", pa: "ਗੁਰਪਾਲ" },
  harpal: { hi: "हरपाल", pa: "ਹਰਪਾਲ" },
  jaspal: { hi: "जसपाल", pa: "ਜਸਪਾਲ" },
  satpal: { hi: "सतपाल", pa: "ਸਤਪਾਲ" },
  yashpal: { hi: "यशपाल", pa: "ਯਸ਼ਪਾਲ" },
  rajpal: { hi: "राजपाल", pa: "ਰਾਜਪਾਲ" },
  pritpal: { hi: "प्रीतपाल", pa: "ਪ੍ਰੀਤਪਾਲ" },
  amritpal: { hi: "अमृतपाल", pa: "ਅੰਮ੍ਰਿਤਪਾਲ" },
  amrit: { hi: "अमृत", pa: "ਅੰਮ੍ਰਿਤ" },
  anmol: { hi: "अनमोल", pa: "ਅਨਮੋਲ" },
  akash: { hi: "आकाश", pa: "ਆਕਾਸ਼" },
  ashok: { hi: "अशोक", pa: "ਅਸ਼ੋਕ" },
  anil: { hi: "अनिल", pa: "ਅਨਿਲ" },
  sunil: { hi: "सुनील", pa: "ਸੁਨੀਲ" },
  kapil: { hi: "कपिल", pa: "ਕਪਿਲ" },
  sahil: { hi: "साहिल", pa: "ਸਾਹਿਲ" },
  nikhil: { hi: "निखिल", pa: "ਨਿਖਿਲ" },
  akhil: { hi: "अखिल", pa: "ਅਖਿਲ" },
  ramesh: { hi: "रमेश", pa: "ਰਮੇਸ਼" },
  suresh: { hi: "सुरेश", pa: "ਸੁਰੇਸ਼" },
  mahesh: { hi: "महेश", pa: "ਮਹੇਸ਼" },
  mukesh: { hi: "मुकेश", pa: "ਮੁਕੇਸ਼" },
  rakesh: { hi: "राकेश", pa: "ਰਾਕੇਸ਼" },
  rajesh: { hi: "राजेश", pa: "ਰਾਜੇਸ਼" },
  dinesh: { hi: "दिनेश", pa: "ਦਿਨੇਸ਼" },
  ganesh: { hi: "गणेश", pa: "ਗਣੇਸ਼" },
  naresh: { hi: "नरेश", pa: "ਨਰੇਸ਼" },
  yogesh: { hi: "योगेश", pa: "ਯੋਗੇਸ਼" },
  umesh: { hi: "उमेश", pa: "ਉਮੇਸ਼" },
  hitesh: { hi: "हितेश", pa: "ਹਿਤੇਸ਼" },
  jignesh: { hi: "जिग्नेश", pa: "ਜਿਗਨੇਸ਼" },
  lokesh: { hi: "लोकेश", pa: "ਲੋਕੇਸ਼" },
  brijesh: { hi: "बृजेश", pa: "ਬ੍ਰਿਜੇਸ਼" },
  raj: { hi: "राज", pa: "ਰਾਜ" },
  raju: { hi: "राजू", pa: "ਰਾਜੂ" },
  rajan: { hi: "राजन", pa: "ਰਾਜਨ" },
  rajeev: { hi: "राजीव", pa: "ਰਾਜੀਵ" },
  rajiv: { hi: "राजीव", pa: "ਰਾਜੀਵ" },
  sanjeev: { hi: "संजीव", pa: "ਸੰਜੀਵ" },
  sanjiv: { hi: "संजीव", pa: "ਸੰਜੀਵ" },
  manoj: { hi: "मनोज", pa: "ਮਨੋਜ" },
  saroj: { hi: "सरोज", pa: "ਸਰੋਜ" },
  anoop: { hi: "अनूप", pa: "ਅਨੂਪ" },
  anup: { hi: "अनूप", pa: "ਅਨੂਪ" },
  roop: { hi: "रूप", pa: "ਰੂਪ" },
  swaroop: { hi: "स्वरूप", pa: "ਸਵਰੂਪ" },
  pawan: { hi: "पवन", pa: "ਪਵਨ" },
  shrawan: { hi: "श्रवण", pa: "ਸ਼੍ਰਵਣ" },
  sawan: { hi: "सावन", pa: "ਸਾਵਣ" },
  naman: { hi: "नमन", pa: "ਨਮਨ" },
  gaurav: { hi: "गौरव", pa: "ਗੌਰਵ" },
  saurabh: { hi: "सौरभ", pa: "ਸੌਰਭ" },
  saurav: { hi: "सौरव", pa: "ਸੌਰਵ" },
  vaibhav: { hi: "वैभव", pa: "ਵੈਭਵ" },
  raghav: { hi: "राघव", pa: "ਰਾਘਵ" },
  madhav: { hi: "माधव", pa: "ਮਾਧਵ" },
  keshav: { hi: "केशव", pa: "ਕੇਸ਼ਵ" },
  pranav: { hi: "प्रणव", pa: "ਪ੍ਰਣਵ" },
  abhinav: { hi: "अभिनव", pa: "ਅਭਿਨਵ" },
  abhishek: { hi: "अभिषेक", pa: "ਅਭਿਸ਼ੇਕ" },
  aditya: { hi: "आदित्य", pa: "ਆਦਿੱਤਿਆ" },
  aryan: { hi: "आर्यन", pa: "ਆਰੀਅਨ" },
  ayush: { hi: "आयुष", pa: "ਆਯੂਸ਼" },
  piyush: { hi: "पीयूष", pa: "ਪੀਯੂਸ਼" },
  ankush: { hi: "अंकुश", pa: "ਅੰਕੁਸ਼" },
  lovekesh: { hi: "लवकेश", pa: "ਲਵਕੇਸ਼" },
  neeraj: { hi: "नीरज", pa: "ਨੀਰਜ" },
  pankaj: { hi: "पंकज", pa: "ਪੰਕਜ" },
  suraj: { hi: "सूरज", pa: "ਸੂਰਜ" },
  dheeraj: { hi: "धीरज", pa: "ਧੀਰਜ" },
  raviraj: { hi: "रविराज", pa: "ਰਵੀਰਾਜ" },
  yuvraj: { hi: "युवराज", pa: "ਯੁਵਰਾਜ" },
  jasराज: { hi: "जसराज", pa: "ਜਸਰਾਜ" },
  jasraj: { hi: "जसराज", pa: "ਜਸਰਾਜ" },
  balraj: { hi: "बलराज", pa: "ਬਲਰਾਜ" },
  hansraj: { hi: "हंसराज", pa: "ਹੰਸਰਾਜ" },
  desraj: { hi: "देसराज", pa: "ਦੇਸਰਾਜ" },
  tilak: { hi: "तिलक", pa: "ਤਿਲਕ" },
  subhash: { hi: "सुभाष", pa: "ਸੁਭਾਸ਼" },
  prakash: { hi: "प्रकाश", pa: "ਪ੍ਰਕਾਸ਼" },
  om: { hi: "ओम", pa: "ਓਮ" },
  jai: { hi: "जय", pa: "ਜੈ" },
  prem: { hi: "प्रेम", pa: "ਪ੍ਰੇਮ" },
  ram: { hi: "राम", pa: "ਰਾਮ" },
  shyam: { hi: "श्याम", pa: "ਸ਼ਿਆਮ" },
  krishan: { hi: "कृष्ण", pa: "ਕ੍ਰਿਸ਼ਨ" },
  krishna: { hi: "कृष्णा", pa: "ਕ੍ਰਿਸ਼ਨਾ" },
  gobind: { hi: "गोबिंद", pa: "ਗੋਬਿੰਦ" },
  govind: { hi: "गोविंद", pa: "ਗੋਵਿੰਦ" },
  gopal: { hi: "गोपाल", pa: "ਗੋਪਾਲ" },
  mohan: { hi: "मोहन", pa: "ਮੋਹਨ" },
  sohan: { hi: "सोहन", pa: "ਸੋਹਨ" },
  rohan: { hi: "रोहन", pa: "ਰੋਹਨ" },
  lal: { hi: "लाल", pa: "ਲਾਲ" },
  chand: { hi: "चंद", pa: "ਚੰਦ" },
  chander: { hi: "चंदर", pa: "ਚੰਦਰ" },
  nath: { hi: "नाथ", pa: "ਨਾਥ" },
  das: { hi: "दास", pa: "ਦਾਸ" },
  dass: { hi: "दास", pa: "ਦਾਸ" },
  parkash: { hi: "प्रकाश", pa: "ਪ੍ਰਕਾਸ਼" },
  kewal: { hi: "केवल", pa: "ਕੇਵਲ" },
  kiran: { hi: "किरण", pa: "ਕਿਰਨ" },
  pooja: { hi: "पूजा", pa: "ਪੂਜਾ" },
  neha: { hi: "नेहा", pa: "ਨੇਹਾ" },
  sneha: { hi: "स्नेहा", pa: "ਸਨੇਹਾ" },
  rekha: { hi: "रेखा", pa: "ਰੇਖਾ" },
  sunita: { hi: "सुनीता", pa: "ਸੁਨੀਤਾ" },
  anita: { hi: "अनीता", pa: "ਅਨੀਤਾ" },
  kavita: { hi: "कविता", pa: "ਕਵਿਤਾ" },
  savita: { hi: "सविता", pa: "ਸਵਿਤਾ" },
  mamta: { hi: "ममता", pa: "ਮਮਤਾ" },
  geeta: { hi: "गीता", pa: "ਗੀਤਾ" },
  seema: { hi: "सीमा", pa: "ਸੀਮਾ" },
  reema: { hi: "रीमा", pa: "ਰੀਮਾ" },
  meena: { hi: "मीना", pa: "ਮੀਨਾ" },
  veena: { hi: "वीणा", pa: "ਵੀਨਾ" },
  asha: { hi: "आशा", pa: "ਆਸ਼ਾ" },
  usha: { hi: "उषा", pa: "ਊਸ਼ਾ" },
  nisha: { hi: "निशा", pa: "ਨਿਸ਼ਾ" },
  disha: { hi: "दिशा", pa: "ਦਿਸ਼ਾ" },
  manisha: { hi: "मनीषा", pa: "ਮਨੀਸ਼ਾ" },
  priya: { hi: "प्रिया", pa: "ਪ੍ਰਿਆ" },
  supriya: { hi: "सुप्रिया", pa: "ਸੁਪ੍ਰਿਆ" },
  riya: { hi: "रिया", pa: "ਰਿਆ" },
  sonia: { hi: "सोनिया", pa: "ਸੋਨੀਆ" },
  tania: { hi: "तानिया", pa: "ਤਾਨੀਆ" },
  suman: { hi: "सुमन", pa: "ਸੁਮਨ" },
  kusum: { hi: "कुसुम", pa: "ਕੁਸੁਮ" },
  poonam: { hi: "पूनम", pa: "ਪੂਨਮ" },
  neelam: { hi: "नीलम", pa: "ਨੀਲਮ" },
  sonam: { hi: "सोनम", pa: "ਸੋਨਮ" },
  shabnam: { hi: "शबनम", pa: "ਸ਼ਬਨਮ" },
  jyoti: { hi: "ज्योति", pa: "ਜੋਤੀ" },
  arti: { hi: "आरती", pa: "ਆਰਤੀ" },
  aarti: { hi: "आरती", pa: "ਆਰਤੀ" },
  bharti: { hi: "भारती", pa: "ਭਾਰਤੀ" },
  preeti: { hi: "प्रीति", pa: "ਪ੍ਰੀਤੀ" },
  swati: { hi: "स्वाति", pa: "ਸਵਾਤੀ" },
  kruti: { hi: "कृति", pa: "ਕ੍ਰਿਤੀ" },
  shruti: { hi: "श्रुति", pa: "ਸ਼ਰੂਤੀ" },
  anjali: { hi: "अंजलि", pa: "ਅੰਜਲੀ" },
  sonali: { hi: "सोनाली", pa: "ਸੋਨਾਲੀ" },
  rupali: { hi: "रुपाली", pa: "ਰੁਪਾਲੀ" },
  deepali: { hi: "दीपाली", pa: "ਦੀਪਾਲੀ" },
  shefali: { hi: "शेफाली", pa: "ਸ਼ੇਫਾਲੀ" },
  komal: { hi: "कोमल", pa: "ਕੋਮਲ" },
  kajal: { hi: "काजल", pa: "ਕਾਜਲ" },
  anchal: { hi: "आंचल", pa: "ਆਂਚਲ" },
  sheetal: { hi: "शीतल", pa: "ਸ਼ੀਤਲ" },
  palak: { hi: "पलक", pa: "ਪਲਕ" },
  mahak: { hi: "महक", pa: "ਮਹਿਕ" },
  mehak: { hi: "महक", pa: "ਮਹਿਕ" },
  muskan: { hi: "मुस्कान", pa: "ਮੁਸਕਾਨ" },
  harleen: { hi: "हरलीन", pa: "ਹਰਲੀਨ" },
  gurleen: { hi: "गुरलीन", pa: "ਗੁਰਲੀन" },
  jasleen: { hi: "जसलीन", pa: "ਜਸਲੀन" },
  manleen: { hi: "मनलीन", pa: "ਮਨਲੀन" },
  navleen: { hi: "नवलीन", pa: "ਨਵਲੀन" },
  prabhleen: { hi: "प्रभलीन", pa: "ਪ੍ਰਭਲੀਨ" },
  avneet: { hi: "अवनीत", pa: "ਅਵਨੀਤ" },
  navneet: { hi: "नवनीत", pa: "ਨਵਨੀਤ" },
  parneet: { hi: "परनीत", pa: "ਪਰਨੀਤ" },
  ravneet: { hi: "रवनीत", pa: "ਰਵਨੀਤ" },
  gurneet: { hi: "गुरनीत", pa: "ਗੁਰਨੀਤ" },
  nimrat: { hi: "निमरत", pa: "ਨਿਮਰਤ" },
  keerat: { hi: "कीरत", pa: "ਕੀਰਤ" },
  seerat: { hi: "सीरत", pa: "ਸੀਰਤ" },
  mannat: { hi: "मन्नत", pa: "ਮੰਨਤ" },
  jannat: { hi: "जन्नत", pa: "ਜੰਨਤ" },
  khushi: { hi: "खुशी", pa: "ਖੁਸ਼ੀ" },
  sakshi: { hi: "साक्षी", pa: "ਸਾਕਸ਼ੀ" },
  rakhi: { hi: "राखी", pa: "ਰਾਖੀ" },
  ritu: { hi: "ऋतु", pa: "ਰਿਤੂ" },
  neetu: { hi: "नीतू", pa: "ਨੀਤੂ" },
  meenu: { hi: "मीनू", pa: "ਮੀਨੂੰ" },
  renu: { hi: "रेणु", pa: "ਰੇਨੂੰ" },
  annu: { hi: "अन्नू", pa: "ਅੰਨੂ" },
  tanu: { hi: "तनु", pa: "ਤਨੂੰ" },
  manu: { hi: "मनु", pa: "ਮਨੂੰ" },
  sonu: { hi: "सोनू", pa: "ਸੋਨੂੰ" },
  monu: { hi: "मोनू", pa: "ਮੋਨੂੰ" },
  rinku: { hi: "रिंकू", pa: "ਰਿੰਕੂ" },
  tinku: { hi: "टिंकू", pa: "ਟਿੰਕੂ" },
  bittu: { hi: "बिट्टू", pa: "ਬਿੱਟੂ" },
  pappu: { hi: "पप्पू", pa: "ਪੱਪੂ" },
  babbu: { hi: "बब्बू", pa: "ਬੱਬੂ" },
  happy: { hi: "हैप्पी", pa: "ਹੈਪੀ" },
  lucky: { hi: "लकी", pa: "ਲੱਕੀ" },
  sunny: { hi: "सनी", pa: "ਸੰਨੀ" },
  bunny: { hi: "बनी", pa: "ਬੰਨੀ" },
  honey: { hi: "हनी", pa: "ਹਨੀ" },
  money: { hi: "मनी", pa: "ਮਨੀ" },
  goldy: { hi: "गोल्डी", pa: "ਗੋਲਡੀ" },
  monty: { hi: "मोंटी", pa: "ਮੋਂਟੀ" },
  bunty: { hi: "बंटी", pa: "ਬੰਟੀ" },
  shanty: { hi: "शैंटी", pa: "ਸ਼ੈਂਟੀ" },
  prince: { hi: "प्रिंस", pa: "ਪ੍ਰਿੰਸ" },
  king: { hi: "किंग", pa: "ਕਿੰਗ" },
  rocky: { hi: "रॉकी", pa: "ਰੌਕੀ" },
  vicky: { hi: "विक्की", pa: "ਵਿੱਕੀ" },
  ricky: { hi: "रिक्की", pa: "ਰਿੱਕੀ" },
  micky: { hi: "मिक्की", pa: "ਮਿੱਕੀ" },
  dimple: { hi: "डिंपल", pa: "ਡਿੰਪਲ" },
  twinkle: { hi: "ट्विंकल", pa: "ਟਵਿੰਕਲ" },
  pinky: { hi: "पिंकी", pa: "ਪਿੰਕੀ" },
  sweety: { hi: "स्वीटी", pa: "ਸਵੀਟੀ" },
  beauty: { hi: "ब्यूटी", pa: "ਬਿਊਟੀ" },
  lovely: { hi: "लवली", pa: "ਲਵਲੀ" },
  baby: { hi: "बेबी", pa: "ਬੇਬੀ" },
  bholi: { hi: "भोली", pa: "ਭੋਲੀ" },
  bhola: { hi: "भोला", pa: "ਭੋਲਾ" },
  kala: { hi: "काला", pa: "ਕਾਲਾ" },
  gaggi: { hi: "गग्गी", pa: "ਗੱਗੀ" },
  jaggi: { hi: "जग्गी", pa: "ਜੱਗੀ" },
  laddi: { hi: "लाडी", pa: "ਲਾਡੀ" },
  kaka: { hi: "काका", pa: "ਕਾਕਾ" },
  nikka: { hi: "निक्का", pa: "ਨਿੱਕਾ" },
  manga: { hi: "मंगा", pa: "ਮੰਗਾ" },
  billa: { hi: "बिल्ला", pa: "ਬਿੱਲਾ" },
  binda: { hi: "बिंदा", pa: "ਬਿੰਦਾ" },
  shinda: { hi: "शिंदा", pa: "ਸ਼ਿੰਦਾ" },
  chhinda: { hi: "छिंदा", pa: "ਛਿੰਦਾ" },
  pamma: { hi: "पम्मा", pa: "ਪੰਮਾ" },
  jeeta: { hi: "जीता", pa: "ਜੀਤਾ" },
  meeta: { hi: "मीता", pa: "ਮੀਤਾ" },
  seeta: { hi: "सीता", pa: "ਸੀਤਾ" },
  sita: { hi: "सीता", pa: "ਸੀਤਾ" },
  radha: { hi: "राधा", pa: "ਰਾਧਾ" },
  laxmi: { hi: "लक्ष्मी", pa: "ਲਕਸ਼ਮੀ" },
  lakshmi: { hi: "लक्ष्मी", pa: "ਲਕਸ਼ਮੀ" },
  sarojini: { hi: "सरोजिनी", pa: "ਸਰੋਜਨੀ" },
  kamla: { hi: "कमला", pa: "ਕਮਲਾ" },
  vimla: { hi: "विमला", pa: "ਵਿਮਲਾ" },
  shakuntla: { hi: "शकुंतला", pa: "ਸ਼ਕੁੰਤਲਾ" },
  pushpa: { hi: "पुष्पा", pa: "ਪੁਸ਼ਪਾ" },
  champa: { hi: "चंपा", pa: "ਚੰਪਾ" },
  shanti: { hi: "शांति", pa: "ਸ਼ਾਂਤੀ" },
  kanti: { hi: "कांति", pa: "ਕਾਂਤੀ" },
  basanti: { hi: "बसंती", pa: "ਬਸੰਤੀ" },
  manorama: { hi: "मनोरमा", pa: "ਮਨੋਰਮਾ" },
  sudha: { hi: "सुधा", pa: "ਸੁਧਾ" },
};

// ============================================================================
// PHONETIC SYLLABIC TRANSLITERATOR (FALLBACK FOR UNMAPPED PROPER NOUNS)
// ============================================================================

interface ConsonantRule {
  roman: string;
  hi: string;
  pa: string;
  isNasal?: boolean;
}

const CONSONANT_RULES: ConsonantRule[] = [
  { roman: "ksh", hi: "क्ष", pa: "ਕਸ਼" },
  { roman: "shr", hi: "श्र", pa: "ਸ਼੍ਰ" },
  { roman: "chh", hi: "छ", pa: "ਛ" },
  { roman: "kh", hi: "ख", pa: "ਖ" },
  { roman: "gh", hi: "घ", pa: "ਘ" },
  { roman: "ch", hi: "च", pa: "ਚ" },
  { roman: "jh", hi: "झ", pa: "ਝ" },
  { roman: "th", hi: "थ", pa: "ਥ" },
  { roman: "dh", hi: "ध", pa: "ਧ" },
  { roman: "ph", hi: "फ", pa: "ਫ" },
  { roman: "bh", hi: "भ", pa: "ਭ" },
  { roman: "sh", hi: "श", pa: "ਸ਼" },
  { roman: "ck", hi: "क", pa: "ਕ" },
  { roman: "qu", hi: "क्व", pa: "ਕਵ" },
  { roman: "ng", hi: "ंग", pa: "ੰਗ" },
  { roman: "tr", hi: "त्र", pa: "ਤ੍ਰ" },
  { roman: "gy", hi: "ज्ञ", pa: "ਗਿਆ" },
  { roman: "k", hi: "क", pa: "ਕ" },
  { roman: "g", hi: "ग", pa: "ਗ" },
  { roman: "c", hi: "क", pa: "ਕ" },
  { roman: "j", hi: "ज", pa: "ਜ" },
  { roman: "t", hi: "ट", pa: "ਟ" },
  { roman: "d", hi: "ड", pa: "ਡ" },
  { roman: "n", hi: "न", pa: "ਨ", isNasal: true },
  { roman: "p", hi: "प", pa: "ਪ" },
  { roman: "f", hi: "फ", pa: "ਫ" },
  { roman: "b", hi: "ब", pa: "ਬ" },
  { roman: "m", hi: "म", pa: "ਮ", isNasal: true },
  { roman: "y", hi: "य", pa: "ਯ" },
  { roman: "r", hi: "र", pa: "ਰ" },
  { roman: "l", hi: "ल", pa: "ਲ" },
  { roman: "v", hi: "व", pa: "ਵ" },
  { roman: "w", hi: "व", pa: "ਵ" },
  { roman: "s", hi: "स", pa: "ਸ" },
  { roman: "z", hi: "ज़", pa: "ਜ਼" },
  { roman: "h", hi: "ह", pa: "ਹ" },
  { roman: "q", hi: "क़", pa: "ਕ਼" },
  { roman: "x", hi: "क्स", pa: "ਕਸ" },
];

interface VowelRule {
  roman: string;
  indepHi: string;
  indepPa: string;
  matraHi: string;
  matraPa: string;
}

const VOWEL_RULES: VowelRule[] = [
  { roman: "aa", indepHi: "आ", indepPa: "ਆ", matraHi: "ा", matraPa: "ਾ" },
  { roman: "ee", indepHi: "ई", indepPa: "ਈ", matraHi: "ी", matraPa: "ੀ" },
  { roman: "oo", indepHi: "ऊ", indepPa: "ਊ", matraHi: "ू", matraPa: "ੂ" },
  { roman: "ai", indepHi: "ऐ", indepPa: "ਐ", matraHi: "ै", matraPa: "ੈ" },
  { roman: "au", indepHi: "औ", indepPa: "ਔ", matraHi: "ौ", matraPa: "ੌ" },
  { roman: "ou", indepHi: "औ", indepPa: "ਔ", matraHi: "ौ", matraPa: "ੌ" },
  { roman: "ei", indepHi: "ए", indepPa: "ਏ", matraHi: "े", matraPa: "ੇ" },
  { roman: "a", indepHi: "अ", indepPa: "ਅ", matraHi: "", matraPa: "" },
  { roman: "i", indepHi: "इ", indepPa: "ਇ", matraHi: "ि", matraPa: "ਿ" },
  { roman: "e", indepHi: "ए", indepPa: "ਏ", matraHi: "े", matraPa: "ੇ" },
  { roman: "u", indepHi: "उ", indepPa: "ਉ", matraHi: "ु", matraPa: "ੁ" },
  { roman: "o", indepHi: "ओ", indepPa: "ਓ", matraHi: "ो", matraPa: "ੋ" },
];

/**
 * Phonetically transliterates a single English/Roman word into Hindi (Devanagari)
 * or Punjabi (Gurmukhi).
 */
const INDIAN_NAME_AND_PLACE_SUFFIXES: Array<{
  suffix: string;
  hi: string;
  pa: string;
}> = [
  { suffix: "winder", hi: "विंदर", pa: "ਵਿੰਦਰ" },
  { suffix: "jinder", hi: "जिंदर", pa: "ਜਿੰਦਰ" },
  { suffix: "inder", hi: "इंदर", pa: "ਇੰਦਰ" },
  { suffix: "preet", hi: "प्रीत", pa: "ਪ੍ਰੀਤ" },
  { suffix: "deep", hi: "दीप", pa: "ਦੀਪ" },
  { suffix: "jeet", hi: "जीत", pa: "ਜੀਤ" },
  { suffix: "jit", hi: "जीत", pa: "ਜੀਤ" },
  { suffix: "veer", hi: "वीर", pa: "ਵੀਰ" },
  { suffix: "vir", hi: "वीर", pa: "ਵੀਰ" },
  { suffix: "beer", hi: "बीर", pa: "ਬੀਰ" },
  { suffix: "bir", hi: "बीर", pa: "ਬੀਰ" },
  { suffix: "leen", hi: "लीन", pa: "ਲੀਨ" },
  { suffix: "neet", hi: "नीत", pa: "ਨੀਤ" },
  { suffix: "garh", hi: "गढ़", pa: "ਗੜ੍ਹ" },
  { suffix: "nagar", hi: "नगर", pa: "ਨਗਰ" },
  { suffix: "pura", hi: "पुरा", pa: "ਪੁਰਾ" },
  { suffix: "pur", hi: "पुर", pa: "ਪੁਰ" },
  { suffix: "wala", hi: "वाला", pa: "ਵਾਲਾ" },
  { suffix: "wali", hi: "वाली", pa: "ਵਾਲੀ" },
  { suffix: "kot", hi: "कोट", pa: "ਕੋਟ" },
  { suffix: "pal", hi: "पाल", pa: "ਪਾਲ" },
  { suffix: "raj", hi: "राज", pa: "ਰਾਜ" },
  { suffix: "dev", hi: "देव", pa: "ਦੇਵ" },
  { suffix: "jot", hi: "जोत", pa: "ਜੋਤ" },
];

/**
 * Phonetically transliterates a single English/Roman word into Hindi (Devanagari)
 * or Punjabi (Gurmukhi).
 */
export function phoneticTransliterateWord(word: string, lang: "hi" | "pa"): string {
  const clean = word.toLowerCase().trim();
  if (!clean || !/^[a-z]+$/.test(clean)) {
    return word;
  }

  // 1. Check built-in dictionary first
  const dictMatch = NAME_AND_ADDRESS_WORD_DICTIONARY[clean];
  if (dictMatch) {
    return lang === "pa" ? dictMatch.pa : dictMatch.hi;
  }

  // 2. Check compound Indian name/place suffix (e.g., "Taranvir" -> "Taran" + "vir" -> "तरनवीर" / "ਤਰਨਵੀਰ")
  if (clean.length >= 5) {
    for (const item of INDIAN_NAME_AND_PLACE_SUFFIXES) {
      if (clean.endsWith(item.suffix) && clean.length > item.suffix.length + 1) {
        const prefix = clean.slice(0, clean.length - item.suffix.length);
        const translatedPrefix = phoneticTransliterateWord(prefix, lang);
        return translatedPrefix + (lang === "pa" ? item.pa : item.hi);
      }
    }
  }

  // 3. Algorithmic syllable-based transliteration
  let out = "";
  let idx = 0;
  let prevWasConsonant = false;

  while (idx < clean.length) {
    const remaining = clean.slice(idx);

    // Special case: 'y' at the very end of a multi-letter word acts as 'ee' (e.g. "Lucky" -> "लकी" / "ਲੱਕੀ", "City" -> "सिटी" / "ਸਿਟੀ")
    if (remaining === "y" && idx > 0) {
      out += lang === "pa" ? "ੀ" : "ी";
      prevWasConsonant = false;
      idx += 1;
      continue;
    }

    // Try matching a vowel
    const vowelMatch = VOWEL_RULES.find((v) => remaining.startsWith(v.roman));
    if (vowelMatch) {
      const isAtEnd = idx + vowelMatch.roman.length === clean.length;

      if (!prevWasConsonant) {
        // Independent vowel (at start of word or after another vowel)
        out += lang === "pa" ? vowelMatch.indepPa : vowelMatch.indepHi;
      } else {
        // Dependent vowel matra after a consonant
        if (vowelMatch.roman === "a" && isAtEnd && clean.length > 2) {
          // Final '-a' in Indian names/places (e.g. "Sharma", "Khanna", "Rana", "Samrala") has 'ा'/'ਾ' sound
          out += lang === "pa" ? "ਾ" : "ा";
        } else if (vowelMatch.roman === "i" && isAtEnd && clean.length > 2) {
          // Final '-i' in Indian names/places (e.g. "Mandi", "Kothi", "Basti") has 'ी'/'ੀ' sound
          out += lang === "pa" ? "ੀ" : "ी";
        } else {
          out += lang === "pa" ? vowelMatch.matraPa : vowelMatch.matraHi;
        }
      }
      prevWasConsonant = false;
      idx += vowelMatch.roman.length;
      continue;
    }

    // Try matching a consonant
    const consMatch = CONSONANT_RULES.find((c) => remaining.startsWith(c.roman));
    if (consMatch) {
      const nextIdx = idx + consMatch.roman.length;
      const nextRemaining = clean.slice(nextIdx);
      const nextIsVowel =
        VOWEL_RULES.some((v) => nextRemaining.startsWith(v.roman)) ||
        nextRemaining === "y";

      // Handle nasal ('n' or 'm') before a stop/plosive consonant ('k','g','c','j','t','d','p','b') -> Anusvara (ं) / Tippi (ੰ)
      const nextIsStopConsonant = /^[kgcjtdpb]/.test(nextRemaining);
      if (consMatch.isNasal && nextRemaining.length > 0 && !nextIsVowel && nextIsStopConsonant) {
        out += lang === "pa" ? "ੰ" : "ं";
        prevWasConsonant = false;
        idx += consMatch.roman.length;
        continue;
      }

      // If previous was also a consonant (consonant cluster)
      if (prevWasConsonant) {
        if (lang === "hi") {
          out += "्";
        } else if (lang === "pa" && consMatch.roman === "r") {
          // In Gurmukhi, 'r' after a consonant uses Pair-Rara (੍ਰ)
          out += "੍ਰ";
          prevWasConsonant = true;
          idx += consMatch.roman.length;
          continue;
        }
      }

      // Soft dental 't' / 'd' heuristics in Indian names (e.g. "preet", "jit", "inder", "dev", "deep")
      let consChar = lang === "pa" ? consMatch.pa : consMatch.hi;
      if (consMatch.roman === "t") {
        consChar = lang === "pa" ? "ਤ" : "त";
      } else if (consMatch.roman === "d") {
        consChar = lang === "pa" ? "ਦ" : "द";
      }

      out += consChar;
      prevWasConsonant = true;
      idx += consMatch.roman.length;
      continue;
    }

    // Fallback: advance 1 char
    out += clean[idx];
    prevWasConsonant = false;
    idx += 1;
  }

  return out || word;
}

/**
 * Checks whether a token looks like a system code, ID, phone, email, URL, or measurement unit
 * that should NOT be phonetically transliterated.
 */
function shouldPreserveTokenAsIs(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed) return true;

  // Preserve emails, URLs, handles
  if (trimmed.includes("@") || trimmed.includes("http") || trimmed.includes("www.")) {
    return true;
  }

  // Preserve system codes with digits & hyphens (e.g., CUST-001, ORD-1024, #104, GSTIN)
  if (/^[A-Z0-9]+-[A-Z0-9-]+$/i.test(trimmed)) {
    return true;
  }

  // Preserve pure numbers, phone numbers, prices, dates
  if (/^[₹$+\-\d.,/:()%#]+$/.test(trimmed)) {
    return true;
  }

  // Preserve short technical units if standalone
  const lower = trimmed.toLowerCase();
  if (["cm", "mm", "in", "kg", "gm", "id", "gst", "upi", "qr", "pdf", "am", "pm"].includes(lower)) {
    return true;
  }

  return false;
}

/**
 * Translates and/or phonetically transliterates any multi-word string
 * (such as Customer Names, Worker Names, Addresses, Landmarks, or Notes)
 * into Hindi (`hi`) or Punjabi (`pa`).
 *
 * Lookup Priority:
 * 1. `customWordLookup(phrase, lang)` from `workerWordMap.ts`
 * 2. Multi-word address phrases (`MULTI_WORD_ADDRESS_PHRASES`)
 * 3. Token-by-token lookup in `workerWordMap.ts` -> `NAME_AND_ADDRESS_WORD_DICTIONARY` -> `phoneticTransliterateWord`
 */
export function translateTextWithNamesAndAddresses(
  text: string,
  lang: "hi" | "pa",
  customWordLookup?: (word: string, lang: string) => string | null,
): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Skip if whole string is a code, email, URL, or pure number
  if (shouldPreserveTokenAsIs(trimmed)) {
    return text;
  }

  // 1. Check if whole string has a direct custom word mapping
  if (customWordLookup) {
    const exactMatch = customWordLookup(trimmed, lang);
    if (exactMatch) return exactMatch;
  }

  // 2. Replace known multi-word address phrases (case-insensitive)
  let workingText = text;
  for (const [phrase, translation] of Object.entries(MULTI_WORD_ADDRESS_PHRASES)) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    if (regex.test(workingText)) {
      workingText = workingText.replace(regex, lang === "pa" ? translation.pa : translation.hi);
    }
  }

  // 3. Process remaining words token-by-token while preserving punctuation & spacing
  return workingText.replace(/[A-Za-z]+(?:-[A-Za-z0-9]+)*/g, (matchedToken) => {
    if (shouldPreserveTokenAsIs(matchedToken)) {
      return matchedToken;
    }

    // 3a. Check custom `WORKER_WORD_MAP` for this word
    if (customWordLookup) {
      const customMatch = customWordLookup(matchedToken, lang);
      if (customMatch) return customMatch;
    }

    // 3b. Check built-in dictionary or phonetic transliteration
    return phoneticTransliterateWord(matchedToken, lang);
  });
}
