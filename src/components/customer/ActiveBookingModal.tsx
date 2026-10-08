import React, { useState, useRef, useEffect } from 'react';
import { Booking, Helper, Customer } from '../../types';
import { MASTER_TASKS } from '../../data/services';
import { db } from '../../services/db';
import {
  X,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Heart,
  Repeat,
  LifeBuoy,
  KeyRound,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface ActiveBookingModalProps {
  booking: Booking | null;
  onClose: () => void;
  helper?: Helper;
  customer: Customer;
  helpers?: Helper[];
  onAcceptReplacement: (bookingId: string) => void;
  onChooseReplacementHelper?: (bookingId: string, helperId: string) => void;
  onSearchAlternativeHelpers?: (bookingId: string) => void;
  onChooseAlternativeAfterDecline?: (bookingId: string, helperId: string) => void;
  onVerifyOtp?: (bookingId: string, enteredOtp: string) => { success: boolean; message: string };
  onSwitchToHelperView?: () => void;
  onSubmitRating: (bookingId: string, ratingData: any) => void;
  onBookAgain: (booking: Booking) => void;
  onOpenSupport: (bookingId: string) => void;
  onToggleFavourite: (helperId: string) => void;
}

export const ActiveBookingModal: React.FC<ActiveBookingModalProps> = ({
  booking,
  onClose,
  helper,
  customer,
  helpers = [],
  onAcceptReplacement,
  onChooseReplacementHelper,
  onSearchAlternativeHelpers,
  onChooseAlternativeAfterDecline,
  onVerifyOtp,
  onSwitchToHelperView,
  onSubmitRating,
  onBookAgain,
  onOpenSupport,
  onToggleFavourite,
}) => {
  // Show manual replacement helper picker
  const [showHelperPicker, setShowHelperPicker] = useState<boolean>(false);
  const [counterInput, setCounterInput] = useState<string>('');

  // 4-digit OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const digitInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Reset OTP inputs when booking changes
  useEffect(() => {
    setOtpDigits(['', '', '', '']);
    setOtpError(null);
    setOtpSuccess(null);
  }, [booking?.id, booking?.status]);

  // Rating form state
  const [overallRating, setOverallRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [behaviourRating, setBehaviourRating] = useState<number>(5);
  const [taskCompletionRating, setTaskCompletionRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // OTP handlers
  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      setOtpError(null);
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 4).split('');
      const newDigits = [...otpDigits];
      chars.forEach((c, i) => {
        if (index + i < 4) newDigits[index + i] = c;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(index + chars.length, 3);
      digitInputRefs[nextFocus].current?.focus();
      setOtpError(null);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned[0];
    setOtpDigits(newDigits);
    setOtpError(null);

    if (index < 3) {
      digitInputRefs[index + 1].current?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = (codeToVerify?: string) => {
    if (!booking) return;
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 4) {
      setOtpError('Please enter all 4 digits of the start OTP code.');
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    const helperIdToUse = booking.helperId || helper?.id;
    if (!helperIdToUse) {
      setOtpError('No helper is assigned to this booking.');
      setIsVerifying(false);
      return;
    }
    const result = onVerifyOtp
      ? onVerifyOtp(booking.id, code)
      : db.verifyStartOtp(booking.id, code, helperIdToUse);

    if (result.success) {
      setOtpSuccess(result.message || 'OTP verified! Visit officially started.');
      setOtpError(null);
    } else {
      setOtpError(result.message || 'Invalid OTP code. The booking cannot move to Started.');
      setOtpSuccess(null);
    }
    setIsVerifying(false);
  };

  if (!booking) return null;

  const isFavourite = helper ? customer.favouriteHelperIds.includes(helper.id) : false;

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRating(booking.id, {
      overall: overallRating,
      punctuality: punctualityRating,
      quality: qualityRating,
      behaviour: behaviourRating,
      taskCompletion: taskCompletionRating,
      customerFeedback: feedback,
    });
    setRatingSubmitted(true);
  };

  const getStatusStepIndex = (status: Booking['status']) => {
    switch (status) {
      case 'requested':
        return 0;
      case 'confirmed':
      case 'helper_assigned':
        return 1;
      case 'on_the_way':
        return 2;
      case 'started':
        return 3;
      case 'completed':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStepIndex(booking.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-display text-stone-900">
                Booking Details
              </span>
              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                {booking.bookingCode}
              </span>
            </div>
            <div className="text-xs text-stone-500">
              {booking.scheduledDate} · {booking.scheduledSlot}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* ============================================================== */}
          {/* REPLACEMENT ENGINE NOTIFICATION CARD (If helper cancelled) */}
          {/* ============================================================== */}
          {booking.priceNegotiationStatus === 'declined' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
              <div>
                <div className="text-sm font-bold text-amber-900">
                  {helper?.name || 'The helper'} declined your offer
                </div>
                <div className="text-xs text-amber-800 mt-1">
                  Your booking is still here. We can search for another suitable helper for the same work and date.
                </div>
              </div>
              <button
                onClick={() => onSearchAlternativeHelpers?.(booking.id)}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                Find Other Helpers
              </button>

              {booking.replacement?.status === 'found' && booking.replacement.replacementHelperId && (
                <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-2">
                  {(() => {
                    const candidate = helpers.find((h) => h.id === booking.replacement?.replacementHelperId);
                    if (!candidate) return null;
                    return (
                      <>
                        <div className="text-xs font-bold text-stone-900">Suggested helper</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-stone-900">{candidate.name}</div>
                            <div className="text-[10px] text-stone-500">{candidate.locality} · {candidate.rating}★</div>
                          </div>
                          <button
                            onClick={() => onChooseAlternativeAfterDecline?.(booking.id, candidate.id)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                          >
                            Send ₹{booking.customerOfferPrice ?? booking.pricing.totalAmount} Offer
                          </button>
                        </div>
                        <div className="text-[10px] text-stone-500">
                          The new helper will receive your existing offer and can accept or counter.
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {booking.status === 'replacement_required' && booking.priceNegotiationStatus !== 'declined' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-amber-900">
                    No Last-Minute Surprises: Helper Reported an Emergency
                  </div>
                  <div className="text-xs text-amber-800 mt-0.5">
                    Your assigned helper gave early notice ({booking.cancellation?.reason || 'family emergency'}). Choose how you would like to proceed:
                  </div>
                </div>
              </div>

              {/* Option 1: Let ZUNO Choose (Recommended) */}
              {booking.replacement?.status === 'found' && (
                <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 text-xs">Option 1: Let ZUNO Choose (Recommended)</span>
                      <div className="text-[11px] text-stone-500">
                        Top matched eligible helper ready nearby:
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      {booking.replacement.matchScore}% Match
                    </span>
                  </div>

                  {(() => {
                    const repHelper = helpers.find((h) => h.id === booking.replacement?.replacementHelperId);
                    if (!repHelper) return null;
                    return (
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center">
                            {repHelper.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{repHelper.name}</div>
                            <div className="text-[10px] text-stone-500">
                              {repHelper.rating}★ · {repHelper.locality} · Asks ₹{repHelper.hourlyRate}/hr
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700">~20m ETA</span>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => onAcceptReplacement(booking.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept ZUNO Replacement Helper</span>
                  </button>
                </div>
              )}

              {/* Option 2: Choose Another Person Myself */}
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-xs">Option 2: Choose Another Helper Yourself</span>
                  <button
                    type="button"
                    onClick={() => setShowHelperPicker((prev) => !prev)}
                    className="text-[11px] font-bold text-orange-600 hover:underline"
                  >
                    {showHelperPicker ? 'Hide List' : 'Browse Available Helpers'}
                  </button>
                </div>

                {showHelperPicker && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-stone-500">
                      Select any available helper to take over this booking:
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {helpers
                        .filter(
                          (h) =>
                            h.id !== booking.helperId &&
                            h.id !== booking.cancellation?.previousHelperId &&
                            h.isActive
                        )
                        .slice(0, 5)
                        .map((h) => (
                          <div
                            key={h.id}
                            className="p-2 rounded-xl border border-stone-200 hover:border-orange-500 flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <div className="font-bold text-stone-900">{h.name}</div>
                              <div className="text-[10px] text-stone-500">
                                {h.locality} · {h.rating}★ · Asks ₹{h.hourlyRate}/hr
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (onChooseReplacementHelper) {
                                  onChooseReplacementHelper(booking.id, h.id);
                                } else {
                                  onAcceptReplacement(booking.id);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px]"
                            >
                              Choose
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: Reschedule or Cancel */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => onOpenSupport(booking.id)}
                  className="text-[11px] text-stone-600 hover:text-stone-900 underline"
                >
                  Or cancel visit with 100% instant refund
                </button>
              </div>
            </div>
          )}
          {/* PRICE NEGOTIATION STATE */}
          {booking.priceNegotiationStatus && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="text-[10px] uppercase tracking-wide font-bold text-amber-800">Price Negotiation</div>
              {booking.priceNegotiationStatus === 'pending_helper' && (
                <>
                  <div className="text-sm font-black text-stone-900">Your offer: ₹{booking.customerOfferPrice ?? booking.pricing.totalAmount}</div>
                  <div className="text-xs text-amber-900">Your offer has been sent to the helper. <b>You can safely close this page.</b> We’ll notify you once the helper responds.</div>
                  <div className="text-xs font-bold text-amber-800">Status: Pending from Helper</div>
                </>
              )}
              {booking.priceNegotiationStatus === 'countered' && (
                <>
                  <div className="text-sm font-black text-stone-900">Helper's counter offer: ₹{booking.helperCounterPrice}</div>
                  <div className="text-xs text-amber-900">Your original offer was ₹{booking.customerOfferPrice}. The helper has proposed ₹{booking.helperCounterPrice}. <b>The helper is not assigned yet.</b></div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" onClick={() => db.customerRespondToCounter(booking.id, customer.id, 'accept')} className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Accept ₹{booking.helperCounterPrice}</button>
                    <button type="button" onClick={onClose} className="py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold">Close</button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input type="number" min="1" placeholder="Counter price ₹" className="min-w-0 flex-1 p-2.5 rounded-xl border border-amber-300 bg-white text-xs" onChange={(event) => setCounterInput(event.target.value)} />
                    <button type="button" onClick={() => { const value=Number(counterInput); if(value>0){ db.customerRespondToCounter(booking.id, customer.id, 'counter', value); setCounterInput(''); } }} className="px-3 rounded-xl border border-amber-300 bg-white text-amber-900 text-xs font-bold">Counter</button>
                  </div>
                </>
              )}
              {booking.priceNegotiationStatus === 'accepted' && (
                <>
                  <div className="text-sm font-black text-emerald-800">Final agreed price: ₹{booking.negotiatedAgreedPrice ?? booking.pricing.totalAmount}</div>
                  <div className="text-xs text-emerald-800 font-semibold">Helper accepted the negotiation. Your booking is confirmed with this final price.</div>
                </>
              )}
              {booking.priceNegotiationStatus === 'declined' && (
                <div className="text-xs text-rose-800 font-semibold">The helper declined the price offer. This booking is not confirmed.</div>
              )}
            </div>
          )}


          {/* ============================================================== */}
          {/* PROGRESS TRACKER BAR */}
          {/* ============================================================== */}
          {booking.status !== 'replacement_required' && booking.status !== 'cancelled' && (
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span>Visit Status</span>
                <span className="text-orange-600 capitalize">
                  {booking.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Progress milestones */}
              <div className="grid grid-cols-4 gap-1 text-center">
                {['Confirmed', 'On the way', 'Started', 'Completed'].map((label, idx) => {
                  const isDone = currentStep >= idx + 1;
                  const isCurrent = currentStep === idx + 1;

                  return (
                    <div key={label} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isDone
                            ? 'bg-orange-600'
                            : isCurrent
                            ? 'bg-orange-400'
                            : 'bg-stone-200'
                        }`}
                      />
                      <div
                        className={`text-[10px] ${
                          isCurrent
                            ? 'font-bold text-orange-600'
                            : isDone
                            ? 'font-semibold text-stone-700'
                            : 'text-stone-400'
                        }`}
                      >
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* OTP CHECK-IN CARD & 4-DIGIT VERIFICATION ENTRY FIELD */}
          {/* ============================================================== */}
          {['confirmed', 'helper_assigned', 'on_the_way'].includes(booking.status) && booking.priceNegotiationStatus !== 'pending_helper' && booking.priceNegotiationStatus !== 'countered' && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-orange-50/80 to-amber-50/60 border-2 border-orange-200/90 space-y-3.5">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">Start Visit OTP Code</div>
                    <div className="text-[11px] text-stone-500">Arrival security verification</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">
                  4-Digit OTP Required
                </span>
              </div>

              {/* Shareable OTP Display */}
              <div className="p-3 bg-white rounded-xl border border-orange-200 text-center shadow-xs">
                <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                  Customer Code to Share with Helper
                </div>
                <div className="text-3xl font-black tracking-[0.25em] font-mono text-orange-600 my-1">
                  {booking.startOtp}
                </div>
                <p className="text-[11px] text-stone-600 max-w-sm mx-auto">
                  Share this 4-digit code with <strong className="text-stone-800">{helper?.name || 'your assigned helper'}</strong> upon arrival. The visit will only move to <strong className="text-stone-900">&quot;Started&quot;</strong> after successful OTP verification.
                </p>
              </div>

              {/* 4-Digit OTP Entry Field */}
              <div className="pt-2 border-t border-orange-200/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                    <span>Enter 4-Digit OTP on Arrival:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = booking.startOtp.slice(0, 4).split('');
                      setOtpDigits(digits);
                      setOtpError(null);
                    }}
                    className="text-[11px] font-semibold text-orange-700 hover:text-orange-900 hover:underline flex items-center gap-1"
                  >
                    <span>Autofill ({booking.startOtp})</span>
                  </button>
                </div>

                {/* 4 Segmented Digit Input Boxes */}
                <div className="flex justify-center items-center gap-2.5 sm:gap-3 py-1">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={digitInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={`w-12 h-13 text-center text-xl font-mono font-black rounded-xl border-2 transition-all outline-none ${
                        digit
                          ? 'border-orange-500 bg-white text-orange-900 shadow-xs'
                          : 'border-stone-300 bg-white text-stone-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                      }`}
                      placeholder="·"
                    />
                  ))}
                </div>

                {/* Error feedback */}
                {otpError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Verification Failed:</span> {otpError}
                      <div className="text-[11px] text-rose-700 mt-0.5">
                        Status remains <span className="font-mono font-bold uppercase">{booking.status.replace(/_/g, ' ')}</span> until valid OTP is verified.
                      </div>
                    </div>
                  </div>
                )}

                {/* Success feedback */}
                {otpSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">{otpSuccess}</span>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="button"
                  disabled={otpDigits.join('').length < 4 || isVerifying}
                  onClick={() => handleVerifyOtp()}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
                    otpDigits.join('').length === 4
                      ? 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer hover:shadow-md'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying OTP...' : 'Verify OTP & Start Visit'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Visit In Progress Live State */}
          {booking.status === 'started' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2.5">
              <div className="flex items-center justify-between text-emerald-900 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Visit In Progress</span>
                </div>
                <span className="font-mono text-xs">
                  Started at {new Date(booking.timestamps.startedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified with 4-Digit Arrival OTP: <strong className="font-mono font-bold">{booking.startOtp}</strong></span>
              </div>
              <p className="text-xs text-emerald-800">
                Your helper is currently performing your requested chores in your home. You can track progress or submit sign-off upon completion.
              </p>
            </div>
          )}

          {/* ============================================================== */}
          {/* HELPER PROFILE CARD */}
          {/* ============================================================== */}
          {helper && (
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 font-bold text-base flex items-center justify-center font-display">
                  {helper.name.split(' ')[0][0]}
                  {helper.name.split(' ')[1]?.[0] || ''}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">{helper.name}</span>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{helper.rating}</span>
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 mt-0.5">
                    {helper.locality} · {helper.experienceYears} yrs exp · {helper.completedJobs} visits
                  </div>
                  {booking.priceNegotiationStatus !== 'accepted' && (
                    <div className="text-[10px] text-amber-700 font-semibold mt-1">
                      Selected helper · assignment is pending final price agreement
                    </div>
                  )}

                  {helper.isChildcareVerified && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold mt-1">
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      <span>Kids Care Verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onSwitchToHelperView && (
                  <button
                    type="button"
                    onClick={onSwitchToHelperView}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 transition-all"
                    title="View how this booking appears on the helper's app"
                  >
                    <span>Helper View</span>
                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                  </button>
                )}
                <button
                  onClick={() => onToggleFavourite(helper.id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isFavourite
                      ? 'bg-rose-50 border-rose-200 text-rose-500'
                      : 'border-stone-200 text-stone-400 hover:text-stone-600'
                  }`}
                  title={isFavourite ? 'In your favourites' : 'Add to favourite helpers'}
                >
                  <Heart className={`w-4 h-4 ${isFavourite ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TASKS INCLUDED */}
          {/* ============================================================== */}
          <div className="space-y-2">
            <div className="font-bold text-stone-700">Scheduled Work Items & Chores</div>
            {booking.workScopeBreakdown ? (
              <div className="space-y-2">
                {booking.workScopeBreakdown.homeCleaning && (
                  <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-stone-900">
                      <span className="flex items-center gap-1.5 text-orange-700">
                        <span>🧹</span>
                        <span>Home Cleaning</span>
                      </span>
                      <span className="font-mono">₹{booking.workScopeBreakdown.homeCleaning.price}</span>
                    </div>
                    {booking.workScopeBreakdown.homeCleaning.broomingMopping && (
                      <div className="text-[11px] text-stone-600 pl-5 space-y-0.5">
                        <div>• {booking.workScopeBreakdown.homeCleaning.broomingMopping.bedrooms} Bedrooms</div>
                        <div>• {booking.workScopeBreakdown.homeCleaning.broomingMopping.halls} Hall / Living room</div>
                        <div>• {booking.workScopeBreakdown.homeCleaning.broomingMopping.kitchens} Kitchen</div>
                        {booking.workScopeBreakdown.homeCleaning.broomingMopping.balcony && <div>• Balcony floor</div>}
                        <div className="text-stone-500 capitalize">
                          ({booking.workScopeBreakdown.homeCleaning.broomingMopping.cleaningType} Cleaning)
                        </div>
                      </div>
                    )}
                    {booking.workScopeBreakdown.homeCleaning.dusting && (
                      <div className="text-[11px] text-stone-600 pl-5">• Dusting</div>
                    )}
                    {booking.workScopeBreakdown.homeCleaning.generalCleaning && (
                      <div className="text-[11px] text-stone-600 pl-5">• General Home Cleaning</div>
                    )}
                    {booking.workScopeBreakdown.homeCleaning.kitchenCleaning && (
                      <div className="text-[11px] text-stone-600 pl-5">• Kitchen Counter Cleaning</div>
                    )}
                  </div>
                )}

                {booking.workScopeBreakdown.bathroomCleaning && (
                  <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-cyan-950">
                      <span className="flex items-center gap-1.5 text-cyan-800">
                        <span>🚿</span>
                        <span>Bathroom Cleaning (Separate Task)</span>
                      </span>
                      <span className="font-mono">₹{booking.workScopeBreakdown.bathroomCleaning.price}</span>
                    </div>
                    <div className="text-[11px] text-cyan-900 pl-5 space-y-0.5">
                      <div>• {booking.workScopeBreakdown.bathroomCleaning.config.bathroomCount} Bathrooms</div>
                      <div className="capitalize">• {booking.workScopeBreakdown.bathroomCleaning.config.cleaningType} Cleaning</div>
                      <div className="text-cyan-700 text-[10px]">
                        Scope: {Object.entries(booking.workScopeBreakdown.bathroomCleaning.config.scope)
                          .filter(([_, v]) => !!v)
                          .map(([k]) => k)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap gap-1.5">
                {booking.tasks.map((id) => {
                  const t = MASTER_TASKS.find((task) => task.id === id);
                  return (
                    <span
                      key={id}
                      className="px-2.5 py-1 rounded-md bg-white border border-stone-200 text-stone-800 font-medium"
                    >
                      ✓ {t?.name || id}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Location & Instructions */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
            <div className="flex items-center gap-1 text-stone-700 font-bold">
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              <span>
                {booking.flat}, {booking.block}, {booking.apartmentName}, {booking.locality}
              </span>
            </div>
            {booking.customerNotes && (
              <div className="text-[11px] text-stone-600 italic">
                &ldquo;{booking.customerNotes}&rdquo;
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 space-y-1.5">
            <div className="flex justify-between font-bold text-stone-900">
              <span>Total Bill Amount ({booking.durationHours} hrs visit)</span>
              <span className="font-mono text-orange-600 font-black text-sm">
                ₹{booking.pricing.totalAmount}
              </span>
            </div>
            <div className="text-[10px] text-stone-500 flex justify-between">
              <span>Helper Payout: ₹{booking.pricing.helperPayout}</span>
              <span>Platform Fee: ₹{booking.pricing.zunoFee}</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RATING FORM (When Completed) */}
          {/* ============================================================== */}
          {booking.status === 'completed' && !booking.rating && !ratingSubmitted && (
            <form onSubmit={handleRatingSubmit} className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
              <div className="font-bold text-stone-900 text-xs">Rate your visit experience</div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600">Overall Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= overallRating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share a few words about the quality, punctuality and service..."
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-stone-200 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
              >
                Submit Review & Feedback
              </button>
            </form>
          )}

          {/* Existing Rating Display */}
          {(booking.rating || ratingSubmitted) && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>Your Review</span>
                <span className="flex items-center gap-0.5 text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{booking.rating?.overall || overallRating}★</span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-900">
                &ldquo;{booking.rating?.customerFeedback || feedback || 'Great visit! Thoroughly satisfied.'}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-2">
          {/* Report an issue trigger */}
          <button
            type="button"
            onClick={() => onOpenSupport(booking.id)}
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1.5"
          >
            <LifeBuoy className="w-4 h-4 text-stone-400" />
            <span>Report Issue</span>
          </button>

          {/* Book Again if Completed */}
          {booking.status === 'completed' && (
            <button
              type="button"
              onClick={() => onBookAgain(booking)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Book Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
