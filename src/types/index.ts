export type ServiceCategory = 'cleaning' | 'bathroom_cleaning' | 'cooking' | 'laundry' | 'organisation' | 'family' | 'kids';

export interface BroomingMoppingConfig {
  bedrooms: number;
  halls: number;
  kitchens: number;
  otherFloorAreas?: number;
  balcony?: boolean;
  cleaningType: 'casual' | 'regular' | 'deep';
}

export interface BathroomCleaningConfig {
  bathroomCount: number; // 1, 2, 3, 4
  cleaningType: 'casual' | 'regular' | 'deep';
  scope: {
    toilet: boolean;
    floor: boolean;
    sink: boolean;
    showerArea: boolean;
    tiles: boolean;
    mirror: boolean;
    other?: string;
  };
}

export interface WorkScopeBreakdown {
  homeCleaning?: {
    broomingMopping?: BroomingMoppingConfig;
    dusting?: boolean;
    generalCleaning?: boolean;
    kitchenCleaning?: boolean;
    price: number;
  };
  bathroomCleaning?: {
    config: BathroomCleaningConfig;
    price: number;
  };
  suggestedTotalPrice: number;
  agreedPrice: number;
  negotiatedDiscount?: number;
}

export interface Task {
  id: string;
  category: ServiceCategory;
  name: string;
  tamilName: string;
  estimatedMinutes: number;
  estimatedRateApprox?: number; // Standard single-task estimated value
  description: string;
  isChildcareOnly?: boolean;
  isComingSoon?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  locality: string;
  apartmentName: string;
  block: string;
  flat: string;
  preferredLanguage: string;
  preferences: {
    dietary: string; // e.g. "Less spicy, less oil, South Indian veg"
    allergies?: string;
    elderFriendly?: boolean;
    kidsFriendly?: boolean;
    petInHouse?: boolean;
  };
  favouriteHelperIds: string[];
  createdAt: string;
}

export interface Helper {
  id: string;
  name: string;
  photoUrl: string;
  phone: string;
  gender: 'female' | 'male';
  age: number;
  locality: string; // Home locality in Chennai
  serviceRadiusKm: number;
  preferredLocalities: string[];
  languages: string[];
  experienceYears: number;
  skills: string[]; // Task IDs
  hourlyRate: number; // Customer price per hour (what helper charges, e.g. ₹199 - ₹279/hr)
  hourlyPayout: number; // What helper receives (e.g. 82% of hourlyRate)
  categoryRates?: Partial<Record<ServiceCategory, number>>; // What helper asks for specific task categories
  availabilityStatus: 'available_now' | 'available_today' | 'scheduled' | 'off_duty';
  workingDays: string[];
  preferredTime: string;
  isActive: boolean;
  verificationStatus: 'verified' | 'pending' | 'documents_submitted' | 'rejected' | 'suspended';
  isChildcareVerified: boolean;
  childcareExperience?: string;
  childcareAgeGroups?: string[];
  isElderAssistanceEligible: boolean;
  rating: number;
  completedJobs: number;
  cancellationRate: number; // percentage, e.g. 2%
  onTimeRate: number; // percentage, e.g. 98%
  emergencyContact: string;
  backgroundCheckStatus: 'verified' | 'pending' | 'in_progress';
  verificationChecklist: {
    idVerified: boolean;
    addressReferenceVerified: boolean;
    experienceVerified: boolean;
    skillsAssessed: boolean;
    childcareScreened: boolean;
  };
  apartmentsServed: string[];
  createdAt: string;
}

export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'helper_assigned'
  | 'on_the_way'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'replacement_required';

export type PriceNegotiationStatus = 'pending_helper' | 'accepted' | 'countered' | 'declined';
export type PaymentStatus = 'not_due' | 'pay_after_arrival_or_completion' | 'paid';

