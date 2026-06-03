

/**
 * TYPES
 */
interface MasterConsentProps {
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}

interface AccountabilityWallProps {
  accepted: boolean;
  onToggle: (accepted: boolean) => void;
  buttonLabel?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  onBack?: () => void;
}

/**
 * PART 1: MASTER CONSENT GATEWAY
 * Scrollable legal terms with a checkbox toggle.
 * Pure UI component — does not fire network calls on check.
 */
export const MasterConsentGateway = ({ isChecked, onToggle }: MasterConsentProps) => {
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
          onChange={(e) => onToggle(e.target.checked)}
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
 * Static disclaimer text. No interaction required.
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
 * PART 3: ACCOUNTABILITY ACTION WALL
 * Checkbox + integrated submit button. The button is disabled until the checkbox is toggled.
 * Can render as a standalone checkbox or as a full action wall with a submit button.
 */
export const AccountabilityWall = ({
  accepted,
  onToggle,
  buttonLabel = 'Post Job',
  disabled = false,
  isSubmitting = false,
  onSubmit,
  onBack,
}: AccountabilityWallProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          checked={accepted}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-800 transition">
          I understand that finalizing this action legally binds my identity to this transaction under our master agreement, and authorizes the release of my ID details to my counterparty if a contract breach or fraud occurs.
        </span>
      </label>

      {onSubmit && (
        <div className="flex gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-200 rounded-full hover:bg-slate-300 transition"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!accepted || disabled || isSubmitting}
            className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
};
