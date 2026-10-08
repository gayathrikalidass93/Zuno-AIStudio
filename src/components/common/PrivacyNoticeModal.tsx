import React, { useState } from 'react';
import { Customer } from '../../types';
import { db } from '../../services/db';
import { CURRENT_PRIVACY_NOTICE_VERSION, maskPhoneNumber, maskEmail } from '../../services/privacy';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
  HelpCircle,
  Database,
  ArrowRight,
} from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [activeTab, setActiveTab] = useState<'notice' | 'controls' | 'grievance'>('notice');
  const [requestType, setRequestType] = useState<
    'access_summary' | 'correction' | 'erasure_anonymisation' | 'withdraw_consent' | 'grievance'
  >('access_summary');
  const [requestDetails, setRequestDetails] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitPrivacyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    db.createPrivacyRequest({
      userId: customer.id,
      userName: customer.name,
      userType: 'customer',
      requestType,
      details: requestDetails || `Standard ${requestType.replace('_', ' ')} request by customer.`,
    });

    setSubmittedNotice(
      'Your privacy request has been logged. Our Data Protection Officer (DPO) will review within 72 business hours.'
    );
    setRequestDetails('');
    setTimeout(() => {
      setSubmittedNotice(null);
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-stone-900 font-display flex items-center gap-2">
                <span>Privacy & Personal Data Protection</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  v{CURRENT_PRIVACY_NOTICE_VERSION}
                </span>
              </div>
              <div className="text-xs text-stone-500">
                DPDP Act (2023) Aligned Notice & Controls
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 pt-2 border-b border-stone-200 bg-white gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('notice')}
            className={`py-2 px-3 border-b-2 transition-all ${
              activeTab === 'notice'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Privacy Notice
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`py-2 px-3 border-b-2 transition-all ${
              activeTab === 'controls'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            My Data & Masking
          </button>
          <button
            onClick={() => setActiveTab('grievance')}
            className={`py-2 px-3 border-b-2 transition-all ${
              activeTab === 'grievance'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Exercise DPDP Rights
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed">
          {activeTab === 'notice' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Important Privacy Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ZUNO treats household data with strict purpose limitation and data minimisation.
                  We collect only the minimum personal information required to safely match and deliver
                  household help in Chennai.
                </p>
              </div>

              {/* Data Classification Overview */}
              <div className="space-y-2">
                <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                  How We Classify & Protect Data:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Public Marketplace Data</span>
                    </div>
                    <p className="text-stone-600">
                      Helper first names, star ratings, skills, verified badges, and service locality.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <div className="font-bold text-amber-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Private PII (Protected)</span>
                    </div>
                    <p className="text-stone-600">
                      Phone numbers, emails, and exact flat addresses. Never exposed on public cards.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <div className="font-bold text-rose-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Restricted Operational Data</span>
                    </div>
                    <p className="text-stone-600">
                      Verification documents, emergency contacts, and childcare screening records.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <div className="font-bold text-blue-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Role-Based Fulfilment</span>
                    </div>
                    <p className="text-stone-600">
                      Assigned helper receives apartment flat info ONLY during the confirmed visit window.
                    </p>
                  </div>
                </div>
              </div>

              {/* Retention Policy */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-[11px]">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-stone-600" />
                  <span>Data Retention & Anonymisation</span>
                </div>
                <p className="text-stone-600">
                  Completed booking logs are retained for accounting and safety dispute resolution.
                  Personal customer preferences and private communications can be anonymised upon request.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="font-bold text-stone-900">
                Your Personal Information on File ({customer?.name || 'Customer'}):
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Full Name:</span>
                  <span className="font-semibold text-stone-900">{customer?.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Registered Phone:</span>
                  <span className="font-mono text-stone-900 flex items-center gap-2">
                    <span>{maskPhoneNumber(customer?.phone)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans font-bold">
                      Masked in Public
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Email Address:</span>
                  <span className="font-mono text-stone-900">{maskEmail(customer?.email)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Primary Residence:</span>
                  <span className="font-semibold text-stone-900">
                    {customer?.apartmentName}, {customer?.locality}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Apartment Flat / Block:</span>
                  <span className="font-mono text-stone-700">
                    {customer?.flat}, {customer?.block} (Only shared with booked helper)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Helper Privacy Guarantee</span>
                </div>
                <p>
                  Helpers on ZUNO also have their home residential addresses, personal emails, and family emergency
                  numbers strictly protected. You only see their verified skills, ratings, and service locality.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'grievance' && (
            <form onSubmit={handleSubmitPrivacyRequest} className="space-y-3.5">
              <div className="font-bold text-stone-900">
                Exercise Your Rights under the DPDP Framework
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-600">Select Request Type:</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="access_summary">1. Request Summary of Personal Data Processed</option>
                  <option value="correction">2. Request Correction of Outdated Information</option>
                  <option value="erasure_anonymisation">3. Request Erasure / Anonymisation of Account</option>
                  <option value="withdraw_consent">4. Withdraw Voluntary Marketing/Analytics Consent</option>
                  <option value="grievance">5. Register Privacy Grievance with DPO</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-600">
                  Additional Details / Notes:
                </label>
                <textarea
                  rows={3}
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  placeholder="Describe your request or grievance..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {submittedNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submittedNotice}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#2E1437] hover:bg-[#431B50] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Submit DPDP Privacy Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
          <span className="text-stone-500 text-[11px]">
            Data Protection Officer: <span className="font-mono">dpo@zuno.in</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
