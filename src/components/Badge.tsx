type BadgeProps = {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
  PENDING_APPROVAL: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-indigo-100 text-indigo-700' },
  PUBLISHED: { label: 'Published', className: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
  REJECTED: { label: 'Rejected', className: 'bg-slate-100 text-slate-500' },

  // Plan badges
  STARTER: { label: 'Starter', className: 'bg-blue-100 text-blue-700' },
  GROWTH: { label: 'Growth', className: 'bg-purple-100 text-purple-700' },
  PRO: { label: 'Pro', className: 'bg-indigo-100 text-indigo-700' },

  // Subscription status
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
  PAST_DUE: { label: 'Past Due', className: 'bg-yellow-100 text-yellow-700' },
  CANCELED: { label: 'Canceled', className: 'bg-red-100 text-red-700' },
  TRIALING: { label: 'Trial', className: 'bg-cyan-100 text-cyan-700' },
}

export default function Badge({ status, size = 'sm' }: BadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-600' }

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  )
}
