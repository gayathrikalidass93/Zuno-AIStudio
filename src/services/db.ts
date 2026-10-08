import {
  Helper,
  Customer,
  Apartment,
  Booking,
  PricingConfig,
  SupportTicket,
  AuditEvent,
  LocalitySupplyDemand,
  BookingStatus,
  ConsentRecord,
  PrivacyRequest,
  AuthSession,
} from '../types';
import {
  INITIAL_HELPERS,
  INITIAL_CUSTOMERS,
  INITIAL_APARTMENTS,
  INITIAL_BOOKINGS,
  INITIAL_PRICING_CONFIG,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LOCALITY_SUPPLY_DEMAND,
} from '../data/seedData';
import { matchHelpers } from './matching';

const STORAGE_KEY = 'zuno_marketplace_data_v2';
const SESSION_STORAGE_KEY = 'zuno_active_session_v3';

let currentSession: AuthSession | null = null;
try {
  if (typeof localStorage !== 'undefined') {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (rawSession) {
      currentSession = JSON.parse(rawSession);
    }
  }
} catch (e) {
  currentSession = null;
}

export interface MarketplaceState {
  helpers: Helper[];
  customers: Customer[];
  apartments: Apartment[];
  bookings: Booking[];
  pricingConfig: PricingConfig;
  supportTickets: SupportTicket[];
  auditLogs: AuditEvent[];
  supplyDemand: LocalitySupplyDemand[];
  privacyConsents: ConsentRecord[];
  privacyRequests: PrivacyRequest[];
  activeCustomerId: string;
  activeHelperId: string;
}

const INITIAL_PRIVACY_CONSENTS: ConsentRecord[] = [
  {
    id: 'cst_kartik_c1',
    userId: 'cust_kartik',
    userType: 'customer',
    noticeVersion: '1.2.0-dpdp',
    acceptedAt: '2025-08-01T10:00:00Z',
    purposes: {
      serviceFulfilment: true,
      urgentCommunications: true,
      supportSafety: true,
    },
  },
  {
    id: 'hlp_lakshmi_c1',
    userId: 'hlp_lakshmi',
    userType: 'helper',
    noticeVersion: '1.2.0-dpdp',
    acceptedAt: '2025-06-12T08:00:00Z',
    purposes: {
      serviceFulfilment: true,
      urgentCommunications: true,
      supportSafety: true,
    },
  },
];

const INITIAL_PRIVACY_REQUESTS: PrivacyRequest[] = [
  {
    id: 'pr_001',
    userId: 'cust_kartik',
    userName: 'Kartik Krishnan',
    userType: 'customer',
    requestType: 'access_summary',
    status: 'completed',
    details: 'Customer requested a summary of active bookings and saved helper preferences.',
    createdAt: '2026-03-20T11:30:00Z',
    resolvedAt: '2026-03-20T12:00:00Z',
    resolutionNotes: 'Generated secure summary for customer review.',
  },
];

function loadState(): MarketplaceState {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.helpers && parsed.bookings) {
          // Ensure all helpers have hourlyRate and categoryRates
          parsed.helpers = parsed.helpers.map((h: any) => {
            const init = INITIAL_HELPERS.find((ih) => ih.id === h.id);
            return {
              ...h,
              hourlyRate: h.hourlyRate || init?.hourlyRate || 249,
              categoryRates: h.categoryRates || init?.categoryRates || { cleaning: 219, cooking: 249, laundry: 199 },
            };
          });
          parsed.privacyConsents = parsed.privacyConsents || INITIAL_PRIVACY_CONSENTS;
          parsed.privacyRequests = parsed.privacyRequests || INITIAL_PRIVACY_REQUESTS;
          return parsed;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    helpers: INITIAL_HELPERS,
    customers: INITIAL_CUSTOMERS,
    apartments: INITIAL_APARTMENTS,
    bookings: INITIAL_BOOKINGS,
    pricingConfig: INITIAL_PRICING_CONFIG,
    supportTickets: INITIAL_SUPPORT_TICKETS,
    auditLogs: INITIAL_AUDIT_LOGS,
    supplyDemand: INITIAL_LOCALITY_SUPPLY_DEMAND,
    privacyConsents: INITIAL_PRIVACY_CONSENTS,
    privacyRequests: INITIAL_PRIVACY_REQUESTS,
    activeCustomerId: 'cust_kartik',
    activeHelperId: 'hlp_lakshmi',
  };
}

