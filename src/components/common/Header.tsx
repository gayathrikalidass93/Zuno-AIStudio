import React from 'react';
import { Customer, Helper, AuthRole } from '../../types';
import {
  Shield,
  ShieldCheck,
  RotateCcw,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentRole: AuthRole;
  activeCustomer: Customer;
  activeHelper?: Helper;
  onLogout: () => void;
  onResetDemo: () => void;
  onOpenPrivacy?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  activeCustomer,
  activeHelper,
  onLogout,
  onResetDemo,
  onOpenPrivacy,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-baseline gap-1.5 text-left">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-orange-600 font-display">
              ZUNO
            </span>
            {currentRole === 'helper' && (
              <span className="text-[11px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 tracking-wider">
                Partner
              </span>
            )}
            {currentRole === 'admin' && (
              <span className="text-[11px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-stone-900 text-white tracking-wider">
                Admin Control Tower
              </span>
            )}
          </div>

          {/* Location indicator for customer only */}
          {currentRole === 'customer' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Chennai</span>
              <span className="text-stone-300">·</span>
              <span className="font-semibold text-stone-700">{activeCustomer.locality}</span>
            </div>
          )}
        </div>

        {/* Authenticated User Identity & Session Controls (Strict role isolation - NO role switchers) */}
        <div className="flex items-center gap-2">
          {/* Customer identity pill */}
          {currentRole === 'customer' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200 text-xs text-stone-800">
              <div className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center font-display">
                {activeCustomer.name.split(' ')[0][0]}
              </div>
              <span className="font-semibold max-w-[120px] truncate">
                {activeCustomer.name}
              </span>
            </div>
          )}

          {/* Helper identity pill */}
          {currentRole === 'helper' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
              <div className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center font-display">
                {activeHelper?.name.split(' ')[0][0]}
              </div>
              <span className="font-semibold max-w-[120px] truncate">
                {activeHelper?.name}
              </span>
            </div>
          )}

          {/* Admin identity pill */}
          {currentRole === 'admin' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-300 text-xs text-stone-900 font-semibold">
              <Shield className="w-3.5 h-3.5 text-stone-700" />
              <span>Operations Admin</span>
            </div>
          )}

          {/* Privacy controls toggle */}
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              title="Privacy Notice & DPDP Controls"
              className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          {/* Reset Demo Data button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all bookings and helpers back to clean demo state?')) {
                onResetDemo();
              }
            }}
            title="Reset Data"
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Log Out / Switch Account */}
          <button
            onClick={onLogout}
            title="Sign Out"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors border border-stone-200"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
