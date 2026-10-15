import React, { useEffect, useMemo, useState } from 'react';
import { Customer, Helper, PricingConfig, ServiceCategory } from '../../types';
import { matchHelpers } from '../../services/matching';
import { ChevronLeft, ChevronRight, Check, X, MapPin, CalendarDays } from 'lucide-react';

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
  const getMinWorkDate = () => { const now = new Date(); const min = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (now.getHours() >= 21) min.setDate(min.getDate() + 1); return getLocalDateString(min); };
  const makeTimeSlots = (date: string) => { const now = new Date(); const today = getLocalDateString(now); const tomorrow = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)); return Array.from({ length: 16 }, (_, index) => index + 6).filter((hour) => { if (date === today) return hour !== 6 && hour > now.getHours(); if (date === tomorrow && now.getHours() >= 21) return hour !== 6; return true; }).map((hour) => ({ value: `${String(hour).padStart(2, '0')}:00`, label: `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}` })); };
  const [workDate, setWorkDate] = useState(getMinWorkDate());
  const [workTime, setWorkTime] = useState(makeTimeSlots(getMinWorkDate())[0]?.value || '07:00');
  const availableTimeSlots = makeTimeSlots(workDate);
  const selectedTimeLabel = availableTimeSlots.find((slot) => slot.value === workTime)?.label || workTime;
  const [category, setCategory] = useState<ServiceCategory>(preselectedCategory || 'cleaning');
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>(preselectedCategory ? [preselectedCategory] : []);
  const [bedrooms, setBedrooms] = useState(2);
  const [halls, setHalls] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [cookingMembers, setCookingMembers] = useState(1);
  const [laundryMethod, setLaundryMethod] = useState<'machine' | 'hand'>('machine');
  const [laundryClothes, setLaundryClothes] = useState(10);
  const [cleaningType, setCleaningType] = useState<'casual'|'regular'>('regular');
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
    const minDate = getMinWorkDate();
    setWorkDate(minDate);
    setWorkTime(makeTimeSlots(minDate)[0]?.value || '07:00');
    setCategory(preselectedCategory || 'cleaning');
    setSelectedCategories(preselectedCategory ? [preselectedCategory] : []);
    setOffer('');
    setCounter(0);
    setAgreedPrice(0);
    setNotes('');
    setCookingMembers(1);
    setLaundryMethod('machine');
    setLaundryClothes(10);
  }, [isOpen, customer, preselectedCategory, initialHelperId]);

  const priceForCategory = (service: ServiceCategory) => {
    if (service === 'cleaning') return Math.max(250, bedrooms * 100 + halls * 80 + kitchens * 90 + 100);
    if (service === 'bathroom_cleaning') return Math.max(150, bathrooms * 150);
    if (service === 'cooking') return Math.max(50, cookingMembers * 50);
    if (service === 'laundry') return 250;
    if (service === 'organisation' || service === 'family') return 0;
    return 300;
  };

  const needsAdminCallback = selectedCategories.some(service => service === 'organisation' || service === 'family');
  const suggestedPrice = useMemo(() => needsAdminCallback ? 0 : selectedCategories.reduce((total, service) => total + priceForCategory(service), 0), [selectedCategories, bedrooms, halls, kitchens, bathrooms, cookingMembers, laundryMethod, laundryClothes, needsAdminCallback]);
  const suggestedPrice = useMemo(() => needsAdminCallback ? 0 : selectedCategories.reduce((total, service) => total + priceForCategory(service), 0), [selectedCategories, bedrooms, halls, kitchens, bathrooms, cookingMembers, laundryMethod, laundryClothes, needsAdminCallback]);

  const selectedTaskIds = selectedCategories.map((service) =>
    service === 'cleaning' ? 'clean_sweep' :
    service === 'bathroom_cleaning' ? 'bath_clean' :
    service === 'cooking' ? 'cook_home' :
    service === 'laundry' ? 'laundry_home' :
    service === 'organisation' ? 'organise_home' : 'family_help'
  );

  // Notify every ranked helper who is eligible and available. The first one to
  // accept will be assigned by the datastore; the rest will lose access to the request.
  const eligibleHelpers = useMemo(() => {
    const matches = matchHelpers(helpers, {
      selectedTaskIds,
      locality,
      apartmentName,
      isUrgent: false,
      customer,
    });
    return matches
      .filter((match) =>
        match.isEligible &&
        ['available_now', 'available_today'].includes(match.helper.availabilityStatus)
      )
      .map((match) => match.helper);
  }, [helpers, selectedCategories, locality, apartmentName, customer]);
  const selectedHelper = eligibleHelpers[0];

  const workDescription = selectedCategories.map((service) => {
    if (service === 'cleaning') return `Brooming / Mopping: ${bedrooms} bedroom(s), ${halls} hall(s), ${kitchens} kitchen(s) · ${cleaningType === 'regular' ? 'Regular' : 'Casual'}`;
    if (service === 'bathroom_cleaning') return `Bathroom Cleaning: ${bathrooms} bathroom(s) · ₹150 per bathroom`;
    if (service === 'cooking') return `Cooking: ${cookingMembers} family member(s) · ₹50 per member (minimum ₹50)`;
    if (service === 'laundry') return laundryMethod === 'machine' ? 'Laundry: Machine wash and hang up · 1 wash' : `Laundry: Hand wash · ${laundryClothes} item(s)`;
    if (service === 'organisation' || service === 'family') return `${services.find(s => s.id === service)?.name || service} · Admin will call to discuss the work and confirm pricing`;
    return services.find(s => s.id === service)?.name || service;
  }).join(' + ');

  const buildBooking = () => {
    if (workDate < getMinWorkDate() || !availableTimeSlots.some((slot) => slot.value === workTime)) { setStep(2); return; }
    const finalPrice = agreedPrice || counter || Number(offer) || suggestedPrice;
    const taskIds = selectedCategories.map((service) => service === 'cleaning' ? 'clean_sweep' : service === 'bathroom_cleaning' ? 'bath_clean' : service === 'cooking' ? 'cook_home' : service === 'laundry' ? 'laundry_home' : service === 'organisation' ? 'organise_home' : 'family_help');

    onConfirmBooking({
      customerId: customer.id,
      helperId: undefined,
      candidateHelperIds: eligibleHelpers.map((helper) => helper.id),
      bookingMode: 'let_zuno_choose',
      bookingType: 'casual',
      status: 'requested',
      category,
      tasks: taskIds,
      scheduledDate: workDate,
      scheduledSlot: workTime,
      durationHours: 1,
      estimatedWorkloadMinutes: 0,
      isUrgent: false,
      locality,
      apartmentName,
      block,
      flat,
      customerNotes: notes,
      workScope: { description: workDescription, bedrooms, halls, kitchens, bathrooms, cleaningType, cookingMembers, laundryMethod, laundryClothes, adminCallbackRequired: needsAdminCallback },
      customerOfferPrice: finalPrice,
      negotiatedAgreedPrice: finalPrice,
      priceNegotiationStatus: needsAdminCallback ? 'admin_quote_needed' : 'pending_helper',
      paymentStatus: needsAdminCallback ? 'awaiting_admin_quote' : 'pay_after_arrival_or_completion',
      pricing: {
        baseHourlyRate: selectedHelper?.hourlyRate ?? 0,
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
        <div><div className="font-black text-lg">Need Help</div><div className="text-xs text-stone-500">Step {step} of 5 · Work-specific booking</div></div>
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
          <p className="text-sm text-stone-500">Choose a start time between 6:00 AM and 9:00 PM. The 6:00 AM slot must be booked before 9:00 PM on the previous day.</p>
          <label className="text-xs font-bold">Date<input type="date" min={getMinWorkDate()} value={workDate} onChange={e=>{ const value=e.target.value; if (value >= getMinWorkDate()) { setWorkDate(value); setWorkTime(makeTimeSlots(value)[0]?.value || '07:00'); } }} className="mt-1 w-full p-3 rounded-xl border"/></label>
          <label className="text-xs font-bold block">Start time<select value={workTime} onChange={e=>setWorkTime(e.target.value)} className="mt-1 w-full p-3 rounded-xl border">{availableTimeSlots.map(slot=><option key={slot.value} value={slot.value}>{slot.label}</option>)}</select></label>
          <button disabled={workDate < getMinWorkDate()} onClick={()=>setStep(3)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold disabled:opacity-40">Continue <ChevronRight className="inline w-4 h-4"/></button>
        </div>}

        {step === 3 && <div className="space-y-4">
          <h2 className="font-black text-xl">What work do you need?</h2>
          <p className="text-sm text-stone-500">Select one or more services. They stay together in the same booking.</p>
          <div className="grid grid-cols-2 gap-3">{services.map(s=><button key={s.id} onClick={()=>{
            setSelectedCategories(prev => {
              const next = prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id];
              if (next.length) setCategory(next[0]);
              return next;
            });
          }} className={`p-4 rounded-2xl border text-left ${selectedCategories.includes(s.id)?'border-orange-500 bg-orange-50':'border-stone-200'}`}>
            <div className="text-2xl">{s.icon}</div><div className="font-bold text-sm mt-2">{s.name}</div>
            {selectedCategories.includes(s.id) && <div className="text-[10px] font-bold text-orange-700 mt-1">Selected</div>}
          </button>)}</div>
          <button disabled={!selectedCategories.length} onClick={()=>setStep(4)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold disabled:opacity-40">Continue <ChevronRight className="inline w-4 h-4"/></button>
        </div>}

        {step === 4 && <div className="space-y-4">
          <h2 className="font-black text-xl">Work details</h2>
          <p className="text-sm text-stone-500">Enter details for every service you selected. Cooking is ₹50 per person; choose your laundry method below.</p>
          {selectedCategories.map((service) => <div key={service} className="p-4 rounded-2xl border border-stone-200 space-y-3">
            <h3 className="font-bold">{services.find(s => s.id === service)?.icon} {services.find(s => s.id === service)?.name}</h3>
            {service === 'cleaning' && <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">{[['Bedrooms',bedrooms,setBedrooms],['Halls',halls,setHalls],['Kitchens',kitchens,setKitchens]].map(([label,value,setter])=><label key={label as string} className="text-xs font-bold">{label as string}<input type="number" min="0" value={value as number} onChange={e=>(setter as any)(Math.max(0, Number(e.target.value)))} className="mt-1 w-full p-3 rounded-xl border"/></label>)}</div>
              <div className="grid grid-cols-2 gap-2">{(['casual','regular'] as const).map(t=><button key={t} type="button" onClick={()=>setCleaningType(t)} className={'p-3 rounded-xl border font-bold text-sm ' + (cleaningType===t?'border-orange-500 bg-orange-50':'')}>{t==='casual'?'Casual Cleaning':'Regular Cleaning'}</button>)}</div>
            </div>}
            {service === 'bathroom_cleaning' && <div className="space-y-3">
              <label className="text-xs font-bold">Number of bathrooms<input type="number" min="1" value={bathrooms} onChange={e=>setBathrooms(Math.max(1, Number(e.target.value)))} className="mt-1 w-full p-3 rounded-xl border"/></label>
              <p className="text-xs text-stone-500">₹150 per bathroom.</p>
            </div>}
            {service === 'cooking' && <div className="space-y-3">
              <label className="block text-xs font-bold">How many family members?<input type="number" min="1" value={cookingMembers} onChange={e=>setCookingMembers(Math.max(1, Number(e.target.value)))} className="mt-1 w-full p-3 rounded-xl border"/></label>
              <p className="text-sm font-semibold text-orange-700">Cooking price: ₹50 × {cookingMembers} {cookingMembers === 1 ? 'person' : 'people'} = ₹{cookingMembers * 50}</p>
            </div>}
            {service === 'laundry' && <div className="space-y-3">
              <div className="text-xs font-bold">Choose laundry method</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={()=>setLaundryMethod('machine')} className={'p-3 rounded-xl border text-sm font-bold ' + (laundryMethod==='machine'?'border-orange-500 bg-orange-50':'')}>Machine wash</button>
                <button type="button" onClick={()=>setLaundryMethod('hand')} className={'p-3 rounded-xl border text-sm font-bold ' + (laundryMethod==='hand'?'border-orange-500 bg-orange-50':'')}>Hand wash</button>
              </div>
              {laundryMethod==='machine' ? <p className="text-sm text-stone-600">One machine wash and hang clothes to dry.</p> : <label className="block text-xs font-bold">How many clothes/items?<input type="number" min="1" value={laundryClothes} onChange={e=>setLaundryClothes(Math.max(1, Number(e.target.value)))} className="mt-1 w-full p-3 rounded-xl border"/></label>}
              <p className="text-xs text-stone-500">Estimated laundry price: ₹250. Zuno will confirm if the amount changes based on the load.</p>
            </div>}
            {(service === 'organisation' || service === 'family') && <div className="p-3 rounded-xl bg-amber-50 text-sm">A Zuno team member will call to understand the work and confirm pricing.</div>}
          </div>)}
          <div className="p-3 rounded-xl bg-stone-50 text-sm font-bold">Current estimated total: {needsAdminCallback ? 'To be confirmed by Zuno' : '₹' + suggestedPrice}</div>
          <button onClick={()=>setStep(5)} className="w-full p-3.5 rounded-xl bg-orange-600 text-white font-bold">Continue to price <ChevronRight className="inline w-4 h-4"/></button>
        </div>}

        {step === 5 && <div className="space-y-4">
          <h2 className="font-black text-xl">Review & negotiate</h2>
          <div className={`p-3 rounded-xl border text-xs ${selectedHelper ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>{selectedHelper ? 'We’ll send your request to all suitable available helpers. The first to accept will be assigned.' : 'No eligible helper is available right now. You can still send this request; it will be saved in Upcoming Services for Admin follow-up.'}</div>
          <div className="p-4 rounded-2xl bg-stone-50 space-y-2 text-sm">
            <div className="font-bold">{services.find(s=>s.id===category)?.icon} {services.find(s=>s.id===category)?.name}</div>
            <div>{workDescription}</div>
            <div className="text-xs text-stone-500"><MapPin className="inline w-3.5 h-3.5"/> {flat}, {block}, {apartmentName}, {locality}</div>
            <div className="text-xs text-stone-500"><CalendarDays className="inline w-3.5 h-3.5"/> {workDate} · {selectedTimeLabel}</div>
          </div>
          <div className="p-4 rounded-2xl border border-stone-200">
            <div className="flex justify-between"><span className="font-bold">Suggested price</span><b>₹{suggestedPrice}</b></div>
            <p className="text-xs text-stone-500 mt-1">Based on the actual work, not hours.</p>
            {counter > 0 && <div className="mt-3 p-3 rounded-xl bg-amber-50 text-sm">Helper counter: <b>₹{counter}</b></div>}
            <div className="mt-3 flex gap-2">
              <input type="number" min="1" value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Your offer" className="flex-1 p-3 rounded-xl border"/>
              <button
                disabled={Number(offer) <= 0}
                onClick={() => {
                  const n = Number(offer);
                  if (n <= 0) return;
                  if (workDate < getMinWorkDate() || !availableTimeSlots.some((slot) => slot.value === workTime)) { setStep(2); return; }
                  setAgreedPrice(n);
                  onConfirmBooking({
                    customerId: customer.id,
                    helperId: undefined,
                    candidateHelperIds: needsAdminCallback ? [] : eligibleHelpers.map((helper) => helper.id),
                    eligibleHelperIds: needsAdminCallback ? eligibleHelpers.map((helper) => helper.id) : [],
                    bookingMode: 'let_zuno_choose',
                    bookingType: 'casual',
                    status: 'requested',
                    category,
                    tasks: selectedTaskIds,
                    scheduledDate: workDate,
                    scheduledSlot: workTime,
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
                    priceNegotiationStatus: needsAdminCallback ? 'admin_quote_needed' : 'pending_helper',
                    paymentStatus: needsAdminCallback ? 'awaiting_admin_quote' : 'pay_after_arrival_or_completion',
                    pricing: {
                      baseHourlyRate: selectedHelper?.hourlyRate ?? 0,
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
                {selectedHelper ? 'Send Offer' : 'Send Request'}
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-500">{selectedHelper ? 'Your request will be saved in Upcoming Services while eligible helpers respond. The first acceptance wins.' : 'Your request will be saved in Upcoming Services without a helper assigned yet. Admin can review it and assign an eligible helper.'}</p>
          </div>
          <label className="text-xs font-bold">Notes (optional)<input value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 w-full p-3 rounded-xl border" placeholder="Anything the helper should know"/></label>
          <button disabled className="w-full p-3.5 rounded-xl font-bold bg-stone-100 text-stone-400">Offer sent — Pending from Helper</button>
        </div>}

        {step === 7 && <div className="space-y-5">
          <div className="text-center"><div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"><Check className="w-7 h-7"/></div><h2 className="font-black text-xl mt-3">Ready to confirm</h2></div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm"><b>₹{agreedPrice} offer submitted.</b><br/>ZUNO will check for the most suitable available helper and notify you. Payment is not taken now; Razorpay payment will be collected after the helper reaches your home or after the work is completed.</div>
          <button onClick={buildBooking} className="w-full p-4 rounded-2xl bg-orange-600 text-white font-black">Send offer · Pay later</button>
          <button onClick={()=>setStep(6)} className="w-full p-3 rounded-xl border font-bold">Back</button>
        </div>}
      </div>

      {step>1 && <div className="p-4 border-t border-stone-200"><button onClick={()=>setStep(s=>s-1)} className="text-sm font-bold text-stone-600"><ChevronLeft className="inline w-4 h-4"/> Back</button></div>}
    </div>
  </div>;
};