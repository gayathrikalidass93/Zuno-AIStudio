import React from 'react';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  User,
  HeartHandshake,
  Shield,
  KeyRound,
  RotateCcw,
  Star,
  Repeat,
} from 'lucide-react';

interface DemoScenarioTourProps {
  currentRole: 'customer' | 'helper' | 'admin' | 'demo';
  onRoleChange: (role: 'customer' | 'helper' | 'admin' | 'demo') => void;
  onLaunchBuildVisit: () => void;
  onLaunchUrgentHelp: () => void;
  onResetDemo: () => void;
}

export const DemoScenarioTour: React.FC<DemoScenarioTourProps> = ({
  currentRole,
  onRoleChange,
  onLaunchBuildVisit,
  onLaunchUrgentHelp,
  onResetDemo,
}) => {
  const steps = [
    {
      num: '1',
      title: 'Customer: "Build My Visit"',
      desc: 'Combine Sweep + Mop + Wash vessels + Cut veggies + Cook lunch into one 3-hour visit.',
      actionLabel: 'Open Build My Visit',
      role: 'customer' as const,
      onClick: () => {
        onRoleChange('customer');
        onLaunchBuildVisit();
      },
    },
    {
      num: '2',
      title: 'ZUNO Match Engine',
      desc: 'See Lakshmi Narayanan matched at 96% with apartment familiarity & skills checklist.',
      actionLabel: 'Switch to Customer App',
      role: 'customer' as const,
      onClick: () => onRoleChange('customer'),
    },
    {
      num: '3',
      title: 'Helper App: Lakshmi Narayanan',
      desc: 'Good morning Lakshmi! View ₹551 transparent payout, enter customer OTP (4821) to start visit.',
      actionLabel: 'Switch to Helper App',
      role: 'helper' as const,
      onClick: () => onRoleChange('helper'),
    },
    {
      num: '4',
      title: 'ZUNO Replacement Engine',
      desc: 'When helper has an emergency, ZUNO automatically matches Anandhi Sekar (94% match) without starting over.',
      actionLabel: 'Test in Customer App',
      role: 'customer' as const,
      onClick: () => onRoleChange('customer'),
    },
    {
      num: '5',
      title: 'Admin Tower: Supply-Demand',
      desc: 'Spot Pallavaram shortage (+8 helpers needed) vs Chromepet surplus (+3). Verification checklist & CSV upload.',
      actionLabel: 'Open Admin Tower',
      role: 'admin' as const,
      onClick: () => onRoleChange('admin'),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 text-xs">
      <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5" />
            <h1 className="font-bold text-base font-display">
              ZUNO Live Marketplace Walkthrough
            </h1>
          </div>
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
        </div>
        <p className="text-orange-100 text-xs max-w-2xl">
          Experience the complete customer → helper → booking → OTP check-in → replacement → completion → rating lifecycle on actual database records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {steps.map((st) => (
          <div
            key={st.num}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2 hover:border-orange-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center font-mono">
                {st.num}
              </span>
              <span className="text-[10px] uppercase font-bold text-stone-400">
                {st.role} view
              </span>
            </div>

            <div className="font-bold text-sm text-stone-900 font-display">
              {st.title}
            </div>

            <p className="text-stone-600 text-xs leading-relaxed">
              {st.desc}
            </p>

            <button
              onClick={st.onClick}
              className="mt-2 w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>{st.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
