import type { ListingType } from './JobTypeSelector';

/**
 * Types derived from the polymorphic financial schema.
 */
type PayType = 'FIXED' | 'RANGE' | 'NEGOTIABLE';

interface JobPayPayload {
  listingType: ListingType;
  payType: PayType;
  minPay: number | null;
  maxPay: number | null;
}

interface PayBadgeRendererProps {
  job: JobPayPayload;
}

export const PayBadgeRenderer = ({ job }: PayBadgeRendererProps) => {
  const { payType, listingType, minPay, maxPay } = job;

  const formatCurrency = (value: number | null) => {
    if (value === null) return '0';
    return new Intl.NumberFormat('en-ET').format(value);
  };

  const getNegotiableLabel = () => {
    return listingType === 'FREELANCE'
      ? 'Freelance | Budget: Negotiable'
      : 'Full-Time | Salary: Negotiable';
  };

  switch (payType) {
    case 'NEGOTIABLE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {getNegotiableLabel()}
        </span>
      );

    case 'FIXED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
          {formatCurrency(minPay)} ETB
        </span>
      );

    case 'RANGE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          {formatCurrency(minPay)} - {formatCurrency(maxPay)} ETB
        </span>
      );

    default:
      return null;
  }
};
