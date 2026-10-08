export type SupportedLang = 'en' | 'ta' | 'hi';

export interface Translations {
  tagline: string;
  location: string;
  helpWhenNeeded: string;
  noCommitment: string;
  buildMyVisit: string;
  buildSubtitle: string;
  needHelpNow: string;
  needHelpSubtitle: string;
  quickHelp: string;
  clean: string;
  cook: string;
  laundry: string;
  organise: string;
  kids: string;
  family: string;
  myHelpers: string;
  bookAgain: string;
  bonusTitle: string;
  bonusSubtitle: string;
  navHome: string;
  navBookings: string;
  navHelpers: string;
  navProfile: string;
  whatNeedsDoing: string;
  selectedTasks: string;
  clearAll: string;
  continueBtn: string;
  howMuchTime: string;
  selectDateTime: string;
  recommendedHelper: string;
  chooseHelper: string;
  letZunoChoose: string;
  checkoutTitle: string;
  visitSummary: string;
  serviceFee: string;
  zunoBonus: string;
  total: string;
  bookZuno: string;
  verifiedHelpers: string;
  easySupport: string;
  securePayment: string;
  onTheWayTitle: string;
  isHeadingOver: string;
  arrivingIn: string;
  visitCompleted: string;
  howWasVisit: string;
  submitRating: string;
}

