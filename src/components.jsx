import React from 'react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const buttonVariants = {
  accent:
    'bg-teal-700 text-white shadow-[0_12px_26px_rgba(15,118,110,0.22)] hover:bg-teal-800',
  primary:
    'bg-teal-700 text-white shadow-[0_12px_26px_rgba(15,118,110,0.22)] hover:bg-teal-800',
  secondary:
    'border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-teal-200 hover:bg-teal-50',
  quiet: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950',
};

const buttonSizes = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

const pillTones = {
  accent: 'bg-teal-50 text-teal-700 ring-teal-100',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
};

const metricTones = {
  accent: {
    card: 'border-teal-100 bg-[linear-gradient(180deg,#ffffff_0%,#ecfdf5_100%)]',
    icon: 'bg-teal-100 text-teal-700',
  },
  neutral: {
    card: 'border-slate-200 bg-white',
    icon: 'bg-slate-100 text-slate-600',
  },
  warning: {
    card: 'border-amber-100 bg-[linear-gradient(180deg,#ffffff_0%,#fffbeb_100%)]',
    icon: 'bg-amber-100 text-amber-700',
  },
};

export const Card = ({ children, className = '', onClick }) => (
  <div
    className={cx(
      'rounded-[28px] border border-white/60 bg-white/88 shadow-[0_20px_60px_rgba(26,48,80,0.12)] backdrop-blur-sm',
      onClick && 'cursor-pointer transition-transform duration-200 hover:-translate-y-0.5',
      className,
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

export const Button = ({
  children,
  className = '',
  disabled = false,
  onClick,
  size = 'md',
  type = 'button',
  variant = 'primary',
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
      buttonVariants[variant] || buttonVariants.primary,
      buttonSizes[size] || buttonSizes.md,
      className,
    )}
  >
    {children}
  </button>
);

export const Pill = ({ children, className = '', tone = 'neutral' }) => (
  <span
    className={cx(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
      pillTones[tone] || pillTones.neutral,
      className,
    )}
  >
    {children}
  </span>
);

export const SectionHeading = ({ body, className = '', eyebrow, title }) => (
  <div className={cx('max-w-2xl', className)}>
    {eyebrow ? (
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
        {eyebrow}
      </div>
    ) : null}
    <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
    {body ? <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p> : null}
  </div>
);

export const MetricCard = ({
  icon,
  label,
  sublabel,
  tone = 'neutral',
  value,
}) => {
  const styles = metricTones[tone] || metricTones.neutral;

  return (
    <div className={cx('rounded-[28px] border p-5 shadow-sm', styles.card)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </div>
          <div className="mt-3 text-4xl font-semibold text-slate-950">{value}</div>
        </div>
        {icon ? (
          <div className={cx('rounded-2xl p-3', styles.icon)} aria-hidden="true">
            {icon}
          </div>
        ) : null}
      </div>
      {sublabel ? <p className="mt-3 text-sm leading-6 text-slate-600">{sublabel}</p> : null}
    </div>
  );
};

export const EmptyState = ({ body, icon, title }) => (
  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
    {icon ? (
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
        {icon}
      </div>
    ) : null}
    <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
    {body ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{body}</p> : null}
  </div>
);

export const PercentileBadge = ({ percentile }) => {
  const value = percentile ?? null;
  const tone =
    value == null
      ? 'bg-slate-100 text-slate-500'
      : value >= 40
        ? 'bg-teal-100 text-teal-800'
        : value >= 20
          ? 'bg-amber-100 text-amber-800'
          : 'bg-rose-100 text-rose-800';

  return (
    <span className={cx('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold', tone)}>
      {value == null ? 'Pending' : `P${value}`}
    </span>
  );
};

export const ProgressRail = ({ current = 0, total = 1 }) => {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
};
