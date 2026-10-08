import React, { useState } from 'react';
import { Customer, Booking, SupportTicket } from '../../types';
import { X, LifeBuoy, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  bookingId?: string;
  onCreateTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => void;
}

const CATEGORIES: { id: SupportTicket['category']; label: string; priority: SupportTicket['priority'] }[] = [
  { id: 'helper_didnt_arrive', label: "Helper didn't arrive", priority: 'urgent' },
  { id: 'late', label: 'Helper arrived very late', priority: 'medium' },
  { id: 'wrong_task', label: 'Requested tasks were missed', priority: 'medium' },
  { id: 'poor_service', label: 'Quality of cleaning/cooking below standard', priority: 'medium' },
  { id: 'behaviour_concern', label: 'Behaviour or conduct concern', priority: 'high' },
  { id: 'safety_concern', label: 'Safety or household item concern', priority: 'urgent' },
  { id: 'payment_issue', label: 'Billing / payment deduction discrepancy', priority: 'medium' },
  { id: 'other', label: 'Other household query', priority: 'low' },
];

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  customer,
  bookingId,
  onCreateTicket,
}) => {
  const [category, setCategory] = useState<SupportTicket['category']>('late');
  const [description, setDescription] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const catObj = CATEGORIES.find((c) => c.id === category);

    onCreateTicket({
      customerId: customer.id,
      customerName: customer.name,
      bookingId,
      category,
      priority: catObj?.priority || 'medium',
      description: description || `Reported ${catObj?.label} for visit ${bookingId || 'recent'}`,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-200 text-xs">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-orange-600" />
            <div>
              <div className="font-bold text-sm text-stone-900 font-display">
                Report an Issue
              </div>
              <div className="text-[11px] text-stone-500">
                ZUNO Support · Chennai Operations Desk
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="font-bold text-stone-900 text-sm">
              Ticket Submitted to Admin Tower
            </div>
            <p className="text-stone-500 text-xs max-w-xs mx-auto">
              Our Chennai support lead is notified and will follow up with you and your helper immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">What issue occurred?</label>
              <div className="grid grid-cols-1 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                      category === cat.id
                        ? 'bg-orange-50/80 border-orange-500 text-orange-950 ring-1 ring-orange-500'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Additional details</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened so we can take immediate corrective action..."
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
            >
              Submit Ticket to Operations Desk
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