export const TRANSLATIONS: Record<SupportedLang, Translations> = {
  en: {
    tagline: 'Your extra pair of hands.',
    location: 'Pallavaram',
    helpWhenNeeded: 'Help when you need it.',
    noCommitment: 'No monthly commitment.',
    buildMyVisit: 'Build My Visit',
    buildSubtitle: "Pick tasks, set time, we'll match you",
    needHelpNow: 'Need Help Now',
    needHelpSubtitle: 'Find a helper nearby',
    quickHelp: 'Quick Help',
    clean: 'Clean',
    cook: 'Cook',
    laundry: 'Laundry',
    organise: 'Organise',
    kids: 'Kids',
    family: 'Family',
    myHelpers: 'My Helpers',
    bookAgain: 'Book Again',
    bonusTitle: 'Earned ZUNO Bonus',
    bonusSubtitle: 'Earn bonus on every visit',
    navHome: 'Home',
    navBookings: 'Bookings',
    navHelpers: 'My Helpers',
    navProfile: 'Profile',
    whatNeedsDoing: 'What needs doing?',
    selectedTasks: 'Selected tasks',
    clearAll: 'Clear all',
    continueBtn: 'Continue',
    howMuchTime: 'How much time do you need?',
    selectDateTime: 'Select date & time',
    recommendedHelper: 'Recommended Helper',
    chooseHelper: 'Choose Lakshmi',
    letZunoChoose: 'Let ZUNO choose',
    checkoutTitle: 'Checkout',
    visitSummary: 'Your visit summary',
    serviceFee: 'Service fee',
    zunoBonus: 'ZUNO Bonus',
    total: 'Total',
    bookZuno: 'Book ZUNO',
    verifiedHelpers: 'Verified helpers',
    easySupport: 'Easy support',
    securePayment: 'Secure payment',
    onTheWayTitle: 'On the way',
    isHeadingOver: 'Lakshmi is on the way',
    arrivingIn: 'Arriving in 12 minutes',
    visitCompleted: 'Visit completed',
    howWasVisit: 'How was your visit?',
    submitRating: 'Submit Rating',
  },
  ta: {
    tagline: 'உங்கள் கூடுதல் உதவி கைகள்.',
    location: 'பல்லாவரம்',
    helpWhenNeeded: 'தேவைப்படும் போது உடனடி உதவி.',
    noCommitment: 'மாதாந்திர கட்டாயம் இல்லை.',
    buildMyVisit: 'பணிகளைத் தேர்வு செய்க',
    buildSubtitle: 'வேலைகளைத் தேர்ந்தெடுங்கள், நாங்கள் ஆளை இணைப்போம்',
    needHelpNow: 'இப்போதே உதவி வேண்டும்',
    needHelpSubtitle: 'அருகிலுள்ள உதவியாளரை உடனடியாக பெறுக',
    quickHelp: 'விரைவு உதவி',
    clean: 'சுத்தம்',
    cook: 'சமையல்',
    laundry: 'துணி',
    organise: 'அடுக்குதல்',
    kids: 'குழந்தைகள்',
    family: 'குடும்பம்',
    myHelpers: 'என் உதவியாளர்கள்',
    bookAgain: 'மீண்டும் முன்பதிவு',
    bonusTitle: 'ZUNO போனஸ் வெகுமதி',
    bonusSubtitle: 'ஒவ்வொரு வருகையிலும் போனஸ் பெறுக',
    navHome: 'முகப்பு',
    navBookings: 'முன்பதிவுகள்',
    navHelpers: 'உதவியாளர்கள்',
    navProfile: 'சுயவிவரம்',
    whatNeedsDoing: 'என்ன வேலை செய்ய வேண்டும்?',
    selectedTasks: 'தேர்ந்தெடுக்கப்பட்ட பணிகள்',
    clearAll: 'அனைத்தையும் நீக்கு',
    continueBtn: 'தொடரவும்',
    howMuchTime: 'எவ்வளவு நேரம் தேவை?',
    selectDateTime: 'தேதி & நேரத்தை தேர்வு செய்க',
    recommendedHelper: 'பரிந்துரைக்கப்பட்ட உதவியாளர்',
    chooseHelper: 'லட்சுமியை தேர்வு செய்',
    letZunoChoose: 'ZUNO சிறந்தவரை தேர்வு செய்யட்டும்',
    checkoutTitle: 'கட்டணம்',
    visitSummary: 'பணி சுருக்கம்',
    serviceFee: 'சேவை கட்டணம்',
    zunoBonus: 'ZUNO போனஸ்',
    total: 'மொத்தம்',
    bookZuno: 'ZUNO முன்பதிவு செய்க',
    verifiedHelpers: 'சரிபார்க்கப்பட்ட ஆட்கள்',
    easySupport: 'எளிய ஆதரவு',
    securePayment: 'பாதுகாப்பான கட்டணம்',
    onTheWayTitle: 'வருகிறார்',
    isHeadingOver: 'லட்சுமி வழியில் உள்ளார்',
    arrivingIn: '12 நிமிடங்களில் வந்தடைவார்',
    visitCompleted: 'பணி முடிந்தது',
    howWasVisit: 'உங்கள் அனுபவம் எப்படி இருந்தது?',
    submitRating: 'மதிப்பீடு சமர்ப்பிக்கவும்',
  },
  hi: {
    tagline: 'घर के कामों में आपका मददगार हाथ।',
    location: 'पल्लावरम',
    helpWhenNeeded: 'जब ज़रूरत हो, तब घर की मदद।',
    noCommitment: 'कोई मासिक बंधन नहीं।',
    buildMyVisit: 'अपनी विज़िट बनाएं',
    buildSubtitle: 'काम चुनें, समय तय करें, हम हेल्पर जोड़ेंगे',
    needHelpNow: 'अभी तुरंत मदद चाहिए',
    needHelpSubtitle: 'पास के हेल्पर को तुरंत बुलाएं',
    quickHelp: 'त्वरित मदद',
    clean: 'सफाई',
    cook: 'खाना',
    laundry: 'कपड़े',
    organise: 'व्यवस्थित करें',
    kids: 'बच्चे',
    family: 'परिवार',
    myHelpers: 'मेरे हेल्पर्स',
    bookAgain: 'दोबारा बुक करें',
    bonusTitle: 'ZUNO बोनस रिवार्ड',
    bonusSubtitle: 'हर विज़िट पर बोनस पाएं',
    navHome: 'होम',
    navBookings: 'बुकिंग्स',
    navHelpers: 'हेल्पर्स',
    navProfile: 'प्रोफाइल',
    whatNeedsDoing: 'क्या काम करवाना है?',
    selectedTasks: 'चुने गए काम',
    clearAll: 'हटाएं',
    continueBtn: 'आगे बढ़ें',
    howMuchTime: 'कितना समय चाहिए?',
    selectDateTime: 'तारीख और समय चुनें',
    recommendedHelper: 'सुझाए गए हेल्पर',
    chooseHelper: 'लक्ष्मी को चुनें',
    letZunoChoose: 'ZUNO सबसे अच्छे हेल्पर को चुने',
    checkoutTitle: 'चेकआउट',
    visitSummary: 'विज़िट विवरण',
    serviceFee: 'सर्विस फीस',
    zunoBonus: 'ZUNO बोनस',
    total: 'कुल राशि',
    bookZuno: 'ZUNO बुक करें',
    verifiedHelpers: 'सत्यापित हेल्पर्स',
    easySupport: 'आसान सहायता',
    securePayment: 'सुरक्षित भुगतान',
    onTheWayTitle: 'रास्ते में हैं',
    isHeadingOver: 'लक्ष्मी रास्ते में हैं',
    arrivingIn: '12 मिनट में पहुंच रही हैं',
    visitCompleted: 'काम पूरा हुआ',
    howWasVisit: 'आपका अनुभव कैसा रहा?',
    submitRating: 'रेटिंग सबमिट करें',
  },
};
