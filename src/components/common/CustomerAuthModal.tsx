import React, { useState, useEffect } from 'react';
import { Customer, Helper } from '../../types';
import { db } from '../../services/db';
import { CHENNAI_LOCALITIES } from '../../data/services';
import { maskPhoneNumber } from '../../services/privacy';
import {
  User,
  HeartHandshake,
  Phone,
  MapPin,
  Building,
  Mail,
  CheckCircle2,
  X,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  Star,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomer: Customer;
  activeHelper?: Helper;
  onCustomerChange?: (customer: Customer) => void;
  onHelperChange?: (helper: Helper) => void;
  onRoleChange?: (role: 'customer' | 'mobile_customer' | 'helper' | 'admin' | 'demo') => void;
  initialRole?: 'customer' | 'helper';
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  activeCustomer,
  activeHelper,
  onCustomerChange,
  onHelperChange,
  onRoleChange,
  initialRole = 'customer',
}) => {
  // Main role selector: 'customer' vs 'helper'
  const [authRole, setAuthRole] = useState<'customer' | 'helper'>(initialRole);

  // Customer sub-mode: 'login' | 'register'
  const [customerMode, setCustomerMode] = useState<'login' | 'register'>('login');
  const [phoneInput, setPhoneInput] = useState('');
  const [helperPhoneInput, setHelperPhoneInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration form fields for customer
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLocality, setRegLocality] = useState<string>(CHENNAI_LOCALITIES[0]);
  const [regApartment, setRegApartment] = useState('');
  const [regBlock, setRegBlock] = useState('Block A');
  const [regFlat, setRegFlat] = useState('');

  // Synchronize initialRole when modal opens
  useEffect(() => {
    if (initialRole) setAuthRole(initialRole);
    setError(null);
    setSuccessMessage(null);
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  // Handle Customer Phone Lookup / Login
  const handleCustomerPhoneLookup = (e?: React.FormEvent, phoneOverride?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const clean = (phoneOverride !== undefined ? phoneOverride : phoneInput).trim();
    if (!clean) {
      setError('Please enter a valid mobile number');
      return;
    }

    const state = db.getState();
    const cleanDigits = clean.replace(/\D/g, '');
    const found = state.customers.find((c) => {
      const cDigits = c.phone.replace(/\D/g, '');
      return cDigits.endsWith(cleanDigits) || cleanDigits.endsWith(cDigits);
    });

    if (found) {
      db.setActiveCustomerId(found.id);
      if (onCustomerChange) onCustomerChange(found);
      if (onRoleChange) onRoleChange('customer');
      setSuccessMessage(`Welcome back, ${found.name}! Your saved customer profile and orders are loaded.`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1000);
    } else {
      setCustomerMode('register');
      setPhoneInput(clean);
      setError('No customer account found for this phone number. Create your account in 30 seconds.');
    }
  };

  // Handle Customer Registration
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setError('Please provide your name');
      return;
    }
    if (!phoneInput.trim()) {
      setError('Please provide your mobile number');
      return;
    }

    const formattedPhone = phoneInput.trim().startsWith('+91')
      ? phoneInput.trim()
      : `+91 ${phoneInput.trim()}`;

    const newCustomer = db.registerCustomer({
      name: regName.trim(),
      phone: formattedPhone,
      email: regEmail.trim() || `${regName.toLowerCase().replace(/\s+/g, '')}.demo@zuno.example`,
      locality: regLocality,
      apartmentName: regApartment.trim() || 'ZUNO Residency',
      block: regBlock.trim() || 'Block A',
      flat: regFlat.trim() || '101',
      preferredLanguage: 'English / Tamil',
      preferences: {
        dietary: 'South Indian homestyle',
        elderFriendly: true,
        kidsFriendly: true,
      },
    });

    if (onCustomerChange) onCustomerChange(newCustomer);
    if (onRoleChange) onRoleChange('customer');
    setSuccessMessage(`Account created successfully! Welcome to ZUNO, ${newCustomer.name}.`);
    setTimeout(() => {
      onClose();
      setSuccessMessage(null);
    }, 1000);
  };

  // Handle Helper Phone Lookup / Login
  const handleHelperPhoneLookup = (e?: React.FormEvent, phoneOverride?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const clean = (phoneOverride !== undefined ? phoneOverride : helperPhoneInput).trim();
    if (!clean) {
      setError('Please enter your registered helper mobile number');
      return;
    }

    const state = db.getState();
    const cleanDigits = clean.replace(/\D/g, '');
    const found = state.helpers.find((h) => {
      const hDigits = h.phone.replace(/\D/g, '');
      return hDigits.endsWith(cleanDigits) || cleanDigits.endsWith(hDigits);
    });

    if (found) {
      db.setActiveHelperId(found.id);
      if (onHelperChange) onHelperChange(found);
      if (onRoleChange) onRoleChange('helper');
      setSuccessMessage(`Welcome back, ${found.name}! Opening your helper dashboard & assigned shifts.`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1000);
    } else {
      setError('No registered helper account found with this phone number. Please choose a helper from the verified demo list below.');
    }
  };

  const state = db.getState();
  const demoHelpers = state.helpers.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${authRole === 'customer' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-700'}`}>
              {authRole === 'customer' ? <User className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 font-display">
                {authRole === 'customer'
                  ? (customerMode === 'login' ? 'Customer Sign In' : 'New Customer Registration')
                  : 'Helper Partner Sign In'}
              </div>
              <div className="text-xs text-stone-500">
                {authRole === 'customer'
                  ? 'Access your home visits and orders'
                  : 'View assigned shifts & verify arrival OTP'}
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

        {/* ROLE SELECTION TABS: Customer vs Helper */}
        <div className="px-5 pt-4 pb-2">
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
            Choose your login type:
          </div>
          <div className="grid grid-cols-2 p-1.5 bg-stone-100 rounded-2xl gap-1.5 border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setAuthRole('customer');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authRole === 'customer'
                  ? 'bg-white text-orange-600 shadow-sm border border-orange-200/50'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-tight">Customer</div>
                <div className="text-[9px] font-normal opacity-75">Book visits</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthRole('helper');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authRole === 'helper'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-tight">Helper Partner</div>
                <div className="text-[9px] font-normal opacity-85">View shifts & OTP</div>
              </div>
            </button>
          </div>
        </div>

        {/* Current Active Account Card for the selected role */}
        <div className="px-5 py-2">
          {authRole === 'customer' ? (
            <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center font-display shadow-xs">
                  {activeCustomer.name.split(' ')[0][0]}
                </div>
                <div>
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{activeCustomer.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Currently Active Customer
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {maskPhoneNumber(activeCustomer.phone)} · {activeCustomer.apartmentName}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center font-display shadow-xs">
                  {activeHelper?.name ? activeHelper.name.split(' ')[0][0] : 'H'}
                </div>
                <div>
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{activeHelper?.name || 'Helper Partner'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Currently Active Helper
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-1">
                    <span>{activeHelper?.locality}</span>
                    <span>·</span>
                    <span className="text-amber-600 font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {activeHelper?.rating || 4.9}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Form */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================== */}
          {/* A. CUSTOMER LOGIN & REGISTRATION FLOW                      */}
          {/* ========================================================== */}
          {authRole === 'customer' && (
            <>
              {customerMode === 'login' ? (
                <form onSubmit={(e) => handleCustomerPhoneLookup(e)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Customer Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 font-semibold">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="98405 12099 or 90000 00001"
                        className="w-full pl-12 pr-3 py-3 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* 1-Click Demo Customer Logins */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Quick Demo Customer Sign-in:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneInput('+91 90000 00001');
                          handleCustomerPhoneLookup(undefined, '+91 90000 00001');
                        }}
                        className="p-2 rounded-xl bg-orange-50/70 hover:bg-orange-100 border border-orange-200/80 text-left transition-colors"
                      >
                        <div className="font-bold text-stone-900">Ananya Demo</div>
                        <div className="text-[10px] text-stone-500 font-mono">+91 90000 00001</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPhoneInput('+91 98405 12099');
                          handleCustomerPhoneLookup(undefined, '+91 98405 12099');
                        }}
                        className="p-2 rounded-xl bg-orange-50/70 hover:bg-orange-100 border border-orange-200/80 text-left transition-colors"
                      >
                        <div className="font-bold text-stone-900">Kartik R.</div>
                        <div className="text-[10px] text-stone-500 font-mono">+91 98405 12099</div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In as Customer</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setCustomerMode('register');
                      }}
                      className="text-xs text-orange-600 hover:underline font-bold"
                    >
                      New to ZUNO? Register your profile &rarr;
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCustomerRegister} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ananya"
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 90000 00001"
                      className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700">Chennai Locality</label>
                      <select
                        value={regLocality}
                        onChange={(e) => setRegLocality(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      >
                        {CHENNAI_LOCALITIES.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700">Apartment / Society</label>
                      <input
                        type="text"
                        value={regApartment}
                        onChange={(e) => setRegApartment(e.target.value)}
                        placeholder="e.g. ZUNO Residency"
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700">Block / Wing</label>
                      <input
                        type="text"
                        value={regBlock}
                        onChange={(e) => setRegBlock(e.target.value)}
                        placeholder="Block A"
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700">Flat / Door No *</label>
                      <input
                        type="text"
                        required
                        value={regFlat}
                        onChange={(e) => setRegFlat(e.target.value)}
                        placeholder="e.g. 402"
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account & Start Booking</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setCustomerMode('login');
                      }}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Already have an account? Sign in &rarr;
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ========================================================== */}
          {/* B. HELPER PARTNER LOGIN FLOW                               */}
          {/* ========================================================== */}
          {authRole === 'helper' && (
            <div className="space-y-4">
              <form onSubmit={(e) => handleHelperPhoneLookup(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Helper Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 font-semibold">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={helperPhoneInput}
                      onChange={(e) => setHelperPhoneInput(e.target.value)}
                      placeholder="98401 23411 or 98402 34522"
                      className="w-full pl-12 pr-3 py-3 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Enter your registered helper phone number to open your shift schedule.
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In as Helper</span>
                </button>
              </form>

              {/* Verified Helper One-Click Selector */}
              <div className="space-y-2 pt-1 border-t border-stone-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                  <span>Or Select a Verified Helper (Demo):</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Instant Access</span>
                </div>

                <div className="space-y-1.5">
                  {demoHelpers.map((h) => {
                    const isCurrent = activeHelper?.id === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setHelperPhoneInput(h.phone);
                          handleHelperPhoneLookup(undefined, h.phone);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-stone-50 hover:bg-emerald-50/50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center font-display">
                            {h.name.split(' ')[0][0]}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{h.name}</span>
                              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                {h.rating}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              {h.phone} · {h.locality}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                            Select &rarr;
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
