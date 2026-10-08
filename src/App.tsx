/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { db } from './services/db';
import { Booking, ServiceCategory, AuthRole, AuthSession, Helper } from './types';
import { Header } from './components/common/Header';
import { AuthScreen } from './components/auth/AuthScreen';
import { CustomerHome } from './components/customer/CustomerHome';
import { NeedHelpModal } from './components/customer/NeedHelpModal';
import { ActiveBookingModal } from './components/customer/ActiveBookingModal';
import { SupportTicketModal } from './components/customer/SupportTicketModal';
import { PrivacyNoticeModal } from './components/common/PrivacyNoticeModal';
import { HelperPortal } from './components/helper/HelperPortal';
import { AdminControlTower } from './components/admin/AdminControlTower';

export default function App() {
  // Sync with reactive marketplace state
  const state = useSyncExternalStore(db.subscribe, db.getState);

  // Reactive authenticated session
  const [session, setSession] = useState<AuthSession | null>(() => db.getSession());

  // Listen to any database session / state modifications
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setSession(db.getSession());
    });
    return unsub;
  }, []);

  // Modals state
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [needHelpTimingType, setNeedHelpTimingType] = useState<'instant' | 'casual'>('instant');
  const [needHelpPreCategory, setNeedHelpPreCategory] = useState<ServiceCategory | undefined>(undefined);
  const [needHelpPreTaskIds, setNeedHelpPreTaskIds] = useState<string[] | undefined>(undefined);
  const [needHelpInitialHelperId, setNeedHelpInitialHelperId] = useState<string | undefined>(undefined);

  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(false);
  const [activeBookingModalId, setActiveBookingModalId] = useState<string | null>(null);
  const [supportModalBookingId, setSupportModalBookingId] = useState<string | null>(null);

  const activeCustomer = db.getActiveCustomer();
  // Helper identity is derived strictly from the authenticated session userId.
  // Never fall back to another helper when a helper is logged in.
  const sessionHelper = session?.role === 'helper'
    ? state.helpers.find((h) => h.id === session.userId)
    : undefined;
  const activeHelper: Helper = session?.role === 'helper'
    ? (sessionHelper as Helper)
    : db.getActiveHelper();

  // Active booking for the details modal
  const selectedBooking = state.bookings.find((b) => b.id === activeBookingModalId) || null;
  const selectedBookingHelper = selectedBooking
    ? state.helpers.find((h) => h.id === selectedBooking.helperId)
    : undefined;

  // Handlers
  const handleOpenNeedHelp = (
    timingType: 'instant' | 'casual' = 'casual',
    preCategory?: ServiceCategory,
    preTaskIds?: string[]
  ) => {
    setNeedHelpTimingType(timingType);
    setNeedHelpPreCategory(preCategory);
    setNeedHelpPreTaskIds(preTaskIds);
    setNeedHelpInitialHelperId(undefined);
    setIsNeedHelpOpen(true);
  };

  const handleCloseNeedHelp = () => {
    setIsNeedHelpOpen(false);
    setNeedHelpPreCategory(undefined);
    setNeedHelpPreTaskIds(undefined);
    setNeedHelpInitialHelperId(undefined);
  };

  const handleBookAgain = (previousBooking: Booking) => {
    setNeedHelpTimingType(previousBooking.bookingType === 'instant' ? 'instant' : 'casual');
    setNeedHelpPreCategory(previousBooking.category);
    setNeedHelpPreTaskIds([...previousBooking.tasks]);
    setNeedHelpInitialHelperId(previousBooking.helperId);
    setIsNeedHelpOpen(true);
  };

  const handleConfirmNewBooking = (newBookingData: any) => {
    const created = db.createBooking(newBookingData);
    // Creating a customer booking must NEVER change the authenticated session
    // to the selected helper. The booking.helperId is the only relationship.
    setActiveBookingModalId(created.id);
  };

  const handleAcceptReplacement = (bookingId: string) => {
    db.acceptReplacement(bookingId);
  };

  const handleSubmitRating = (bookingId: string, ratingData: any) => {
    db.submitRating(bookingId, ratingData);
  };

  const handleToggleFavourite = (helperId: string) => {
    db.toggleFavouriteHelper(activeCustomer.id, helperId);
  };

  const handleLoginSuccess = (role: AuthRole, userId: string) => {
    if (role === 'customer') {
      const customer = state.customers.find((c) => c.id === userId);
      if (!customer) return;
      db.setSession({
        role: 'customer',
        userId: customer.id,
        userName: customer.name,
        phone: customer.phone,
      });
    } else if (role === 'helper') {
      const helper = state.helpers.find((h) => h.id === userId);
      if (!helper) return;
      // Helper identity comes only from the authenticated helper ID.
      // Do not route through the legacy active-helper selector.
      db.setSession({
        role: 'helper',
        userId: helper.id,
        userName: helper.name,
        phone: helper.phone,
      });
    } else {
      db.setSession({
        role: 'admin',
        userId: 'admin_ops_1',
        userName: 'ZUNO Operations Admin',
      });
    }
    setSession(db.getSession());
  };

  const handleLogout = () => {
    db.logout();
    setSession(null);
  };

  // If a helper session points to a missing helper record, do not silently show Lakshmi/another helper.
  if (session?.role === 'helper' && !sessionHelper) {
    db.logout();
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // If no session exists, strictly present the Login / Registration screen
  if (!session) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. Global Navigation Bar showing authenticated role & info (Strict isolation) */}
      <Header
        currentRole={session.role}
        activeCustomer={activeCustomer}
        activeHelper={activeHelper}
        onLogout={handleLogout}
        onResetDemo={() => db.resetToDemoData()}
        onOpenPrivacy={() => setIsPrivacyNoticeOpen(true)}
      />

      {/* 2. Main Role Content: Strictly isolated by session.role */}
      <main className="flex-1 pb-16">
        {session.role === 'customer' && (
          <CustomerHome
            customer={activeCustomer}
            helpers={state.helpers}
            bookings={state.bookings}
            onOpenNeedHelp={handleOpenNeedHelp}
            onBookAgain={handleBookAgain}
            onViewBookingDetails={(id) => setActiveBookingModalId(id)}
            onToggleFavourite={handleToggleFavourite}
            onLogout={handleLogout}
            onOpenAuth={handleLogout}
          />
        )}

        {session.role === 'helper' && (
          <HelperPortal
            helper={activeHelper}
            bookings={state.bookings}
            customers={state.customers}
            onUpdateAvailability={(status) => db.updateHelperAvailability(activeHelper.id, status)}
            onVerifyOtp={(bkId, otp) => db.verifyStartOtp(bkId, otp, activeHelper.id)}
            onUpdateBookingStatus={(bkId, status) =>
              db.updateBookingStatus(bkId, status, { actor: 'helper', actorName: activeHelper.name })
            }
            onCancelWithEmergency={(bkId, reason) => db.cancelByHelper(bkId, activeHelper.id, reason)}
            onRateCustomer={(bkId, rating, feedback) =>
              db.submitHelperRatingForCustomer(bkId, rating, feedback)
            }
            onPriceResponse={(bkId, action, counterPrice) => db.respondToPriceOffer(bkId, activeHelper.id, action, counterPrice)}
            onOpenAuth={handleLogout}
          />
        )}

        {session.role === 'admin' && (
          <AdminControlTower
            bookings={state.bookings}
            helpers={state.helpers}
            customers={state.customers}
            apartments={state.apartments}
            pricingConfig={state.pricingConfig}
            supportTickets={state.supportTickets}
            auditLogs={state.auditLogs}
            supplyDemand={state.supplyDemand}
            privacyRequests={state.privacyRequests}
            privacyConsents={state.privacyConsents}
            onUpdatePricing={(cfg) => db.updatePricingConfig(cfg)}
            onUpdateVerification={(id, status, checklist, isChildcare) =>
              db.updateHelperVerification(id, status, checklist, isChildcare)
            }
            onUpdateTicketStatus={(id, status, res) => db.updateSupportTicketStatus(id, status, res)}
            onUpdatePrivacyRequest={(id, status, res) => db.updatePrivacyRequestStatus(id, status, res)}
            onImportHelpers={(newH) => db.importHelpers(newH)}
            onImportApartments={(newA) => db.importApartments(newA)}
          />
        )}
      </main>

      {/* 3. Global Modals */}
      {/* A. Need Help Core Booking Flow */}
      <NeedHelpModal
        isOpen={isNeedHelpOpen}
        onClose={handleCloseNeedHelp}
        customer={activeCustomer}
        helpers={state.helpers}
        pricingConfig={state.pricingConfig}
        initialTimingType={needHelpTimingType}
        preselectedCategory={needHelpPreCategory}
        preselectedTaskIds={needHelpPreTaskIds}
        initialHelperId={needHelpInitialHelperId}
        onConfirmBooking={handleConfirmNewBooking}
      />

      {/* B. Active Booking Details & 4-digit OTP Arrival Lifecycle */}
      <ActiveBookingModal
        booking={selectedBooking}
        onClose={() => setActiveBookingModalId(null)}
        helper={selectedBookingHelper}
        customer={activeCustomer}
        helpers={state.helpers}
        onAcceptReplacement={handleAcceptReplacement}
        onChooseReplacementHelper={(bkId, hId) => db.chooseReplacementHelper(bkId, hId)}
        onVerifyOtp={(bkId, otp) => {
          const b = state.bookings.find((item) => item.id === bkId);
          if (!b?.helperId) return { success: false, message: 'No helper is assigned to this booking.' };
          return db.verifyStartOtp(bkId, otp, b.helperId);
        }}
        onSubmitRating={handleSubmitRating}
        onBookAgain={handleBookAgain}
        onOpenSupport={(bkId) => {
          setSupportModalBookingId(bkId);
        }}
        onToggleFavourite={handleToggleFavourite}
      />

      {/* C. Report an Issue / Support Ticket */}
      <SupportTicketModal
        isOpen={!!supportModalBookingId}
        onClose={() => setSupportModalBookingId(null)}
        customer={activeCustomer}
        bookingId={supportModalBookingId || undefined}
        onCreateTicket={(t) => db.createSupportTicket(t)}
      />

      {/* D. Privacy & Personal Data Protection Modal (DPDP) */}
      <PrivacyNoticeModal
        isOpen={isPrivacyNoticeOpen}
        onClose={() => setIsPrivacyNoticeOpen(false)}
        customer={activeCustomer}
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-stone-200 py-4 text-center text-xs text-stone-500 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 font-display">ZUNO</span>
            <span>·</span>
            <span>Your extra pair of hands.</span>
            <span>·</span>
            <button
              onClick={() => setIsPrivacyNoticeOpen(true)}
              className="text-stone-600 hover:text-stone-900 underline font-medium"
            >
              Privacy & DPDP Controls
            </button>
          </div>
          <div>
            Chennai Pilot: Pallavaram · Chromepet · Pammal · Keelkattalai · Medavakkam · Velachery · Tambaram
          </div>
        </div>
      </footer>
    </div>
  );
}
