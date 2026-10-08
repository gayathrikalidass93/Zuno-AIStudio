import React, { useState } from 'react';
import { db } from '../../services/db';
import { Customer, Helper, AuthRole } from '../../types';
import { CHENNAI_LOCALITIES } from '../../data/services';
import {
  User,
  HeartHandshake,
  Shield,
  Phone,
  MapPin,
  Building,
  Mail,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  Star,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (role: AuthRole, userId: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [roleTab, setRoleTab] = useState<AuthRole>('customer');
  const [customerMode, setCustomerMode] = useState<'login' | 'register'>('login');

  // Customer form inputs
  const [phoneInput, setPhoneInput] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLocality, setRegLocality] = useState<string>(CHENNAI_LOCALITIES[1] || 'Chromepet');
  const [regApartment, setRegApartment] = useState('ZUNO Residency');
  const [regBlock, setRegBlock] = useState('A');
  const [regFlat, setRegFlat] = useState('402');

  // Helper form inputs
  const [helperPhoneInput, setHelperPhoneInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const state = db.getState();
  const availableHelpers = state.helpers;

  // Handle Customer Login
  const handleCustomerLogin = (e?: React.FormEvent, directPhone?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const phoneToTest = (directPhone !== undefined ? directPhone : phoneInput).trim();
    if (!phoneToTest) {
      setError('Please enter a valid mobile number');
      return;
    }

    const cleanDigits = phoneToTest.replace(/\D/g, '');
    const found = state.customers.find((c) => {
      const cDigits = c.phone.replace(/\D/g, '');
      return cDigits.endsWith(cleanDigits) || cleanDigits.endsWith(cDigits);
    });

    if (found) {
      db.setSession({
        role: 'customer',
        userId: found.id,
        userName: found.name,
        phone: found.phone,
      });
      setSuccess(`Welcome back, ${found.name}! Logging you in...`);
      setTimeout(() => {
        onLoginSuccess('customer', found.id);
      }, 300);
    } else {
      setPhoneInput(phoneToTest);
      setCustomerMode('register');
      setError('No customer account found for this phone number. Please register your details below.');
    }
  };

  // Handle Customer Registration
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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

    // Create stable new customer
    const newCustomer = db.registerCustomer({
      name: regName.trim(),
      phone: formattedPhone,
      email: regEmail.trim() || `${regName.toLowerCase().replace(/\s+/g, '')}@zuno.example`,
      locality: regLocality,
      apartmentName: regApartment.trim() || 'ZUNO Residency',
      block: regBlock.trim() || 'A',
      flat: regFlat.trim() || '402',
      preferredLanguage: 'English / Tamil',
      preferences: {
        dietary: 'Standard home cooked',
        petInHouse: false,
        elderFriendly: false,
        kidsFriendly: false,
      },
    });

    setSuccess(`Account created for ${newCustomer.name}! Welcome to ZUNO.`);
    setTimeout(() => {
      onLoginSuccess('customer', newCustomer.id);
    }, 300);
  };

  // Handle Helper Login
  const handleHelperLogin = (e?: React.FormEvent, directPhoneOrId?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const input = (directPhoneOrId !== undefined ? directPhoneOrId : helperPhoneInput).trim();
    if (!input) {
      setError('Please enter your helper registered phone number');
      return;
    }

    const cleanDigits = input.replace(/\D/g, '');
    const found = state.helpers.find((h) => {
      if (h.id === input) return true;
      const hDigits = h.phone.replace(/\D/g, '');
      return hDigits.endsWith(cleanDigits) || cleanDigits.endsWith(hDigits);
    });

    if (found) {
      db.setSession({
        role: 'helper',
        userId: found.id,
        userName: found.name,
        phone: found.phone,
      });
      setSuccess(`Welcome, ${found.name}! Opening your helper dashboard...`);
      setTimeout(() => {
        onLoginSuccess('helper', found.id);
      }, 300);
    } else {
      setError('No registered helper found with this phone number. Please choose a verified helper below.');
    }
  };

  // Handle Admin Login
  const handleAdminLogin = () => {
    db.setSession({
      role: 'admin',
      userId: 'admin_ops_1',
      userName: 'ZUNO Operations Admin',
    });
    onLoginSuccess('admin', 'admin_ops_1');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Brand Banner */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 p-6 text-white text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-widest uppercase mb-2 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Household Help On-Demand</span>
          </div>
          <h1 className="text-3xl font-black font-display tracking-tight text-white">
            ZUNO
          </h1>
          <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto">
            Book trusted apartment helpers for cleaning, cooking, laundry, and care tasks.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="p-4 border-b border-stone-100 bg-stone-50">
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2 text-center">
            Sign In As:
          </div>
          <div className="grid grid-cols-3 p-1.5 bg-stone-200/70 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setRoleTab('customer');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                roleTab === 'customer'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab('helper');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                roleTab === 'helper'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Helper</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab('admin');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                roleTab === 'admin'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. CUSTOMER FLOW */}
          {roleTab === 'customer' && (
            <div className="space-y-4">
              {customerMode === 'login' ? (
                <form onSubmit={(e) => handleCustomerLogin(e)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 font-semibold text-sm">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="90000 00002 or 98405 12099"
                        className="w-full pl-13 pr-3.5 py-3 rounded-2xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Customer App</span>
                  </button>

                  {/* 1-Click QA Synthetic Test Setup */}
                  <div className="pt-2 border-t border-stone-200 space-y-2">
                    <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Quick Start Test Accounts:
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput('+91 90000 00002');
                        setRegName('Test Customer Kavitha Flow');
                        setRegLocality('Chromepet');
                        setRegApartment('ZUNO Residency');
                        setRegBlock('A');
                        setRegFlat('402');
                        setRegEmail('customer.kavitha.flow@zuno.example');
                        setCustomerMode('register');
                      }}
                      className="w-full p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-left text-xs font-semibold text-orange-950 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div>⚡ New Test Customer (Chromepet, A-402)</div>
                        <div className="text-[10px] text-stone-500 font-mono">+91 90000 00002</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-200 text-orange-900">
                        Select &rarr;
                      </span>
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setCustomerMode('register');
                      }}
                      className="text-xs text-orange-600 hover:underline font-bold"
                    >
                      New Customer? Register once here &rarr;
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCustomerRegister} className="space-y-3 text-xs">
                  <div className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center justify-between">
                    <span>One-Time Customer Registration</span>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('login')}
                      className="text-xs text-orange-600 hover:underline font-normal"
                    >
                      Back to Login
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Test Customer Kavitha Flow"
                      className="w-full p-2.5 rounded-xl border border-stone-300 font-medium text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 90000 00002"
                      className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-stone-700">Area / Locality *</label>
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
                      <label className="font-bold text-stone-700">Apartment *</label>
                      <input
                        type="text"
                        required
                        value={regApartment}
                        onChange={(e) => setRegApartment(e.target.value)}
                        placeholder="ZUNO Residency"
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-stone-700">Block *</label>
                      <input
                        type="text"
                        required
                        value={regBlock}
                        onChange={(e) => setRegBlock(e.target.value)}
                        placeholder="A"
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-stone-700">Flat No *</label>
                      <input
                        type="text"
                        required
                        value={regFlat}
                        onChange={(e) => setRegFlat(e.target.value)}
                        placeholder="402"
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="customer.kavitha.flow@zuno.example"
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Profile & Enter App</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. HELPER FLOW */}
          {roleTab === 'helper' && (
            <div className="space-y-4">
              <form onSubmit={(e) => handleHelperLogin(e)} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Helper Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 font-semibold text-sm">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={helperPhoneInput}
                      onChange={(e) => setHelperPhoneInput(e.target.value)}
                      placeholder="97909 43210 (Kavitha) or 98401 23411 (Lakshmi)"
                      className="w-full pl-13 pr-3.5 py-3 rounded-2xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In as Helper Partner</span>
                </button>
              </form>

              {/* 1-Click Helper List */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Select Registered Helper:
                </div>
                <div className="space-y-1.5">
                  {availableHelpers.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleHelperLogin(undefined, h.id)}
                      className="w-full p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left text-xs transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center font-display">
                          {h.name.split(' ')[0][0]}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{h.name}</span>
                            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {h.rating}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">
                            {h.locality} · {h.phone}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Login &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. ADMIN FLOW */}
          {roleTab === 'admin' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mx-auto text-2xl border border-stone-200">
                <Shield className="w-7 h-7 text-stone-800" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">ZUNO Control Tower</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Access live market dispatch, real-time bookings, helper verification, and operational supply-demand audit.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAdminLogin}
                className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Enter Admin Operations</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
