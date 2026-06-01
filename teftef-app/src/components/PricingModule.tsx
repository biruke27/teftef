import type { ListingType } from './JobTypeSelector';

interface PricingModuleProps {
  listingType: ListingType;
  budget: string;
  setBudget: (value: string) => void;
}

export const PricingModule = ({ listingType, budget, setBudget }: PricingModuleProps) => {
  const isFreelance = listingType === 'FREELANCE';

  return (
    <label className="space-y-2 text-sm font-medium text-slate-700 block animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <span className="text-slate-900">
          {isFreelance ? 'Project Budget (ETB)' : 'Monthly Salary Range (ETB)'}
        </span>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {isFreelance
            ? 'Specify the total amount for the project. Consider breaking this down into milestones in the description.'
            : 'Enter the expected monthly net or gross salary scale to align with local professional standards.'}
        </p>
      </div>
      <input
        type="text"
        value={budget}
        onChange={(event) => setBudget(event.target.value)}
        placeholder={isFreelance ? "e.g. 15000" : "e.g. 15000 - 20000"}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        required
      />
    </label>
  );
};
