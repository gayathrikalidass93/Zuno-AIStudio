import React, { useState, useMemo } from 'react';
import { Customer, Helper, PricingConfig } from '../../types';
import { MASTER_TASKS, CHENNAI_LOCALITIES } from '../../data/services';
import { calculatePricing } from '../../services/pricing';
import { matchHelpers } from '../../services/matching';
import {
  Zap,
  X,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface NeedHelpNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  helpers: Helper[];
  pricingConfig: PricingConfig;
  onConfirmUrgentBooking: (bookingData: any) => void;
}

export const NeedHelpNowModal: React.FC<NeedHelpNowModalProps> = ({
  isOpen,
  onClose,
  customer,
  helpers,
  pricingConfig,
  onConfirmUrgentBooking,
}) => {
  // Urgent selection typically 1-3 urgent tasks
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([
    'clean_sweep',
    'clean_mop',
    'clean_vessels',
  ]);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [selectedHelperId, setSelectedHelperId] = useState<string | null>(null);

  // Common quick urgent task presets
  const urgentPresets = [
    { label: 'Emergency Kitchen & Vessels', taskIds: ['clean_vessels', 'clean_kitchen', 'cook_veg_prep'] },
    { label: 'Quick Floor & Dusting', taskIds: ['clean_sweep', 'clean_mop', 'clean_dust'] },
    { label: 'Guest Arrival Rush', taskIds: ['clean_sweep', 'clean_mop', 'clean_vessels', 'cook_lunch'] },
  ];

  // Match eligible helpers who are 'available_now'
  const matchedHelpers = useMemo(() => {
    const results = matchHelpers(helpers, {
      selectedTaskIds,
      locality: customer.locality,
      apartmentName: customer.apartmentName,
      isUrgent: true, // Filters strictly for available_now
      customer,
    });
    return results.filter((m) => m.isEligible && m.helper.availabilityStatus === 'available_now');
  }, [helpers, selectedTaskIds, customer]);

  // Set default selected helper
  const topHelper = matchedHelpers[0]?.helper;
  const chosenHelper = useMemo(() => {
    if (selectedHelperId) {
      return helpers.find((h) => h.id === selectedHelperId);
    }
    return topHelper;
  }, [selectedHelperId, topHelper, helpers]);

  // Pricing with urgent premium based on chosen helper's rate
  const pricing = useMemo(
    () =>
      calculatePricing(
        durationHours,
        selectedTaskIds.length,
        true, // isUrgent = true!
        false,
        pricingConfig,
        chosenHelper?.hourlyRate
      ),
    [durationHours, selectedTaskIds.length, pricingConfig, chosenHelper?.hourlyRate]
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    const helperId = selectedHelperId || topHelper?.id;
    if (!helperId) return;

    onConfirmUrgentBooking({
      customerId: customer.id,
      helperId,
      status: 'on_the_way', // Immediate dispatch!
      tasks: selectedTaskIds,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledSlot: 'Immediate (Next 30 mins)',
      durationHours,
      estimatedWorkloadMinutes: durationHours * 60,
      bookingMode: 'need_help_now',
      isUrgent: true,
      locality: customer.locality,
      apartmentName: customer.apartmentName,
      block: customer.block,
      flat: customer.flat,
      customerNotes: '⚡ URGENT REQUEST - Helper requested for immediate arrival.',
      pricing,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold font-display flex items-center gap-2">
                <span>Need Help Now</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-900">
                  ⚡ Urgent Dispatch
                </span>
              </div>
              <div className="text-xs text-stone-400">
                Searching helpers active right now in {customer.locality}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Quick Preset selection */}
          <div className="space-y-1.5">
            <div className="text-stone-600 font-bold">What is urgent?</div>
            <div className="flex flex-wrap gap-1.5">
              {urgentPresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedTaskIds(preset.taskIds)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 font-medium text-stone-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Tasks Chips */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="font-bold text-stone-700">Selected tasks ({selectedTaskIds.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {selectedTaskIds.map((id) => {
                const t = MASTER_TASKS.find((task) => task.id === id);
                return (
                  <span
                    key={id}
                    className="px-2.5 py-1 rounded-md bg-white border border-stone-200 text-stone-800 font-medium flex items-center gap-1"
                  >
                    <span>✓ {t?.name || id}</span>
                    <button
                      onClick={() => setSelectedTaskIds((ids) => ids.filter((x) => x !== id))}
                      className="text-stone-400 hover:text-stone-700 ml-1"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <div className="font-bold text-stone-700">Duration needed</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDurationHours(1)}
                className={`py-2 rounded-xl text-center font-bold border transition-all ${
                  durationHours === 1
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white border-stone-200 text-stone-700'
                }`}
              >
                1 Hour (Quick assist)
              </button>
              <button
                type="button"
                onClick={() => setDurationHours(2)}
                className={`py-2 rounded-xl text-center font-bold border transition-all ${
                  durationHours === 2
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white border-stone-200 text-stone-700'
                }`}
              >
                2 Hours (Comprehensive)
              </button>
            </div>
          </div>

          {/* Available Helpers Nearby */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between font-bold text-stone-800">
              <span>Available right now in your area</span>
              <span className="text-emerald-700 font-semibold">
                ● {matchedHelpers.length} online
              </span>
            </div>

            {matchedHelpers.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-1">
                <div className="font-bold">No helpers currently on Available Now in {customer.locality}</div>
                <p className="text-[11px] text-amber-800">
                  Tap &quot;Build My Visit&quot; to book a scheduled slot for later today or tomorrow!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {matchedHelpers.map((match) => {
                  const h = match.helper;
                  const isSelected = (selectedHelperId || topHelper?.id) === h.id;
                  // Calculate dynamic ETA based on distance
                  const estimatedEtaMins = Math.max(15, Math.round(match.distanceKm * 6 + 10));

                  return (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHelperId(h.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-50/70 border-orange-500 ring-1 ring-orange-500'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center font-display">
                            {h.name.split(' ')[0][0]}
                            {h.name.split(' ')[1]?.[0] || ''}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{h.name}</span>
                            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{h.rating}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {h.locality} · {match.distanceKm.toFixed(1)} km away
                          </div>
                          <div className="text-[11px] font-bold text-stone-900 font-mono mt-0.5">
                            Asking: ₹{h.hourlyRate || 249}/hr
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          ETA ~{estimatedEtaMins} mins
                        </div>
                        <div className="text-xs font-black text-orange-600 font-mono mt-0.5">
                          ₹{(h.hourlyRate || 249) * durationHours} ({durationHours}h)
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {match.score}% Match
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 space-y-1">
            <div className="flex justify-between font-bold text-stone-900 text-xs">
              <span>Urgent Visit Total ({durationHours} hrs)</span>
              <span className="font-mono text-orange-600 font-black">₹{pricing.totalAmount}</span>
            </div>
            <div className="text-[10px] text-stone-500 flex justify-between">
              <span>Includes ₹{pricing.urgentFee} immediate dispatch bonus</span>
              <span>Helper receives ₹{pricing.helperPayout}</span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="text-xs text-stone-600 font-medium">
            Immediate dispatch to {customer.apartmentName}
          </div>
          <button
            type="button"
            disabled={matchedHelpers.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span>Book Now (₹{pricing.totalAmount})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
