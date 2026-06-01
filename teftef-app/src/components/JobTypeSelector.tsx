export type ListingType = 'FREELANCE' | 'FULL_TIME';

interface JobTypeSelectorProps {
  listingType: ListingType;
  onTypeChange: (type: ListingType) => void;
}

export const JobTypeSelector = ({ listingType, onTypeChange }: JobTypeSelectorProps) => {
  return (
    <div className="space-y-3 mb-8">
      <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 block">
        Listing Structure
      </label>

      <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => onTypeChange('FREELANCE')}
          className={`flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
            listingType === 'FREELANCE'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Freelance / Gig
        </button>

        <button
          type="button"
          onClick={() => onTypeChange('FULL_TIME')}
          className={`flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
            listingType === 'FULL_TIME'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Full-Time Job
        </button>
      </div>

      <p className="text-[11px] text-slate-400 italic">
        {listingType === 'FREELANCE'
          ? 'Pricing will be handled as a fixed project escrow budget.'
          : 'Pricing will be handled as a standard salary parameter selection.'}
      </p>
    </div>
  );
};
