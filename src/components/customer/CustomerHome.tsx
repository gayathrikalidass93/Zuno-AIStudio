import React, { useState, useMemo } from 'react';
import { Customer, Helper, Booking, ServiceCategory, Task } from '../../types';
import { SERVICE_CATEGORIES, MASTER_TASKS } from '../../data/services';
import { getHelperWorkRatesBreakdown } from '../../services/helperRates';
import { maskPhoneNumber } from '../../services/privacy';
import {
  Sparkles,
  Zap,
  Clock,
  Star,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Heart,
  Repeat,
  Check,
  ArrowRight,
  AlertTriangle,
  Plus,
  KeyRound,
  Calendar,
  CheckCircle2,
  X,
  Search,
  CheckSquare,
  Square,
  Info,
  User,
  LogOut,
  Building,
  Phone,
  Mail,
} from 'lucide-react';

interface CustomerHomeProps {
  customer: Customer;
  helpers: Helper[];
  bookings: Booking[];
  onOpenNeedHelp: (
    timingType?: 'instant' | 'casual',
    preCategory?: ServiceCategory,
    preTaskIds?: string[]
  ) => void;
  onBookAgain: (previousBooking: Booking) => void;
  onViewBookingDetails: (bookingId: string) => void;
  onToggleFavourite: (helperId: string) => void;
  onLogout?: () => void;
  onOpenAuth?: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  customer,
  helpers,
  bookings,
  onOpenNeedHelp,
  onBookAgain,
  onViewBookingDetails,
  onToggleFavourite,
  onLogout,
  onOpenAuth,
}) => {
  // Main tabs: 'services' | 'bookings' | 'helpers' | 'profile'
  const [activeTab, setActiveTab] = useState<'services' | 'bookings' | 'helpers' | 'profile'>('services');

  // Filter in Services tab
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');

  // Selected chore checkboxes on the services discovery view
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Filter in Bookings tab
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Active bookings (in progress or pending action) for THIS customer
  const activeBookings = bookings.filter((b) =>
    b.customerId === customer.id &&
    ['requested', 'confirmed', 'helper_assigned', 'on_the_way', 'started', 'replacement_required'].includes(
      b.status
    )
  );
  const completedBookings = bookings.filter((b) => b.customerId === customer.id && b.status === 'completed');
  const cancelledBookings = bookings.filter((b) => b.customerId === customer.id && b.status === 'cancelled');

  // Filtered bookings list for the Bookings tab (Strict customer isolation!)
  const filteredBookings = useMemo(() => {
    const userBookings = bookings.filter((b) => b.customerId === customer.id);
    if (bookingFilter === 'active') return activeBookings;
    if (bookingFilter === 'completed') return completedBookings;
    if (bookingFilter === 'cancelled') return cancelledBookings;
    return userBookings;
  }, [bookings, customer.id, bookingFilter, activeBookings, completedBookings, cancelledBookings]);

  // Customer's favourite helpers
  const favouriteHelpers = helpers.filter((h) => customer.favouriteHelperIds.includes(h.id));

  // Community helper count
  const communityHelpers = helpers.filter(
    (h) => h.locality === customer.locality || h.apartmentsServed.includes(customer.apartmentName)
  );

  // Toggle chore selection
  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Clear all selected tasks
  const handleClearSelected = () => {
    setSelectedTaskIds([]);
  };

  // Launch Need Help booking flow with strictly the user's selected tasks
  const handleProceedWithSelectedTasks = () => {
    onOpenNeedHelp('casual', undefined, selectedTaskIds);
    // Note: Do not clear immediately here so user returns safely if they cancel
  };

  // Filtered task catalog for the services tab
  const displayedTasks = useMemo(() => {
    let list = MASTER_TASKS;

    if (selectedServiceCategory !== 'all') {
      list = list.filter((t) => t.category === selectedServiceCategory);
    }

    if (serviceSearchQuery.trim()) {
      const q = serviceSearchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.tamilName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedServiceCategory, serviceSearchQuery]);

  // Selected tasks total workload and helper asking price estimate
  const selectedTasksSummary = useMemo(() => {
    const tasks = MASTER_TASKS.filter((t) => selectedTaskIds.includes(t.id));
    const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const avgRates = tasks.map((t) => t.estimatedRateApprox || 100);
    const totalValue = avgRates.reduce((sum, r) => sum + r, 0);

    return {
      tasks,
      totalMinutes,
      totalValue,
      count: selectedTaskIds.length,
    };
  }, [selectedTaskIds]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* 1. Header with Location & Customer Identity */}
      <div className="flex items-center justify-between text-xs font-medium text-stone-500">
        <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span className="font-semibold text-stone-900">{customer.apartmentName}</span>
          <span>·</span>
          <span>{customer.locality}</span>
        </div>
        <span className="text-stone-500 font-medium">
          {communityHelpers.length} helpers nearby
        </span>
      </div>

      {/* 2. Customer Organized Tabs Navigation: Services | Bookings | My Helpers */}
      <div className="flex items-center p-1 bg-stone-100 rounded-2xl text-xs font-bold shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'services'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Available Services</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'bookings'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bookings</span>
          {activeBookings.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-orange-600 text-white text-[10px] font-bold">
              {activeBookings.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('helpers')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'helpers'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>My Helpers</span>
          {favouriteHelpers.length > 0 && (
            <span className="text-stone-400 text-[10px] font-normal">
              ({favouriteHelpers.length})
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: AVAILABLE SERVICES (Clean, intuitive, choose easily)   */}
      {/* ============================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-display">
              What do you need help with?
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Select any chores below to combine into one visit with a trusted helper.
            </p>
          </div>

          {/* Quick Direct Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onOpenNeedHelp('casual')}
              className="p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-sm hover:shadow-md active:scale-[0.99] transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-base font-bold font-display flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-orange-200" />
                  <span>Need help?</span>
                </div>
                <div className="text-xs text-orange-100 mt-1">
                  Choose chores · Choose helper · Scheduled visit
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/90 shrink-0" />
            </button>

            <button
              onClick={() => onOpenNeedHelp('instant')}
              className="p-4 rounded-2xl bg-stone-900 text-white shadow-xs hover:bg-stone-800 active:scale-[0.99] transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-base font-bold font-display flex items-center gap-1.5">
                  <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Need instant help?</span>
                </div>
                <div className="text-xs text-stone-300 mt-1">
                  Immediate arrival within 45 mins (&lt;4 hrs)
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 shrink-0" />
            </button>
          </div>

          {/* Real-time Chore Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={serviceSearchQuery}
              onChange={(e) => setServiceSearchQuery(e.target.value)}
              placeholder="Search chores: sweep, mop, cook lunch, wash vessels, fold clothes..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {serviceSearchQuery && (
              <button
                type="button"
                onClick={() => setServiceSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Service Category Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>Choose Categories</span>
              <span className="text-[11px] text-stone-500 font-normal">
                {displayedTasks.length} services available
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedServiceCategory('all')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  selectedServiceCategory === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Services ({MASTER_TASKS.length})
              </button>

              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedServiceCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedServiceCategory === cat.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span>
                    {cat.id === 'cleaning' && '🧹'}
                    {cat.id === 'bathroom_cleaning' && '🛁'}
                    {cat.id === 'cooking' && '🍳'}
                    {cat.id === 'laundry' && '👕'}
                    {cat.id === 'organisation' && '👗'}
                    {cat.id === 'family' && '👵'}
                    {cat.id === 'kids' && '👶'}
                  </span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* List of Available Services - Tap to choose easily */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {displayedTasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.id);

                if (task.isComingSoon) {
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 opacity-60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-stone-600">{task.name}</div>
                        <div className="text-[11px] text-stone-400">{task.tamilName}</div>
                      </div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase px-2 py-0.5 rounded bg-stone-200">
                        Coming Soon
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-orange-50/90 border-orange-500 ring-2 ring-orange-500'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                        <span>{task.name}</span>
                        {task.isChildcareOnly && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                            Verified Only
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500">{task.tamilName}</div>
                      <div className="text-[10px] text-stone-500 leading-snug line-clamp-1">
                        {task.description}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-600 pt-0.5 font-medium">
                        <span>~{task.estimatedMinutes} mins</span>
                        <span>·</span>
                        <span className="text-stone-800 font-bold">
                          Helper asks ~₹{task.estimatedRateApprox ? Math.round(task.estimatedRateApprox * 2.2) : 220}/hr
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-orange-600 text-white'
                          : 'border border-stone-300 bg-stone-50 text-stone-400'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Selected Chores Summary Bar */}
          {selectedTaskIds.length > 0 && (
            <div className="sticky bottom-4 z-30 p-3.5 rounded-2xl bg-stone-900 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>{selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'Chore' : 'Chores'} Selected</span>
                </div>
                <div className="text-[11px] text-stone-300 line-clamp-1">
                  {selectedTasksSummary.tasks.map((t) => t.name).join(' + ')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="text-[11px] text-stone-400 hover:text-white px-2 py-1"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleProceedWithSelectedTasks}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>Choose Helper & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Pricing Transparency Info */}
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-600 space-y-1">
            <div className="font-bold text-stone-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Transparent Helper Pricing</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              Helpers set their own asking rates per work (e.g. Sweeping: ~₹180–₹220/hr, Cooking: ~₹230–₹280/hr). In the next step, you can compare exactly what each helper asks and pick the one you prefer.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BOOKINGS (All visits: Live, OTP, Completed, Cancelled)  */}
      {/* ============================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 tracking-tight font-display">
                My Bookings
              </h2>
              <p className="text-xs text-stone-500">
                Track live visit progress, OTP codes, and past visit receipts.
              </p>
            </div>

            <div className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
              {bookings.length} Visits Total
            </div>
          </div>

          {/* Bookings Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setBookingFilter('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                bookingFilter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({bookings.length})
            </button>

            <button
              onClick={() => setBookingFilter('active')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                bookingFilter === 'active'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>Active</span>
              {activeBookings.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeBookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setBookingFilter('completed')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                bookingFilter === 'completed'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Completed ({completedBookings.length})
            </button>

            <button
              onClick={() => setBookingFilter('cancelled')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                bookingFilter === 'cancelled'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Cancelled ({cancelledBookings.length})
            </button>
          </div>

          {/* Bookings Cards List */}
          {filteredBookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-dashed border-stone-200 text-center space-y-3">
              <Clock className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="font-bold text-stone-800 text-sm">No visits found in this category</div>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Ready for help at home? Choose your tasks and book a trusted helper in 60 seconds.
              </p>
              <button
                onClick={() => {
                  setActiveTab('services');
                  onOpenNeedHelp('casual');
                }}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
              >
                Choose Services & Book
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const helper = helpers.find((h) => h.id === b.helperId);
                const isActive = ['requested', 'confirmed', 'helper_assigned', 'on_the_way', 'started', 'replacement_required'].includes(b.status);

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition-all shadow-xs space-y-3 ${
                      b.status === 'started'
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : b.status === 'replacement_required'
                        ? 'bg-amber-50/70 border-amber-300'
                        : isActive
                        ? 'bg-orange-50/50 border-orange-200'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    {/* Header: Status & Code */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            b.status === 'started'
                              ? 'bg-emerald-600 text-white'
                              : b.status === 'replacement_required'
                              ? 'bg-amber-600 text-white'
                              : b.status === 'on_the_way'
                              ? 'bg-blue-600 text-white'
                              : b.status === 'completed'
                              ? 'bg-stone-100 text-stone-700'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          ● {b.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-600">
                          {b.bookingCode}
                        </span>
                      </div>

                      <div className="text-xs font-bold font-mono text-stone-900">
                        ₹{b.pricing.totalAmount}
                      </div>
                    </div>

                    {/* Helper & Timing */}
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-stone-900 flex items-center gap-2">
                          <span>{helper?.name || 'Assigning Helper...'}</span>
                          {helper && (
                            <span className="text-amber-600 flex items-center gap-0.5 text-xs font-semibold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{helper.rating}</span>
                            </span>
                          )}
                        </div>

                        <div className="text-stone-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{b.scheduledDate} · {b.scheduledSlot} ({b.durationHours} hrs)</span>
                        </div>

                        <div className="text-stone-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{b.apartmentName}, {b.locality}</span>
                        </div>
                      </div>

                      {/* Start OTP Display (Critical for Active Visits!) */}
                      {isActive && b.status !== 'completed' && (
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-center shadow-xs">
                          <div className="text-[10px] uppercase font-bold text-stone-500 flex items-center justify-center gap-1">
                            <KeyRound className="w-3 h-3 text-orange-600" />
                            <span>Start OTP</span>
                          </div>
                          <div className="text-lg font-black font-mono tracking-wider text-orange-600">
                            {b.startOtp}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tasks List & Work Scope Breakdown */}
                    <div className="space-y-1.5 pt-1 border-t border-stone-100">
                      {b.workScopeBreakdown ? (
                        <div className="space-y-1.5 text-xs">
                          {b.workScopeBreakdown.homeCleaning && (
                            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                              <div className="font-bold text-stone-900 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-orange-700">
                                  <span>🧹</span>
                                  <span>Home Cleaning</span>
                                </span>
                                <span className="font-mono text-stone-700">₹{b.workScopeBreakdown.homeCleaning.price}</span>
                              </div>
                              {b.workScopeBreakdown.homeCleaning.broomingMopping && (
                                <div className="text-[11px] text-stone-600 pl-4 space-y-0.5 mt-1">
                                  <div>
                                    • {b.workScopeBreakdown.homeCleaning.broomingMopping.bedrooms} Bedrooms · {b.workScopeBreakdown.homeCleaning.broomingMopping.halls} Hall · {b.workScopeBreakdown.homeCleaning.broomingMopping.kitchens} Kitchen
                                    {b.workScopeBreakdown.homeCleaning.broomingMopping.balcony ? ' · Balcony' : ''}
                                  </div>
                                  <div className="text-stone-500 capitalize">
                                    ({b.workScopeBreakdown.homeCleaning.broomingMopping.cleaningType} Cleaning)
                                  </div>
                                </div>
                              )}
                              {b.workScopeBreakdown.homeCleaning.dusting && (
                                <div className="text-[11px] text-stone-600 pl-4">• Dusting</div>
                              )}
                              {b.workScopeBreakdown.homeCleaning.kitchenCleaning && (
                                <div className="text-[11px] text-stone-600 pl-4">• Kitchen Counter</div>
                              )}
                            </div>
                          )}

                          {b.workScopeBreakdown.bathroomCleaning && (
                            <div className="p-2.5 bg-cyan-50/70 rounded-xl border border-cyan-200">
                              <div className="font-bold text-cyan-950 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-cyan-800">
                                  <span>🚿</span>
                                  <span>Bathroom Cleaning (Separate Service)</span>
                                </span>
                                <span className="font-mono text-cyan-800">₹{b.workScopeBreakdown.bathroomCleaning.price}</span>
                              </div>
                              <div className="text-[11px] text-cyan-900 pl-4 space-y-0.5 mt-1">
                                <div>
                                  • {b.workScopeBreakdown.bathroomCleaning.config.bathroomCount} {b.workScopeBreakdown.bathroomCleaning.config.bathroomCount === 1 ? 'Bathroom' : 'Bathrooms'}
                                  {' · '}{b.workScopeBreakdown.bathroomCleaning.config.cleaningType} Cleaning
                                </div>
                              </div>
                            </div>
                          )}

                          {b.negotiatedAgreedPrice && (
                            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-0.5">
                              <span>Agreed Price:</span>
                              <span className="font-bold font-mono">₹{b.pricing.totalAmount}</span>
                              <span className="line-through text-stone-400 font-mono text-[10px]">₹{b.workScopeBreakdown.suggestedTotalPrice}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-[11px] font-semibold text-stone-500">
                            Tasks ({b.tasks.length}):
                          </div>
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {b.tasks.map((id) => {
                              const t = MASTER_TASKS.find((task) => task.id === id);
                              return (
                                <span
                                  key={id}
                                  className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700"
                                >
                                  ✓ {t?.name || id}
                                </span>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => onViewBookingDetails(b.id)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <span>View Visit Tracker</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {b.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => onBookAgain(b)}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <Repeat className="w-3 h-3" />
                          <span>Book Again</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MY HELPERS (Favourite helpers & 1-click rebook)        */}
      {/* ============================================================== */}
      {activeTab === 'helpers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 tracking-tight font-display">
                My Favourite Helpers
              </h2>
              <p className="text-xs text-stone-500">
                Trusted helpers saved from your previous visits.
              </p>
            </div>
          </div>

          {favouriteHelpers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-dashed border-stone-200 text-center space-y-2">
              <Heart className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="font-bold text-stone-800 text-xs">No saved helpers yet</div>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                After any visit, tap the heart icon on your helper card to save them to your favourites for easy 1-click rebooking!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favouriteHelpers.map((h) => {
                const helperLastBooking = bookings.find(
                  (b) => b.helperId === h.id && b.status === 'completed'
                );
                const workRates = getHelperWorkRatesBreakdown(h);

                return (
                  <div
                    key={h.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 font-bold text-base flex items-center justify-center font-display">
                          {h.name.split(' ')[0][0]}
                          {h.name.split(' ')[1]?.[0] || ''}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">{h.name}</span>
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{h.rating}</span>
                            </span>
                          </div>

                          <div className="text-xs text-stone-500 mt-0.5">
                            {h.locality} · {h.completedJobs} completed visits
                          </div>

                          <div className="text-xs font-bold text-stone-800 font-mono mt-0.5">
                            Base: ₹{h.hourlyRate || 249} / hr
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleFavourite(h.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                        title="Remove favourite"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    {/* What this helper asks for each work */}
                    <div className="space-y-1 pt-1 border-t border-stone-100">
                      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        Asking rates by work:
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {workRates.map((wr) => (
                          <span
                            key={wr.category}
                            className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium"
                          >
                            {wr.icon} {wr.name}: ₹{wr.askingRate}/hr
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-stone-500">
                        {helperLastBooking
                          ? `Last booked: ${helperLastBooking.tasks.length} chores (${helperLastBooking.durationHours}h)`
                          : 'Available for your community'}
                      </span>

                      <button
                        onClick={() => {
                          if (helperLastBooking) {
                            onBookAgain(helperLastBooking);
                          } else {
                            onOpenNeedHelp('casual', undefined, []);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Book Again</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CUSTOMER ACCOUNT PROFILE & ORDERS STATS               */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white font-extrabold flex items-center justify-center text-xl font-display shadow-inner">
                  {customer.name.split(' ')[0][0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display">{customer.name}</h2>
                  <div className="text-xs text-stone-300 font-mono mt-0.5">
                    {maskPhoneNumber(customer.phone)}
                  </div>
                  <div className="text-[11px] text-orange-300 mt-0.5">
                    {customer.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                    title="Sign Out of customer account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
                {onOpenAuth && (
                  <button
                    onClick={onOpenAuth}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Switch</span>
                  </button>
                )}
              </div>
            </div>

            {/* Address Card */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Saved Home Address:
              </div>
              <div className="font-semibold text-white">
                {customer.flat}, {customer.block}, {customer.apartmentName}
              </div>
              <div className="text-stone-300 text-[11px]">
                {customer.locality}, Chennai
              </div>
            </div>

            {/* Quick Account Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-lg font-black font-mono text-orange-400">{filteredBookings.length}</div>
                <div className="text-[10px] text-stone-400">Total Visits</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-lg font-black font-mono text-emerald-400">{completedBookings.length}</div>
                <div className="text-[10px] text-stone-400">Completed</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-lg font-black font-mono text-amber-400">{favouriteHelpers.length}</div>
                <div className="text-[10px] text-stone-400">Favourite Helpers</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3 text-xs">
            <div className="font-bold text-stone-900">Household Preferences</div>
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-900">Dietary & Cooking: </span>
              {customer.preferences.dietary || 'Standard homestyle'}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {customer.preferences.elderFriendly && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-semibold border border-rose-100">
                  👵 Elder Friendly
                </span>
              )}
              {customer.preferences.kidsFriendly && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-100">
                  👶 Child Friendly
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
