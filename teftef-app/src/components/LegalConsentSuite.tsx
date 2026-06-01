import React, { useState } from 'react';

/**
 * TYPES
 */
interface MasterConsentProps {
  acceptedMasterTerms: boolean;
  onAccept: (accepted: boolean) => Promise<void>;
}

interface AccountabilityCheckProps {
  accepted: boolean;
  onToggle: (accepted: boolean) => void;
}

/**
 * PART 1: MASTER CONSENT GATEWAY
 * A one-time roadblock for major legal sign-off.
 * Displays a dense, scrollable area for terms when user.acceptedMasterTerms is false.
 */
export const MasterConsentGateway = ({ acceptedMasterTerms, onAccept }: MasterConsentProps) => {
  const [isChecked, setIsChecked] = useState(false);

  if (acceptedMasterTerms) return null;

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    // Optimistic update to prevent UI freezing
    setIsChecked(checked);

    if (checked) {
      try {
        await onAccept(true);
      } catch (error) {
        console.error('[Legal-T1] Master consent update failed:', error);
        setIsChecked(false); // Revert on failure
      }
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-slate-900">Legal Framework Agreement</h4>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Required</span>
      </div>

      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 space-y-4">
        <section>
          <p className="font-semibold text-slate-800">Unified Terms of Service</p>
          <p>By using TefTef, you agree to the operational guidelines of this marketplace. All interactions are conducted at the user's own risk. The platform facilitates discovery but does not govern the contractual specifics of individual agreements.</p>
        </section>
        <section>
          <p className="font-semibold text-slate-800">Peer-to-Peer Risk Disclosure</p>
          <p>Users acknowledge that P2P transactions are susceptible to counterparty risk. TefTef provides behavioral trust signals but does not guarantee the integrity of any single user or transaction.</p>
        </section>
        <section>
          <p className="font-semibold text-slate-800">Conditional Forfeiture Privacy Policy</p>
          <p>Identity/ID details provided for verification are kept confidential unless a formal breach or fraud report is filed. In such cases, data is released to the counterparty for legal recovery purposes.</p>
        </section>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          checked={isChecked}
          onChange={handleToggle}
        />
        <span className="text-xs text-slate-600 leading-tight group-hover:text-slate-900 transition">
          I have read and accept the Unified Terms, Risk Disclosure, and Privacy Policy.
        </span>
      </label>
    </div>
  );
};

/**
 * PART 2: MICRO-CONSENT BANNER
 * High-visibility amber disclaimer for high-intent action areas.
 */
export const MicroConsentBanner = () => {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 animate-in slide-in-from-top-2 duration-300">
      <div className="flex gap-2">
        <span className="font-bold uppercase tracking-tight">Disclaimer:</span>
        <p>
          TefTef is an open matching directory engine. The platform does not act as an escrow middleman and holds zero liability for monetary transfers handled over off-platform local networks like Telebirr, Chapa or CBE Birr.
        </p>
      </div>
    </div>
  );
};

/**
 * PART 3: ACCOUNTABILITY CHECKBOX CONTROLLER
 * Enforces a legal waiver prior to finalizing a match or submission.
 */
export const AccountabilityCheck = ({ accepted, onToggle }: AccountabilityCheckProps) => {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
        checked={accepted}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-800 transition">
        I understand that finalizing this match legally binds my identity to this transaction under our master agreement, and authorizes the release of my ID details to my counterparty if a contract breach or fraud occurs.
      </span>
    </label>
  );
};
