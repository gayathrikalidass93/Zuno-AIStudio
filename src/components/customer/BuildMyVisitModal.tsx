import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Helper, Booking, ServiceCategory, PricingConfig, Task } from '../../types';
import { SERVICE_CATEGORIES, MASTER_TASKS, CHENNAI_LOCALITIES } from '../../data/services';
import { calculateTaskIntelligence } from '../../services/taskIntelligence';
import { calculatePricing } from '../../services/pricing';
import { matchHelpers } from '../../services/matching';
import {
  getHelperAskingRateForTask,
  getHelperEffectiveRateForTasks,
  getHelperWorkRatesBreakdown,
} from '../../services/helperRates';
import {
  X,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  AlertCircle,
  Info,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  Heart,
  Tag,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

interface BuildMyVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  helpers: Helper[];
  pricingConfig: PricingConfig;
  preselectedCategory?: ServiceCategory;
  preselectedTaskIds?: string[];
  initialHelperId?: string;
  onConfirmBooking: (newBookingData: any) => void;
}

export const BuildMyVisitModal: React.FC<BuildMyVisitModalProps> = ({
  isOpen,
  onClose,
  customer,
  helpers,
  pricingConfig,
  preselectedCategory,
  preselectedTaskIds,
  initialHelperId,
  onConfirmBooking,
}) => {
  // Step in wizard: 1 = Tasks & Time, 2 = Helper Selection, 3 = Review & Bill
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selected tasks state - ONLY select tasks explicitly chosen by the user!
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    preselectedTaskIds && preselectedTaskIds.length > 0 ? [...preselectedTaskIds] : []
  );

  // Active category filter tab in step 1
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>(
    preselectedCategory || 'cleaning'
  );

  // Duration in hours (1-4)
  const [durationHours, setDurationHours] = useState<number>(1);

  // Helper sorting in Step 2: 'price_asc' | 'match' | 'rating' | 'distance'
  const [sortBy, setSortBy] = useState<'price_asc' | 'match' | 'rating' | 'distance'>('price_asc');

  // Date and slot
  const todayStr = new Date().toISOString().split('T')[0];
  const [scheduledDate, setScheduledDate] = useState<string>(todayStr);
  const [scheduledSlot, setScheduledSlot] = useState<string>('10:00 AM - 01:00 PM');

  // Address
  const [locality, setLocality] = useState<string>(customer.locality);
  const [apartmentName, setApartmentName] = useState<string>(customer.apartmentName);
  const [block, setBlock] = useState<string>(customer.block);
  const [flat, setFlat] = useState<string>(customer.flat);
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Mode: 'choose_helper' or 'let_zuno_choose'
  const [bookingMode, setBookingMode] = useState<'choose_helper' | 'let_zuno_choose'>('choose_helper');
  const [selectedHelperId, setSelectedHelperId] = useState<string | undefined>(initialHelperId);

  // Reset state cleanly whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      // Strictly set only what was passed, or empty array if none
      if (preselectedTaskIds && preselectedTaskIds.length > 0) {
        setSelectedTaskIds([...preselectedTaskIds]);
      } else {
        setSelectedTaskIds([]);
      }
      if (preselectedCategory) {
        setActiveCategory(preselectedCategory);
      }
      if (initialHelperId) {
        setSelectedHelperId(initialHelperId);
      } else {
        setSelectedHelperId(undefined);
      }
    }
  }, [isOpen, preselectedTaskIds, preselectedCategory, initialHelperId]);

  // Task Intelligence calculations
  const intelligence = useMemo(
    () => calculateTaskIntelligence(selectedTaskIds, durationHours),
    [selectedTaskIds, durationHours]
  );

  // Auto-sync duration with workload estimate when tasks change
  useEffect(() => {
    if (selectedTaskIds.length > 0) {
      setDurationHours(intelligence.recommendedHours);
    } else {
      setDurationHours(1);
    }
  }, [selectedTaskIds.length, intelligence.recommendedHours]);

  // Helpers matching engine results
  const matchResults = useMemo(
    () =>
      matchHelpers(helpers, {
        selectedTaskIds,
        locality,
        apartmentName,
        isUrgent: false,
        customer,
      }),
    [helpers, selectedTaskIds, locality, apartmentName, customer]
  );

  const eligibleMatches = matchResults.filter((m) => m.isEligible);
  const topHelper = eligibleMatches[0]?.helper;

  // Sorted helper matches for Step 2 based on asking rate for selected work
  const sortedMatches = useMemo(() => {
    const list = [...eligibleMatches];
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => {
        const rateA = getHelperEffectiveRateForTasks(a.helper, selectedTaskIds);
        const rateB = getHelperEffectiveRateForTasks(b.helper, selectedTaskIds);
        return rateA - rateB;
      });
    }
    if (sortBy === 'rating') {
      return list.sort((a, b) => b.helper.rating - a.helper.rating);
    }
    if (sortBy === 'distance') {
      return list.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return list.sort((a, b) => b.score - a.score);
  }, [eligibleMatches, sortBy, selectedTaskIds]);

  // Selected helper object
  const chosenHelper = useMemo(() => {
    if (selectedHelperId) {
      return helpers.find((h) => h.id === selectedHelperId);
    }
    return topHelper || helpers[0];
  }, [selectedHelperId, topHelper, helpers]);

  // Selected helper's asking rate for the customer's selected tasks!
  const chosenHelperAskingRate = useMemo(() => {
    if (!chosenHelper) return pricingConfig.baseHourlyRate;
    return getHelperEffectiveRateForTasks(chosenHelper, selectedTaskIds);
  }, [chosenHelper, selectedTaskIds, pricingConfig.baseHourlyRate]);

  // Pricing calculations using the chosen helper's specific asking rate
  const isWeekend = useMemo(() => {
    const day = new Date(scheduledDate).getDay();
    return day === 0 || day === 6;
  }, [scheduledDate]);

  const pricing = useMemo(
    () =>
      calculatePricing(
        durationHours,
        selectedTaskIds.length,
        false, // not urgent
        isWeekend,
        pricingConfig,
        chosenHelperAskingRate // Use helper's asking rate for the selected work!
      ),
    [durationHours, selectedTaskIds.length, isWeekend, pricingConfig, chosenHelperAskingRate]
  );

  // Selected task names string
  const selectedTaskNames = useMemo(() => {
    return selectedTaskIds
      .map((id) => MASTER_TASKS.find((t) => t.id === id)?.name || id)
      .join(', ');
  }, [selectedTaskIds]);

  if (!isOpen) return null;

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const exists = prev.includes(taskId);
      if (exists) {
        return prev.filter((id) => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleClearAllTasks = () => {
    setSelectedTaskIds([]);
  };

  const handleFinalSubmit = () => {
    const assignedHelperId =
      bookingMode === 'let_zuno_choose' ? topHelper?.id : selectedHelperId || topHelper?.id;

    onConfirmBooking({
      customerId: customer.id,
      helperId: assignedHelperId,
      status: assignedHelperId ? 'confirmed' : 'requested',
      tasks: selectedTaskIds,
      scheduledDate,
      scheduledSlot,
      durationHours,
      estimatedWorkloadMinutes: intelligence.totalEstimatedMinutes,
      bookingMode,
      isUrgent: false,
      locality,
      apartmentName,
      block,
      flat,
      customerNotes,
      pricing,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="p-1 rounded-lg hover:bg-stone-200 text-stone-600 transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-base font-bold text-stone-900 font-display flex items-center gap-2">
                <span>Build My Visit</span>
                <span className="text-[11px] font-medium text-stone-500 font-sans">
                  Step {step} of 3
                </span>
              </div>
              <div className="text-xs text-stone-500">
                {step === 1
                  ? 'Select chores & visit duration'
                  : step === 2
                  ? 'Compare what helpers ask for this work'
                  : 'Review workload & transparent bill'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm">
          {/* ============================================================== */}
          {/* STEP 1: TASK SELECTION & WORKLOAD ESTIMATE                    */}
          {/* ============================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              {/* CURRENTLY SELECTED CHORES BANNER (100% Strict Transparency - No extra tasks!) */}
              <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    <span>Selected for this visit ({selectedTaskIds.length}):</span>
                  </div>
                  {selectedTaskIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllTasks}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {selectedTaskIds.length === 0 ? (
                  <div className="text-xs text-stone-500 italic py-1">
                    No chores selected yet. Tap any chore below (e.g. Sweep floors) to add it to this visit.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTaskIds.map((id) => {
                        const t = MASTER_TASKS.find((task) => task.id === id);
                        if (!t) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-600 text-white text-xs font-semibold shadow-xs"
                          >
                            <span>{t.name}</span>
                            <span className="text-orange-200 text-[10px]">({t.estimatedMinutes}m)</span>
                            <button
                              type="button"
                              onClick={() => handleToggleTask(id)}
                              className="p-0.5 hover:bg-orange-700 rounded-full text-white"
                              title="Remove chore"
                            >
                              <X className="w-3 h-3 stroke-[3]" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-stone-500 font-medium pt-0.5">
                      ✓ Exactly {selectedTaskIds.length} chore{selectedTaskIds.length === 1 ? '' : 's'} will be booked. No unrequested tasks will be added.
                    </div>
                  </div>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {SERVICE_CATEGORIES.map((cat) => {
                  const countInCategory = selectedTaskIds.filter(
                    (id) => MASTER_TASKS.find((t) => t.id === id)?.category === cat.id
                  ).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activeCategory === cat.id
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <span>
                        {cat.id === 'cleaning' && '🧹'}
                        {cat.id === 'cooking' && '🍳'}
                        {cat.id === 'laundry' && '👕'}
                        {cat.id === 'organisation' && '👗'}
                        {cat.id === 'family' && '👵'}
                        {cat.id === 'kids' && '👶'}
                      </span>
                      <span>{cat.name}</span>
                      {countInCategory > 0 && (
                        <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                          {countInCategory}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Special Category Notices */}
              {activeCategory === 'kids' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Safety-First Childcare Policy</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Kids care requires specialized screening. Only helpers with the{' '}
                    <span className="font-semibold">Kids Care Verified</span> badge will be eligible for this booking.
                  </p>
                </div>
              )}

              {/* Tasks List with Individual Work Rates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-600 uppercase tracking-wider">
                  <span>Available in {SERVICE_CATEGORIES.find((c) => c.id === activeCategory)?.name}</span>
                  <span className="text-stone-400 font-normal lowercase">tap to select or unselect</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MASTER_TASKS.filter((t) => t.category === activeCategory).map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);

                    if (task.isComingSoon) {
                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 opacity-60 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-stone-600">{task.name}</div>
                            <div className="text-[10px] text-stone-500">{task.tamilName}</div>
                          </div>
                          <span className="text-[10px] font-bold text-stone-500 uppercase px-2 py-0.5 rounded bg-stone-200">
                            Coming Soon
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 shadow-xs ${
                          isSelected
                            ? 'bg-orange-50/80 border-orange-500 text-stone-900 ring-1 ring-orange-500'
                            : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-stone-900 flex items-center gap-1.5">
                            <span>{task.name}</span>
                            {task.isChildcareOnly && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">{task.tamilName}</div>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 pt-0.5">
                            <span>~{task.estimatedMinutes} mins</span>
                            <span>·</span>
                            <span className="font-semibold text-stone-700">
                              Helpers ask ~₹{task.estimatedRateApprox ? Math.round(task.estimatedRateApprox * 2.2) : 220}/hr
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-orange-600 text-white'
                              : 'border border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workload Duration Box */}
              <div className="p-4 rounded-2xl bg-stone-100/90 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-stone-900">
                      Workload Estimate ({selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'chore' : 'chores'})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-orange-700 font-mono">
                    {intelligence.formattedDuration}
                  </span>
                </div>

                <div className="text-xs text-stone-600 leading-relaxed">
                  {intelligence.feasibilityNotice}
                </div>

                {/* Duration Picker: 1, 2, 3, 4 Hours */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-semibold text-stone-700">
                    How much time do you need?
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((hrs) => {
                      const isOverloaded = intelligence.isOverloadedForSelectedHours(hrs);
                      const isSelected = durationHours === hrs;

                      return (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setDurationHours(hrs)}
                          className={`py-2 px-3 rounded-xl text-center text-xs font-bold transition-all relative ${
                            isSelected
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                          }`}
                        >
                          <div>{hrs} {hrs === 1 ? 'Hour' : 'Hours'}</div>
                          {hrs === intelligence.recommendedHours && (
                            <div className="text-[9px] font-normal opacity-90">Suggested</div>
                          )}
                          {isOverloaded && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: COMPARE WHAT HELPERS ASK FOR EACH WORK & CHOOSE       */}
          {/* ============================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Selected Work Summary */}
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-orange-950">
                    Your Selected Work ({selectedTaskIds.length}):
                  </div>
                  <div className="text-orange-900 font-medium text-[11px] mt-0.5 line-clamp-1">
                    {selectedTaskNames || 'None selected'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-orange-200/80 text-orange-900 font-bold text-[10px]">
                    {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'} Visit
                  </span>
                </div>
              </div>

              {/* Date & Slot selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>Select Date</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    min={todayStr}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Time Slot</span>
                  </label>
                  <select
                    value={scheduledSlot}
                    onChange={(e) => setScheduledSlot(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-medium"
                  >
                    <option value="08:00 AM - 11:00 AM">Morning (08:00 AM - 11:00 AM)</option>
                    <option value="10:00 AM - 01:00 PM">Mid-day (10:00 AM - 01:00 PM)</option>
                    <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                    <option value="05:00 PM - 08:00 PM">Evening (05:00 PM - 08:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Booking Mode Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBookingMode('choose_helper')}
                  className={`p-3 rounded-xl border text-left transition-all shadow-xs ${
                    bookingMode === 'choose_helper'
                      ? 'bg-orange-50/70 border-orange-500 text-stone-900 ring-1 ring-orange-500'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Choose a Helper Myself</span>
                    {bookingMode === 'choose_helper' && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Compare what each helper asks for this work and pick.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBookingMode('let_zuno_choose');
                    if (topHelper) setSelectedHelperId(topHelper.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all shadow-xs ${
                    bookingMode === 'let_zuno_choose'
                      ? 'bg-orange-50/70 border-orange-500 text-stone-900 ring-1 ring-orange-500'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Let ZUNO Choose Best Match</span>
                    {bookingMode === 'let_zuno_choose' && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Automatically assigns top-ranked eligible helper.
                  </div>
                </button>
              </div>

              {/* Sorting Filter Controls (Customer chooses based on helper asking rates!) */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs font-bold text-stone-800">
                  Available Helpers ({sortedMatches.length})
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-stone-500">Sort by:</span>
                  <button
                    type="button"
                    onClick={() => setSortBy('price_asc')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      sortBy === 'price_asc'
                        ? 'bg-orange-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Lowest Asking Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('match')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      sortBy === 'match'
                        ? 'bg-orange-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Best Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('rating')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      sortBy === 'rating'
                        ? 'bg-orange-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Top Rated
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('distance')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      sortBy === 'distance'
                        ? 'bg-orange-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Distance
                  </button>
                </div>
              </div>

              {/* Helper List with Clear Asking Rates by Work */}
              {sortedMatches.length === 0 ? (
                <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <div className="text-xs font-bold text-stone-800">
                    No matching helper found for all requested tasks
                  </div>
                  <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                    Try adjusting the time slot or task requirements to see available helpers.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMatches.map((match) => {
                    const h = match.helper;
                    const isSelected = selectedHelperId === h.id;
                    const askingRateForThisWork = getHelperEffectiveRateForTasks(h, selectedTaskIds);
                    const visitEstimatedTotal = askingRateForThisWork * durationHours;
                    const workRates = getHelperWorkRatesBreakdown(h);

                    // Check which requested tasks are matched
                    const matchedRequestedTasks = selectedTaskIds.filter((id) => h.skills.includes(id));

                    return (
                      <div
                        key={h.id}
                        onClick={() => {
                          setSelectedHelperId(h.id);
                          if (bookingMode === 'let_zuno_choose') {
                            setBookingMode('choose_helper');
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-2.5 ${
                          isSelected
                            ? 'bg-orange-50/70 border-orange-500 ring-2 ring-orange-500'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {/* Header: Identity, Rating & Asking Rate for This Work */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 font-bold text-base flex items-center justify-center font-display">
                                {h.name.split(' ')[0][0]}
                                {h.name.split(' ')[1]?.[0] || ''}
                              </div>
                              {h.isChildcareVerified && (
                                <div
                                  title="Kids Care Verified"
                                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px]"
                                >
                                  🛡️
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-stone-900">
                                  {h.name}
                                </span>
                                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>{h.rating}</span>
                                </span>
                              </div>

                              <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                                <span>{h.locality}</span>
                                <span>·</span>
                                <span>{match.distanceKm.toFixed(1)} km away</span>
                                <span>·</span>
                                <span>{h.completedJobs} visits</span>
                              </div>
                            </div>
                          </div>

                          {/* Helper's Specific Asking Rate for This Selected Work */}
                          <div className="text-right">
                            <div className="text-[10px] text-stone-500 font-medium">
                              Asks for this work:
                            </div>
                            <div className="text-base font-black text-stone-900 font-mono">
                              ₹{askingRateForThisWork} <span className="text-xs font-normal text-stone-500">/ hr</span>
                            </div>
                            <div className="text-xs font-bold text-orange-600 font-mono">
                              ₹{visitEstimatedTotal} <span className="text-[10px] text-stone-500 font-sans font-normal">({durationHours} hr visit)</span>
                            </div>
                          </div>
                        </div>

                        {/* Matched Tasks for this customer's booking */}
                        <div className="text-[11px] text-stone-600 flex flex-wrap gap-1 items-center">
                          <span className="font-semibold text-stone-700">Matched Tasks:</span>
                          {matchedRequestedTasks.map((id) => {
                            const t = MASTER_TASKS.find((task) => task.id === id);
                            return (
                              <span key={id} className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                                ✓ {t?.name || id}
                              </span>
                            );
                          })}
                        </div>

                        {/* WHAT THIS HELPER ASKS FOR EACH WORK (Full Category Breakdown) */}
                        <div className="pt-2 border-t border-stone-100 space-y-1">
                          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                            What this helper asks for each work:
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {workRates.map((wr) => {
                              // Highlight if this work category matches any of the customer's selected tasks!
                              const isCategorySelected = selectedTaskIds.some(
                                (id) => MASTER_TASKS.find((t) => t.id === id)?.category === wr.category
                              );

                              return (
                                <span
                                  key={wr.category}
                                  className={`px-2 py-0.5 rounded transition-all font-medium ${
                                    isCategorySelected
                                      ? 'bg-orange-100 text-orange-900 border border-orange-300 font-bold'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {wr.icon} {wr.name}: ₹{wr.askingRate}/hr
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <div className="text-[11px] text-stone-500 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{match.score}% Match Score</span>
                          </div>

                          <div className="flex items-center gap-1 font-bold">
                            {isSelected ? (
                              <span className="text-orange-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Selected Helper
                              </span>
                            ) : (
                              <span className="text-stone-400 group-hover:text-stone-700">
                                Tap to select
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: REVIEW WORKLOAD, ADDRESS & BILL                       */}
          {/* ============================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Selected Helper & Slot Summary */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Selected Helper
                  </div>
                  <div className="text-sm font-bold text-stone-900 mt-0.5">
                    {bookingMode === 'let_zuno_choose'
                      ? `${topHelper?.name || 'Best Match'} (ZUNO Auto-Assign)`
                      : chosenHelper?.name || 'Helper Selected'}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {scheduledDate} · {scheduledSlot} ({durationHours} hrs)
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1 font-medium">
                    Helper Asking Rate: <span className="font-bold text-stone-900 font-mono">₹{chosenHelperAskingRate}/hr</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-orange-600 font-display">
                    ₹{pricing.totalAmount}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Total bill for {durationHours} hr visit
                  </div>
                </div>
              </div>

              {/* Tasks Breakdown - STRICTLY Customer's Selected Chores */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-stone-700">
                  Chores included in this visit ({selectedTaskIds.length})
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200 flex flex-wrap gap-1.5">
                  {selectedTaskIds.map((id) => {
                    const task = MASTER_TASKS.find((t) => t.id === id);
                    if (!task) return null;
                    return (
                      <span
                        key={id}
                        className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-medium"
                      >
                        ✓ {task.name} ({task.estimatedMinutes}m)
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Address Form */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-700">Service Location</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-500">Locality (Chennai)</label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-medium"
                    >
                      {CHENNAI_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Apartment Society</label>
                    <input
                      type="text"
                      value={apartmentName}
                      onChange={(e) => setApartmentName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Tower / Block</label>
                    <input
                      type="text"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Flat Number</label>
                    <input
                      type="text"
                      value={flat}
                      onChange={(e) => setFlat(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Special instructions for helper</label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Ring bell twice, start with bedroom first"
                  className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-medium"
                />
              </div>

              {/* Transparent Bill Breakdown */}
              <div className="p-4 rounded-2xl bg-stone-100/90 border border-stone-200 space-y-2 text-xs">
                <div className="font-bold text-stone-800 text-xs">Bill & Payout Transparency</div>

                <div className="flex justify-between text-stone-600">
                  <span>
                    Helper asking rate (₹{pricing.baseHourlyRate}/hr × {durationHours} hrs)
                  </span>
                  <span className="font-mono">₹{pricing.baseAmount}</span>
                </div>

                {pricing.multiTaskDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Multi-task visit bundle discount ({selectedTaskIds.length} chores)</span>
                    <span className="font-mono">-₹{pricing.multiTaskDiscount}</span>
                  </div>
                )}

                {pricing.weekendFee > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Weekend schedule fee</span>
                    <span className="font-mono">+₹{pricing.weekendFee}</span>
                  </div>
                )}

                <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-stone-900 text-sm">
                  <span>Total Bill to Pay</span>
                  <span className="font-mono font-black text-orange-600">₹{pricing.totalAmount}</span>
                </div>

                <div className="pt-1.5 border-t border-stone-200/60 text-[11px] text-stone-500 flex justify-between">
                  <span>Helper receives: ₹{pricing.helperPayout}</span>
                  <span>ZUNO platform fee: ₹{pricing.zunoFee}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/90 flex items-center justify-between gap-3">
          {step === 1 && (
            <>
              <div className="text-xs text-stone-600">
                <span className="font-bold text-stone-900">{selectedTaskIds.length} chores</span>
                <span> · </span>
                <span className="font-bold text-orange-600 font-mono">
                  {durationHours} {durationHours === 1 ? 'hr' : 'hrs'}
                </span>
              </div>

              <button
                type="button"
                disabled={selectedTaskIds.length === 0}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Compare Helpers & Rates</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-semibold"
              >
                Back
              </button>

              <button
                type="button"
                disabled={eligibleMatches.length === 0}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Review & Confirm (₹{pricing.totalAmount})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-semibold"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Confirm & Book Helper (₹{pricing.totalAmount})</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
