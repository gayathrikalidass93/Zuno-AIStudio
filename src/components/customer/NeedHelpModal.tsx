import React, { useState, useMemo, useEffect } from 'react';
import {
  Customer,
  Helper,
  Booking,
  ServiceCategory,
  PricingConfig,
  BroomingMoppingConfig,
  BathroomCleaningConfig,
  WorkScopeBreakdown,
} from '../../types';
import { SERVICE_CATEGORIES, MASTER_TASKS, CHENNAI_LOCALITIES } from '../../data/services';
import {
  calculatePricing,
  calculateBathroomCleaningPrice,
  calculateBroomingMoppingPrice,
  calculateWorkScopeBreakdown,
} from '../../services/pricing';
import {
  X,
  MapPin,
  Clock,
  Zap,
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Star,
  ShieldCheck,
  Check,
  User,
  AlertCircle,
  Plus,
  Minus,
  Sparkle,
  BadgePercent,
  CheckSquare,
  Square,
} from 'lucide-react';

interface NeedHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  helpers: Helper[];
  pricingConfig: PricingConfig;
  onConfirmBooking: (bookingData: any) => void;
  initialTimingType?: 'instant' | 'casual';
  preselectedCategory?: ServiceCategory;
  preselectedTaskIds?: string[];
  initialHelperId?: string;
}

