import React, { useState } from 'react';
import { SupportedLang, TRANSLATIONS } from '../../data/translations';
import {
  Sparkles,
  Zap,
  MapPin,
  Calendar,
  Clock,
  Star,
  Check,
  ChevronRight,
  ArrowLeft,
  Phone,
  MessageCircle,
  HelpCircle,
  Car,
  Gift,
  CheckCircle2,
  Heart,
  User,
  ShieldCheck,
  Lock,
  Headphones,
  RotateCcw,
  Languages,
  Share2,
  ArrowRight,
  X,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

export type ScreenId =
  | 'home'
  | 'build_visit'
  | 'time_match'
  | 'checkout'
  | 'tracking'
  | 'completed'
  | 'bookings'
  | 'helpers'
  | 'profile';

interface TaskItem {
  id: string;
  name: string;
  category: 'clean' | 'cook' | 'laundry' | 'organise';
  icon: string;
  estimatedMinutes: number;
}

const ALL_TASKS: TaskItem[] = [
  { id: 'sweep', name: 'Sweep', category: 'clean', icon: '🧹', estimatedMinutes: 25 },
  { id: 'mop', name: 'Mop', category: 'clean', icon: '🧹', estimatedMinutes: 30 },
  { id: 'vessels', name: 'Wash vessels', category: 'clean', icon: '🍽️', estimatedMinutes: 35 },
  { id: 'dust', name: 'Dust furniture', category: 'clean', icon: '🪶', estimatedMinutes: 20 },
  { id: 'kitchen', name: 'Kitchen counter', category: 'clean', icon: '🧽', estimatedMinutes: 30 },
  { id: 'bathroom', name: 'Bathroom wash', category: 'clean', icon: '🚿', estimatedMinutes: 35 },
  { id: 'veg_cut', name: 'Cut vegetables', category: 'cook', icon: '🥕', estimatedMinutes: 30 },
  { id: 'breakfast', name: 'Breakfast prep', category: 'cook', icon: '🥞', estimatedMinutes: 40 },
  { id: 'lunch', name: 'Cook lunch', category: 'cook', icon: '🍳', estimatedMinutes: 60 },
  { id: 'dinner', name: 'Cook dinner', category: 'cook', icon: '🍲', estimatedMinutes: 50 },
  { id: 'fold_clothes', name: 'Fold clothes', category: 'laundry', icon: '👕', estimatedMinutes: 25 },
  { id: 'iron_clothes', name: 'Iron clothes', category: 'laundry', icon: '👔', estimatedMinutes: 35 },
  { id: 'wardrobe', name: 'Organise wardrobe', category: 'organise', icon: '👗', estimatedMinutes: 45 },
  { id: 'packing', name: 'Packing & unpack', category: 'organise', icon: '📦', estimatedMinutes: 45 },
];

export const ZunoApp: React.FC = () => {
  // Active Screen
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');

  // Language: English (en) | Tamil (ta) | Hindi (hi)
  const [lang, setLang] = useState<SupportedLang>('en');
  const t = TRANSLATIONS[lang];

  // Selected Tasks in "Build My Visit"
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([
    'sweep',
    'mop',
    'vessels',
    'veg_cut',
    'lunch',
  ]);

  // Active Category filter in Build My Visit
  const [activeCategory, setActiveCategory] = useState<'clean' | 'cook' | 'laundry' | 'organise'>('clean');

  // Time & Match selections
  const [durationHours, setDurationHours] = useState<number>(3);
  const [selectedDate, setSelectedDate] = useState<string>('Sat, 26 Apr 2025');
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM - 1:00 PM');
  const [chosenHelperName, setChosenHelperName] = useState<string>('Lakshmi');

  // Rating on completed screen
  const [userRating, setUserRating] = useState<number>(5);
  const [isLakshmiFavourited, setIsLakshmiFavourited] = useState<boolean>(true);

  // Bonus balance state
  const [bonusBalance, setBonusBalance] = useState<number>(120);

  // Toggle tasks in checklist
  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Clear all tasks
  const clearAllTasks = () => {
    setSelectedTaskIds([]);
  };

  // Calculate pricing based on duration
  const baseServiceFee = durationHours * 233;
  const bonusDiscount = 35;
  const totalAmount = baseServiceFee - bonusDiscount;

  // Selected tasks objects
  const selectedTasksList = ALL_TASKS.filter((task) => selectedTaskIds.includes(task.id));

  // Quick book again handler
  const handleBookAgain = (helperName: string = 'Lakshmi') => {
    setChosenHelperName(helperName);
    setSelectedTaskIds(['sweep', 'mop', 'vessels', 'veg_cut', 'lunch']);
    setDurationHours(3);
    setCurrentScreen('checkout');
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] py-0 sm:py-8 px-0 sm:px-4 flex flex-col items-center justify-start text-[#1F142B] font-sans antialiased selection:bg-[#FF5A36] selection:text-white">
      {/* Top Demo Navigation Switcher Bar (For testing all screens shown in mockup) */}
      <div className="w-full max-w-[430px] mb-3 px-3 hidden sm:flex items-center justify-between text-xs text-stone-600 bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#2E1437]">
          <span className="w-2 h-2 rounded-full bg-[#FF5A36]"></span>
          <span>Screen Preview:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold">
          {[
            { id: 'home', label: '1. Home' },
            { id: 'build_visit', label: '2. Build' },
            { id: 'time_match', label: '3. Match' },
            { id: 'checkout', label: '4. Checkout' },
            { id: 'tracking', label: '5. Tracking' },
            { id: 'completed', label: 'Done' },
            { id: 'helpers', label: 'Helpers' },
            { id: 'bookings', label: 'Bookings' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setCurrentScreen(sc.id as ScreenId)}
              className={`px-2 py-1 rounded-lg transition-all ${
                currentScreen === sc.id
                  ? 'bg-[#2E1437] text-white shadow-xs'
                  : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Mobile App Frame */}
      <div className="w-full max-w-[420px] bg-[#FAF7F2] min-h-[844px] flex flex-col relative rounded-none sm:rounded-[44px] shadow-2xl border-0 sm:border-[9px] border-[#1F142B] overflow-hidden">
        {/* iOS / Mobile Status Bar Header */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-[#1F142B] bg-[#FAF7F2] select-none shrink-0 z-30">
          <span>9:41</span>
          <div className="w-24 h-4 bg-transparent rounded-full flex items-center justify-center">
            <div className="w-16 h-3 bg-stone-300/40 rounded-full"></div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="font-bold">5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          {/* ============================================================== */}
          {/* SCREEN 1: HOME                                                 */}
          {/* ============================================================== */}
          {currentScreen === 'home' && (
            <div className="p-4 space-y-4 animate-in fade-in duration-150">
              {/* App Brand Header */}
              <div className="flex items-start justify-between pt-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black tracking-tight text-[#2E1437] font-display">
                      ZUNO
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-[#FF5A36] fill-[#FF5A36]" />
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    {t.tagline}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#1F142B] mt-1 cursor-pointer hover:text-[#FF5A36] transition-colors">
                    <MapPin className="w-3 h-3 text-[#FF5A36]" />
                    <span>{t.location}</span>
                    <ChevronRight className="w-3 h-3 text-stone-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language Selector: EN | தமிழ் | हिन्दी */}
                  <div className="flex items-center p-0.5 bg-stone-200/70 rounded-full text-[10px] font-bold text-stone-600">
                    <button
                      onClick={() => setLang('en')}
                      className={`px-1.5 py-0.5 rounded-full transition-all ${
                        lang === 'en' ? 'bg-[#2E1437] text-white shadow-xs' : 'hover:text-stone-900'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setLang('ta')}
                      className={`px-1.5 py-0.5 rounded-full transition-all ${
                        lang === 'ta' ? 'bg-[#2E1437] text-white shadow-xs' : 'hover:text-stone-900'
                      }`}
                    >
                      தமிழ்
                    </button>
                    <button
                      onClick={() => setLang('hi')}
                      className={`px-1.5 py-0.5 rounded-full transition-all ${
                        lang === 'hi' ? 'bg-[#2E1437] text-white shadow-xs' : 'hover:text-stone-900'
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>

                  {/* Profile Avatar */}
                  <div
                    onClick={() => setCurrentScreen('profile')}
                    className="w-9 h-9 rounded-full ring-2 ring-white shadow-xs overflow-hidden cursor-pointer active:scale-95 transition-transform shrink-0"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                      alt="Kartik"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Main Visual Hero Card with Warm Photo Overlay */}
              <div className="relative rounded-[24px] overflow-hidden shadow-sm aspect-[16/9] bg-stone-200">
                <img
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
                  alt="Help when you need it"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-transparent flex flex-col justify-end p-4 text-white">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display leading-tight max-w-[210px]">
                    {t.helpWhenNeeded}
                  </h2>
                  <p className="text-[11px] text-stone-200 font-medium mt-0.5">
                    {t.noCommitment}
                  </p>
                </div>
              </div>

              {/* Primary Call-to-Actions (Matching exact layout from mockup) */}
              <div className="space-y-2.5">
                {/* 1. Build My Visit (Deep Plum) */}
                <button
                  onClick={() => setCurrentScreen('build_visit')}
                  className="w-full p-4 rounded-[22px] bg-[#2E1437] text-white flex items-center justify-between shadow-md active:scale-[0.99] transition-all text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#FF5A36] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Calendar className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold tracking-tight font-display flex items-center gap-1.5">
                        <span>{t.buildMyVisit}</span>
                      </div>
                      <div className="text-xs text-stone-300 font-normal">
                        {t.buildSubtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* 2. Need Help Now (Warm Coral Gradient) */}
                <button
                  onClick={() => {
                    setSelectedTaskIds(['sweep', 'vessels']);
                    setDurationHours(1);
                    setCurrentScreen('time_match');
                  }}
                  className="w-full p-4 rounded-[22px] bg-gradient-to-r from-[#FF5A36] to-[#FF4422] text-white flex items-center justify-between shadow-md active:scale-[0.99] transition-all text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/25 text-white flex items-center justify-center shrink-0 backdrop-blur-xs">
                      <Zap className="w-5 h-5 fill-white stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold tracking-tight font-display">
                        {t.needHelpNow}
                      </div>
                      <div className="text-xs text-orange-100 font-normal">
                        {t.needHelpSubtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-orange-100 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>

              {/* Quick Help (3x2 Grid matching image) */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-stone-800 tracking-tight">
                  {t.quickHelp}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'clean', label: t.clean, icon: '🧹' },
                    { id: 'cook', label: t.cook, icon: '🍳' },
                    { id: 'laundry', label: t.laundry, icon: '👕' },
                    { id: 'organise', label: t.organise, icon: '📦' },
                    { id: 'kids', label: t.kids, icon: '👶' },
                    { id: 'family', label: t.family, icon: '👵' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (['clean', 'cook', 'laundry', 'organise'].includes(cat.id)) {
                          setActiveCategory(cat.id as any);
                        }
                        setCurrentScreen('build_visit');
                      }}
                      className="p-3 rounded-2xl bg-white border border-stone-100 hover:border-stone-200 shadow-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-bold text-stone-800">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* My Helpers Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">{t.myHelpers}</span>
                  <button
                    onClick={() => setCurrentScreen('helpers')}
                    className="text-[#FF5A36] font-semibold text-[11px] hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-stone-100 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-stone-100 shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                        alt="Lakshmi"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-900">Lakshmi</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-stone-700">4.9</span>
                        <span>(120 jobs)</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        Cleaning · Cooking
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookAgain('Lakshmi')}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A36] border border-orange-200/60 font-bold text-xs active:scale-95 transition-all shrink-0"
                  >
                    {t.bookAgain}
                  </button>
                </div>
              </div>

              {/* ZUNO Bonus Reward Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="font-bold text-stone-900">{t.bonusSubtitle}</div>
                    <div className="text-[11px] text-stone-600">
                      Balance available: <span className="font-bold font-mono text-emerald-700">₹{bonusBalance}</span>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#FF5A36] border border-orange-200 font-black font-mono text-xs shadow-xs">
                  ₹35 Bonus
                </span>
              </div>

              {/* Promotional Household Situations Mini-Cards */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Help When You Need It
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-100">
                    <div className="font-bold text-stone-800">Guests coming?</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Book help for a few hours.</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-100">
                    <div className="font-bold text-stone-800">Busy weekend?</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Get an extra pair of hands.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 2: BUILD MY VISIT (Exact Column 2 from Mockup)          */}
          {/* ============================================================== */}
          {currentScreen === 'build_visit' && (
            <div className="p-4 space-y-4 animate-in fade-in duration-150">
              {/* Screen Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="p-1 rounded-lg text-stone-700 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#1F142B] font-display">
                  Build My Visit
                </h1>
                <div className="w-5"></div>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#1F142B] tracking-tight font-display">
                  {t.whatNeedsDoing}
                </h2>
              </div>

              {/* 4 Photo Category Cards (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'clean',
                    label: 'Clean',
                    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'cook',
                    label: 'Cook',
                    img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'laundry',
                    label: 'Laundry',
                    img: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'organise',
                    label: 'Organise',
                    img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
                  },
                ].map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)}
                      className={`relative rounded-2xl overflow-hidden aspect-[4/3] text-left transition-all shadow-xs group ${
                        isActive
                          ? 'ring-2 ring-[#2E1437] shadow-md scale-[1.01]'
                          : 'opacity-90 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={cat.img}
                        alt={cat.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                        <span className="px-2.5 py-1 rounded-full bg-white/95 text-stone-900 text-xs font-bold backdrop-blur-xs">
                          {cat.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Tasks Checklist Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-900">{t.selectedTasks}</span>
                  <button
                    onClick={clearAllTasks}
                    className="text-stone-500 hover:text-rose-600 font-semibold text-[11px]"
                  >
                    {t.clearAll}
                  </button>
                </div>

                <div className="space-y-2">
                  {ALL_TASKS.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white border-[#2E1437]/30 shadow-xs'
                            : 'bg-white/60 border-stone-200/80 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{task.icon}</span>
                          <span className="font-bold text-xs text-stone-900">{task.name}</span>
                        </div>

                        {/* Checkbox box (Filled deep plum when checked) */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#2E1437] text-white'
                              : 'border-2 border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floating Sticky Summary Bar */}
              <div className="sticky bottom-2 z-20 pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                    <ShoppingBag className="w-4 h-4 text-[#2E1437]" />
                    <span>
                      {selectedTaskIds.length} tasks · ~{durationHours} hrs
                    </span>
                  </div>

                  <button
                    disabled={selectedTaskIds.length === 0}
                    onClick={() => setCurrentScreen('time_match')}
                    className="w-full py-3.5 rounded-2xl bg-[#2E1437] hover:bg-[#3E1B4A] disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>{t.continueBtn} →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 3: TIME & MATCH (Exact Column 3 from Mockup)            */}
          {/* ============================================================== */}
          {currentScreen === 'time_match' && (
            <div className="p-4 space-y-4 animate-in fade-in duration-150">
              {/* Screen Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen('build_visit')}
                  className="p-1 rounded-lg text-stone-700 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#1F142B] font-display">
                  Time & Match
                </h1>
                <div className="w-5"></div>
              </div>

              {/* Section 1: How much time do you need? */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-900">
                  {t.howMuchTime}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((hrs) => {
                    const isSelected = durationHours === hrs;
                    return (
                      <button
                        key={hrs}
                        onClick={() => setDurationHours(hrs)}
                        className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#2E1437] text-white shadow-md'
                            : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        {hrs} hr
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Select date & time */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-stone-900">
                  {t.selectDateTime}
                </div>
                <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                    <div className="flex items-center gap-2 text-stone-800 font-semibold">
                      <Calendar className="w-4 h-4 text-stone-500" />
                      <span>{selectedDate}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 text-stone-800 font-semibold">
                      <Clock className="w-4 h-4 text-stone-500" />
                      <span>{selectedSlot}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              </div>

              {/* Section 3: Recommended Helper (Lakshmi) */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-stone-900">
                  {t.recommendedHelper}
                </div>

                <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-stone-100 shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                        alt="Lakshmi"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-stone-900 font-display">
                          Lakshmi
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-0.5">
                          ✓ Verified
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 flex items-center gap-1.5">
                        <span className="font-bold text-stone-800 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          4.9
                        </span>
                        <span>(120 jobs)</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Available
                        </span>
                        <span>·</span>
                        <span>📍 1.8 km away</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-stone-600">
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100">Cleaning</span>
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100">Cooking</span>
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100">Laundry</span>
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-400">+1</span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <button
                      onClick={() => {
                        setChosenHelperName('Lakshmi');
                        setCurrentScreen('checkout');
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#2E1437] hover:bg-[#3E1B4A] text-white font-extrabold text-xs shadow-md active:scale-95 transition-all text-center"
                    >
                      {t.chooseHelper}
                    </button>

                    <button
                      onClick={() => {
                        setChosenHelperName('Lakshmi');
                        setCurrentScreen('checkout');
                      }}
                      className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>{t.letZunoChoose}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 4: CHECKOUT (Exact Column 4 from Mockup)                */}
          {/* ============================================================== */}
          {currentScreen === 'checkout' && (
            <div className="p-4 space-y-3.5 animate-in fade-in duration-150">
              {/* Screen Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen('time_match')}
                  className="p-1 rounded-lg text-stone-700 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#1F142B] font-display">
                  {t.checkoutTitle}
                </h1>
                <div className="w-5"></div>
              </div>

              {/* Card 1: Your visit summary */}
              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-stone-900">
                  <span>{t.visitSummary}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>

                {/* Selected tasks with icons */}
                <div className="space-y-1.5 text-stone-700">
                  {selectedTasksList.map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span className="font-medium">{t.name}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-500 font-medium text-[11px]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{durationHours} hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Sat, 26 Apr · 10:00 AM</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Location */}
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-stone-900">Location</div>
                    <div className="text-stone-600 font-medium">Pallavaram</div>
                    <div className="text-[10px] text-stone-400">Chennai, Tamil Nadu</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </div>

              {/* Card 3: Price details */}
              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2 text-xs">
                <div className="font-bold text-stone-900">Price details</div>

                <div className="flex items-center justify-between text-stone-600">
                  <span>{t.serviceFee}</span>
                  <span className="font-mono">₹ {baseServiceFee}</span>
                </div>

                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <span>🎁</span>
                    <span>{t.zunoBonus}</span>
                  </span>
                  <span className="font-mono">- ₹ {bonusDiscount}</span>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-900 font-black text-base">
                  <span>{t.total}</span>
                  <span className="font-mono">₹ {totalAmount}</span>
                </div>
              </div>

              {/* Card 4: Payment method */}
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] border border-emerald-200">
                    UPI
                  </div>
                  <span className="font-bold text-stone-900">UPI</span>
                </div>
                <button className="text-stone-500 font-semibold text-[11px] hover:underline">
                  Change
                </button>
              </div>

              {/* Primary CTA Button: Book ZUNO */}
              <div className="pt-1">
                <button
                  onClick={() => setCurrentScreen('tracking')}
                  className="w-full py-4 rounded-2xl bg-[#2E1437] hover:bg-[#3E1B4A] text-white font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all text-center"
                >
                  {t.bookZuno}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-stone-500 pt-1 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.verifiedHelpers}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Headphones className="w-3.5 h-3.5 text-stone-600" />
                  <span>{t.easySupport}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-stone-600" />
                  <span>{t.securePayment}</span>
                </span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 5: TRACKING / ON THE WAY (Exact Column 5 from Mockup)   */}
          {/* ============================================================== */}
          {currentScreen === 'tracking' && (
            <div className="p-4 space-y-3.5 animate-in fade-in duration-150">
              {/* Screen Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="p-1 rounded-lg text-stone-700 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#1F142B] font-display">
                  {t.onTheWayTitle}
                </h1>
                <div className="w-5"></div>
              </div>

              {/* Top Status Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-stone-900 text-xs">
                    {t.isHeadingOver}
                  </div>
                  <div className="text-[11px] text-stone-600 font-medium">
                    {t.arrivingIn}
                  </div>
                </div>
              </div>

              {/* Stepper Progress */}
              <div className="px-2 py-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-stone-700 relative">
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">
                      ✓
                    </span>
                    <span>Requested</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">
                      ✓
                    </span>
                    <span>Confirmed</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">
                      ✓
                    </span>
                    <span className="text-emerald-800 font-extrabold">On the way</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center text-[9px]">
                      ○
                    </span>
                    <span className="text-stone-400">Arrived</span>
                  </div>
                </div>
              </div>

              {/* Big Helper Status Card with Photo */}
              <div className="relative rounded-3xl overflow-hidden aspect-[16/11] bg-stone-200 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
                  alt="Lakshmi"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80"
                      alt="Lakshmi"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-stone-900">Lakshmi</span>
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                    ★ 4.9
                  </span>
                </div>
              </div>

              {/* ETA Pill & Start OTP */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                  <div className="text-[10px] text-stone-500 font-medium">ETA</div>
                  <div className="font-black text-sm text-stone-900 mt-0.5">12 mins</div>
                  <div className="text-[10px] text-stone-400">Pallavaram</div>
                </div>

                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 shadow-xs text-center">
                  <div className="text-[10px] text-stone-600 font-bold">Start OTP for Lakshmi</div>
                  <div className="font-mono font-black text-lg text-[#FF5A36] tracking-widest mt-0.5">
                    4821
                  </div>
                </div>
              </div>

              {/* Actions: Call, Chat, Help */}
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="tel:+919840123411"
                  className="p-3 rounded-2xl bg-[#2E1437] text-white flex flex-col items-center justify-center gap-1 text-xs font-bold active:scale-95 transition-transform"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </a>

                <button
                  onClick={() => alert('Opening live chat with Lakshmi...')}
                  className="p-3 rounded-2xl bg-white border border-stone-200 text-stone-800 flex flex-col items-center justify-center gap-1 text-xs font-bold hover:bg-stone-50 active:scale-95 transition-transform"
                >
                  <MessageCircle className="w-4 h-4 text-stone-600" />
                  <span>Chat</span>
                </button>

                <button
                  onClick={() => alert('Connecting to ZUNO 24x7 Customer Support...')}
                  className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF5A36] flex flex-col items-center justify-center gap-1 text-xs font-bold hover:bg-orange-100 active:scale-95 transition-transform"
                >
                  <HelpCircle className="w-4 h-4 text-[#FF5A36]" />
                  <span>Help</span>
                </button>
              </div>

              {/* Earned ZUNO Bonus Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="font-bold text-stone-900">{t.bonusTitle}</div>
                    <div className="text-emerald-700 font-black text-sm font-mono">+ ₹35</div>
                  </div>
                </div>
                <span className="text-xl">✨</span>
              </div>

              {/* Prototype Simulation Action: Trigger Visit Completed */}
              <div className="pt-2">
                <button
                  onClick={() => setCurrentScreen('completed')}
                  className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>[Demo] Simulate Helper Completed Visit →</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 7: COMPLETED & RATING (Screen 7 from prompt)            */}
          {/* ============================================================== */}
          {currentScreen === 'completed' && (
            <div className="p-4 space-y-4 animate-in fade-in duration-150 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
                🎉
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-stone-900 font-display">
                  {t.visitCompleted}
                </h2>
                <p className="text-xs text-stone-500">
                  Lakshmi finished all 5 tasks · 3 hours visit
                </p>
              </div>

              {/* Star Rating Component */}
              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="font-bold text-xs text-stone-800">
                  {t.howWasVisit}
                </div>

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="p-1 transition-transform active:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          userRating >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
                  {['Punctual ⏰', 'Great Cleaning 🧹', 'Delicious Cooking 🍳', 'Polite 🤝'].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>

                <button
                  onClick={() => {
                    alert('Thank you for rating Lakshmi! Your feedback helps our community.');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#2E1437] text-white font-bold text-xs"
                >
                  {t.submitRating}
                </button>
              </div>

              {/* Reward Bonus Earned */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="font-bold text-stone-900">ZUNO Bonus Credited</div>
                    <div className="text-[11px] text-stone-600">Added to your wallet balance</div>
                  </div>
                </div>
                <span className="font-black font-mono text-emerald-700 text-sm">+₹35</span>
              </div>

              {/* Add to My Helpers & Book Again CTA */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsLakshmiFavourited(true);
                    alert('Lakshmi is now saved to My Helpers for fast 1-click booking!');
                  }}
                  className="w-full py-3 rounded-2xl bg-white border border-stone-200 hover:border-rose-300 text-stone-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>❤️ Add Lakshmi to My Helpers</span>
                </button>

                <button
                  onClick={() => handleBookAgain('Lakshmi')}
                  className="w-full py-3.5 rounded-2xl bg-[#2E1437] text-white font-extrabold text-xs shadow-md"
                >
                  Book Again with Lakshmi
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 8: MY HELPERS (Screen 8 from prompt / Nav Tab 3)        */}
          {/* ============================================================== */}
          {currentScreen === 'helpers' && (
            <div className="p-4 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-stone-900 font-display">
                  {t.myHelpers}
                </h1>
                <span className="text-xs text-stone-500 font-medium">3 saved helpers</span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    name: 'Lakshmi',
                    rating: 4.9,
                    jobs: 120,
                    skills: 'Cleaning · Cooking · Laundry',
                    distance: '1.8 km',
                    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
                  },
                  {
                    name: 'Meena',
                    rating: 4.8,
                    jobs: 94,
                    skills: 'Cleaning · Laundry',
                    distance: '2.1 km',
                    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  },
                  {
                    name: 'Kavitha',
                    rating: 4.9,
                    jobs: 140,
                    skills: 'Cooking · Vegetable Prep · Vessels',
                    distance: '2.4 km',
                    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
                  },
                ].map((helper) => (
                  <div
                    key={helper.name}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-stone-100 shrink-0">
                        <img
                          src={helper.img}
                          alt={helper.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">{helper.name}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-stone-700">{helper.rating}</span>
                          <span>({helper.jobs} jobs)</span>
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {helper.skills}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookAgain(helper.name)}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A36] border border-orange-200/60 font-bold text-xs active:scale-95 transition-all shrink-0"
                    >
                      {t.bookAgain}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 9: BOOKINGS (Screen 9 from prompt / Nav Tab 2)          */}
          {/* ============================================================== */}
          {currentScreen === 'bookings' && (
            <div className="p-4 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-stone-900 font-display">
                  {t.navBookings}
                </h1>
                <span className="text-xs text-stone-500 font-mono font-bold">2 Visits</span>
              </div>

              {/* Bookings cards */}
              <div className="space-y-3">
                {/* Active booking */}
                <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ● Confirmed
                    </span>
                    <span className="font-mono font-black text-stone-900 text-sm">₹ 664</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-stone-200 shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                        alt="Lakshmi"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">Lakshmi</div>
                      <div className="text-stone-500 text-[11px]">Sat, 26 Apr · 10 AM – 1 PM (3 hrs)</div>
                      <div className="text-stone-600 font-medium text-[11px]">Cleaning + Cooking (5 tasks)</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">Pallavaram, Flat C-704</span>
                    <button
                      onClick={() => setCurrentScreen('tracking')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2E1437] text-white font-bold text-xs"
                    >
                      Track Helper
                    </button>
                  </div>
                </div>

                {/* Past completed booking */}
                <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3 text-xs opacity-90">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold text-[10px]">
                      Completed
                    </span>
                    <span className="font-mono font-black text-stone-900 text-sm">₹ 498</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-stone-200 shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                        alt="Meena"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">Meena</div>
                      <div className="text-stone-500 text-[11px]">Wed, 23 Apr · 2 hrs visit</div>
                      <div className="text-stone-600 font-medium text-[11px]">Sweep + Mop + Laundry</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-amber-500 font-bold">Rated 5.0 ★</span>
                    <button
                      onClick={() => handleBookAgain('Meena')}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 text-[#FF5A36] border border-orange-200 font-bold text-xs"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 10: PROFILE (Screen 10 from prompt / Nav Tab 4)         */}
          {/* ============================================================== */}
          {currentScreen === 'profile' && (
            <div className="p-4 space-y-4 animate-in fade-in duration-150 text-xs">
              {/* Profile Card */}
              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-stone-100 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                    alt="Kartik"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-stone-900 font-display">
                    Kartik Krishnan
                  </h2>
                  <div className="text-stone-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#FF5A36]" />
                    <span>Purva Windermere, Pallavaram</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">+91 98405 12099</div>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                <div className="font-bold text-stone-900">App Language</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'ta', label: 'தமிழ்' },
                    { id: 'hi', label: 'हिन्दी' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        lang === l.id
                          ? 'bg-[#2E1437] text-white shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Sections */}
              <div className="rounded-3xl bg-white border border-stone-200 shadow-xs overflow-hidden divide-y divide-stone-100">
                <button
                  onClick={() => setCurrentScreen('helpers')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
                >
                  <span className="font-bold text-stone-800 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>My Helpers</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => setCurrentScreen('bookings')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
                >
                  <span className="font-bold text-stone-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Bookings</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <div className="p-3.5 flex items-center justify-between text-left">
                  <span className="font-bold text-stone-800 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-500" />
                    <span>ZUNO Bonus</span>
                  </span>
                  <span className="font-black font-mono text-emerald-700">₹ 120 Available</span>
                </div>

                <div className="p-3.5 flex items-center justify-between text-left">
                  <span className="font-bold text-stone-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-stone-600" />
                    <span>Payments (UPI)</span>
                  </span>
                  <span className="text-[11px] text-stone-500">Google Pay</span>
                </div>

                <div className="p-3.5 flex items-center justify-between text-left">
                  <span className="font-bold text-stone-800 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-blue-500" />
                    <span>Help & Support</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar (Home | Bookings | My Helpers | Profile) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-6 py-2.5 flex items-center justify-between text-[11px] font-bold z-30">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              currentScreen === 'home' ? 'text-[#FF5A36]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <span className="text-base">🏠</span>
            <span>{t.navHome}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('bookings')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              currentScreen === 'bookings' ? 'text-[#FF5A36]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <span className="text-base">📅</span>
            <span>{t.navBookings}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('helpers')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              currentScreen === 'helpers' ? 'text-[#FF5A36]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <span className="text-base">👥</span>
            <span>{t.navHelpers}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              currentScreen === 'profile' ? 'text-[#FF5A36]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <span className="text-base">👤</span>
            <span>{t.navProfile}</span>
          </button>
        </div>
      </div>

      {/* Brand Value Ribbon (From Mockup bottom footer) */}
      <div className="w-full max-w-5xl mt-6 px-4 hidden lg:flex items-center justify-between text-xs text-stone-700 py-3 bg-white/80 backdrop-blur-xs rounded-2xl border border-stone-200/70 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2E1437]" />
          <span className="font-medium">Flexible 1–4 hr visits</span>
        </div>
        <div className="w-px h-4 bg-stone-200"></div>
        <div className="flex items-center gap-2">
          <span className="text-sm">👥</span>
          <span className="font-medium">One helper, Multiple tasks</span>
        </div>
        <div className="w-px h-4 bg-stone-200"></div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF5A36]" />
          <span className="font-medium">Trusted & verified helpers</span>
        </div>
        <div className="w-px h-4 bg-stone-200"></div>
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500" />
          <span className="font-medium">Earn ZUNO Bonus on every visit</span>
        </div>
        <div className="w-px h-4 bg-stone-200"></div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="font-medium">More time for what matters</span>
        </div>
      </div>
    </div>
  );
};
