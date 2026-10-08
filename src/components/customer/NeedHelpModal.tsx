import React, { useEffect, useMemo, useState } from 'react';
import { Customer, Helper, PricingConfig, ServiceCategory } from '../../types';
import { db } from '../../services/db';
import { ChevronLeft, ChevronRight, Check, X, MapPin, CalendarDays, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  helpers: Helper[];
  pricingConfig: PricingConfig;
  onConfirmBooking: (bookingData: any) => void;
  initialTimingType?: 'instant' | 'casual';
  preselectedCategory?: ServiceCategory;
  preselectedTaskIds?: string[];
  initialHelperId?: string;
}

const services = [
  { id: 'cleaning' as ServiceCategory, icon: '🧹', name: 'Brooming / Mopping' },
  { id: 'bathroom_cleaning' as ServiceCategory, icon: '🚿', name: 'Bathroom Cleaning' },
  { id: 'cooking' as ServiceCategory, icon: '🍳', name: 'Cooking' },
  { id: 'laundry' as ServiceCategory, icon: '👕', name: 'Laundry' },
  { id: 'organisation' as ServiceCategory, icon: '🏠', name: 'Home Organisation' },
  { id: 'family' as ServiceCategory, icon: '👨‍👩‍👧', name: 'Family Assistance' },
];

