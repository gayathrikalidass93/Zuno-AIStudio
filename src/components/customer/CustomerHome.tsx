import React, { useMemo, useState } from 'react';
import { Booking, Customer, Helper } from '../../types';
import { db } from '../../services/db';
import { MASTER_TASKS } from '../../data/services';

interface Props {
  customer: Customer;
  helpers: Helper[];
  bookings: Booking[];
  onOpenNeedHelp: () => void;
  onBookAgain: (booking: Booking) => void;
  onViewBookingDetails: (bookingId: string) => void;
  onToggleFavourite: (helperId: string) => void;
  onLogout?: () => void;
  onOpenAuth?: () => void;
}

const SERVICES = [
  { id: 'cleaning', icon: '🧹', name: 'Brooming / Mopping' },
  { id: 'bathroom_cleaning', icon: '🚿', name: 'Bathroom Cleaning' },
  { id: 'cooking', icon: '🍳', name: 'Cooking' },
  { id: 'laundry', icon: '👕', name: 'Laundry' },
  { id: 'organisation', icon: '🏠', name: 'Home Organisation' },
  { id: 'family', icon: '👨‍👩‍👧', name: 'Family Assistance' },
] as const;

export const CustomerHome: React.FC<Props> = ({ customer, helpers, bookings, onOpenNeedHelp, onBookAgain, onViewBookingDetails, onToggleFavourite, onLogout }) => {
  const [tab, setTab] = useState<'home'|'bookings'|'profile'>('home');
  const [bookingTab, setBookingTab] = useState<'upcoming'|'active'|'history'>('upcoming');
  const [language, setLanguage] = useState(customer.preferredLanguage || 'English');
  const [counterInput, setCounterInput] = useState<string>('');

  const myBookings = useMemo(() => bookings.filter(b => b.customerId === customer.id), [bookings, customer.id]);
  // A declined price offer is still an open booking; never hide it because of its status.
  const upcoming = myBookings.filter(b => b.priceNegotiationStatus === 'declined' || ['requested','confirmed','helper_assigned','replacement_required'].includes(b.status));
  const active = myBookings.filter(b => ['on_the_way','started'].includes(b.status));
  const history = myBookings.filter(b => ['completed','cancelled'].includes(b.status));

  const getHelper = (booking: Booking) => booking.helperId ? helpers.find(h => h.id === booking.helperId) : undefined;

  const saveLanguage = (value: string) => {
    setLanguage(value);
    const current = db.getCustomer(customer.id);
    if (current) {
      (current as any).preferredLanguage = value;
      db.updateCustomerLanguage(customer.id, value);
    }
  };

  const list = bookingTab === 'upcoming' ? upcoming : bookingTab === 'active' ? active : history;
  const statusLabel = (b: Booking) => b.priceNegotiationStatus === 'pending_helper'
    ? `Pending from Helper · Offer ₹${b.customerOfferPrice ?? b.pricing.totalAmount} sent`
    : b.priceNegotiationStatus === 'countered'
      ? `Helper countered at ₹${b.helperCounterPrice}. Awaiting your response.`
      : b.priceNegotiationStatus === 'accepted'
        ? `Final agreed price ₹${b.negotiatedAgreedPrice ?? b.pricing.totalAmount} · Helper assigned`
        : b.priceNegotiationStatus === 'declined'
          ? 'Helper declined the offer.'
          : b.status.replace(/_/g,' ');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</p>
          <h1 className="text-2xl font-black text-stone-900">What do you need help with?</h1>
          <p className="text-sm text-stone-500 mt-1">{customer.apartmentName} · {customer.block} · Flat {customer.flat}</p>
        </div>
      </header>

      <button onClick={onOpenNeedHelp} className="w-full rounded-2xl bg-orange-600 text-white p-4 text-left shadow-md hover:bg-orange-700">
        <div className="text-lg font-black">Need Help</div>
        <div className="text-sm text-orange-100">Choose your work, date, helper and negotiate the price.</div>
      </button>

      <section>
        <h2 className="text-sm font-bold text-stone-800 mb-3">Services</h2>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map(s => (
            <button key={s.id} onClick={onOpenNeedHelp} className="bg-white border border-stone-200 rounded-2xl p-4 text-left hover:border-orange-400 hover:shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-bold text-sm text-stone-900">{s.name}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-stone-800">Your Bookings</h2>
          <button onClick={() => setTab('bookings')} className="text-xs font-bold text-orange-600">View all</button>
        </div>
        <div className="flex p-1 bg-stone-100 rounded-xl mb-3">
          {(['upcoming','active','history'] as const).map(t => (
            <button key={t} onClick={() => { setTab('bookings'); setBookingTab(t); }} className={`flex-1 py-2 rounded-lg text-xs font-bold ${bookingTab === t && tab === 'bookings' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}>
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        {list.slice(0,3).map(b => {
          const helper = getHelper(b);
          const isNegotiationFinal = b.priceNegotiationStatus === 'accepted';
          return <div key={b.id} onClick={() => onViewBookingDetails(b.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onViewBookingDetails(b.id); }} className="w-full text-left bg-white border border-stone-200 rounded-2xl p-4 mb-2 cursor-pointer">
            <div className="flex justify-between gap-3">
              <div>
                <div className="font-bold text-sm">
                  {b.tasks?.length > 1
                    ? `${b.tasks.length} services: ${b.tasks.map(taskId => MASTER_TASKS.find(t => t.id === taskId)?.name || taskId).join(' + ')}`
                    : MASTER_TASKS.find(t => t.id === b.tasks?.[0])?.name || b.category || 'Household assistance'}
                </div>
                <div className="text-xs text-stone-500 mt-1">{b.scheduledDate || 'Work date'} · {b.locality}</div>
              </div>
              <span className="text-[10px] font-bold uppercase text-orange-700">
                {b.priceNegotiationStatus === 'pending_helper'
                  ? 'Pending from Helper'
                  : b.priceNegotiationStatus === 'countered'
                    ? 'Helper Countered'
                    : b.priceNegotiationStatus === 'accepted'
                      ? 'Helper Assigned'
                      : b.status.replace(/_/g,' ')}
              </span>
            </div>
            <div className="mt-2 text-xs text-stone-600">
              {helper ? (
                <><span>{isNegotiationFinal ? 'Helper: ' : 'Selected helper: '}</span><b>{helper.name}</b></>
              ) : 'Helper: Not assigned'}
            </div>
            <div className="mt-2 text-xs font-semibold text-amber-700">{statusLabel(b)}</div>
            {b.priceNegotiationStatus === 'countered' && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200" onClick={e=>e.stopPropagation()}>
                <div className="text-[11px] text-amber-900 font-semibold mb-2">
                  The helper has proposed a new price. This booking is <b>not confirmed yet</b>.
                </div>
                <div className="flex gap-2">
                  <button onClick={() => db.customerRespondToCounter(b.id, customer.id, 'accept')} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Accept ₹{b.helperCounterPrice}</button>
                  <input type="number" min="1" value={counterInput} onChange={e=>setCounterInput(e.target.value)} placeholder="Counter ₹" className="min-w-0 flex-1 px-3 py-2 rounded-xl border text-xs" />
                  <button onClick={() => { const n=Number(counterInput); if(n>0){ db.customerRespondToCounter(b.id, customer.id, 'counter', n); setCounterInput(''); } }} className="px-3 py-2 rounded-xl border text-xs font-bold">Counter</button>
                </div>
              </div>
            )}
          </div>;
        })}
        {list.length === 0 && <div className="bg-stone-50 rounded-2xl p-5 text-sm text-stone-500 text-center">No bookings in this section.</div>}
      </section>

      {tab === 'profile' && (
        <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <div><div className="font-black text-lg">{customer.name}</div><div className="text-sm text-stone-500">{customer.phone}</div></div>
          <div className="grid grid-cols-2 gap-3 text-sm"><div className="bg-stone-50 rounded-xl p-3"><b>Apartment</b><br/>{customer.apartmentName}</div><div className="bg-stone-50 rounded-xl p-3"><b>Flat</b><br/>{customer.block} · {customer.flat}</div></div>
          <label className="text-sm font-bold">Preferred language
            <select value={language} onChange={e => saveLanguage(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 p-3">
              <option>English</option><option>Tamil</option><option>Hindi</option><option>Other</option>
            </select>
          </label>
          <button onClick={onLogout} className="w-full rounded-xl border border-stone-300 p-3 text-sm font-bold">Log out</button>
        </section>
      )}

      <nav className="grid grid-cols-3 bg-white border border-stone-200 rounded-2xl p-1">
        {([['home','Home'],['bookings','Bookings'],['profile','Profile']] as const).map(([id,label]) =>
          <button key={id} onClick={() => setTab(id)} className={`rounded-xl py-2.5 text-xs font-bold ${tab===id?'bg-stone-900 text-white':'text-stone-500'}`}>{label}</button>
        )}
      </nav>
    </div>
  );
};