let state: MarketplaceState = loadState();
const listeners = new Set<() => void>();

function saveState() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    // ignore
  }
  state = { ...state };
  listeners.forEach((listener) => listener());
}

export const db = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): MarketplaceState {
    return state;
  },

  resetToDemoData() {
    state = {
      helpers: JSON.parse(JSON.stringify(INITIAL_HELPERS)),
      customers: JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)),
      apartments: JSON.parse(JSON.stringify(INITIAL_APARTMENTS)),
      bookings: JSON.parse(JSON.stringify(INITIAL_BOOKINGS)),
      pricingConfig: JSON.parse(JSON.stringify(INITIAL_PRICING_CONFIG)),
      supportTickets: JSON.parse(JSON.stringify(INITIAL_SUPPORT_TICKETS)),
      auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
      supplyDemand: JSON.parse(JSON.stringify(INITIAL_LOCALITY_SUPPLY_DEMAND)),
      privacyConsents: [],
      privacyRequests: [],
      activeCustomerId: 'cust_kartik',
      activeHelperId: 'hlp_lakshmi',
    };
    saveState();
  },

  // Session & Authentication Management
  getSession(): AuthSession | null {
    return currentSession;
  },

  setSession(session: AuthSession | null) {
    currentSession = session;
    try {
      if (typeof localStorage !== 'undefined') {
        if (session) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
      if (session) {
        if (session.role === 'customer') {
          state.activeCustomerId = session.userId;
        } else if (session.role === 'helper') {
          state.activeHelperId = session.userId;
        }
      }
    } catch (e) {
      // ignore
    }
    saveState();
  },

  logout() {
    this.setSession(null);
  },

  resetCustomerSession() {
    this.setSession(null);
    state.activeCustomerId = '';
    saveState();
  },

  // Active User / Helper switcher
  setActiveCustomerId(id: string) {
    state.activeCustomerId = id;
    const cust = state.customers.find((c) => c.id === id);
    if (cust) {
      this.setSession({
        role: 'customer',
        userId: cust.id,
        userName: cust.name,
        phone: cust.phone,
      });
    } else {
      saveState();
    }
  },

  setActiveHelperId(id: string) {
    state.activeHelperId = id;
    const hlp = state.helpers.find((h) => h.id === id);
    if (hlp) {
      this.setSession({
        role: 'helper',
        userId: hlp.id,
        userName: hlp.name,
        phone: hlp.phone,
      });
    } else {
      saveState();
    }
  },

  getActiveCustomer(): Customer {
    if (currentSession && currentSession.role === 'customer') {
      const found = state.customers.find((c) => c.id === currentSession?.userId);
      if (found) return found;
    }
    const cust = state.customers.find((c) => c.id === state.activeCustomerId);
    return cust || state.customers[0];
  },

  getActiveHelper(): Helper {
    if (currentSession && currentSession.role === 'helper') {
      const found = state.helpers.find((h) => h.id === currentSession?.userId);
      if (found) return found;
    }
    const hlp = state.helpers.find((h) => h.id === state.activeHelperId);
    return hlp || state.helpers.find((h) => h.id === 'hlp_kavitha') || state.helpers[0];
  },

  // Customer Management
  getCustomer(id: string): Customer | undefined {
    return state.customers.find((c) => c.id === id);
  },

  registerCustomer(
    data: Omit<Customer, 'id' | 'createdAt' | 'favouriteHelperIds' | 'preferences'> & {
      favouriteHelperIds?: string[];
      preferences?: Partial<Customer['preferences']>;
    }
  ): Customer {
    // Check if customer with same phone exists
    const cleanDigits = data.phone.replace(/\D/g, '');
    const existing = state.customers.find((c) => {
      const cDigits = c.phone.replace(/\D/g, '');
      return cDigits.endsWith(cleanDigits) || cleanDigits.endsWith(cDigits);
    });

    if (existing) {
      // Update existing customer profile
      existing.name = data.name;
      existing.locality = data.locality;
      existing.apartmentName = data.apartmentName;
      existing.block = data.block;
      existing.flat = data.flat;
      if (data.email) existing.email = data.email;
      if (data.preferences) {
        existing.preferences = { ...existing.preferences, ...data.preferences };
      }
      state.activeCustomerId = existing.id;
      this.setSession({
        role: 'customer',
        userId: existing.id,
        userName: existing.name,
        phone: existing.phone,
      });
      saveState();
      return existing;
    }

    const uniqueNum = Math.floor(100 + Math.random() * 900);
    const newCustomer: Customer = {
      ...data,
      preferences: {
        dietary: 'Standard home cooked',
        petInHouse: false,
        elderFriendly: false,
        kidsFriendly: false,
        ...(data.preferences || {}),
      },
      id: `CUST-TEST-${uniqueNum}`,
      favouriteHelperIds: data.favouriteHelperIds || [],
      createdAt: new Date().toISOString(),
    };

    state.customers.push(newCustomer);
    state.activeCustomerId = newCustomer.id;
    this.setSession({
      role: 'customer',
      userId: newCustomer.id,
      userName: newCustomer.name,
      phone: newCustomer.phone,
    });

    db.logAudit({
      bookingId: 'AUTH',
      event: `New customer registered: ${newCustomer.name} (${newCustomer.locality})`,
      actor: 'customer',
      actorName: newCustomer.name,
    });

    saveState();
    return newCustomer;
  },

  updateCustomerLanguage(customerId: string, language: string) {
    const cust = state.customers.find((c) => c.id === customerId);
    if (!cust) return;
    cust.preferredLanguage = language;
    saveState();
  },

  toggleFavouriteHelper(customerId: string, helperId: string): boolean {
    const cust = state.customers.find((c) => c.id === customerId);
    if (!cust) return false;
    const isFav = cust.favouriteHelperIds.includes(helperId);
    if (isFav) {
      cust.favouriteHelperIds = cust.favouriteHelperIds.filter((id) => id !== helperId);
    } else {
      cust.favouriteHelperIds.push(helperId);
    }
    saveState();
    return !isFav;
  },

  updateCustomerPreferences(customerId: string, preferences: Customer['preferences']) {
    const cust = state.customers.find((c) => c.id === customerId);
    if (cust) {
      cust.preferences = { ...cust.preferences, ...preferences };
      saveState();
    }
  },

  // Helper Management
  getHelper(id: string): Helper | undefined {
    return state.helpers.find((h) => h.id === id);
  },

  updateHelperAvailability(
    helperId: string,
    status: Helper['availabilityStatus']
  ) {
    const hlp = state.helpers.find((h) => h.id === helperId);
    if (hlp) {
      hlp.availabilityStatus = status;
      saveState();
    }
  },

  updateHelperVerification(
    helperId: string,
    verificationStatus: Helper['verificationStatus'],
    checklist?: Partial<Helper['verificationChecklist']>,
    isChildcareVerified?: boolean
  ) {
    const hlp = state.helpers.find((h) => h.id === helperId);
    if (hlp) {
      hlp.verificationStatus = verificationStatus;
      hlp.isActive = verificationStatus === 'verified';
      if (checklist) {
        hlp.verificationChecklist = { ...hlp.verificationChecklist, ...checklist };
      }
      if (isChildcareVerified !== undefined) {
        hlp.isChildcareVerified = isChildcareVerified;
      }
      saveState();
    }
  },

  // Booking Flow
  createBooking(bookingData: Omit<Booking, 'id' | 'bookingCode' | 'startOtp' | 'timestamps'>): Booking {
    if (!state.customers.some((c) => c.id === bookingData.customerId)) {
      throw new Error('Customer account does not exist.');
    }
    if (bookingData.helperId && !state.helpers.some((h) => h.id === bookingData.helperId && h.isActive)) {
      throw new Error('Selected helper is not available.');
    }
    const [y,m,day] = bookingData.scheduledDate.split('-').map(Number);
    const requestedDate = new Date(y, m - 1, day);
    const now = new Date();
    const minimum = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (now.getHours() >= 23) minimum.setDate(minimum.getDate() + 1);
    if (requestedDate < minimum) {
      throw new Error('Please choose a future work date.');
    }
    const count = state.bookings.length + 1;
    const bookingCode = `ZUNO-${2600 + count}`;
    const id = `bk_${Date.now()}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking: Booking = {
      ...bookingData,
      id,
      bookingCode,
      startOtp: otp,
      timestamps: {
        requestedAt: new Date().toISOString(),
        confirmedAt: bookingData.status === 'confirmed' ? new Date().toISOString() : undefined,
        assignedAt: bookingData.helperId ? new Date().toISOString() : undefined,
      },
    };

    state.bookings.unshift(newBooking);

    // Audit log
    db.logAudit({
      bookingId: id,
      event: `Booking created (${newBooking.tasks.length} tasks, ${newBooking.durationHours} hrs, ${newBooking.bookingMode})`,
      actor: 'customer',
      actorName: db.getCustomer(newBooking.customerId)?.name || 'Customer',
    });

    saveState();
    return newBooking;
  },

  respondToPriceOffer(bookingId: string, helperId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number): Booking | undefined {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.helperId !== helperId) return undefined;

    if (action === 'accept') {
      const agreed = booking.customerOfferPrice ?? booking.negotiatedAgreedPrice ?? booking.pricing.totalAmount;
      booking.negotiatedAgreedPrice = agreed;
      booking.pricing.baseAmount = agreed;
      booking.pricing.subtotal = agreed;
      booking.pricing.totalAmount = agreed;
      booking.pricing.helperPayout = agreed;
      booking.priceNegotiationStatus = 'accepted';
      booking.status = 'helper_assigned';
    } else if (action === 'counter') {
      if (!counterPrice || counterPrice <= 0) return undefined;
      booking.helperCounterPrice = counterPrice;
      booking.priceNegotiationStatus = 'countered';
      booking.status = 'requested';
    } else {
      booking.priceNegotiationStatus = 'declined';
      booking.status = 'cancelled';
      booking.timestamps.cancelledAt = new Date().toISOString();
    }

    db.logAudit({
      bookingId,
      event: `Helper price response: ${action}${counterPrice ? ` ₹${counterPrice}` : ''}`,
      actor: 'helper',
      actorName: db.getHelper(helperId)?.name || 'Helper',
    });
    saveState();
    return booking;
  },

  acceptCustomerCounter(bookingId: string): Booking | undefined {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.priceNegotiationStatus !== 'countered' || !booking.helperCounterPrice) return undefined;
    booking.negotiatedAgreedPrice = booking.helperCounterPrice;
    booking.pricing.baseAmount = booking.helperCounterPrice;
    booking.pricing.subtotal = booking.helperCounterPrice;
    booking.pricing.totalAmount = booking.helperCounterPrice;
    booking.pricing.helperPayout = booking.helperCounterPrice;
    booking.priceNegotiationStatus = 'accepted';
    booking.status = 'helper_assigned';
    saveState();
    return booking;
  },

  updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    metadata?: Record<string, any>
  ): Booking | undefined {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return undefined;

    const prevStatus = booking.status;
    booking.status = newStatus;
    const now = new Date().toISOString();

    if (newStatus === 'confirmed' && !booking.timestamps.confirmedAt) {
      booking.timestamps.confirmedAt = now;
    }
    if (newStatus === 'helper_assigned' && !booking.timestamps.assignedAt) {
      booking.timestamps.assignedAt = now;
    }
    if (newStatus === 'on_the_way' && !booking.timestamps.onTheWayAt) {
      booking.timestamps.onTheWayAt = now;
    }
    if (newStatus === 'started' && !booking.timestamps.startedAt) {
      booking.timestamps.startedAt = now;
    }
    if (newStatus === 'completed' && !booking.timestamps.completedAt) {
      booking.timestamps.completedAt = now;

      // Update helper stats
      if (booking.helperId) {
        const helper = state.helpers.find((h) => h.id === booking.helperId);
        if (helper) {
          helper.completedJobs += 1;
          if (!helper.apartmentsServed.includes(booking.apartmentName)) {
            helper.apartmentsServed.push(booking.apartmentName);
          }
        }
      }
    }

    db.logAudit({
      bookingId,
      event: `Status updated from ${prevStatus} to ${newStatus}`,
      actor: metadata?.actor || 'system',
      actorName: metadata?.actorName || 'ZUNO System',
      details: metadata,
    });

    saveState();
    return booking;
  },

  // OTP Verification for Job Start
  verifyStartOtp(bookingId: string, enteredOtp: string, helperId: string): { success: boolean; message: string } {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found' };
    if (booking.startOtp.trim() !== enteredOtp.trim()) {
      return { success: false, message: 'Invalid OTP. Please check the 4-digit code on the customer screen.' };
    }

    booking.status = 'started';
    booking.timestamps.startedAt = new Date().toISOString();

    db.logAudit({
      bookingId,
      event: `Start OTP ${enteredOtp} verified. Job started.`,
      actor: 'helper',
      actorName: db.getHelper(helperId)?.name || 'Helper',
    });

    saveState();
    return { success: true, message: 'OTP verified! Visit officially started.' };
  },

  // Helper Cancellation & Automatic Replacement
  cancelByHelper(bookingId: string, helperId: string, reason: string): { replacementFound: boolean; replacementHelper?: Helper } {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return { replacementFound: false };

    const originalHelper = state.helpers.find((h) => h.id === helperId);
    const originalHelperName = originalHelper?.name || 'Helper';

    booking.cancellation = {
      reason,
      cancelledBy: 'helper',
      cancelledAt: new Date().toISOString(),
      previousHelperId: helperId,
    };

    // Transition to replacement_required
    booking.status = 'replacement_required';

    db.logAudit({
      bookingId,
      event: `Helper ${originalHelperName} cancelled: "${reason}". ZUNO Replacement Engine triggered.`,
      actor: 'helper',
      actorName: originalHelperName,
    });

    // Run ZUNO Match Engine to find replacement
    const matches = matchHelpers(
      state.helpers.filter((h) => h.id !== helperId),
      {
        selectedTaskIds: booking.tasks,
        locality: booking.locality,
        apartmentName: booking.apartmentName,
        isUrgent: false,
        customer: db.getCustomer(booking.customerId),
      }
    );

    const eligibleMatches = matches.filter((m) => m.isEligible);
    if (eligibleMatches.length > 0) {
      const topReplacement = eligibleMatches[0];
      booking.replacement = {
        status: 'found',
        originalHelperId: helperId,
        replacementHelperId: topReplacement.helper.id,
        matchScore: topReplacement.score,
        offeredAt: new Date().toISOString(),
      };

      db.logAudit({
        bookingId,
        event: `Replacement found: ${topReplacement.helper.name} (${topReplacement.score}% match). Offered to customer.`,
        actor: 'system',
        actorName: 'ZUNO Match Engine',
      });

      saveState();
      return { replacementFound: true, replacementHelper: topReplacement.helper };
    } else {
      booking.replacement = {
        status: 'unfulfilled',
        originalHelperId: helperId,
        offeredAt: new Date().toISOString(),
      };

      db.logAudit({
        bookingId,
        event: 'No replacement helper available in vicinity. Customer offered rescheduling or refund.',
        actor: 'system',
        actorName: 'ZUNO Replacement Engine',
      });

      saveState();
      return { replacementFound: false };
    }
  },

  acceptReplacement(bookingId: string): boolean {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking || !booking.replacement || !booking.replacement.replacementHelperId) return false;

    const newHelperId = booking.replacement.replacementHelperId;
    booking.helperId = newHelperId;
    booking.status = 'confirmed';
    booking.replacement.status = 'accepted';

    db.logAudit({
      bookingId,
      event: `Customer accepted replacement helper ${db.getHelper(newHelperId)?.name}. Booking confirmed.`,
      actor: 'customer',
      actorName: db.getCustomer(booking.customerId)?.name || 'Customer',
    });

    saveState();
    return true;
  },

  chooseReplacementHelper(bookingId: string, helperId: string): boolean {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    booking.helperId = helperId;
    booking.status = 'confirmed';
    if (!booking.replacement) {
      booking.replacement = {
        status: 'accepted',
        originalHelperId: booking.helperId || '',
        replacementHelperId: helperId,
        offeredAt: new Date().toISOString(),
      };
    } else {
      booking.replacement.replacementHelperId = helperId;
      booking.replacement.status = 'accepted';
    }

    db.logAudit({
      bookingId,
      event: `Customer chose replacement helper ${db.getHelper(helperId)?.name}. Booking confirmed.`,
      actor: 'customer',
      actorName: db.getCustomer(booking.customerId)?.name || 'Customer',
    });

    saveState();
    return true;
  },

  // Submit Rating
  submitRating(
    bookingId: string,
    ratingData: {
      overall: number;
      punctuality: number;
      quality: number;
      behaviour: number;
      taskCompletion: number;
      customerFeedback?: string;
    }
  ) {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    booking.rating = {
      ...ratingData,
      createdAt: new Date().toISOString(),
    };

    // Update helper average rating
    if (booking.helperId) {
      const helper = state.helpers.find((h) => h.id === booking.helperId);
      if (helper) {
        const helperBookings = state.bookings.filter(
          (b) => b.helperId === helper.id && b.rating?.overall
        );
        const totalRating = helperBookings.reduce((sum, b) => sum + (b.rating?.overall || 0), 0);
        helper.rating = Number((totalRating / helperBookings.length).toFixed(2));
      }
    }

    db.logAudit({
      bookingId,
      event: `Customer submitted rating: ${ratingData.overall}★ ("${ratingData.customerFeedback || 'No comment'}")`,
      actor: 'customer',
      actorName: db.getCustomer(booking.customerId)?.name || 'Customer',
    });

    saveState();
  },

  submitHelperRatingForCustomer(
    bookingId: string,
    rating: number,
    feedback?: string
  ) {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking || !booking.rating) return;

    booking.rating.helperRatingForCustomer = rating;
    booking.rating.helperFeedback = feedback;

    db.logAudit({
      bookingId,
      event: `Helper rated customer: ${rating}★`,
      actor: 'helper',
      actorName: db.getHelper(booking.helperId || '')?.name || 'Helper',
    });

    saveState();
  },

  // Support Ticket
  createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>): SupportTicket {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `tkt_${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    state.supportTickets.unshift(newTicket);
    saveState();
    return newTicket;
  },

  updateSupportTicketStatus(id: string, status: SupportTicket['status'], resolution?: string) {
    const ticket = state.supportTickets.find((t) => t.id === id);
    if (ticket) {
      ticket.status = status;
      if (resolution) ticket.resolution = resolution;
      saveState();
    }
  },

  // Pricing configuration update
  updatePricingConfig(config: Partial<PricingConfig>) {
    state.pricingConfig = { ...state.pricingConfig, ...config };
    saveState();
  },

  // Audit Logging
  logAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    state.auditLogs.unshift({
      ...event,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
  },

  // Data Import
  importHelpers(newHelpers: Helper[]) {
    // Upsert helpers by ID or phone
    newHelpers.forEach((h) => {
      const idx = state.helpers.findIndex((existing) => existing.id === h.id || existing.phone === h.phone);
      if (idx >= 0) {
        state.helpers[idx] = h;
      } else {
        state.helpers.push(h);
      }
    });
    saveState();
  },

  importApartments(newApartments: Apartment[]) {
    newApartments.forEach((apt) => {
      const idx = state.apartments.findIndex((existing) => existing.name.toLowerCase() === apt.name.toLowerCase());
      if (idx >= 0) {
        state.apartments[idx] = apt;
      } else {
        state.apartments.push(apt);
      }
    });
    saveState();
  },

  // Privacy & DPDP Compliance Methods
  recordConsent(consent: Omit<ConsentRecord, 'id' | 'acceptedAt'>) {
    const existingIdx = state.privacyConsents.findIndex(
      (c) => c.userId === consent.userId && c.noticeVersion === consent.noticeVersion
    );
    const newRecord: ConsentRecord = {
      ...consent,
      id: `cst_${Date.now()}`,
      acceptedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      state.privacyConsents[existingIdx] = newRecord;
    } else {
      state.privacyConsents.unshift(newRecord);
    }
    db.logAudit({
      bookingId: 'PRIVACY',
      event: `Privacy consent recorded for ${consent.userId} (v${consent.noticeVersion})`,
      actor: consent.userType,
      actorName: consent.userId,
    });
    saveState();
  },

  getConsentForUser(userId: string): ConsentRecord | undefined {
    return state.privacyConsents.find((c) => c.userId === userId);
  },

  createPrivacyRequest(req: Omit<PrivacyRequest, 'id' | 'createdAt' | 'status'>): PrivacyRequest {
    const newReq: PrivacyRequest = {
      ...req,
      id: `pr_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    state.privacyRequests.unshift(newReq);
    db.logAudit({
      bookingId: 'PRIVACY',
      event: `Privacy ${req.requestType} request submitted by ${req.userName}`,
      actor: req.userType,
      actorName: req.userName,
    });
    saveState();
    return newReq;
  },

  updatePrivacyRequestStatus(id: string, status: PrivacyRequest['status'], resolutionNotes?: string) {
    const r = state.privacyRequests.find((req) => req.id === id);
    if (r) {
      r.status = status;
      if (resolutionNotes) r.resolutionNotes = resolutionNotes;
      if (status === 'completed' || status === 'rejected') {
        r.resolvedAt = new Date().toISOString();
      }
      db.logAudit({
        bookingId: 'PRIVACY',
        event: `Privacy request ${id} updated to ${status}`,
        actor: 'admin',
        actorName: 'Admin',
      });
      saveState();
    }
  },
};