export interface BookingPricing {
  baseHourlyRate: number; // Selected helper's asking rate per hour
  durationHours: number;
  baseAmount: number;
  taskComplexityAdjustment: number;
  urgentFee: number;
  weekendFee: number;
  multiTaskDiscount: number;
  subtotal: number;
  zunoFee: number;
  helperPayout: number;
  totalAmount: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  helperId?: string;
  status: BookingStatus;
  tasks: string[]; // Task IDs
  category?: ServiceCategory; // e.g. "cleaning"
  bookingType?: 'instant' | 'casual'; // <4h = instant, >4h = casual
  scheduledDate: string; // YYYY-MM-DD
  scheduledSlot: string; // e.g. "10:00 AM - 01:00 PM"
  durationHours: number; // 1, 2, 3, 4
  estimatedWorkloadMinutes: number;
  bookingMode: 'choose_helper' | 'let_zuno_choose' | 'need_help_now';
  isUrgent: boolean;
  locality: string;
  apartmentName: string;
  block: string;
  flat: string;
  customerNotes?: string;
  startOtp: string; // 4-digit verification code
  pricing: BookingPricing;
  workScopeBreakdown?: WorkScopeBreakdown;
  negotiatedAgreedPrice?: number;
  customerOfferPrice?: number;
  helperCounterPrice?: number;
  priceNegotiationStatus?: PriceNegotiationStatus;
  paymentStatus?: PaymentStatus;
  workScope?: {
    description: string;
    bedrooms?: number;
    halls?: number;
    kitchens?: number;
    bathrooms?: number;
    cleaningType?: 'casual' | 'regular';
  };
  timestamps: {
    requestedAt: string;
    confirmedAt?: string;
    assignedAt?: string;
    onTheWayAt?: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
  };
  cancellation?: {
    reason: string;
    cancelledBy: 'customer' | 'helper' | 'admin';
    cancelledAt: string;
    previousHelperId?: string;
  };
  replacement?: {
    status: 'searching' | 'found' | 'accepted' | 'declined' | 'unfulfilled';
    originalHelperId: string;
    replacementHelperId?: string;
    matchScore?: number;
    offeredAt?: string;
  };
  rating?: {
    overall: number;
    punctuality: number;
    quality: number;
    behaviour: number;
    taskCompletion: number;
    customerFeedback?: string;
    helperRatingForCustomer?: number;
    helperFeedback?: string;
    createdAt: string;
  };
}

export interface Apartment {
  id: string;
  name: string;
  locality: string;
  address: string;
  blocks: string[];
  totalFlats: number;
  activeCustomers: number;
  activeHelpers: number;
  totalBookings: number;
  repeatBookingRate: number; // percentage
}

export interface PricingConfig {
  baseHourlyRate: number;
  minimumDurationHours: number;
  urgentPremiumPercent: number;
  weekendPremiumPercent: number;
  helperPayoutPercent: number;
  zunoPlatformFeePercent: number;
  multiTaskDiscountPercent: number;
  // Bathroom Cleaning independent pricing configuration
  bathroomCleaningRatePerBath: number; // Base price per bathroom (default: 149)
  bathroomRegularAddon: number; // Regular cleaning addon (default: 50)
  bathroomDeepCleanAddon: number; // Deep clean addon (default: 120)
  // Brooming & Mopping floor area pricing configuration
  broomingBaseRate: number; // Base per room (default: 60)
  broomingDeepCleanMultiplier: number; // multiplier for deep clean (default: 1.5)
}

export interface SupportTicket {
  id: string;
  bookingId?: string;
  customerId: string;
  customerName: string;
  category:
    | 'helper_didnt_arrive'
    | 'late'
    | 'wrong_task'
    | 'poor_service'
    | 'behaviour_concern'
    | 'safety_concern'
    | 'payment_issue'
    | 'other';
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  resolution?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  bookingId: string;
  event: string;
  actor: 'customer' | 'helper' | 'admin' | 'system';
  actorName: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface LocalitySupplyDemand {
  locality: string;
  demandToday: number;
  availableHelpers: number;
  gap: number; // positive = shortage, negative = surplus
  urgentRequestsPending: number;
  popularSlots: string;
  recommendation: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  userType: 'customer' | 'helper';
  noticeVersion: string;
  acceptedAt: string;
  purposes: {
    serviceFulfilment: boolean;
    urgentCommunications: boolean;
    supportSafety: boolean;
  };
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  userName: string;
  userType: 'customer' | 'helper';
  requestType: 'access_summary' | 'correction' | 'erasure_anonymisation' | 'withdraw_consent' | 'grievance';
  status: 'pending' | 'in_review' | 'completed' | 'rejected';
  details: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export type AuthRole = 'customer' | 'helper' | 'admin';

export interface AuthSession {
  role: AuthRole;
  userId: string;
  userName: string;
  phone?: string;
}

