import { PayBadgeRenderer } from './PayBadgeRenderer';
import type { ListingType } from './JobTypeSelector';

export interface JobCardProps {
  id?: string;
  title: string;
  listingType: ListingType;
  payType: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
  minPay: number | null;
  maxPay: number | null;
  description: string;
  clientName: string;
  status: 'OPEN' | 'PENDING_MATCH' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CLOSED';
  postedAt: string;
  onClick?: () => void;
}

const statusStyles: Record<JobCardProps['status'], string> = {
  OPEN: 'bg-green-100 text-green-800',
  PENDING_MATCH: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  DISPUTED: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-red-100 text-red-800',
};

export function JobCard({
  title,
  listingType,
  payType,
  minPay,
  maxPay,
  description,
  clientName,
  status,
  postedAt,
  onClick,
}: JobCardProps) {
  return (
    <article
      onClick={onClick}
      className={`rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {clientName}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {status.replace('_', ' ')}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600 line-clamp-3">
        {description}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <PayBadgeRenderer job={{ listingType, payType, minPay, maxPay }} />
        <span>Posted {postedAt}</span>
      </div>
    </article>
  );
}