export const NeedHelpModal: React.FC<NeedHelpModalProps> = ({
  isOpen,
  onClose,
  customer,
  helpers,
  pricingConfig,
  onConfirmBooking,
  initialTimingType,
  preselectedCategory,
  preselectedTaskIds,
  initialHelperId,
}) => {
  // Wizard steps: 1: Location -> 2: Timing -> 3: Service Scope -> 4: Choose Helper -> 5: Review & Negotiate
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Location State (defaults to saved customer profile)
  const [locality, setLocality] = useState<string>(customer.locality || 'Chromepet');
  const [apartmentName, setApartmentName] = useState<string>(customer.apartmentName || 'ZUNO Residency');
  const [block, setBlock] = useState<string>(customer.block || 'A');
  const [flat, setFlat] = useState<string>(customer.flat || '402');

  // Step 2: Timing & Classification State
  // <4 hours = instant, >4 hours = casual
  const [timingType, setTimingType] = useState<'instant' | 'casual'>('instant');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('Immediate (within 45 mins)');
  const [durationHours, setDurationHours] = useState<number>(2);

  // Step 3: Category & Task State
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('cleaning');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(['clean_sweep']);

  // --- Work-Scope Specific States: Home Cleaning (Brooming & Mopping) ---
  // Strictly asks for floor areas: Bedrooms, Halls, Kitchens, other floor areas, Balcony.
  // CRITICAL: NO bathroom / toilet questions inside Brooming & Mopping!
  const [includeHomeCleaning, setIncludeHomeCleaning] = useState<boolean>(true);
  const [broomingScope, setBroomingScope] = useState<BroomingMoppingConfig>({
    bedrooms: 2,
    halls: 1,
    kitchens: 1,
    otherFloorAreas: 0,
    balcony: false,
    cleaningType: 'casual',
  });
  const [homeIncludeDusting, setHomeIncludeDusting] = useState<boolean>(false);
  const [homeIncludeGeneral, setHomeIncludeGeneral] = useState<boolean>(false);
  const [homeIncludeKitchen, setHomeIncludeKitchen] = useState<boolean>(false);

  // --- Work-Scope Specific States: Bathroom Cleaning (SEPARATE SERVICE) ---
  // Standalone selectable service with independent questions:
  // How many bathrooms? (1, 2, 3, 4+)
  // Cleaning type: Casual Cleaning / Regular Cleaning / Deep Cleaning
  // Scope additions: Toilet, Floor, Sink, Shower area, Tiles, Mirror, Other
  const [includeBathroomService, setIncludeBathroomService] = useState<boolean>(false);
  const [bathroomScope, setBathroomScope] = useState<BathroomCleaningConfig>({
    bathroomCount: 2,
    cleaningType: 'regular',
    scope: {
      toilet: true,
      floor: true,
      sink: true,
      showerArea: true,
      tiles: false,
      mirror: true,
    },
  });

  // --- Step 4: Helper Selection ---
  const [selectedHelperId, setSelectedHelperId] = useState<string>('');

  // --- Step 5: Special Instructions & Negotiation ---
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [isNegotiating, setIsNegotiating] = useState<boolean>(false);
  const [negotiatedOffer, setNegotiatedOffer] = useState<number>(0);
  const [negotiationAccepted, setNegotiationAccepted] = useState<boolean>(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsNegotiating(false);
      setNegotiationAccepted(false);
      if (customer) {
        setLocality(customer.locality || 'Chromepet');
        setApartmentName(customer.apartmentName || 'ZUNO Residency');
        setBlock(customer.block || 'A');
        setFlat(customer.flat || '402');
      }
      if (initialTimingType) {
        setTimingType(initialTimingType);
        if (initialTimingType === 'instant') {
          setSelectedSlot('Immediate (within 45 mins)');
        }
      }
      if (preselectedCategory) {
        setSelectedCategory(preselectedCategory);
        if (preselectedCategory === 'bathroom_cleaning') {
          setIncludeBathroomService(true);
          setIncludeHomeCleaning(false);
        } else if (preselectedCategory === 'cleaning') {
          setIncludeHomeCleaning(true);
          setIncludeBathroomService(false);
        } else {
          setIncludeHomeCleaning(false);
          setIncludeBathroomService(false);
        }
      }
      if (preselectedTaskIds && preselectedTaskIds.length > 0) {
        setSelectedTaskIds(preselectedTaskIds);
        const hasBathroom = preselectedTaskIds.some((id) =>
          ['bath_casual_clean', 'bath_regular_clean', 'bath_deep_clean', 'clean_bathroom'].includes(id)
        );
        const hasHome = preselectedTaskIds.some((id) =>
          ['clean_sweep', 'clean_dust', 'clean_general', 'clean_kitchen', 'clean_vessels'].includes(id)
        );
        if (hasBathroom) {
          setIncludeBathroomService(true);
        }
        if (hasBathroom && !hasHome) {
          setIncludeHomeCleaning(false);
        }
      }
      if (initialHelperId) {
        setSelectedHelperId(initialHelperId);
      } else {
        setSelectedHelperId('');
      }
    }
  }, [isOpen, customer, initialTimingType, preselectedCategory, preselectedTaskIds, initialHelperId]);

  if (!isOpen) return null;

  // Toggle tasks for generic categories
  const categoryTasks = MASTER_TASKS.filter((t) => t.category === selectedCategory);

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.length > 1
          ? prev.filter((id) => id !== taskId)
          : prev
        : [...prev, taskId]
    );
  };

  // Find eligible helpers matching location, skills, and availability
  const eligibleHelpers = helpers.filter((h) => {
    if (!h.isActive) return false;
    const coversLocality =
      h.locality.toLowerCase() === locality.toLowerCase() ||
      h.preferredLocalities.some((l) => l.toLowerCase() === locality.toLowerCase()) ||
      (h.apartmentsServed && h.apartmentsServed.some((a) => a.toLowerCase() === apartmentName.toLowerCase()));

    const isBathroom = selectedCategory === 'bathroom_cleaning' || includeBathroomService;
    const hasSkill =
      isBathroom ||
      selectedTaskIds.some((tId) => h.skills.includes(tId)) ||
      h.skills.length > 0;

    return coversLocality && hasSkill;
  });

  const displayHelpers = eligibleHelpers.length > 0 ? eligibleHelpers : helpers.filter((h) => h.isActive);
  const selectedHelper = helpers.find((h) => h.id === selectedHelperId);

  // Is this a Home Cleaning and/or Bathroom Cleaning booking?
  const isHomeCleaningActive =
    (selectedCategory === 'cleaning' || selectedCategory === 'bathroom_cleaning')
      ? includeHomeCleaning
      : selectedTaskIds.some((id) => ['clean_sweep', 'clean_dust', 'clean_general', 'clean_kitchen'].includes(id));
  const isBathroomActive =
    (selectedCategory === 'cleaning' || selectedCategory === 'bathroom_cleaning')
      ? includeBathroomService
      : false;

  // Compute separate service work-scope breakdown
  const workScope = useMemo(() => {
    if (!isHomeCleaningActive && !isBathroomActive) {
      return null;
    }

    const homeParams = isHomeCleaningActive
      ? {
          broomingMopping: broomingScope,
          dusting: homeIncludeDusting,
          generalCleaning: homeIncludeGeneral,
          kitchenCleaning: homeIncludeKitchen,
        }
      : undefined;

    const bathParams = isBathroomActive
      ? {
          config: bathroomScope,
        }
      : undefined;

    return calculateWorkScopeBreakdown(
      {
        homeCleaning: homeParams,
        bathroomCleaning: bathParams,
        negotiatedDiscount: negotiationAccepted && negotiatedOffer > 0 ? negotiatedOffer : 0,
      },
      pricingConfig
    );
  }, [
    isHomeCleaningActive,
    isBathroomActive,
    broomingScope,
    homeIncludeDusting,
    homeIncludeGeneral,
    homeIncludeKitchen,
    bathroomScope,
    negotiationAccepted,
    negotiatedOffer,
    pricingConfig,
  ]);

  // Calculate pricing (Customer-facing total)
  const isWeekend = [0, 6].includes(new Date(selectedDate).getDay());
  const isUrgent = timingType === 'instant';

  const pricing = useMemo(() => {
    if (workScope) {
      return calculatePricing(
        durationHours,
        selectedTaskIds.length,
        isUrgent,
        isWeekend,
        pricingConfig,
        selectedHelper?.hourlyRate,
        workScope.agreedPrice
      );
    }

    return calculatePricing(
      durationHours,
      selectedTaskIds.length,
      isUrgent,
      isWeekend,
      pricingConfig,
      selectedHelper?.hourlyRate
    );
  }, [
    workScope,
    durationHours,
    selectedTaskIds.length,
    isUrgent,
    isWeekend,
    pricingConfig,
    selectedHelper?.hourlyRate,
  ]);

  // Handle negotiation submit
  const handleApplyNegotiation = (targetAmount: number) => {
    if (workScope && targetAmount > 0 && targetAmount < workScope.suggestedTotalPrice) {
      const discount = workScope.suggestedTotalPrice - targetAmount;
      setNegotiatedOffer(discount);
      setNegotiationAccepted(true);
      setIsNegotiating(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedHelperId) return;

    // Combine tasks to include separate items
    const finalTasks: string[] = [];
    if (isHomeCleaningActive) {
      finalTasks.push('clean_sweep');
      if (homeIncludeDusting) finalTasks.push('clean_dust');
      if (homeIncludeGeneral) finalTasks.push('clean_general');
      if (homeIncludeKitchen) finalTasks.push('clean_kitchen');
    }
    if (isBathroomActive) {
      if (bathroomScope.cleaningType === 'casual') finalTasks.push('bath_casual_clean');
      else if (bathroomScope.cleaningType === 'regular') finalTasks.push('bath_regular_clean');
      else finalTasks.push('bath_deep_clean');
    }
    if (finalTasks.length === 0) {
      finalTasks.push(...selectedTaskIds);
    }

    const bookingPayload = {
      customerId: customer.id,
      helperId: selectedHelperId,
      status: 'confirmed',
      tasks: finalTasks,
      category:
        isHomeCleaningActive && isBathroomActive
          ? 'cleaning'
          : isBathroomActive
          ? 'bathroom_cleaning'
          : selectedCategory,
      bookingType: timingType,
      scheduledDate: selectedDate,
      scheduledSlot: selectedSlot,
      durationHours,
      estimatedWorkloadMinutes: durationHours * 60,
      bookingMode: 'choose_helper',
      isUrgent,
      locality,
      apartmentName,
      block,
      flat,
      customerNotes: customerNotes.trim() || undefined,
      pricing,
      workScopeBreakdown: workScope || undefined,
      negotiatedAgreedPrice: negotiationAccepted ? pricing.totalAmount : undefined,
    };

    onConfirmBooking(bookingPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors mr-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-sm font-bold font-display text-stone-900">
                {step === 1 && 'Step 1: Confirm Service Location'}
                {step === 2 && 'Step 2: When Do You Need Help?'}
                {step === 3 && 'Step 3: Service Scope & Work Details'}
                {step === 4 && 'Step 4: Choose Your Helper'}
                {step === 5 && 'Step 5: Review & Negotiate Price'}
              </div>
              <div className="text-[11px] text-stone-500">
                Step {step} of 5 · Separate work-scope pricing
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 gap-1 px-5 pt-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-orange-600' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* ========================================================== */}
          {/* STEP 1: LOCATION                                           */}
          {/* ========================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200 text-orange-950 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Service Location</div>
                  <div className="text-[11px] text-orange-900/80 mt-0.5">
                    Your helper will arrive at this flat to carry out your requested chores.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Area / Locality</label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {CHENNAI_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}, Chennai
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Apartment / Gated Community Name</label>
                  <input
                    type="text"
                    value={apartmentName}
                    onChange={(e) => setApartmentName(e.target.value)}
                    placeholder="e.g. Purva Windermere, Casagrand Lorenza"
                    className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Tower / Block</label>
                    <input
                      type="text"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      placeholder="e.g. Block C / Tower 2"
                      className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Flat / Door Number</label>
                    <input
                      type="text"
                      value={flat}
                      onChange={(e) => setFlat(e.target.value)}
                      placeholder="e.g. 704"
                      className="w-full p-3 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Continue to Timing</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 2: TIMING (<4h Instant vs >4h Casual)                  */}
          {/* ========================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-bold text-stone-800">When do you need the service?</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTimingType('instant');
                      setSelectedSlot('Immediate (within 45 mins)');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      timingType === 'instant'
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/30'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-1">
                      <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>Instant / Immediate</span>
                    </div>
                    <div className="text-[11px] font-semibold text-stone-900">
                      Within 4 hours (Today)
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Fast-tracked arrival within ~30–45 mins
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimingType('casual');
                      setSelectedSlot('10:00 AM - 12:00 PM');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      timingType === 'casual'
                        ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/30'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-orange-700 font-bold mb-1">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span>Casual Visit</span>
                    </div>
                    <div className="text-[11px] font-semibold text-stone-900">
                      More than 4 hours later
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Plan ahead for convenient slots today or upcoming days
                    </div>
                  </button>
                </div>
              </div>

              {/* Slot / Date selector */}
              {timingType === 'casual' ? (
                <div className="space-y-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Preferred Time Slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Morning)</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening)</option>
                      <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Early Morning)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold">Immediate Booking Window</div>
                      <div className="text-[10px] text-amber-800">
                        Dispatched today · Target arrival within ~30–45 mins
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md text-[10px]">
                    Fast Track
                  </span>
                </div>
              )}

              {/* Duration selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Visit Duration (Hours)</label>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDurationHours(hrs)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        durationHours === hrs
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-700'
                      }`}
                    >
                      {hrs} hr{hrs > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Continue to Service Scope</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 3: SERVICE SCOPE (BATHROOM CLEANING IS SEPARATE!)      */}
          {/* ========================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Category Switcher Tabs */}
              <div className="space-y-2">
                <div className="font-bold text-stone-800">Select Service Category</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (cat.id === 'bathroom_cleaning') {
                          setIncludeBathroomService(true);
                          setIncludeHomeCleaning(false);
                        } else if (cat.id === 'cleaning') {
                          setIncludeHomeCleaning(true);
                          setIncludeBathroomService(false);
                        } else {
                          setIncludeHomeCleaning(false);
                          setIncludeBathroomService(false);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/30'
                          : 'bg-white hover:bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        {cat.id === 'bathroom_cleaning' && (
                          <span className="text-[9px] bg-cyan-100 text-cyan-800 px-1 rounded font-bold">
                            Separate
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400">{cat.tamilName}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SERVICE 1: HOME CLEANING (Brooming & Mopping — NO BATHROOM INCLUDED) */}
              {/* ------------------------------------------------------------------ */}
              {(selectedCategory === 'cleaning' || selectedCategory === 'bathroom_cleaning') && (
                <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  includeHomeCleaning ? 'bg-stone-50 border-stone-200' : 'bg-white border-stone-200'
                }`}>
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="toggleHomeCleaning"
                        checked={includeHomeCleaning}
                        onChange={(e) => setIncludeHomeCleaning(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <label htmlFor="toggleHomeCleaning" className="font-bold text-stone-900 text-xs cursor-pointer flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-orange-600" />
                        <span>Home Cleaning → Brooming & Mopping</span>
                      </label>
                    </div>
                    <span className="text-[10px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                      Floor Area Only (No Bathrooms)
                    </span>
                  </div>

                  {includeHomeCleaning ? (
                    <>
                      <p className="text-[11px] text-stone-600">
                        Floor cleaning asking details across rooms. <strong>Bathrooms are NOT included</strong> in Brooming & Mopping.
                      </p>

                      {/* Room counters: Bedrooms, Halls, Kitchens, Other, Balcony */}
                      <div className="space-y-2">
                        <div className="font-bold text-stone-700 text-[11px]">Specify Rooms / Floor Areas:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Bedrooms */}
                          <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-stone-800">Bedrooms</div>
                              <div className="text-[10px] text-stone-400">Bedrooms to sweep & mop</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    bedrooms: Math.max(0, s.bedrooms - 1),
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-200"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-4 text-center">{broomingScope.bedrooms}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    bedrooms: s.bedrooms + 1,
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-bold flex items-center justify-center hover:bg-orange-200"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Halls / Living rooms */}
                          <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-stone-800">Living / Halls</div>
                              <div className="text-[10px] text-stone-400">Main hall & dining</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    halls: Math.max(0, s.halls - 1),
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-200"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-4 text-center">{broomingScope.halls}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    halls: s.halls + 1,
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-bold flex items-center justify-center hover:bg-orange-200"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Kitchens */}
                          <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-stone-800">Kitchens</div>
                              <div className="text-[10px] text-stone-400">Kitchen floor</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    kitchens: Math.max(0, s.kitchens - 1),
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-200"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-4 text-center">{broomingScope.kitchens}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    kitchens: s.kitchens + 1,
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-bold flex items-center justify-center hover:bg-orange-200"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Other Floor Areas */}
                          <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-stone-800">Other Areas</div>
                              <div className="text-[10px] text-stone-400">Pooja / foyer / study</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    otherFloorAreas: Math.max(0, (s.otherFloorAreas || 0) - 1),
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-200"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-4 text-center">
                                {broomingScope.otherFloorAreas || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setBroomingScope((s) => ({
                                    ...s,
                                    otherFloorAreas: (s.otherFloorAreas || 0) + 1,
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-bold flex items-center justify-center hover:bg-orange-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Balcony toggle */}
                        <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!broomingScope.balcony}
                            onChange={(e) =>
                              setBroomingScope((s) => ({
                                ...s,
                                balcony: e.target.checked,
                              }))
                            }
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span className="font-semibold text-stone-800">Include Balcony floor wash</span>
                        </label>

                        {/* Cleaning Type: Casual Cleaning / Regular Cleaning / Deep Cleaning */}
                        <div className="pt-2">
                          <div className="font-bold text-stone-700 text-[11px] mb-1.5">Cleaning Type:</div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['casual', 'regular', 'deep'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setBroomingScope((s) => ({ ...s, cleaningType: type }))}
                                className={`p-2 rounded-xl border text-center font-bold capitalize transition-all ${
                                  broomingScope.cleaningType === type
                                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                                }`}
                              >
                                {type} Cleaning
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Additional Home Cleaning Sub-Services */}
                        <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                          <div className="font-bold text-stone-700 text-[11px]">
                            Add Additional Home Cleaning Chores:
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setHomeIncludeDusting(!homeIncludeDusting)}
                              className={`p-2 rounded-xl border text-left transition-all ${
                                homeIncludeDusting
                                  ? 'bg-orange-50 border-orange-500 font-bold text-orange-950'
                                  : 'bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <div className="text-xs">Dusting</div>
                              <div className="text-[10px] text-stone-500">+₹70</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setHomeIncludeGeneral(!homeIncludeGeneral)}
                              className={`p-2 rounded-xl border text-left transition-all ${
                                homeIncludeGeneral
                                  ? 'bg-orange-50 border-orange-500 font-bold text-orange-950'
                                  : 'bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <div className="text-xs">General Tidying</div>
                              <div className="text-[10px] text-stone-500">+₹120</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setHomeIncludeKitchen(!homeIncludeKitchen)}
                              className={`p-2 rounded-xl border text-left transition-all ${
                                homeIncludeKitchen
                                  ? 'bg-orange-50 border-orange-500 font-bold text-orange-950'
                                  : 'bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <div className="text-xs">Kitchen Counter</div>
                              <div className="text-[10px] text-stone-500">+₹99</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-stone-500">
                      Check this box if you want Home Cleaning (Brooming & Mopping). Bathrooms are NOT included in this service.
                    </p>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------------ */}
              {/* SERVICE 2: BATHROOM CLEANING (SEPARATE SERVICE WITH OWN SCOPE)     */}
              {/* ------------------------------------------------------------------ */}
              {(selectedCategory === 'cleaning' || selectedCategory === 'bathroom_cleaning') && (
                <div
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    includeBathroomService
                      ? 'bg-cyan-50/70 border-cyan-300'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="toggleBathroom"
                        checked={includeBathroomService}
                        onChange={(e) => setIncludeBathroomService(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                      <label htmlFor="toggleBathroom" className="font-bold text-stone-900 text-xs cursor-pointer">
                        Bathroom Cleaning (Separate Service)
                      </label>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900">
                      Separate Scope & Pricing
                    </span>
                  </div>

                  {includeBathroomService ? (
                    <div className="space-y-3 pt-1 border-t border-cyan-200">
                      <p className="text-[11px] text-cyan-950 leading-relaxed">
                        Bathroom Cleaning is priced independently per bathroom and work intensity.
                      </p>

                      {/* How many bathrooms? 1, 2, 3, 4+ */}
                      <div className="space-y-1.5">
                        <div className="font-bold text-stone-800 text-[11px]">How many bathrooms?</div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[1, 2, 3, 4].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() =>
                                setBathroomScope((s) => ({ ...s, bathroomCount: count }))
                              }
                              className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                                bathroomScope.bathroomCount === count
                                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                  : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-700'
                              }`}
                            >
                              {count} {count === 4 ? '4+' : count === 1 ? 'Bath' : 'Baths'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cleaning Type: Casual Cleaning / Regular Cleaning / Deep Cleaning */}
                      <div className="space-y-1.5">
                        <div className="font-bold text-stone-800 text-[11px]">Cleaning Type:</div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['casual', 'regular', 'deep'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                setBathroomScope((s) => ({ ...s, cleaningType: type }))
                              }
                              className={`p-2 rounded-xl border text-center font-bold capitalize transition-all ${
                                bathroomScope.cleaningType === type
                                  ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs'
                                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              {type} Cleaning
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scope specific items: Toilet, Floor, Sink, Shower area, Tiles, Mirror */}
                      <div className="space-y-1.5">
                        <div className="font-bold text-stone-800 text-[11px]">
                          Select Specific Work Requirements:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {[
                            { key: 'toilet', label: 'Toilet' },
                            { key: 'floor', label: 'Floor' },
                            { key: 'sink', label: 'Sink / Basin' },
                            { key: 'showerArea', label: 'Shower Area' },
                            { key: 'tiles', label: 'Wall Tiles' },
                            { key: 'mirror', label: 'Mirror / Glass' },
                          ].map((item) => {
                            const isChecked = !!bathroomScope.scope[item.key as keyof typeof bathroomScope.scope];
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() =>
                                  setBathroomScope((s) => ({
                                    ...s,
                                    scope: {
                                      ...s.scope,
                                      [item.key]: !isChecked,
                                    },
                                  }))
                                }
                                className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                                  isChecked
                                    ? 'bg-white border-cyan-500 font-bold text-cyan-950 shadow-2xs'
                                    : 'bg-white/60 border-stone-200 text-stone-600'
                                }`}
                              >
                                <span>{item.label}</span>
                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                                  isChecked ? 'bg-cyan-600 text-white' : 'border border-stone-300'
                                }`}>
                                  {isChecked ? '✓' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500">
                      Check this box if you want your bathrooms cleaned. It is priced as a separate service and will not be mixed into floor brooming.
                    </p>
                  )}
                </div>
              )}

              {/* Notice when neither Home Cleaning nor Bathroom Cleaning is selected */}
              {(selectedCategory === 'cleaning' || selectedCategory === 'bathroom_cleaning') &&
                !includeHomeCleaning &&
                !includeBathroomService && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Please check at least one service (Home Cleaning or Bathroom Cleaning) above.</span>
                  </div>
                )}

              {/* Other generic chores (Cooking, Laundry, etc.) */}
              {selectedCategory !== 'cleaning' && selectedCategory !== 'bathroom_cleaning' && (
                <div className="space-y-2">
                  <div className="font-bold text-stone-800">Select Chores for {selectedCategory}:</div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {categoryTasks.map((task) => {
                      const isChecked = selectedTaskIds.includes(task.id);
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between text-xs ${
                            isChecked
                              ? 'bg-orange-50/70 border-orange-400 text-stone-900'
                              : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] font-black ${
                                isChecked ? 'bg-orange-600 border-orange-600 text-white' : 'border-stone-300 bg-white'
                              }`}
                            >
                              {isChecked ? '✓' : ''}
                            </span>
                            <div>
                              <div className="font-bold">{task.name}</div>
                              <div className="text-[10px] text-stone-500">{task.tamilName}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Work Scope Live Price Bar */}
              {workScope && (
                <div className="p-3.5 rounded-2xl bg-stone-900 text-white flex items-center justify-between shadow-md">
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">
                      Combined Work Scope Total
                    </div>
                    <div className="text-xs text-stone-200 font-medium">
                      {workScope.homeCleaning && 'Home Cleaning'}
                      {workScope.homeCleaning && workScope.bathroomCleaning && ' + '}
                      {workScope.bathroomCleaning && 'Bathroom Cleaning'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-orange-400">
                      ₹{workScope.suggestedTotalPrice}
                    </span>
                    <div className="text-[9px] text-stone-400">Not based on hours</div>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={(selectedCategory === 'cleaning' || selectedCategory === 'bathroom_cleaning') && !includeHomeCleaning && !includeBathroomService}
                onClick={() => setStep(4)}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-4 ${
                  (selectedCategory === 'cleaning' || selectedCategory === 'bathroom_cleaning') && !includeHomeCleaning && !includeBathroomService
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                }`}
              >
                <span>View Available Helpers</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 4: CHOOSE HELPER (Explicit selection: Kavitha, etc.)  */}
          {/* ========================================================== */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900 text-sm">Available Helpers for Your Work</div>
                  <div className="text-[11px] text-stone-500">
                    Showing verified helpers in {locality}
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {displayHelpers.length} Available
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {displayHelpers.map((helper) => {
                  const isSelected = selectedHelperId === helper.id;
                  return (
                    <div
                      key={helper.id}
                      onClick={() => setSelectedHelperId(helper.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50/90 border-orange-500 ring-2 ring-orange-400/30 shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center font-display text-base">
                            {helper.name.split(' ')[0][0]}
                            {helper.name.split(' ')[1]?.[0] || ''}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                              <span>{helper.name}</span>
                              <span className="text-xs text-amber-600 flex items-center gap-0.5 font-bold">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                {helper.rating}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5">
                              {helper.locality} · {helper.experienceYears} yrs exp · {helper.completedJobs} visits
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              ✓ Available today
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHelperId(helper.id);
                            setStep(5);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            isSelected
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'bg-stone-100 hover:bg-orange-600 hover:text-white text-stone-800'
                          }`}
                        >
                          {isSelected ? 'Selected ✓' : `Choose ${helper.name.split(' ')[0]}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedHelperId && (
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>Review with {selectedHelper?.name.split(' ')[0]}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 5: REVIEW, WORK SCOPE & PRICE NEGOTIATION              */}
          {/* ========================================================== */}
          {step === 5 && selectedHelper && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center justify-between">
                  <span>Visit Work Summary</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold uppercase">
                    {timingType === 'instant' ? 'Instant Help' : 'Casual Visit'}
                  </span>
                </div>

                {/* Scope Breakdown Rows: Home Cleaning vs Bathroom Cleaning */}
                {workScope ? (
                  <div className="space-y-2.5 text-xs">
                    {/* Home Cleaning Box */}
                    {workScope.homeCleaning && (
                      <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-stone-900">
                          <span className="flex items-center gap-1.5 text-orange-700">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Home Cleaning</span>
                          </span>
                          <span className="font-mono">₹{workScope.homeCleaning.price}</span>
                        </div>
                        {workScope.homeCleaning.broomingMopping && (
                          <div className="text-[11px] text-stone-600 pl-5 space-y-0.5">
                            <div>• {workScope.homeCleaning.broomingMopping.bedrooms} Bedrooms</div>
                            <div>• {workScope.homeCleaning.broomingMopping.halls} Hall / Living room</div>
                            <div>• {workScope.homeCleaning.broomingMopping.kitchens} Kitchen</div>
                            {workScope.homeCleaning.broomingMopping.balcony && <div>• Balcony floor</div>}
                            <div className="text-stone-500 capitalize">
                              ({workScope.homeCleaning.broomingMopping.cleaningType} Cleaning)
                            </div>
                          </div>
                        )}
                        {workScope.homeCleaning.dusting && (
                          <div className="text-[11px] text-stone-600 pl-5">• Dusting</div>
                        )}
                        {workScope.homeCleaning.generalCleaning && (
                          <div className="text-[11px] text-stone-600 pl-5">• General Home Cleaning</div>
                        )}
                        {workScope.homeCleaning.kitchenCleaning && (
                          <div className="text-[11px] text-stone-600 pl-5">• Kitchen Counter Cleaning</div>
                        )}
                      </div>
                    )}

                    {/* Bathroom Cleaning Box (Explicit separate line!) */}
                    {workScope.bathroomCleaning && (
                      <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-cyan-950">
                          <span className="flex items-center gap-1.5 text-cyan-800">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Bathroom Cleaning</span>
                          </span>
                          <span className="font-mono">₹{workScope.bathroomCleaning.price}</span>
                        </div>
                        <div className="text-[11px] text-cyan-900 pl-5 space-y-0.5">
                          <div>• {workScope.bathroomCleaning.config.bathroomCount} Bathrooms</div>
                          <div className="capitalize">
                            • {workScope.bathroomCleaning.config.cleaningType} Cleaning
                          </div>
                          <div className="text-cyan-700 text-[10px]">
                            Includes:{' '}
                            {Object.entries(workScope.bathroomCleaning.config.scope)
                              .filter(([_, v]) => !!v)
                              .map(([k]) => k)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500">Service:</span>
                      <div className="font-bold text-stone-900 capitalize">{selectedCategory}</div>
                    </div>
                    <div>
                      <span className="text-stone-500">Helper:</span>
                      <div className="font-bold text-stone-900">{selectedHelper.name}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-stone-200">
                  <div>
                    <span className="text-stone-500">Helper:</span>
                    <div className="font-bold text-stone-900">{selectedHelper.name}</div>
                  </div>
                  <div>
                    <span className="text-stone-500">When:</span>
                    <div className="font-bold text-stone-900">
                      {selectedDate} · {selectedSlot}
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-2 text-[11px]">
                  <span className="text-stone-500">Service Location:</span>
                  <div className="font-bold text-stone-900">
                    Flat {flat}, {block}, {apartmentName}, {locality}
                  </div>
                </div>

                {/* Price Display & Negotiation Section */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">
                        {negotiationAccepted ? 'Agreed Price' : 'Suggested Price'}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Based on actual work scope (not hours)
                      </div>
                    </div>
                    <div className="text-right">
                      {negotiationAccepted && (
                        <span className="line-through text-stone-400 text-xs mr-2 font-mono">
                          ₹{workScope?.suggestedTotalPrice || pricing.baseAmount}
                        </span>
                      )}
                      <span className="text-xl font-black font-mono text-orange-600">
                        ₹{pricing.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Negotiation Action Button */}
                  {workScope && !negotiationAccepted && !isNegotiating && (
                    <button
                      type="button"
                      onClick={() => setIsNegotiating(true)}
                      className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-stone-300"
                    >
                      <BadgePercent className="w-4 h-4 text-orange-600" />
                      <span>Negotiate Price</span>
                    </button>
                  )}

                  {/* Negotiation Form Box */}
                  {isNegotiating && (
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 space-y-2 animate-in fade-in">
                      <div className="font-bold text-orange-950 text-xs">
                        Enter your desired price for this work scope:
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-stone-700">₹</span>
                        <input
                          type="number"
                          defaultValue={Math.max(100, (workScope?.suggestedTotalPrice || pricing.totalAmount) - 50)}
                          id="negotiateOfferInput"
                          className="flex-1 p-2 rounded-xl border border-orange-300 text-xs font-mono font-bold bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('negotiateOfferInput') as HTMLInputElement;
                            const val = Number(input?.value);
                            handleApplyNegotiation(val);
                          }}
                          className="px-3 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 cursor-pointer"
                        >
                          Agree
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNegotiating(false)}
                          className="p-2 text-stone-500 hover:text-stone-700 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="text-[10px] text-orange-800">
                        Suggested price was ₹{workScope?.suggestedTotalPrice}. Helper will receive the complete work scope.
                      </div>
                    </div>
                  )}

                  {negotiationAccepted && (
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Negotiated price applied for this work scope!</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Special Instructions / Notes (Optional)</label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Please ring bell upon arrival"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Booking & Assign {selectedHelper.name.split(' ')[0]}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
