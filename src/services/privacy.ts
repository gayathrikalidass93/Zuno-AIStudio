/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ZUNO Privacy Architecture & DPDP Alignment Engine
 * Provides centralized data classification, PII masking, role-based visibility,
 * and user consent management according to the Digital Personal Data Protection Act, 2023.
 */

export type DataClassification = 
  | 'public_marketplace' // Display name, rating, skills, service radius, badges
  | 'private_pii'         // Phone numbers, personal emails, residential addresses
  | 'restricted_ops'      // KYC docs, emergency contacts, internal screening
  | 'admin_audit';        // Logs, support resolution notes, compliance logs

export interface ConsentRecord {
  id: string;
  userId: string;
  userType: 'customer' | 'helper';
  noticeVersion: string; // e.g., "1.2.0-dpdp"
  acceptedAt: string;
  purposes: {
    serviceFulfilment: boolean; // Purpose 1: Connect with helper/customer for household visit
    urgentCommunications: boolean; // Purpose 2: Service arrival, cancellation alerts
    supportSafety: boolean; // Purpose 3: Incident escalation & verification
  };
  revokedAt?: string;
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

export const CURRENT_PRIVACY_NOTICE_VERSION = '1.2.0-dpdp';

/**
 * Masks phone numbers to protect against accidental exposure while allowing verification.
 * Example: "+91 98405 12099" -> "+91 ••••• •2099"
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return 'Not provided';
  const clean = phone.trim();
  if (clean.length <= 4) return '••••';
  const lastFour = clean.slice(-4);
  return `+91 ••••• •${lastFour}`;
}

/**
 * Masks email addresses to prevent public harvesting.
 * Example: "kartik.krishnan@gmail.com" -> "k•••••n@gmail.com"
 */
export function maskEmail(email?: string): string {
  if (!email) return 'Not provided';
  const parts = email.split('@');
  if (parts.length !== 2) return '•••••@••••.com';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}•@${domain}`;
  return `${name[0]}••••${name[name.length - 1]}@${domain}`;
}

/**
 * Masks home address details for public browsing.
 * Helper home addresses must NEVER be exposed to customers.
 * Customer full apartment flat is only visible to the assigned helper of an active booking.
 */
export function sanitizeAddressForRole(
  role: 'customer' | 'helper' | 'admin' | 'public',
  locality: string,
  apartmentName?: string,
  block?: string,
  flat?: string,
  isAssignedActiveBooking: boolean = false
): string {
  if (role === 'admin') {
    return [flat, block, apartmentName, locality].filter(Boolean).join(', ');
  }

  // Assigned helper on active visit needs precise flat for fulfilment
  if (role === 'helper' && isAssignedActiveBooking) {
    return [flat, block, apartmentName, `${locality}, Chennai`].filter(Boolean).join(', ');
  }

  // Customer or other views: Only show locality & apartment community, never flat/block
  if (apartmentName) {
    return `${apartmentName}, ${locality}`;
  }
  return `${locality}, Chennai`;
}