export const NeedHelpModal: React.FC<Props> = ({ isOpen, onClose, customer, helpers, onConfirmBooking, preselectedCategory, initialHelperId }) => {
  const [step, setStep] = useState(1);
  const [locality, setLocality] = useState(customer.locality || 'Chromepet');
  const [apartmentName, setApartmentName] = useState(customer.apartmentName || '');
  const [block, setBlock] = useState(customer.block || '');
  const [flat, setFlat] = useState(customer.flat || '');
  const getLocalDateString = (date: Date) => { const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; };
  const getMinWorkDate = () => { const now = new Date(); const min = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (now.getHours() >= 23) min.setDate(min.getDate() + 1); return getLocalDateString(min); };
  const [workDate, setWorkDate] = useState(getMinWorkDate());
  const [category, setCategory] = useState<ServiceCategory>(preselectedCategory || 'cleaning');
  const [bedrooms, setBedrooms] = useState(2);
  const [halls, setHalls] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [cleaningType, setCleaningType] = useState<'casual'|'regular'>('regular');
  const [helperId, setHelperId] = useState(initialHelperId || '');
  const [offer, setOffer] = useState('');
  const [counter, setCounter] = useState(0);
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setLocality(customer.locality || 'Chromepet');
    setApartmentName(customer.apartmentName || '');
    setBlock(customer.block || '');
    setFlat(customer.flat || '');
    setWorkDate(getMinWorkDate());
    setCategory(preselectedCategory || 'cleaning');
    setHelperId(initialHelperId || '');
    setOffer('');
    setCounter(0);
    setAgreedPrice(0);
    setNotes('');
  }, [isOpen, customer, preselectedCategory, initialHelperId]);

  const suggestedPrice = useMemo(() => {
    if (category === 'cleaning') return Math.max(250, bedrooms * 100 + halls * 80 + kitchens * 90 + 100);
    if (category === 'bathroom_cleaning') return Math.max(199, bathrooms * 180);
    if (category === 'cooking') return 300;
    if (category === 'laundry') return 250;
    if (category === 'organisation') return 300;
    return 300;
  }, [category, bedrooms, halls, kitchens, bathrooms]);

  const eligibleHelpers = useMemo(() => {
    const sameArea = helpers.filter(h => h.isActive && (
      h.locality?.toLowerCase() === locality.toLowerCase() ||
      h.preferredLocalities?.some(l => l.toLowerCase() === locality.toLowerCase()) ||
      h.apartmentsServed?.some(a => a.toLowerCase() === apartmentName.toLowerCase())
    ));
    return sameArea.length ? sameArea : helpers.filter(h => h.isActive);
  }, [helpers, locality, apartmentName]);

  const selectedHelper = helpers.find(h => h.id === helperId);

  const workDescription = category === 'cleaning'
    ? `${bedrooms} bedroom(s), ${halls} hall(s), ${kitchens} kitchen(s) · ${cleaningType === 'regular' ? 'Regular' : 'Casual'} Cleaning`
    : category === 'bathroom_cleaning'
      ? `${bathrooms} bathroom(s) · ${cleaningType === 'regular' ? 'Regular' : 'Casual'} Cleaning`
      : services.find(s => s.id === category)?.name || category;

  const buildBooking = () => {
    if (!selectedHelper) return;
    if (workDate < getMinWorkDate()) { setStep(2); return; }
    const finalPrice = agreedPrice || counter || Number(offer) || suggestedPrice;
    const taskId = category === 'cleaning' ? 'clean_sweep'
      : category === 'bathroom_cleaning' ? 'bath_clean'
      : category === 'cooking' ? 'cook_home'
      : category === 'laundry' ? 'laundry_home'
      : category === 'organisation' ? 'organise_home' : 'family_help';

    onConfirmBooking({
      customerId: customer.id,
      helperId: selectedHelper.id,
      bookingMode: 'choose_helper',
      bookingType: 'casual',
      status: 'requested',
      category,
      tasks: [taskId],
      scheduledDate: workDate,
      scheduledSlot: 'Work-specific booking',
      durationHours: 1,
      estimatedWorkloadMinutes: 0,
      isUrgent: false,
      locality,
      apartmentName,
      block,
      flat,
      customerNotes: notes,
      workScope: { description: workDescription, bedrooms, halls, kitchens, bathrooms, cleaningType },
      customerOfferPrice: finalPrice,
      negotiatedAgreedPrice: finalPrice,
      priceNegotiationStatus: 'pending_helper',
      paymentStatus: 'pay_after_arrival_or_completion',
      pricing: {
        baseHourlyRate: selectedHelper.hourlyRate,
        durationHours: 1,
        baseAmount: finalPrice,
        taskComplexityAdjustment: 0,
        urgentFee: 0,
        weekendFee: 0,
        multiTaskDiscount: 0,
        subtotal: finalPrice,
        zunoFee: 0,
        helperPayout: finalPrice,
        totalAmount: finalPrice,
      },
    });
    onClose();
  };

  if (!isOpen) return null;

  return <div className="fixed inset-0 z-50 bg-black/40 p-3 sm:p-6 flex items-end sm:items-center justify-center">
    <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 p-4 flex items-center justify-between">
        <div><div className="font-black text-lg">Need Help</div><div className="text-xs text-stone-500">Step {step} of 7 · Work-specific booking</div></div>
        <button onClick={onClose}><X className="w-5 h-5"/></button>
      </div>

      <div className="p-5 space-y-5">
        {step === 1 && <div className="space-y-4">
          <h2 className="font-black text-xl">Where is the work?</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold">Locality<input value={locality} onChange={e=>setLocality(e.target.value)} className="mt-1 w-full p-3 rounded-xl border"/></label>
            <label className="text-xs font-bold">Apartment<input value={apartmentName} onChange={e=>setApartmentName(e.target.value)} className="mt-1 w-full p-3 rounded-xl border"/></label>
            <label className="text-xs font-bold">Block<input value={block} onChange={e=>setBlock(e.target.value)} className="mt-1 w-full p-3 rounded-xl border"/></label>
            <label className="text-xs font-bold">Flat<input value={flat} onChange={e=>setFlat(e.target.value)} className="mt-1 w-full p-3 rounded-xl border"/></label>
          </div>
          <button onClick={()=>setStep(2)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold">Continue <ChevronRight className="inline w-4 h-4"/></button>
        </div>}

        {step === 2 && <div className="space-y-4">
          <h2 className="font-black text-xl">Choose work date</h2>
          <p className="text-sm text-stone-500">Helpers are matched by the work requested, not by time slots.</p>
          <label className="text-xs font-bold">Date<input type="date" min={new Date().toISOString().slice(0,10)} value={workDate} onChange={e=>{ const value=e.target.value; if (value >= getMinWorkDate()) setWorkDate(value); }} className="mt-1 w-full p-3 rounded-xl border"/></label>
          <button disabled={workDate < getMinWorkDate()} onClick={()=>setStep(3)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold disabled:opacity-40">Continue <ChevronRight className="inline w-4 h-4"/></button>
        </div>}

        {step === 3 && <div className="space-y-4">
          <h2 className="font-black text-xl">What work do you need?</h2>
          <div className="grid grid-cols-2 gap-3">{services.map(s=><button key={s.id} onClick={()=>setCategory(s.id)} className={`p-4 rounded-2xl border text-left ${category===s.id?'border-orange-500 bg-orange-50':'border-stone-200'}`}><div className="text-2xl">{s.icon}</div><div className="font-bold text-sm mt-2">{s.name}</div></button>)}</div>
          <button onClick={()=>setStep(4)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold">Continue <ChevronRight className="inline w-4 h-4"/></button>
        </div>}

        {step === 4 && <div className="space-y-4">
          <h2 className="font-black text-xl">Work details</h2>
          {category === 'cleaning' && <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">{[['Bedrooms',bedrooms,setBedrooms],['Halls',halls,setHalls],['Kitchens',kitchens,setKitchens]].map(([label,value,setter])=><label key={label as string} className="text-xs font-bold">{label as string}<input type="number" min="0" value={value as number} onChange={e=>(setter as any)(Number(e.target.value))} className="mt-1 w-full p-3 rounded-xl border"/></label>)}</div>
            <div className="p-3 rounded-xl bg-stone-50 text-xs text-stone-600">Cleaning includes brooming and mopping using your home's available cleaning products.</div>
            <div className="grid grid-cols-2 gap-2">{(['casual','regular'] as const).map(t=><button key={t} onClick={()=>setCleaningType(t)} className={`p-3 rounded-xl border font-bold text-sm ${cleaningType===t?'border-orange-500 bg-orange-50':''}`}>{t==='casual'?'Casual Cleaning':'Regular Cleaning'}</button>)}</div>
          </div>}
          {category === 'bathroom_cleaning' && <div className="space-y-4">
            <label className="text-xs font-bold">Bathrooms<input type="number" min="1" value={bathrooms} onChange={e=>setBathrooms(Number(e.target.value))} className="mt-1 w-full p-3 rounded-xl border"/></label>
            <div className="p-3 rounded-xl bg-stone-50 text-xs text-stone-600">Bathroom cleaning includes toilet, sink, floor, shower area, tiles and mirror as applicable, using your home's available cleaning products.</div>
            <div className="grid grid-cols-2 gap-2">{(['casual','regular'] as const).map(t=><button key={t} onClick={()=>setCleaningType(t)} className={`p-3 rounded-xl border font-bold text-sm ${cleaningType===t?'border-orange-500 bg-orange-50':''}`}>{t==='casual'?'Casual Cleaning':'Regular Cleaning'}</button>)}</div>
          </div>}
          {!['cleaning','bathroom_cleaning'].includes(category) && <div className="p-4 rounded-2xl bg-stone-50 text-sm">Tell the helper the exact work for <b>{services.find(s=>s.id===category)?.name}</b> in the notes on the review step.</div>}
          <button onClick={()=>setStep(5)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold">Find matching helpers <ChevronRight className="inline w-4 h-4"/></button>
        </div>}

        {step === 5 && <div className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-black text-xl">Matching helpers</h2><span className="text-xs font-bold text-emerald-700">{eligibleHelpers.length} found</span></div>
          {eligibleHelpers.map(h=><button key={h.id} onClick={()=>setHelperId(h.id)} className={`w-full text-left p-4 rounded-2xl border ${helperId===h.id?'border-orange-500 bg-orange-50':'border-stone-200'}`}>
            <div className="flex items-center justify-between"><div><div className="font-bold">{h.name}</div><div className="text-xs text-stone-500">{h.locality} · {h.experienceYears} yrs experience</div></div><div className="text-sm font-bold">★ {h.rating}</div></div>
            <div className="mt-2 text-xs text-emerald-700"><ShieldCheck className="inline w-3.5 h-3.5"/> Verified helper</div>
          </button>)}
          {helperId && <button onClick={()=>setStep(6)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold">Review <ChevronRight className="inline w-4 h-4"/></button>}
        </div>}

        {step === 6 && selectedHelper && <div className="space-y-4">
          <h2 className="font-black text-xl">Review & negotiate</h2>
          <div className="p-4 rounded-2xl bg-stone-50 space-y-2 text-sm">
            <div className="font-bold">{services.find(s=>s.id===category)?.icon} {services.find(s=>s.id===category)?.name}</div>
            <div>{workDescription}</div>
            <div className="text-xs text-stone-500"><MapPin className="inline w-3.5 h-3.5"/> {flat}, {block}, {apartmentName}, {locality}</div>
            <div className="text-xs text-stone-500"><CalendarDays className="inline w-3.5 h-3.5"/> {workDate}</div>
          </div>
          <div className="p-4 rounded-2xl border border-stone-200">
            <div className="flex justify-between"><span className="font-bold">Suggested price</span><b>₹{suggestedPrice}</b></div>
            <p className="text-xs text-stone-500 mt-1">Based on the actual work, not hours.</p>
            {counter > 0 && <div className="mt-3 p-3 rounded-xl bg-amber-50 text-sm">Helper counter: <b>₹{counter}</b></div>}
            <div className="mt-3 flex gap-2">
              <input type="number" min="1" value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Your offer" className="flex-1 p-3 rounded-xl border"/>
              <button
                disabled={!selectedHelper || Number(offer) <= 0}
                onClick={() => {
                  const n = Number(offer);
                  if (!selectedHelper || n <= 0) return;
                  setAgreedPrice(n);
                  onConfirmBooking({
                    customerId: customer.id,
                    helperId: selectedHelper.id,
                    bookingMode: 'choose_helper',
                    bookingType: 'casual',
                    status: 'requested',
                    category,
                    tasks: [category === 'cleaning' ? 'clean_sweep' : category === 'bathroom_cleaning' ? 'bath_clean' : category === 'cooking' ? 'cook_home' : category === 'laundry' ? 'laundry_home' : category === 'organisation' ? 'organise_home' : 'family_help'],
                    scheduledDate: workDate,
                    scheduledSlot: 'Work-specific booking',
                    durationHours: 1,
                    estimatedWorkloadMinutes: 0,
                    isUrgent: false,
                    locality,
                    apartmentName,
                    block,
                    flat,
                    customerNotes: notes,
                    workScope: { description: workDescription, bedrooms, halls, kitchens, bathrooms, cleaningType },
                    customerOfferPrice: n,
                    negotiatedAgreedPrice: n,
                    priceNegotiationStatus: 'pending_helper',
                    paymentStatus: 'pay_after_arrival_or_completion',
                    pricing: {
                      baseHourlyRate: selectedHelper.hourlyRate,
                      durationHours: 1,
                      baseAmount: n,
                      taskComplexityAdjustment: 0,
                      urgentFee: 0,
                      weekendFee: 0,
                      multiTaskDiscount: 0,
                      subtotal: n,
                      zunoFee: 0,
                      helperPayout: n,
                      totalAmount: n,
                    },
                  });
                  onClose();
                }}
                className="px-4 rounded-xl bg-stone-900 text-white font-bold disabled:opacity-40"
              >
                Negotiate
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-500">Your offer will be sent to the helper. This popup will close and the booking will show <b>Pending from Helper</b>.</p>
          </div>
          <label className="text-xs font-bold">Notes (optional)<input value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 w-full p-3 rounded-xl border" placeholder="Anything the helper should know"/></label>
          <button disabled className="w-full p-3.5 rounded-xl font-bold bg-stone-100 text-stone-400">Offer sent — Pending from Helper</button>
        </div>}

        {step === 7 && <div className="space-y-5">
          <div className="text-center"><div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"><Check className="w-7 h-7"/></div><h2 className="font-black text-xl mt-3">Ready to confirm</h2></div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm"><b>₹{agreedPrice} offer sent to {selectedHelper?.name}.</b><br/>We'll check with the helper and update you. Payment is not taken now; Razorpay payment will be collected after the helper reaches your home or after the work is completed.</div>
          <button onClick={buildBooking} className="w-full p-4 rounded-2xl bg-orange-600 text-white font-black">Send offer · Pay later</button>
          <button onClick={()=>setStep(6)} className="w-full p-3 rounded-xl border font-bold">Back</button>
        </div>}
      </div>

      {step>1 && <div className="p-4 border-t border-stone-200"><button onClick={()=>setStep(s=>s-1)} className="text-sm font-bold text-stone-600"><ChevronLeft className="inline w-4 h-4"/> Back</button></div>}
    </div>
  </div>;
};