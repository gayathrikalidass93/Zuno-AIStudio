import React, { useState } from 'react';
import {
  Booking,
  Helper,
  Customer,
  Apartment,
  PricingConfig,
  SupportTicket,
  AuditEvent,
  LocalitySupplyDemand,
  PrivacyRequest,
  ConsentRecord,
} from '../../types';
import { CHENNAI_LOCALITIES, MASTER_TASKS, SERVICE_CATEGORIES } from '../../data/services';
import {
  LayoutDashboard,
  Radio,
  Users,
  Building2,
  FileCheck2,
  Sliders,
  Upload,
  LifeBuoy,
  History,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AdminControlTowerProps {
  bookings: Booking[];
  helpers: Helper[];
  customers: Customer[];
  apartments: Apartment[];
  pricingConfig: PricingConfig;
  supportTickets: SupportTicket[];
  auditLogs: AuditEvent[];
  supplyDemand: LocalitySupplyDemand[];
  privacyRequests?: PrivacyRequest[];
  privacyConsents?: ConsentRecord[];
  onUpdatePricing: (config: Partial<PricingConfig>) => void;
  onUpdateVerification: (
    helperId: string,
    status: Helper['verificationStatus'],
    checklist?: any,
    isChildcare?: boolean
  ) => void;
  onUpdateTicketStatus: (id: string, status: SupportTicket['status'], resolution?: string) => void;
  onUpdatePrivacyRequest?: (id: string, status: PrivacyRequest['status'], resolutionNotes?: string) => void;
  onImportHelpers: (newHelpers: Helper[]) => void;
  onImportApartments: (newApartments: Apartment[]) => void;
}

export const AdminControlTower: React.FC<AdminControlTowerProps> = ({
  bookings,
  helpers,
  customers,
  apartments,
  pricingConfig,
  supportTickets,
  auditLogs,
  supplyDemand,
  privacyRequests = [],
  privacyConsents = [],
  onUpdatePricing,
  onUpdateVerification,
  onUpdateTicketStatus,
  onUpdatePrivacyRequest,
  onImportHelpers,
  onImportApartments,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'services_tasks'
    | 'supply_demand'
    | 'live_bookings'
    | 'apartments'
    | 'verification'
    | 'pricing'
    | 'data_import'
    | 'support'
    | 'privacy_dpdp'
    | 'audit'
  >('dashboard');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pricing Form State
  const [tempPricing, setTempPricing] = useState<PricingConfig>(pricingConfig);
  const [pricingSavedNotice, setPricingSavedNotice] = useState(false);

  // CSV Import State
  const [importType, setImportType] = useState<'helpers' | 'apartments'>('helpers');
  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(null);

  // Financial calculations
  const totalGmv = bookings.reduce((sum, b) => sum + b.pricing.totalAmount, 0);
  const totalZunoRevenue = bookings.reduce((sum, b) => sum + b.pricing.zunoFee, 0);
  const totalHelperPayouts = bookings.reduce((sum, b) => sum + b.pricing.helperPayout, 0);

  // Status counts
  const activeBookingsCount = bookings.filter((b) =>
    ['requested', 'confirmed', 'helper_assigned', 'on_the_way', 'started'].includes(b.status)
  ).length;
  const replacementRequiredCount = bookings.filter((b) => b.status === 'replacement_required').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePricing(tempPricing);
    setPricingSavedNotice(true);
    setTimeout(() => setPricingSavedNotice(false), 2000);
  };

  const handleParseCsv = () => {
    setImportErrors([]);
    setImportPreview(null);
    setImportSuccessNotice(null);

    if (!csvText.trim()) {
      setImportErrors(['CSV text is empty. Please paste CSV rows or click "Load Sample Template" below.']);
      return;
    }

    const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setImportErrors(['CSV must contain a header row and at least 1 data row.']);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    if (importType === 'helpers') {
      const required = ['name', 'phone', 'locality', 'age', 'experience_years'];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        setImportErrors([`Missing required headers: ${missing.join(', ')}`]);
        return;
      }

      const rows: any[] = [];
      const errors: string[] = [];

      lines.slice(1).forEach((line, idx) => {
        const cols = line.split(',').map((c) => c.trim());
        const rowData: Record<string, any> = {};
        headers.forEach((h, i) => {
          rowData[h] = cols[i] || '';
        });

        // Validations
        if (!rowData.name) errors.push(`Row ${idx + 2}: Name is required`);
        if (!rowData.phone) errors.push(`Row ${idx + 2}: Phone is required`);
        if (!CHENNAI_LOCALITIES.includes(rowData.locality as any)) {
          errors.push(
            `Row ${idx + 2}: Locality "${rowData.locality}" is not one of Chennai pilot areas (${CHENNAI_LOCALITIES.join(', ')})`
          );
        }

        rows.push(rowData);
      });

      if (errors.length > 0) {
        setImportErrors(errors);
      } else {
        setImportPreview(rows);
      }
    } else {
      // Apartments
      const required = ['name', 'locality', 'total_flats'];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        setImportErrors([`Missing required headers: ${missing.join(', ')}`]);
        return;
      }

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        const rowData: Record<string, any> = {};
        headers.forEach((h, i) => {
          rowData[h] = cols[i] || '';
        });
        return rowData;
      });
      setImportPreview(rows);
    }
  };

  const handleCommitImport = () => {
    if (!importPreview) return;

    if (importType === 'helpers') {
      const createdHelpers: Helper[] = importPreview.map((row, i) => ({
        id: `hlp_imp_${Date.now()}_${i}`,
        name: row.name,
        photoUrl: '',
        phone: row.phone,
        gender: (row.gender?.toLowerCase() === 'male' ? 'male' : 'female'),
        age: Number(row.age) || 35,
        locality: row.locality,
        serviceRadiusKm: 5,
        preferredLocalities: [row.locality],
        languages: ['Tamil', 'English'],
        experienceYears: Number(row.experience_years) || 4,
        skills: ['clean_sweep', 'clean_mop', 'clean_vessels', 'cook_veg_prep'],
        hourlyRate: Number(row.hourly_rate) || 249,
        hourlyPayout: Number(row.hourly_payout) || Math.round((Number(row.hourly_rate) || 249) * 0.82),
        categoryRates: { cleaning: 219, cooking: 249, laundry: 199 },
        availabilityStatus: 'available_today',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        preferredTime: 'Morning',
        isActive: true,
        verificationStatus: 'verified',
        isChildcareVerified: row.is_childcare_verified === 'true',
        isElderAssistanceEligible: true,
        rating: 4.9,
        completedJobs: 12,
        cancellationRate: 1.0,
        onTimeRate: 99.0,
        emergencyContact: '+91 98401 00000',
        backgroundCheckStatus: 'verified',
        verificationChecklist: {
          idVerified: true,
          addressReferenceVerified: true,
          experienceVerified: true,
          skillsAssessed: true,
          childcareScreened: row.is_childcare_verified === 'true',
        },
        apartmentsServed: [],
        createdAt: new Date().toISOString(),
      }));

      onImportHelpers(createdHelpers);
      setImportSuccessNotice(`Successfully imported and registered ${createdHelpers.length} helpers!`);
    } else {
      const createdApartments: Apartment[] = importPreview.map((row, i) => ({
        id: `apt_imp_${Date.now()}_${i}`,
        name: row.name,
        locality: row.locality,
        address: `${row.name}, ${row.locality}, Chennai`,
        blocks: ['Block A', 'Block B'],
        totalFlats: Number(row.total_flats) || 200,
        activeCustomers: 5,
        activeHelpers: 2,
        totalBookings: 15,
        repeatBookingRate: 60,
      }));
      onImportApartments(createdApartments);
      setImportSuccessNotice(`Successfully imported ${createdApartments.length} apartment societies!`);
    }

    setImportPreview(null);
    setCsvText('');
  };

  const loadSampleHelpersCsv = () => {
    setCsvText(
      `name,phone,locality,gender,age,experience_years,is_childcare_verified\n` +
      `Suganya Murugan,+91 98407 11223,Pallavaram,female,34,5,true\n` +
      `Latha Rajasekar,+91 97892 33445,Chromepet,female,42,8,false\n` +
      `Banu Priya,+91 99401 55667,Medavakkam,female,31,4,true`
    );
    setImportErrors([]);
    setImportPreview(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-display">
              ZUNO Operations Control Tower
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-900 text-white font-mono">
              CHENNAI PILOT
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time supply density, multi-task dispatch, verification workflows & marketplace metrics.
          </p>
        </div>

        {/* Global Key Stats Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-stone-500">Live Active: </span>
            <span className="font-bold text-orange-600 font-mono">{activeBookingsCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-stone-500">Supply Gap: </span>
            <span className="font-bold text-rose-600 font-mono">
              +{supplyDemand.reduce((sum, d) => sum + (d.gap > 0 ? d.gap : 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'services_tasks', label: 'Services & Tasks', icon: Sparkles },
          { id: 'supply_demand', label: 'Supply-Demand View', icon: Radio },
          { id: 'live_bookings', label: 'Live Bookings', icon: Clock },
          { id: 'apartments', label: 'Apartment Density', icon: Building2 },
          { id: 'verification', label: 'Helper Verification', icon: FileCheck2 },
          { id: 'pricing', label: 'Pricing Engine', icon: Sliders },
          { id: 'data_import', label: 'CSV Data Import', icon: Upload },
          { id: 'support', label: `Support Tickets (${supportTickets.filter((t) => t.status === 'open').length})`, icon: LifeBuoy },
          { id: 'privacy_dpdp', label: `Privacy & DPDP (${privacyRequests.filter((r) => r.status === 'pending').length})`, icon: ShieldCheck },
          { id: 'audit', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all shadow-xs ${
                isActive
                  ? 'bg-stone-900 text-white font-bold'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 1. DASHBOARD OVERVIEW */}
      {/* ============================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="text-xs text-stone-500 font-medium">Gross Merchandise Value (GMV)</div>
              <div className="text-2xl font-black text-stone-900 font-mono">₹{totalGmv.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.4% this week</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="text-xs text-stone-500 font-medium">ZUNO Platform Revenue</div>
              <div className="text-2xl font-black text-orange-600 font-mono">₹{totalZunoRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-stone-500">18% transparent take rate</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="text-xs text-stone-500 font-medium">Helper Payouts Paid</div>
              <div className="text-2xl font-black text-emerald-700 font-mono">₹{totalHelperPayouts.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-700 font-medium">82% directly to workers</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="text-xs text-stone-500 font-medium">Repeat Booking Rate</div>
              <div className="text-2xl font-black text-stone-900 font-mono">74.2%</div>
              <div className="text-[11px] text-emerald-600 font-semibold">High apartment retention</div>
            </div>
          </div>

          {/* Operational Quality Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-stone-500">Average Rating:</span>
              <div className="text-lg font-bold text-stone-900 flex items-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>4.91 / 5.0</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-stone-500">On-Time Arrival:</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">98.4%</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-stone-500">Cancellation Rate:</span>
              <div className="text-lg font-bold text-stone-900 mt-0.5">1.2%</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-stone-500">Replacement Resolved:</span>
              <div className="text-lg font-bold text-orange-600 mt-0.5">100% within 2m</div>
            </div>
          </div>

          {/* Urgent Attention Alert: Replacement Required / High Gap */}
          {replacementRequiredCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs text-amber-950">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold">
                    {replacementRequiredCount} Booking(s) Require Helper Replacement
                  </div>
                  <div className="text-[11px] text-amber-800">
                    A helper cancelled. ZUNO Match engine has found candidate replacements awaiting customer confirmation.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('live_bookings')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                View Live Bookings
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SERVICES & MASTER TASK RECORDS */}
      {/* ============================================================== */}
      {activeTab === 'services_tasks' && (
        <div className="space-y-4 text-xs">
          {/* Overview Header */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-display flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Service Catalog & Task Records</span>
                </h3>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Complete operational view of services and work items. <strong>Bathroom Cleaning is a separate service</strong> with independent pricing, distinct from Home Cleaning.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                {MASTER_TASKS.length} Master Tasks
              </span>
            </div>

            {/* Service Structure Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Home Cleaning Card */}
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-orange-950 text-xs flex items-center gap-1.5">
                    <span className="text-base">🧹</span>
                    <span>Home Cleaning</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-900">
                    Floor Rooms Only
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Includes Brooming & Mopping, Dusting, General Home Cleaning, and Kitchen Counter. <strong>Does NOT include bathrooms.</strong> Work scope asks strictly for bedrooms, halls, kitchens, and other floor areas.
                </p>
                <div className="text-[10px] text-orange-900 font-medium flex items-center gap-2 pt-1 border-t border-orange-200/60">
                  <span>Base Rate: ₹{tempPricing.broomingBaseRate || 60}/room</span>
                  <span>·</span>
                  <span>Deep Multiplier: {tempPricing.broomingDeepCleanMultiplier || 1.5}x</span>
                </div>
              </div>

              {/* Bathroom Cleaning Card */}
              <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-cyan-950 text-xs flex items-center gap-1.5">
                    <span className="text-base">🚿</span>
                    <span>Bathroom Cleaning (Separate Service)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-200 text-cyan-900">
                    Standalone Service
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Dedicated service selected independently. Scope: 1, 2, 3, 4+ bathrooms, cleaning type (Casual / Regular / Deep), and fixtures (toilet, sink, floor, shower area, tiles, mirror).
                </p>
                <div className="text-[10px] text-cyan-900 font-medium flex items-center gap-2 pt-1 border-t border-cyan-200/60">
                  <span>Base / Bath: ₹{tempPricing.bathroomCleaningRatePerBath || 149}</span>
                  <span>·</span>
                  <span>Regular: +₹{tempPricing.bathroomRegularAddon || 50}</span>
                  <span>·</span>
                  <span>Deep: +₹{tempPricing.bathroomDeepCleanAddon || 120}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Master Tasks Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-stone-50 border-b border-stone-200 font-bold text-stone-800 flex items-center justify-between text-xs">
              <span>Operational Task Definitions</span>
              <span className="text-[11px] text-stone-500 font-normal">
                Structured independently across categories
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold text-[11px]">
                  <tr>
                    <th className="p-3">Task ID</th>
                    <th className="p-3">Service Category</th>
                    <th className="p-3">Task Name</th>
                    <th className="p-3">Work Scope Description</th>
                    <th className="p-3">Est. Time</th>
                    <th className="p-3">Est. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {MASTER_TASKS.map((task) => (
                    <tr key={task.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-stone-700">{task.id}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            task.category === 'bathroom_cleaning'
                              ? 'bg-cyan-100 text-cyan-800'
                              : task.category === 'cleaning'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {task.category === 'bathroom_cleaning'
                            ? 'Bathroom Cleaning (Separate)'
                            : task.category === 'cleaning'
                            ? 'Home Cleaning'
                            : task.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-stone-900">{task.name}</div>
                        <div className="text-[10px] text-stone-400">{task.tamilName}</div>
                      </td>
                      <td className="p-3 text-[11px] text-stone-600 max-w-xs">
                        {task.description}
                      </td>
                      <td className="p-3 font-mono text-stone-700">{task.estimatedMinutes}m</td>
                      <td className="p-3 font-mono font-bold text-stone-900">
                        ₹{task.estimatedRateApprox || 120}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SUPPLY-DEMAND VIEW BY LOCALITY (Section 30) */}
      {/* ============================================================== */}
      {activeTab === 'supply_demand' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-900 text-white flex items-center justify-between">
            <div>
              <div className="font-bold text-sm font-display flex items-center gap-2">
                <Radio className="w-4 h-4 text-orange-400" />
                <span>Chennai Locality Supply-Demand Intelligence</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Identifies worker shortages by locality and hour so operations can recruit and balance supply.
              </p>
            </div>
            <div className="text-xs bg-stone-800 px-3 py-1.5 rounded-xl font-mono text-emerald-400">
              8 Pilot Clusters Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supplyDemand.map((item) => {
              const isShortage = item.gap > 0;
              const isSurplus = item.gap < 0;

              return (
                <div
                  key={item.locality}
                  className={`p-4 rounded-2xl border transition-all ${
                    isShortage
                      ? 'bg-rose-50/50 border-rose-200'
                      : isSurplus
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      <span>{item.locality}</span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isShortage
                          ? 'bg-rose-100 text-rose-800'
                          : isSurplus
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isShortage
                        ? `Shortage: -${item.gap} Helpers`
                        : isSurplus
                        ? `Surplus: +${Math.abs(item.gap)} Helpers`
                        : 'Balanced'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 text-xs border-y border-stone-100 text-center">
                    <div>
                      <div className="text-stone-500 text-[10px]">Today Demand</div>
                      <div className="font-bold text-stone-900 font-mono text-base">{item.demandToday}</div>
                    </div>
                    <div>
                      <div className="text-stone-500 text-[10px]">Available Helpers</div>
                      <div className="font-bold text-stone-900 font-mono text-base">{item.availableHelpers}</div>
                    </div>
                    <div>
                      <div className="text-stone-500 text-[10px]">Urgent Pending</div>
                      <div className="font-bold text-orange-600 font-mono text-base">
                        {item.urgentRequestsPending}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="text-[11px] text-stone-500">
                      <span className="font-semibold text-stone-700">Peak Demand Slots: </span>
                      <span>{item.popularSlots}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 border border-stone-200/60 text-[11px] font-medium text-stone-800">
                      💡 <span className="font-semibold">Action: </span>
                      {item.recommendation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. LIVE BOOKINGS MONITOR */}
      {/* ============================================================== */}
      {activeTab === 'live_bookings' && (
        <div className="space-y-4 text-xs">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-stone-200">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, customer or locality..."
                className="p-1 text-xs bg-transparent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1 rounded-lg border border-stone-200 bg-stone-50 text-xs font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="started">Started</option>
                <option value="on_the_way">On the way</option>
                <option value="confirmed">Confirmed</option>
                <option value="replacement_required">Replacement Required</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold text-[11px]">
                  <tr>
                    <th className="p-3">Booking Code</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Customer & Location</th>
                    <th className="p-3">Helper</th>
                    <th className="p-3">Tasks / Duration</th>
                    <th className="p-3">Start OTP</th>
                    <th className="p-3">Bill / Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bookings
                    .filter((b) => {
                      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        return (
                          b.bookingCode.toLowerCase().includes(q) ||
                          b.apartmentName.toLowerCase().includes(q) ||
                          b.locality.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((b) => {
                      const helper = helpers.find((h) => h.id === b.helperId);
                      const customer = customers.find((c) => c.id === b.customerId);

                      return (
                        <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3 font-mono font-bold text-stone-900">
                            {b.bookingCode}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                                b.status === 'replacement_required'
                                  ? 'bg-rose-100 text-rose-800'
                                  : b.status === 'started'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'on_the_way'
                                  ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'completed'
                                  ? 'bg-stone-100 text-stone-700'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {b.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-stone-900">
                              {customer?.name || 'Customer'}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {b.apartmentName} · {b.locality}
                            </div>
                          </td>
                          <td className="p-3">
                            {helper ? (
                              <div className="font-medium text-stone-900">{helper.name}</div>
                            ) : (
                              <span className="text-stone-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3">
                            {b.workScopeBreakdown ? (
                              <div className="space-y-1 text-[11px]">
                                {b.workScopeBreakdown.homeCleaning && (
                                  <div className="inline-block px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 font-semibold mr-1">
                                    🧹 Home: {b.workScopeBreakdown.homeCleaning.broomingMopping ? `${b.workScopeBreakdown.homeCleaning.broomingMopping.bedrooms}B/${b.workScopeBreakdown.homeCleaning.broomingMopping.halls}H` : 'Chores'}
                                  </div>
                                )}
                                {b.workScopeBreakdown.bathroomCleaning && (
                                  <div className="inline-block px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 font-semibold">
                                    🚿 Bath: {b.workScopeBreakdown.bathroomCleaning.config.bathroomCount} Baths ({b.workScopeBreakdown.bathroomCleaning.config.cleaningType})
                                  </div>
                                )}
                                <div className="text-[10px] text-stone-500">{b.scheduledSlot}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-stone-800">
                                  {b.tasks.length} tasks ({b.durationHours} hrs)
                                </div>
                                <div className="text-[10px] text-stone-500">{b.scheduledSlot}</div>
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-orange-600 text-sm">
                            {b.startOtp}
                          </td>
                          <td className="p-3 font-mono">
                            <div className="font-bold text-stone-900">₹{b.pricing.totalAmount}</div>
                            {b.workScopeBreakdown?.negotiatedDiscount && (
                              <div className="text-[10px] text-emerald-700">
                                Agreed (was ₹{b.workScopeBreakdown.suggestedTotalPrice})
                              </div>
                            )}
                            <div className="text-[10px] text-stone-500">
                              Payout: ₹{b.pricing.helperPayout}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. APARTMENT DENSITY MANAGER (Section 31) */}
      {/* ============================================================== */}
      {activeTab === 'apartments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-stone-800">
            <span>Apartment Community Partnerships ({apartments.length} societies)</span>
            <span className="text-stone-500 font-normal">Chennai Pilot Network</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {apartments.map((apt) => (
              <div key={apt.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">{apt.name}</h3>
                    <div className="text-stone-500 text-[11px]">{apt.address}</div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 font-bold text-xs">
                    {apt.repeatBookingRate}% Repeat Rate
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center p-2 rounded-xl bg-stone-50">
                  <div>
                    <div className="text-[10px] text-stone-500">Total Flats</div>
                    <div className="font-bold text-stone-900 font-mono text-sm">{apt.totalFlats}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500">Customers</div>
                    <div className="font-bold text-stone-900 font-mono text-sm">{apt.activeCustomers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500">Helpers</div>
                    <div className="font-bold text-emerald-700 font-mono text-sm">{apt.activeHelpers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500">Bookings</div>
                    <div className="font-bold text-orange-600 font-mono text-sm">{apt.totalBookings}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-600">
                  <span>Blocks: {apt.blocks.join(', ')}</span>
                  <span className="font-semibold text-emerald-700">● Active Society</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. HELPER VERIFICATION WORKFLOW (Section 32) */}
      {/* ============================================================== */}
      {activeTab === 'verification' && (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-900 text-white flex items-center justify-between">
            <div>
              <div className="font-bold text-sm font-display flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Helper Verification & Safety Checklist</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Multi-stage screening for ID, address verification, practical skills assessment and dedicated Childcare qualification.
              </p>
            </div>
            <div className="text-xs text-emerald-400 bg-stone-800 px-3 py-1 rounded-xl">
              100% Verified before dispatch
            </div>
          </div>

          <div className="space-y-3">
            {helpers.map((h) => {
              const cl = h.verificationChecklist;

              return (
                <div key={h.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center font-display">
                        {h.name.split(' ')[0][0]}
                        {h.name.split(' ')[1]?.[0] || ''}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">{h.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              h.verificationStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {h.verificationStatus}
                          </span>
                        </div>
                        <div className="text-stone-500 text-[11px] mt-0.5">
                          {h.phone} · {h.locality} · {h.age} yrs · {h.experienceYears} yrs experience
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {h.verificationStatus !== 'verified' ? (
                        <button
                          onClick={() =>
                            onUpdateVerification(h.id, 'verified', {
                              idVerified: true,
                              addressReferenceVerified: true,
                              experienceVerified: true,
                              skillsAssessed: true,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Approve & Verify
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateVerification(h.id, 'suspended')}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Verification Checklist Items */}
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                    <div className="font-bold text-stone-700 text-[11px]">
                      Verification Checklist:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cl.idVerified}
                          onChange={(e) =>
                            onUpdateVerification(h.id, h.verificationStatus, {
                              idVerified: e.target.checked,
                            })
                          }
                          className="rounded text-orange-600"
                        />
                        <span>Aadhaar/ID</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cl.addressReferenceVerified}
                          onChange={(e) =>
                            onUpdateVerification(h.id, h.verificationStatus, {
                              addressReferenceVerified: e.target.checked,
                            })
                          }
                          className="rounded text-orange-600"
                        />
                        <span>Address Verified</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cl.experienceVerified}
                          onChange={(e) =>
                            onUpdateVerification(h.id, h.verificationStatus, {
                              experienceVerified: e.target.checked,
                            })
                          }
                          className="rounded text-orange-600"
                        />
                        <span>Experience Checked</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cl.skillsAssessed}
                          onChange={(e) =>
                            onUpdateVerification(h.id, h.verificationStatus, {
                              skillsAssessed: e.target.checked,
                            })
                          }
                          className="rounded text-orange-600"
                        />
                        <span>Skills Tested</span>
                      </label>

                      {/* Childcare specific screening */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-amber-900 font-semibold">
                        <input
                          type="checkbox"
                          checked={h.isChildcareVerified}
                          onChange={(e) =>
                            onUpdateVerification(
                              h.id,
                              h.verificationStatus,
                              { childcareScreened: e.target.checked },
                              e.target.checked
                            )
                          }
                          className="rounded text-amber-600"
                        />
                        <span>Kids Care Verified</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. PRICING ENGINE MANAGER (Section 25) */}
      {/* ============================================================== */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSavePricing} className="max-w-xl mx-auto space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="font-bold text-sm text-stone-900 font-display flex items-center justify-between">
              <span>Dynamic Pricing Engine Configuration</span>
              {pricingSavedNotice && (
                <span className="text-emerald-600 text-xs font-semibold">✓ Saved!</span>
              )}
            </div>
            <p className="text-stone-500">
              Update Chennai pilot base rates, worker payout share, and surge/urgent fees without code deployment.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Base Hourly Rate (₹ / hour)
                </label>
                <input
                  type="number"
                  value={tempPricing.baseHourlyRate}
                  onChange={(e) =>
                    setTempPricing({ ...tempPricing, baseHourlyRate: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Helper Payout Share (%)
                  </label>
                  <input
                    type="number"
                    value={tempPricing.helperPayoutPercent}
                    onChange={(e) =>
                      setTempPricing({
                        ...tempPricing,
                        helperPayoutPercent: Number(e.target.value),
                        zunoPlatformFeePercent: 100 - Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold"
                  />
                  <span className="text-[10px] text-stone-500">
                    Platform takes {tempPricing.zunoPlatformFeePercent}%
                  </span>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Multi-Task Bundle Discount (%)
                  </label>
                  <input
                    type="number"
                    value={tempPricing.multiTaskDiscountPercent}
                    onChange={(e) =>
                      setTempPricing({
                        ...tempPricing,
                        multiTaskDiscountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Urgent Dispatch Premium (%)
                  </label>
                  <input
                    type="number"
                    value={tempPricing.urgentPremiumPercent}
                    onChange={(e) =>
                      setTempPricing({
                        ...tempPricing,
                        urgentPremiumPercent: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Weekend Premium (%)
                  </label>
                  <input
                    type="number"
                    value={tempPricing.weekendPremiumPercent}
                    onChange={(e) =>
                      setTempPricing({
                        ...tempPricing,
                        weekendPremiumPercent: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Independent Bathroom Cleaning & Floor Brooming Pricing Controls */}
              <div className="pt-3 border-t border-stone-200 space-y-3">
                <div className="font-bold text-stone-900 text-xs flex items-center justify-between">
                  <span>Bathroom Cleaning Independent Rates</span>
                  <span className="text-[10px] text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded font-bold">
                    Per Bathroom (Not Hourly)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                      Base / Bathroom (₹)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.bathroomCleaningRatePerBath || 149}
                      onChange={(e) =>
                        setTempPricing({
                          ...tempPricing,
                          bathroomCleaningRatePerBath: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-xl border border-stone-200 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                      Regular Scrub Addon (₹)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.bathroomRegularAddon || 50}
                      onChange={(e) =>
                        setTempPricing({
                          ...tempPricing,
                          bathroomRegularAddon: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-xl border border-stone-200 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                      Deep Descaling Addon (₹)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.bathroomDeepCleanAddon || 120}
                      onChange={(e) =>
                        setTempPricing({
                          ...tempPricing,
                          bathroomDeepCleanAddon: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-xl border border-stone-200 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="font-bold text-stone-900 text-xs pt-1 flex items-center justify-between">
                  <span>Brooming & Mopping Floor Pricing</span>
                  <span className="text-[10px] text-orange-800 bg-orange-100 px-2 py-0.5 rounded font-bold">
                    Floor Rooms Only (No Bathrooms)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                      Base / Bedroom/Hall (₹)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.broomingBaseRate || 60}
                      onChange={(e) =>
                        setTempPricing({
                          ...tempPricing,
                          broomingBaseRate: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-xl border border-stone-200 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                      Deep Floor Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={tempPricing.broomingDeepCleanMultiplier || 1.5}
                      onChange={(e) =>
                        setTempPricing({
                          ...tempPricing,
                          broomingDeepCleanMultiplier: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-xl border border-stone-200 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
            >
              Update Pricing Engine Rules
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 7. CSV DATA IMPORT (Section 33) */}
      {/* ============================================================== */}
      {activeTab === 'data_import' && (
        <div className="max-w-2xl mx-auto space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900 font-display">
                  Bulk CSV Data Import
                </h3>
                <p className="text-stone-500 mt-0.5">
                  Upload helpers or apartment records with schema validation and error detection.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setImportType('helpers')}
                  className={`px-2.5 py-1 rounded-md font-bold ${
                    importType === 'helpers' ? 'bg-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Helpers
                </button>
                <button
                  type="button"
                  onClick={() => setImportType('apartments')}
                  className={`px-2.5 py-1 rounded-md font-bold ${
                    importType === 'apartments' ? 'bg-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Apartments
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-stone-700">Paste CSV or use template:</span>
              <button
                type="button"
                onClick={loadSampleHelpersCsv}
                className="text-orange-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Load Sample Helper CSV Template</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="name,phone,locality,gender,age,experience_years,is_childcare_verified"
              className="w-full p-3 font-mono text-[11px] rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
            />

            {importErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Validation Errors Detected ({importErrors.length}):</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{importSuccessNotice}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleParseCsv}
                className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold"
              >
                Validate & Preview Rows
              </button>
            </div>

            {/* Preview Table */}
            {importPreview && importPreview.length > 0 && (
              <div className="pt-3 border-t border-stone-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-stone-900">
                  <span>Valid Rows Preview ({importPreview.length}):</span>
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Confirm & Save to Database
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-stone-100 font-bold text-stone-600">
                      <tr>
                        {Object.keys(importPreview[0]).map((key) => (
                          <th key={key} className="p-2">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {importPreview.map((row, i) => (
                        <tr key={i} className="hover:bg-stone-50">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="p-2">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. SUPPORT TICKETS (Section 27) */}
      {/* ============================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-stone-800">
            <span>Customer Reported Support Issues ({supportTickets.length})</span>
            <span className="text-stone-500 font-normal">Fast Operations Response</span>
          </div>

          <div className="space-y-2.5">
            {supportTickets.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="font-bold text-stone-900">{t.category.replace(/_/g, ' ')}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] capitalize ${
                      t.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    ● {t.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-stone-700 text-xs">{t.description}</div>

                <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-100">
                  <span>Customer: {t.customerName} ({t.bookingId || 'General'})</span>
                  <div className="flex gap-2">
                    {t.status !== 'resolved' && (
                      <button
                        onClick={() =>
                          onUpdateTicketStatus(t.id, 'resolved', 'Addressed with customer and helper credit applied')
                        }
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. PRIVACY & DPDP COMPLIANCE MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'privacy_dpdp' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                DPDP Act (2023) Aligned Data Governance Station
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 mt-0.5">
                Manage data principal requests (access summary, correction, erasure, consent withdrawal),
                audit consent records (v1.2.0-dpdp), and ensure strict role-based purpose limitation across Chennai operations.
              </p>
            </div>
          </div>

          {/* Privacy Consents Audit */}
          <div className="space-y-2">
            <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
              <span>Active Consent Records ({privacyConsents.length})</span>
              <span className="text-[11px] text-stone-500 font-normal">Standard DPDP Notice v1.2.0</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {privacyConsents.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Principal: {c.userId}</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {c.userType}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Notice: <span className="font-semibold text-stone-700">v{c.noticeVersion}</span> · Accepted: {new Date(c.acceptedAt).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">✓ Service Fulfilment</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">✓ Alerts & Safety</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Grievance Requests */}
          <div className="space-y-2 pt-2">
            <div className="font-bold text-xs text-stone-900">
              User Privacy Requests & Grievances ({privacyRequests.length})
            </div>

            {privacyRequests.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-xs text-stone-500">
                No privacy or grievance requests logged.
              </div>
            ) : (
              <div className="space-y-2">
                {privacyRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{req.userName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 uppercase font-mono">
                          {req.requestType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="text-stone-700 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      {req.details}
                    </div>

                    {req.resolutionNotes && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                        Resolution: {req.resolutionNotes}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100">
                      <span>Logged: {new Date(req.createdAt).toLocaleString()}</span>
                      {req.status === 'pending' && onUpdatePrivacyRequest && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onUpdatePrivacyRequest(req.id, 'completed', 'DPO verified and executed request')}
                            className="text-emerald-700 hover:underline font-semibold"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => onUpdatePrivacyRequest(req.id, 'rejected', 'Request does not meet operational threshold')}
                            className="text-rose-600 hover:underline font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. AUDIT TRAIL (Section 35) */}
      {/* ============================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-3 text-xs">
          <div className="font-bold text-stone-800">Operational Event Audit Trail</div>
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-stone-900">{log.event}</div>
                  <div className="text-[11px] text-stone-500">
                    Actor: <span className="font-medium text-stone-700">{log.actorName}</span> ({log.actor}) · Booking: {log.bookingId}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-stone-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
