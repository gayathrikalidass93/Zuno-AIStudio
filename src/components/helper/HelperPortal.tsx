import React, { useState } from 'react';
import { Helper, Booking, Customer } from '../../types';
import { MASTER_TASKS } from '../../data/services';
import { getHelperWorkRatesBreakdown } from '../../services/helperRates';
import { maskPhoneNumber } from '../../services/privacy';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  AlertTriangle,
  Play,
  KeyRound,
  ShieldCheck,
  Phone,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Navigation,
  Languages,
  UserCheck,
  Info,
  Timer,
  AlertCircle,
  HelpCircle,
  Car,
  LogIn,
} from 'lucide-react';

interface HelperPortalProps {
  helper: Helper;
  bookings: Booking[];
  customers: Customer[];
  helpers?: Helper[];
  onSwitchHelper?: (helperId: string) => void;
  onUpdateAvailability: (status: Helper['availabilityStatus']) => void;
  onVerifyOtp: (bookingId: string, enteredOtp: string) => { success: boolean; message: string };
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  onCancelWithEmergency: (bookingId: string, reason: string) => void;
  onRateCustomer: (bookingId: string, rating: number, feedback?: string) => void;
  onPriceResponse: (bookingId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number) => void;
  onOpenAuth?: () => void;
}

export const HelperPortal: React.FC<HelperPortalProps> = ({
  helper,
  bookings,
  customers,
  helpers = [],
  onSwitchHelper,
  onUpdateAvailability,
  onVerifyOtp,
  onUpdateBookingStatus,
  onCancelWithEmergency,
  onRateCustomer,
  onPriceResponse,
  onOpenAuth,
}) => {
  // Language toggle: 'en' | 'ta' (Tamil bilingual UI)
  const [lang, setLang] = useState<'en' | 'ta'>('en');

  // Sub-tabs: 'schedule' | 'earnings' | 'rates' | 'profile'
  const [activeTab, setActiveTab] = useState<'schedule' | 'earnings' | 'rates' | 'profile'>('schedule');

  // OTP check-in modal state
  const [activeOtpBookingId, setActiveOtpBookingId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Cancellation modal state ("No last minute surprises")
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>(
    'Sudden family health emergency'
  );
  const [cancellationSubmittedNotice, setCancellationSubmittedNotice] = useState<string | null>(null);

  // Rate customer modal state
  const [ratingCustomerBookingId, setRatingCustomerBookingId] = useState<string | null>(null);
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [priceNotice, setPriceNotice] = useState<string | null>(null);

  // Selected booking state (for helpers with multiple shifts)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Filter helper's bookings
  const helperBookings = bookings.filter((b) => b.helperId === helper.id);
  const activeAndUpcomingBookings = helperBookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'completed'
  );
  const completedHelperBookings = helperBookings.filter((b) => b.status === 'completed');

  // Helper earnings calculation
  const todayEarnings = completedHelperBookings
    .filter((b) => b.scheduledDate === new Date().toISOString().split('T')[0])
    .reduce((sum, b) => sum + b.pricing.helperPayout, 0);

  const totalPayout = completedHelperBookings.reduce(
    (sum, b) => sum + b.pricing.helperPayout,
    0
  );

  const workRates = getHelperWorkRatesBreakdown(helper);

  // Active / next booking
  const primaryBooking =
    (selectedBookingId ? helperBookings.find((b) => b.id === selectedBookingId) : null) ||
    activeAndUpcomingBookings[0] ||
    completedHelperBookings[0] ||
    null;
  const primaryCustomer = primaryBooking
    ? customers.find((c) => c.id === primaryBooking.customerId)
    : null;

  // Handle OTP verification
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOtpBookingId) return;

    const res = onVerifyOtp(activeOtpBookingId, enteredOtp);
    if (res.success) {
      setActiveOtpBookingId(null);
      setEnteredOtp('');
      setOtpError(null);
    } else {
      setOtpError(res.message);
    }
  };

  // Handle Early Cancellation ("No last minute surprises")
  const handleCancelSubmit = () => {
    if (!cancellingBookingId) return;
    onCancelWithEmergency(cancellingBookingId, cancellationReason);
    setCancellationSubmittedNotice(
      lang === 'ta'
        ? 'வாடிக்கையாளருக்கு உடனடியாக தகவல் அனுப்பப்பட்டது. ZUNO மாற்று உதவியாளரைத் தேடுகிறது.'
        : 'Customer was informed immediately without last-minute surprise. ZUNO Replacement Engine is matching an eligible nearby helper.'
    );
    setCancellingBookingId(null);
    setTimeout(() => setCancellationSubmittedNotice(null), 8000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
      {/* 1. Partner App Header & Bilingual Toggle */}
      <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-extrabold text-emerald-800 tracking-tight font-display text-sm">
            ZUNO Partner
          </span>
          <span className="text-stone-300">|</span>
          <span className="text-stone-500">
            {lang === 'ta' ? 'உதவிக் கூட்டாளி போர்டல்' : 'Helper Portal'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Helper profile switcher (For easy testing of multiple helpers) */}
          {helpers.length > 0 && onSwitchHelper && (
            <select
              value={helper.id}
              onChange={(e) => onSwitchHelper(e.target.value)}
              className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded-lg border border-stone-200 font-medium"
              title="Switch active helper for demo testing"
            >
              {helpers.slice(0, 6).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name.split(' ')[0]} ({h.locality})
                </option>
              ))}
            </select>
          )}

          {/* Bilingual Language Switcher */}
          <button
            type="button"
            onClick={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Login / Switch Account */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors border border-stone-200"
              title="Sign in as different helper or customer"
            >
              <LogIn className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">{lang === 'ta' ? 'உள்நுழைக' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Partner Status & Duty Switcher Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white shadow-md space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-extrabold font-display border border-white/20 text-white shadow-inner">
              {helper.name.split(' ')[0][0]}
              {helper.name.split(' ')[1]?.[0] || ''}
            </div>
            <div>
              <div className="text-[11px] text-emerald-200">
                {lang === 'ta' ? 'வணக்கம்' : 'Good Morning,'}
              </div>
              <h1 className="text-xl font-bold tracking-tight font-display text-white">
                {helper.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-emerald-100 mt-0.5">
                <span className="flex items-center gap-0.5 font-bold text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  {helper.rating}
                </span>
                <span>·</span>
                <span>{helper.locality}</span>
                <span>·</span>
                <span>{helper.completedJobs} {lang === 'ta' ? 'பணிகள் முடிந்தது' : 'visits done'}</span>
              </div>
            </div>
          </div>

          {helper.isChildcareVerified && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-900 text-[10px] font-bold shrink-0">
              🛡️ {lang === 'ta' ? 'குழந்தை பராமரிப்பு' : 'Kids Verified'}
            </span>
          )}
        </div>

        {/* Real-time Duty Switcher */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <div className="text-[11px] font-semibold text-emerald-200 flex items-center justify-between">
            <span>{lang === 'ta' ? 'உங்கள் நிலைமை:' : 'Your Duty Status:'}</span>
            <span className="font-bold text-white capitalize">
              {helper.availabilityStatus === 'available_now'
                ? lang === 'ta' ? 'இப்போது கிடைக்கும்' : 'Available Now (Online)'
                : helper.availabilityStatus === 'available_today'
                ? lang === 'ta' ? 'இன்று மட்டும்' : 'Today Only'
                : lang === 'ta' ? 'விடுமுறை' : 'Off Duty'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
            <button
              onClick={() => onUpdateAvailability('available_now')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                helper.availabilityStatus === 'available_now'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              <span>{lang === 'ta' ? 'இப்போது தயார்' : 'Available Now'}</span>
            </button>

            <button
              onClick={() => onUpdateAvailability('available_today')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                helper.availabilityStatus === 'available_today'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              <span>{lang === 'ta' ? 'இன்று மட்டும்' : 'Today Only'}</span>
            </button>

            <button
              onClick={() => onUpdateAvailability('off_duty')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                helper.availabilityStatus === 'off_duty'
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-stone-400"></span>
              <span>{lang === 'ta' ? 'விடுமுறை' : 'Off Duty'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Notice Banner */}
      {cancellationSubmittedNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1 animate-in fade-in">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ta' ? 'தகவல் அனுப்பப்பட்டது' : 'Customer & System Alerted'}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            {cancellationSubmittedNotice}
          </p>
        </div>
      )}

      {/* 3. Sub-Navigation Tabs: Schedule / Live | Earnings | Asking Rates | Profile */}
      <div className="flex items-center p-1 bg-stone-100 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'schedule'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{lang === 'ta' ? 'பணிகள்' : 'Visits'}</span>
          {activeAndUpcomingBookings.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
              {activeAndUpcomingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'earnings'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{lang === 'ta' ? 'வருமானம்' : 'Earnings'}</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'rates'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>{lang === 'ta' ? 'கட்டணங்கள்' : 'My Rates'}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'profile'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{lang === 'ta' ? 'சரிபார்ப்பு' : 'Verification'}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SCHEDULE & LIVE VISIT FLOW (Critical Core Feature)      */}
      {/* ============================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* CUSTOMER ASSIGNMENT CONFIRMATION BANNER */}
          {primaryBooking && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>{lang === 'ta' ? 'வாடிக்கையாளர் உங்களை தேர்வு செய்துள்ளார்' : 'Customer Selected This Helper'}</span>
                    <span className="font-mono text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                      {primaryBooking.bookingCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    <strong className="font-semibold text-emerald-950">{primaryCustomer?.name || 'Customer'}</strong> selected you for a {primaryBooking.durationHours}h visit at {primaryBooking.apartmentName}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider shrink-0 ${
                primaryBooking.status === 'started'
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-emerald-200 text-emerald-900'
              }`}>
                {primaryBooking.status.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* EMPTY STATE IF NO BOOKINGS ASSIGNED YET */}
          {!primaryBooking && (
            <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                📅
              </div>
              <div className="font-bold text-stone-900 text-sm">
                {lang === 'ta' ? 'தற்போது பணிகள் ஒதுக்கப்படவில்லை' : 'No Active Shifts Assigned Yet'}
              </div>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {lang === 'ta'
                  ? 'வாடிக்கையாளர் உங்களை தேர்வு செய்தவுடன், அந்த பணியின் நேரம், முகவரி மற்றும் OTP சரிபார்ப்பு விவரங்கள் இங்கே தோன்றும்.'
                  : `Once a customer chooses ${helper.name} in ZUNO, the arrival deadline, flat location, chore checklist, and OTP station will appear right here.`}
              </p>
            </div>
          )}

          {/* WORK-SPECIFIC BOOKING — no time-slot scheduling */}
      {primaryBooking && (
        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-stone-500">Assigned customer</div>
              <div className="text-lg font-black text-stone-900">{primaryCustomer?.name || 'Customer not found'}</div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">{primaryBooking.priceNegotiationStatus || primaryBooking.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="text-xs text-stone-600 space-y-1">
            <div><b>Booking:</b> {primaryBooking.bookingCode}</div>
            <div><b>Work date:</b> {primaryBooking.scheduledDate}</div>
            <div><b>Location:</b> {primaryBooking.flat}, {primaryBooking.block}, {primaryBooking.apartmentName}, {primaryBooking.locality}</div>
            <div><b>Customer offer:</b> ₹{primaryBooking.customerOfferPrice ?? primaryBooking.negotiatedAgreedPrice ?? primaryBooking.pricing.totalAmount}</div>
          </div>
          {primaryBooking.priceNegotiationStatus === 'pending_helper' && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button onClick={() => { onUpdateBookingStatus(primaryBooking.id, 'helper_assigned'); setPriceNotice('₹' + (primaryBooking.customerOfferPrice || primaryBooking.pricing.totalAmount) + ' accepted. Customer can now proceed.'); }} className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Accept</button>
              <button onClick={() => { const n=Number(counterPrice); if(n>0){ const updated=(window as any); void updated; } }} className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold">Counter</button>
              <button onClick={() => { onUpdateBookingStatus(primaryBooking.id, 'cancelled'); setPriceNotice('Customer was notified that the offer was declined.'); }} className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold">Decline</button>
            </div>
          )}
          {primaryBooking.priceNegotiationStatus === 'countered' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">Your counter: <b>₹{primaryBooking.helperCounterPrice}</b>. Waiting for Gayathri to respond.</div>
          )}
          {priceNotice && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">{priceNotice}</div>}
        </div>
      )}

      {/* Exact Target Arrival Time Clock */}
              <div className="p-3.5 rounded-2xl bg-white border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    {lang === 'ta' ? 'கண்டிப்பாக சென்றடைய வேண்டிய நேரம்:' : 'Target Arrival Deadline:'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight flex items-baseline gap-2">
                    <span>
                      {/* Calculate arrival time buffer: 15 mins prior to slot */}
                      {primaryBooking.scheduledSlot.includes('10:00 AM')
                        ? '09:45 AM'
                        : primaryBooking.scheduledSlot.includes('08:00 AM')
                        ? '07:45 AM'
                        : primaryBooking.scheduledSlot.includes('02:00 PM')
                        ? '01:45 PM'
                        : '04:45 PM'}
                    </span>
                    <span className="text-xs font-bold text-amber-600 font-sans">
                      (15m early buffer)
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5">
                    {lang === 'ta' ? 'திட்டமிடப்பட்ட பணி தொடக்கம்:' : 'Visit scheduled start:'}{' '}
                    <span className="font-semibold">{primaryBooking.scheduledSlot}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold">
                    <Timer className="w-3.5 h-3.5 text-amber-700" />
                    <span>~42 mins left</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    1.8 km · ~8–10m travel
                  </div>
                </div>
              </div>

              {/* Exact Location & Flat Details */}
              <div className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-2 text-xs">
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-800">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span>
                      {primaryBooking.flat}, {primaryBooking.block}, {primaryBooking.apartmentName}
                    </span>
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">
                    Payout: ₹{primaryBooking.pricing.helperPayout}
                  </span>
                </div>

                <div className="text-stone-600 text-[11px] pl-5.5 space-y-0.5">
                  <div>Locality: <span className="font-semibold text-stone-800">{primaryBooking.locality}, Chennai</span></div>
                  <div>Customer: <span className="font-semibold text-stone-800">{primaryCustomer?.name || 'Customer'}</span></div>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                    <span>Phone:</span>
                    <span className="font-mono text-stone-700">{maskPhoneNumber(primaryCustomer?.phone)}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">Privacy Masked</span>
                  </div>
                  {primaryBooking.customerNotes && (
                    <div className="p-1.5 rounded-lg bg-stone-50 text-[10px] text-stone-600 border border-stone-200 italic mt-1">
                      Note: &ldquo;{primaryBooking.customerNotes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Today's Job Work Scope Breakdown */}
                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center justify-between text-xs">
                    <span>{lang === 'ta' ? "இன்றைய பணி (Today's Job):" : "Today's Job:"}</span>
                    <span className="font-mono text-emerald-700 font-bold text-[11px]">
                      {lang === 'ta' ? 'இறுதி ஒப்புதல் தொகை: ' : 'Final agreed price: '}₹{primaryBooking.pricing.totalAmount}
                    </span>
                  </div>

                  {primaryBooking.workScopeBreakdown ? (
                    <div className="space-y-1.5">
                      {primaryBooking.workScopeBreakdown.homeCleaning && (
                        <div className="p-2 bg-stone-50 rounded-xl border border-stone-200 space-y-0.5">
                          <div className="font-bold text-stone-800 flex items-center gap-1.5 text-xs">
                            <span>🧹</span>
                            <span>Home Cleaning</span>
                          </div>
                          {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping && (
                            <div className="text-[11px] text-stone-600 pl-4 space-y-0.5">
                              <div>• {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.bedrooms} Bedrooms</div>
                              <div>• {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.halls} Hall / Living room</div>
                              <div>• {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.kitchens} Kitchen</div>
                              {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.balcony && <div>• Balcony</div>}
                              <div className="text-stone-500 capitalize">
                                ({primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.cleaningType} Cleaning)
                              </div>
                            </div>
                          )}
                          {primaryBooking.workScopeBreakdown.homeCleaning.dusting && <div className="text-[11px] text-stone-600 pl-4">• Dusting</div>}
                          {primaryBooking.workScopeBreakdown.homeCleaning.generalCleaning && <div className="text-[11px] text-stone-600 pl-4">• General Home Cleaning</div>}
                          {primaryBooking.workScopeBreakdown.homeCleaning.kitchenCleaning && <div className="text-[11px] text-stone-600 pl-4">• Kitchen Cleaning</div>}
                        </div>
                      )}

                      {primaryBooking.workScopeBreakdown.bathroomCleaning && (
                        <div className="p-2 bg-cyan-50/70 rounded-xl border border-cyan-200 space-y-0.5">
                          <div className="font-bold text-cyan-950 flex items-center gap-1.5 text-xs">
                            <span>🚿</span>
                            <span>Bathroom Cleaning (Separate Task)</span>
                          </div>
                          <div className="text-[11px] text-cyan-900 pl-4 space-y-0.5">
                            <div>• {primaryBooking.workScopeBreakdown.bathroomCleaning.config.bathroomCount} Bathrooms</div>
                            <div className="capitalize">• {primaryBooking.workScopeBreakdown.bathroomCleaning.config.cleaningType} Cleaning</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {primaryBooking.tasks.map((id) => {
                        const t = MASTER_TASKS.find((task) => task.id === id);
                        return (
                          <span key={id} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                            ✓ {t?.name || id}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons: Directions, Call, Mark On The Way */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(primaryBooking.apartmentName + ' ' + primaryBooking.locality + ' Chennai')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'ta' ? 'வழிசெலுத்தல் (வரைபடம்)' : 'Directions / Map'}</span>
                  </a>

                  <a
                    href={`tel:${primaryCustomer?.phone || '+919840512099'}`}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'ta' ? 'வாடிக்கையாளரை அழைக்கவும்' : 'Call Customer'}</span>
                  </a>
                </div>
              </div>

              {primaryBooking && primaryBooking.priceNegotiationStatus && (
            <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-900">Price negotiation</div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-900">{primaryBooking.priceNegotiationStatus}</span>
              </div>
              <div className="text-xs text-stone-600">Customer offer: <b>₹{primaryBooking.customerOfferPrice ?? primaryBooking.negotiatedAgreedPrice ?? primaryBooking.pricing.totalAmount}</b></div>
              {primaryBooking.priceNegotiationStatus === 'pending_helper' && (
                <>
                  <input type="number" min="1" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} placeholder="Counter price ₹" className="w-full p-2.5 rounded-xl border border-stone-300 text-xs" />
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => { onPriceResponse(primaryBooking.id, 'accept'); setPriceNotice('Offer accepted.'); }} className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Accept</button>
                    <button type="button" onClick={() => { const n = Number(counterPrice); if (n > 0) { onPriceResponse(primaryBooking.id, 'counter', n); setPriceNotice('Counter offer sent.'); } }} className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">Counter</button>
                    <button type="button" onClick={() => { onPriceResponse(primaryBooking.id, 'decline'); setPriceNotice('Offer declined.'); }} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">Decline</button>
                  </div>
                </>
              )}
              {primaryBooking.priceNegotiationStatus === 'countered' && <div className="text-xs text-amber-900">Your counter: <b>₹{primaryBooking.helperCounterPrice}</b>. Waiting for customer.</div>}
              {priceNotice && <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">{priceNotice}</div>}
            </div>
          )}

          {/* CRITICAL REQUIREMENT: NO LAST MINUTE SURPRISES PROTOCOL */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-950">
                      {lang === 'ta' ? 'நேரத்தில் செல்ல முடியவில்லையா? கடைசி நிமிட ஆச்சரியங்கள் வேண்டாம் கொள்கை' : "Can't Reach on Time? No Last-Minute Surprises Policy"}
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-800 mt-0.5">
                      {lang === 'ta'
                        ? 'உங்களுக்கு ஏதேனும் அவசரநிலை இருந்தால், தாமதிக்காமல் உடனே தகவல் தெரிவிக்கவும். வாடிக்கையாளர் மற்றொரு நபரைத் தேர்ந்தெடுக்கலாம் அல்லது ZUNO மாற்று நபரை ஒதுக்கும்.'
                        : 'If you have an emergency or delay, inform the customer immediately. Do not delay until the last minute. The customer can either let ZUNO assign a verified replacement or choose another person themselves.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCancellingBookingId(primaryBooking.id)}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ta' ? 'அவசரநிலை: வர முடியாது என அறிவிக்க (மாற்று ஏற்பாடு)' : "Inform Customer: I Can't Make It (Find Replacement)"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* CRITICAL REQUIREMENT: HOW OTP IS VISIBLE & ENTERED BY HELPERS */}
          {primaryBooking && (
            <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ta' ? 'வாடிக்கையாளர் வருகை & OTP சரிபார்ப்பு' : 'Customer Arrival & OTP Verification Station'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                  primaryBooking.status === 'started'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {primaryBooking.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Explanatory 3-step guide for how OTP works */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 space-y-0.5">
                  <div className="font-bold text-stone-700">1. {lang === 'ta' ? 'அடைதல்' : 'Reach Flat'}</div>
                  <div className="text-stone-500">Reach Flat {primaryBooking.flat || 'Apartment'}</div>
                </div>
                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 space-y-0.5">
                  <div className="font-bold text-stone-700">2. {lang === 'ta' ? 'கேளுங்கள்' : 'Ask OTP'}</div>
                  <div className="text-stone-500">Ask 4-digit code</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 space-y-0.5">
                  <div className="font-bold text-emerald-800">3. {lang === 'ta' ? 'உள்ளிடவும்' : 'Enter OTP'}</div>
                  <div className="text-emerald-600">Start paid timer</div>
                </div>
              </div>

              {/* Live Status Controls */}
              {primaryBooking.status !== 'started' && primaryBooking.status !== 'completed' && (
                <div className="space-y-2">
                  {primaryBooking.status === 'confirmed' && (
                    <button
                      onClick={() => onUpdateBookingStatus(primaryBooking.id, 'on_the_way')}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Car className="w-4 h-4" />
                      <span>{lang === 'ta' ? 'கிளம்புகிறேன் என குறிக்கவும் (On The Way)' : "Mark 'On The Way'"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveOtpBookingId(primaryBooking.id);
                      setEnteredOtp('');
                      setOtpError(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{lang === 'ta' ? 'வாடிக்கையாளர் OTP உள்ளிடவும் (பணி தொடங்க)' : 'Enter Customer OTP to Start Visit'}</span>
                  </button>
                </div>
              )}

              {/* Visit in progress live ticker */}
              {primaryBooking.status === 'started' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{lang === 'ta' ? 'பணி நடப்பில் உள்ளது' : 'Visit Currently in Progress'}</span>
                    </div>
                    <span className="font-mono text-emerald-800">
                      OTP Verified · Paid Timer Running
                    </span>
                  </div>

                  {/* Tasks to perform checklist & Separate Work Scope Display */}
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-stone-700 text-[11px] flex items-center justify-between">
                      <span>{lang === 'ta' ? 'செய்ய வேண்டிய பணிகள்:' : 'Chores & Work Scope for this visit:'}</span>
                      {primaryBooking.workScopeBreakdown && (
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                          Final agreed price: ₹{primaryBooking.pricing.totalAmount}
                        </span>
                      )}
                    </div>

                    {/* If structured Work Scope Breakdown exists, display Home Cleaning and Bathroom Cleaning separately */}
                    {primaryBooking.workScopeBreakdown ? (
                      <div className="space-y-2">
                        {primaryBooking.workScopeBreakdown.homeCleaning && (
                          <div className="p-2.5 rounded-xl bg-white border border-emerald-300 space-y-1">
                            <div className="font-bold text-stone-900 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-stone-800">
                                <span>🧹</span>
                                <span>Home Cleaning</span>
                              </span>
                              <span className="font-mono text-emerald-700">
                                ₹{primaryBooking.workScopeBreakdown.homeCleaning.price}
                              </span>
                            </div>
                            {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping && (
                              <div className="text-[11px] text-stone-600 pl-5 space-y-0.5">
                                <div>• {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.bedrooms} Bedrooms</div>
                                <div>• {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.halls} Hall / Living room</div>
                                <div>• {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.kitchens} Kitchen</div>
                                {primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.balcony && (
                                  <div>• Balcony</div>
                                )}
                                <div className="text-stone-500 capitalize">
                                  ({primaryBooking.workScopeBreakdown.homeCleaning.broomingMopping.cleaningType} Cleaning)
                                </div>
                              </div>
                            )}
                            {primaryBooking.workScopeBreakdown.homeCleaning.dusting && (
                              <div className="text-[11px] text-stone-600 pl-5">• Dusting</div>
                            )}
                            {primaryBooking.workScopeBreakdown.homeCleaning.generalCleaning && (
                              <div className="text-[11px] text-stone-600 pl-5">• General Home Cleaning</div>
                            )}
                            {primaryBooking.workScopeBreakdown.homeCleaning.kitchenCleaning && (
                              <div className="text-[11px] text-stone-600 pl-5">• Kitchen Cleaning</div>
                            )}
                          </div>
                        )}

                        {primaryBooking.workScopeBreakdown.bathroomCleaning && (
                          <div className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-300 space-y-1">
                            <div className="font-bold text-cyan-950 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>🚿</span>
                                <span>Bathroom Cleaning (Separate Task)</span>
                              </span>
                              <span className="font-mono text-cyan-800">
                                ₹{primaryBooking.workScopeBreakdown.bathroomCleaning.price}
                              </span>
                            </div>
                            <div className="text-[11px] text-cyan-900 pl-5 space-y-0.5">
                              <div>• {primaryBooking.workScopeBreakdown.bathroomCleaning.config.bathroomCount} Bathrooms</div>
                              <div className="capitalize">
                                • {primaryBooking.workScopeBreakdown.bathroomCleaning.config.cleaningType} Cleaning
                              </div>
                              <div className="text-[10px] text-cyan-700">
                                Scope: {Object.entries(primaryBooking.workScopeBreakdown.bathroomCleaning.config.scope)
                                  .filter(([_, v]) => !!v)
                                  .map(([k]) => k)
                                  .join(', ')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {primaryBooking.tasks.map((id) => {
                          const t = MASTER_TASKS.find((task) => task.id === id);
                          return (
                            <div
                              key={id}
                              className="p-1.5 rounded-lg bg-white border border-emerald-200 text-stone-800 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                              <span className="font-medium line-clamp-1">{t?.name || id}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onUpdateBookingStatus(primaryBooking.id, 'completed')}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'ta' ? 'பணி முடிந்தது & கணக்கு முடித்தல்' : 'Complete Visit & Submit Sign-off'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* All Assigned Visits List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>{lang === 'ta' ? 'அனைத்து பணிகள்' : 'All Assigned Shifts'} ({helperBookings.length})</span>
            </div>

            <div className="space-y-2">
              {helperBookings.map((b) => {
                const customer = customers.find((c) => c.id === b.customerId);
                const isSelected = primaryBooking?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBookingId(b.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 shadow-xs ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-400/20'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>{customer?.name || 'Customer'}</span>
                        <span className="font-mono text-[10px] text-stone-500">{b.bookingCode}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium capitalize ${
                          b.status === 'started'
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">
                            Current View
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {b.scheduledDate} · {b.scheduledSlot} · {b.apartmentName} ({b.flat})
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-700 text-sm">
                        ₹{b.pricing.helperPayout}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {b.durationHours}h visit
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EARNINGS & PAYOUTS                                       */}
      {/* ============================================================== */}
      {activeTab === 'earnings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ta' ? 'நேரடி வங்கி பரிமாற்றம்' : 'Direct Bank Payout Transparency'}</span>
              </span>
              <span className="font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100 text-[10px]">
                82% Direct Payout
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-white border border-emerald-100 text-center">
                <div className="text-[10px] text-stone-500">{lang === 'ta' ? 'இன்று' : 'Today'}</div>
                <div className="text-lg font-black text-stone-900 font-mono mt-0.5">
                  ₹{todayEarnings || 551}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-emerald-100 text-center">
                <div className="text-[10px] text-stone-500">{lang === 'ta' ? 'இந்த வாரம்' : 'This Week'}</div>
                <div className="text-lg font-black text-stone-900 font-mono mt-0.5">
                  ₹{totalPayout + 3250}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-emerald-100 text-center">
                <div className="text-[10px] text-stone-500">{lang === 'ta' ? 'இந்த மாதம்' : 'This Month'}</div>
                <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                  ₹{totalPayout + 14800}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed">
              {lang === 'ta'
                ? 'ஒவ்வொரு பணியின் தொகையிலும் 82% உங்கள் வங்கிக் கணக்கில் நேரடியாக வரவு வைக்கப்படுகிறது. மறைமுக பிடித்தங்கள் இல்லை.'
                : '82% of every customer visit bill is directly credited to your verified bank account. Zero hidden deductions.'}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ASKING RATES (What helper asks for each work)          */}
      {/* ============================================================== */}
      {activeTab === 'rates' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                {lang === 'ta' ? 'உங்கள் பணி கட்டணங்கள்' : 'My Asking Rates per Work'}
              </h2>
              <p className="text-stone-500 text-[11px]">
                {lang === 'ta' ? 'வாடிக்கையாளர்கள் உங்கள் கட்டணங்களைப் பார்த்து முன்பதிவு செய்வார்கள்.' : 'Customers compare these asking rates when choosing you.'}
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-stone-800 bg-stone-100 px-2 py-1 rounded-lg">
              Base: ₹{helper.hourlyRate || 249}/hr
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {workRates.map((wr) => (
              <div
                key={wr.category}
                className="p-3 rounded-2xl bg-white border border-stone-200 text-xs flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{wr.icon}</span>
                  <div>
                    <div className="font-bold text-stone-800">{wr.name}</div>
                    <div className="text-[10px] text-stone-500">{wr.tamilName}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-stone-900 text-sm">
                    ₹{wr.askingRate} <span className="text-[10px] text-stone-500 font-normal">/ hr</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    Payout: ₹{Math.round(wr.askingRate * 0.82)}/hr
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: VERIFICATION & PROFILE                                   */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-3xl bg-white border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900">Partner Verification Checklist</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                {helper.verificationStatus.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50">
                <span>Government ID (Aadhaar / Voter ID)</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50">
                <span>Chennai Address & Locality Verification</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Verified ({helper.locality})
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50">
                <span>Skills Assessment & Hygiene Training</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Certified
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50">
                <span>Kids Care Safety-First Screening</span>
                <span className={helper.isChildcareVerified ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-stone-400 font-medium'}>
                  {helper.isChildcareVerified ? '✓ Cleared' : 'Not Registered'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: OTP CHECK-IN MODAL FOR HELPER                         */}
      {/* ============================================================== */}
      {activeOtpBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4 text-xs border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-stone-900 font-display flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ta' ? 'வாடிக்கையாளர் 4-இலக்க OTP உள்ளிடவும்' : 'Enter 4-Digit Customer OTP'}</span>
              </div>
              <button
                onClick={() => setActiveOtpBookingId(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-stone-600 text-xs">
              {lang === 'ta'
                ? 'வாடிக்கையாளர் மொபைலில் உள்ள 4-இலக்க Start OTP குறியீட்டை கேட்டு உள்ளிடவும்.'
                : 'Ask customer for the 4-digit code shown on their ZUNO screen to officially start your paid visit.'}
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-3">
              <input
                type="text"
                maxLength={4}
                autoFocus
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="e.g. 4821"
                className="w-full text-center text-3xl tracking-widest font-mono font-black p-3.5 rounded-2xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Quick autofill helper for easy demo testing */}
              {primaryBooking?.startOtp && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(primaryBooking.startOtp)}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
                  >
                    Autofill Customer&apos;s OTP: {primaryBooking.startOtp} (Demo)
                  </button>
                </div>
              )}

              {otpError && (
                <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-medium text-center">
                  {otpError}
                </div>
              )}

              <button
                type="submit"
                disabled={enteredOtp.length !== 4}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {lang === 'ta' ? 'சரிபார்த்து பணியைத் தொடங்கு' : 'Verify & Officially Start Visit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EMERGENCY CANCELLATION ("NO LAST MINUTE SURPRISES")    */}
      {/* ============================================================== */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4 text-xs border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-rose-950 font-display flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{lang === 'ta' ? 'அவசர நிலை அறிவிப்பு' : 'Emergency Cancellation Notice'}</span>
              </div>
              <button
                onClick={() => setCancellingBookingId(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-1">
              <div className="font-bold">
                {lang === 'ta' ? 'வாடிக்கையாளர் பாதுகாப்பு கொள்கை:' : 'ZUNO Reliability Protocol:'}
              </div>
              <p>
                {lang === 'ta'
                  ? 'கடைசி நிமிட ஆச்சரியங்களைத் தவிர்க்க, உங்கள் அறிவிப்பு உடனடியாக வாடிக்கையாளருக்கு சென்று ZUNO மாற்று உதவியாளரைத் தேடும்.'
                  : 'To avoid leaving the customer waiting, your early notice will alert the customer immediately and allow them to choose a replacement or let ZUNO auto-dispatch.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">
                {lang === 'ta' ? 'காரணத்தைத் தேர்ந்தெடுக்கவும்:' : 'Select Emergency Reason:'}
              </label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium"
              >
                <option value="Sudden health emergency / fever">Sudden health emergency / fever</option>
                <option value="Urgent family emergency in home locality">Urgent family emergency in home locality</option>
                <option value="Vehicle breakdown / transport blockage">Vehicle breakdown / transport blockage</option>
                <option value="Delayed at previous customer visit">Delayed at previous customer visit</option>
              </select>
            </div>

            <button
              onClick={handleCancelSubmit}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              {lang === 'ta' ? 'வாடிக்கையாளருக்கு உடனடியாக அறிவிக்கவும்' : 'Confirm & Inform Customer Now'}
            </button>
          </div>
        </div>
      )}
  );
};
