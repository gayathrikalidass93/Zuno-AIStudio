import React, { useMemo, useState } from 'react';
import { Helper, Booking, Customer } from '../../types';
import { MASTER_TASKS } from '../../data/services';
import { getHelperWorkRatesBreakdown } from '../../services/helperRates';
import { maskPhoneNumber } from '../../services/privacy';
import { CheckCircle2, KeyRound, Languages, MapPin, Phone, ShieldCheck, Star, X } from 'lucide-react';

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
  onOpenAuth?: () => void;
  onPriceResponse?: (
    bookingId: string,
    action: 'accept' | 'counter' | 'decline',
    counterPrice?: number
  ) => void;
}

export const HelperPortal: React.FC<HelperPortalProps> = ({
  helper,
  bookings,
  customers,
  onUpdateAvailability,
  onVerifyOtp,
  onUpdateBookingStatus,
  onCancelWithEmergency,
  onOpenAuth,
  onPriceResponse,
}) => {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [tab, setTab] = useState<'work' | 'earnings' | 'rates' | 'profile'>('work');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [otpBookingId, setOtpBookingId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Sudden health emergency / fever');

  const helperBookings = useMemo(
    () => bookings.filter((booking) => booking.helperId === helper.id),
    [bookings, helper.id]
  );

  const activeBookings = helperBookings.filter(
    (booking) => booking.status !== 'cancelled' && booking.status !== 'completed'
  );
  const completedBookings = helperBookings.filter((booking) => booking.status === 'completed');

  const booking =
    (selectedBookingId
      ? helperBookings.find((item) => item.id === selectedBookingId)
      : undefined) ??
    activeBookings[0] ??
    null;

  const customer = booking
    ? customers.find((item) => item.id === booking.customerId)
    : undefined;

  const totalPayout = completedBookings.reduce(
    (sum, item) => sum + item.pricing.helperPayout,
    0
  );

  const rates = getHelperWorkRatesBreakdown(helper);

  const submitOtp = (event: React.FormEvent) => {
    event.preventDefault();
    if (!otpBookingId) return;
    const result = onVerifyOtp(otpBookingId, otp);
    if (result.success) {
      setOtpBookingId(null);
      setOtp('');
      setOtpError(null);
      setNotice('Visit started successfully.');
    } else {
      setOtpError(result.message);
    }
  };

  const respondToOffer = (action: 'accept' | 'counter' | 'decline') => {
    if (!booking) return;
    if (action === 'counter') {
      const value = Number(counterPrice);
      if (!Number.isFinite(value) || value <= 0) {
        setNotice('Enter a valid counter price.');
        return;
      }
      onPriceResponse?.(booking.id, action, value);
      setNotice(`Counter offer ₹${value} sent to the customer.`);
      return;
    }
    onPriceResponse?.(booking.id, action);
    if (action === 'accept') {
      setNotice('Offer accepted. Waiting for the customer to proceed.');
    } else {
      setNotice('Offer declined.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-emerald-800">ZUNO Partner</div>
          <div className="text-[11px] text-stone-500">
            {lang === 'ta' ? 'உதவியாளர் போர்டல்' : 'Helper Portal'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang((value) => (value === 'en' ? 'ta' : 'en'))}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800"
          >
            <Languages className="inline w-3.5 h-3.5 mr-1" />
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-bold"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <section className="p-4 rounded-3xl bg-emerald-900 text-white space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-200">Good Morning,</div>
            <h1 className="text-xl font-bold">{helper.name}</h1>
            <div className="text-xs text-emerald-100">{helper.locality}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-300 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" /> {helper.rating}
            </div>
            <div className="text-[10px] text-emerald-200">{helper.completedJobs} visits</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['available_now', 'available_today', 'off_duty'] as Helper['availabilityStatus'][]).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => onUpdateAvailability(status)}
                className={`py-2 rounded-xl text-[11px] font-bold ${
                  helper.availabilityStatus === status
                    ? 'bg-white text-emerald-900'
                    : 'bg-white/10 text-white'
                }`}
              >
                {status === 'available_now'
                  ? 'Available'
                  : status === 'available_today'
                    ? 'Today'
                    : 'Off Duty'}
              </button>
            )
          )}
        </div>
      </section>

      <nav className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-2xl text-xs font-bold">
        {([
          ['work', 'Assigned Work'],
          ['earnings', 'Earnings'],
          ['rates', 'My Rates'],
          ['profile', 'Verification'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`py-2 rounded-xl ${
              tab === value ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          {notice}
        </div>
      )}

      {tab === 'work' && (
        <section className="space-y-3">
          {!booking && (
            <div className="p-6 rounded-3xl bg-white border border-stone-200 text-center">
              <div className="font-bold text-stone-900">No assigned work</div>
              <div className="text-xs text-stone-500 mt-1">
                A customer booking assigned to this helper will appear here.
              </div>
            </div>
          )}

          {booking && (
            <>
              <div className="p-4 rounded-3xl bg-white border border-stone-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide font-bold text-stone-500">
                      Assigned customer
                    </div>
                    <div className="text-lg font-black text-stone-900">
                      {customer?.name || 'Customer'}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs text-stone-600 space-y-1">
                  <div><b>Booking:</b> {booking.bookingCode}</div>
                  <div><b>Work date:</b> {booking.scheduledDate}</div>
                  <div className="flex gap-1 items-start">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{booking.flat}, {booking.block}, {booking.apartmentName}, {booking.locality}</span>
                  </div>
                  {customer?.phone && (
                    <div className="flex gap-1 items-center">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{maskPhoneNumber(customer.phone)}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Price negotiation</div>
                  <div className="text-sm font-black text-stone-900 mt-1">
                    Customer offer: ₹{booking.customerOfferPrice ?? booking.negotiatedAgreedPrice ?? booking.pricing.totalAmount}
                  </div>

                  {booking.priceNegotiationStatus === 'pending_helper' && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="number"
                        min="1"
                        value={counterPrice}
                        onChange={(event) => setCounterPrice(event.target.value)}
                        placeholder="Counter price ₹"
                        className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => respondToOffer('accept')}
                          className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToOffer('counter')}
                          className="p-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold"
                        >
                          Counter
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToOffer('decline')}
                          className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {booking.priceNegotiationStatus === 'countered' && (
                    <div className="mt-2 text-xs text-amber-900">
                      Your counter: <b>₹{booking.helperCounterPrice}</b>. Waiting for customer.
                    </div>
                  )}

                  {booking.priceNegotiationStatus === 'accepted' && (
                    <div className="mt-2 text-xs text-emerald-800 font-semibold">
                      Final agreed price: ₹{booking.negotiatedAgreedPrice ?? booking.pricing.totalAmount}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="text-xs font-bold text-stone-800">Work scope</div>
                  {booking.workScope ? (
                    <div className="text-[11px] text-stone-600 mt-1 space-y-0.5">
                      {'bedrooms' in booking.workScope && <div>Bedrooms: {booking.workScope.bedrooms}</div>}
                      {'halls' in booking.workScope && <div>Halls / living rooms: {booking.workScope.halls}</div>}
                      {'kitchens' in booking.workScope && <div>Kitchens: {booking.workScope.kitchens}</div>}
                      {'bathrooms' in booking.workScope && <div>Bathrooms: {booking.workScope.bathrooms}</div>}
                      {'cleaningType' in booking.workScope && <div>Cleaning: {booking.workScope.cleaningType}</div>}
                    </div>
                  ) : (
                    <div className="text-[11px] text-stone-500 mt-1">
                      {booking.tasks
                        .map((id) => MASTER_TASKS.find((task) => task.id === id)?.name || id)
                        .join(', ')}
                    </div>
                  )}
                </div>

                {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                  <div className="grid grid-cols-2 gap-2">
                    {booking.status !== 'started' && (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpBookingId(booking.id);
                          setOtp('');
                          setOtpError(null);
                        }}
                        className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        <KeyRound className="inline w-4 h-4 mr-1" />
                        Enter OTP
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCancelBookingId(booking.id)}
                      className="py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"
                    >
                      Can't Make It
                    </button>
                    {booking.status === 'started' && (
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(booking.id, 'completed')}
                        className="col-span-2 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold"
                      >
                        <CheckCircle2 className="inline w-4 h-4 mr-1" />
                        Complete Work
                      </button>
                    )}
                  </div>
                )}
              </div>

              {helperBookings.length > 1 && (
                <div className="space-y-2">
                  {helperBookings.map((item) => {
                    const itemCustomer = customers.find((c) => c.id === item.customerId);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedBookingId(item.id)}
                        className={`w-full text-left p-3 rounded-2xl border text-xs ${
                          item.id === booking.id
                            ? 'bg-emerald-50 border-emerald-400'
                            : 'bg-white border-stone-200'
                        }`}
                      >
                        <b>{itemCustomer?.name || 'Customer'}</b>
                        <span className="text-stone-500"> · {item.scheduledDate} · {item.bookingCode}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'earnings' && (
        <section className="p-4 rounded-3xl bg-white border border-stone-200 space-y-2">
          <div className="text-xs text-stone-500">Completed payout</div>
          <div className="text-3xl font-black text-emerald-800">₹{totalPayout}</div>
          <div className="text-xs text-stone-500">{completedBookings.length} completed jobs</div>
        </section>
      )}

      {tab === 'rates' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rates.map((rate) => (
            <div key={rate.category} className="p-3 rounded-2xl bg-white border border-stone-200">
              <div className="font-bold text-sm">{rate.icon} {rate.name}</div>
              <div className="text-xs text-stone-500">₹{rate.askingRate} / hr</div>
            </div>
          ))}
        </section>
      )}

      {tab === 'profile' && (
        <section className="p-4 rounded-3xl bg-white border border-stone-200 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verification
          </div>
          <div className="text-stone-600">
            Status: <b>{helper.verificationStatus}</b>
          </div>
          <div className="text-stone-600">Locality: <b>{helper.locality}</b></div>
          <div className="text-stone-600">Languages: <b>{helper.languages?.join(', ') || 'Not specified'}</b></div>
        </section>
      )}

      {otpBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={submitOtp} className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <b>Enter customer OTP</b>
              <button type="button" onClick={() => setOtpBookingId(null)}><X className="w-5 h-5" /></button>
            </div>
            <input
              autoFocus
              maxLength={4}
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className="w-full p-4 text-center text-3xl tracking-widest font-mono border rounded-2xl"
              placeholder="0000"
            />
            {otpError && <div className="text-xs text-rose-700">{otpError}</div>}
            <button
              type="submit"
              disabled={otp.length !== 4}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50"
            >
              Verify & Start Work
            </button>
          </form>
        </div>
      )}

      {cancelBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <b>Emergency cancellation</b>
              <button type="button" onClick={() => setCancelBookingId(null)}><X className="w-5 h-5" /></button>
            </div>
            <select
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              className="w-full p-3 rounded-xl border"
            >
              <option>Sudden health emergency / fever</option>
              <option>Urgent family emergency</option>
              <option>Transport blockage</option>
              <option>Delayed at previous visit</option>
            </select>
            <button
              type="button"
              onClick={() => {
                onCancelWithEmergency(cancelBookingId, cancelReason);
                setCancelBookingId(null);
                setNotice('Customer was informed and replacement matching can begin.');
              }}
              className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold"
            >
              Inform Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
