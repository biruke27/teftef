import { useState, useEffect } from 'react';
import type { ListingType } from './JobTypeSelector';

/**
 * Polymorphic financial state types for Ethiopian employment standards.
 * FIXED: Single total amount or monthly rate.
 * RANGE: A scale (min - max).
 * NEGOTIABLE: Open to discussion, no hard limits.
 */
type PayType = 'FIXED' | 'RANGE' | 'NEGOTIABLE';

interface FinancialPayload {
  payType: PayType;
  minPay: number | null;
  maxPay: number | null;
}

interface PolymorphicPricingControllerProps {
  listingType: ListingType;
  onPayloadChange: (payload: FinancialPayload) => void;
}

export const PolymorphicPricingController = ({
  listingType,
  onPayloadChange,
}: PolymorphicPricingControllerProps) => {
  // --- Local States ---
  const [payType, setPayType] = useState<PayType>('FIXED');
  const [minPay, setMinPay] = useState<number | null>(null);
  const [maxPay, setMaxPay] = useState<number | null>(null);

  // --- Contextual Localization ---
  const isFreelance = listingType === 'FREELANCE';
  const labels = {
    header: isFreelance ? 'Project Budget (ETB)' : 'Monthly Salary (ETB)',
    minPlaceholder: isFreelance ? 'e.g. 5000' : 'Min Monthly',
    maxPlaceholder: isFreelance ? 'e.g. 10000' : 'Max Monthly',
    fixedPlaceholder: isFreelance ? 'Total project amount' : 'Fixed monthly rate',
  };

  // --- State Projection (Loop-Free) ---
  // Only projects current state values upward. No internal state-setters here.
  useEffect(() => {
    onPayloadChange({
      payType,
      minPay,
      maxPay,
    });
  }, [payType, minPay, maxPay, onPayloadChange]);

  // --- Action Handlers (Implicit State Wiping) ---
  const handlePayTypeToggle = (newType: PayType) => {
    // 1. Handle "Negotiable" transition: Wipe all numeric values
    if (newType === 'NEGOTIABLE') {
      setMinPay(null);
      setMaxPay(null);
    }
    // 2. Handle "Fixed" transition: Clear the upper boundary to prevent stale range leak
    else if (newType === 'FIXED') {
      setMaxPay(null);
    }

    setPayType(newType);
  };

  const handleNumberChange = (field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    if (field === 'min') setMinPay(numValue);
    else setMaxPay(numValue);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">{labels.header}</span>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            checked={payType === 'NEGOTIABLE'}
            onChange={(e) => handlePayTypeToggle(e.target.checked ? 'NEGOTIABLE' : 'FIXED')}
          />
          <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition">
            Negotiable
          </span>
        </label>
      </div>

      <div className="grid gap-3">
        {payType === 'NEGOTIABLE' ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-3">
            <span className="text-xs text-slate-400 italic">Compensation open for negotiation</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pay Type Selector (Fixed vs Range) */}
            <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg w-fit">
              <button
                onClick={() => handlePayTypeToggle('FIXED')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
                  payType === 'FIXED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                FIXED
              </button>
              <button
                onClick={() => handlePayTypeToggle('RANGE')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
                  payType === 'RANGE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                RANGE
              </button>
            </div>

            {/* Dynamic Input Fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-400 font-bold ml-1">
                  {payType === 'FIXED' ? 'Amount' : 'Minimum'}
                </span>
                <input
                  type="number"
                  value={minPay ?? ''}
                  onChange={(e) => handleNumberChange('min', e.target.value)}
                  placeholder={payType === 'FIXED' ? labels.fixedPlaceholder : labels.minPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              {payType === 'RANGE' && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold ml-1">Maximum</span>
                  <input
                    type="number"
                    value={maxPay ?? ''}
                    onChange={(e) => handleNumberChange('max', e.target.value)}
                    placeholder={labels.maxPlaceholder}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
