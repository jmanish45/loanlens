import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { formatINRCompact } from '../../lib/loanMath';
import { ROUTES } from '../../constants/routes';

const RADIUS = 84;
const CENTER = 100;
const ARC_LENGTH = Math.PI * RADIUS;

function Gauge({ percent }) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const filled = (clamped / 100) * ARC_LENGTH;
  const angle = Math.PI * (1 - clamped / 100);
  const knobX = CENTER + RADIUS * Math.cos(angle);
  const knobY = CENTER - RADIUS * Math.sin(angle);
  const arc = `M ${CENTER - RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${CENTER}`;

  return (
    <svg
      viewBox="0 0 200 116"
      className="w-full"
      role="img"
      aria-label={`Document readiness ${clamped} percent`}
    >
      <path d={arc} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" strokeLinecap="round" />
      <path
        d={arc}
        fill="none"
        stroke="#10B981"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${ARC_LENGTH}`}
      />
      {clamped > 0 && <circle cx={knobX} cy={knobY} r="7" fill="#10B981" stroke="#0A192F" strokeWidth="3" />}
    </svg>
  );
}

export default function PortfolioHero({ summary = null, readiness = null, latest = null }) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const approved = summary?.approved ?? 0;
  const actionRequired = summary?.actionRequired ?? 0;
  const totalRequested = summary?.totalRequested ?? 0;

  const percent = readiness?.percent ?? 0;
  const required = readiness?.required ?? 0;
  const uploadedCount = readiness?.uploadedCount ?? 0;
  const missingCount = readiness?.missingCount ?? 0;

  const headline =
    total === 0
      ? 'Start your first application'
      : total === 1
        ? 'Your application, tracked end to end'
        : `${total} applications, one clear view`;

  const parts = [];
  if (active > 0) parts.push(`${active} in progress`);
  if (approved > 0) parts.push(`${approved} approved`);
  if (actionRequired > 0) parts.push(`${actionRequired} needing documents`);
  if (parts.length === 0 && total > 0) parts.push(`${total} on file`);

  const subline =
    total === 0
      ? 'Compare partner banks, upload your documents once, and track every step.'
      : parts.join(' · ');

  return (
    <section className="relative overflow-hidden rounded-xl bg-navy-900 text-white p-5 lg:p-6">
      <div className="absolute inset-0 dash-grid-pattern" aria-hidden="true" />

      <div className="relative grid lg:grid-cols-[1fr_auto] gap-5 lg:gap-8 items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Your Loan Portfolio
          </p>
          <h1 className="text-[21px] lg:text-[25px] font-semibold leading-tight tracking-[-0.01em] mt-1.5">
            {headline}
          </h1>
          <p className="text-[13px] text-slate-300 mt-1">
            {subline}
            {latest?.bankName && (
              <span className="text-slate-400">
                {' · '}Most recent: <span className="capitalize">{latest.loanType}</span> loan with{' '}
                {latest.bankName}
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Total Requested
              </p>
              <p className="text-xl font-semibold tabular-nums mt-0.5">
                {total === 0 ? '—' : formatINRCompact(totalRequested)}
              </p>
            </div>
            <span className="hidden sm:block w-px h-8 bg-white/10" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                In Progress
              </p>
              <p className="text-xl font-semibold tabular-nums mt-0.5">{active}</p>
            </div>
            <span className="hidden sm:block w-px h-8 bg-white/10" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Needs Attention
              </p>
              <p
                className={`text-xl font-semibold tabular-nums mt-0.5 ${
                  actionRequired > 0 ? 'text-red-400' : 'text-white'
                }`}
              >
                {actionRequired}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Link
                to={ROUTES.APPLY}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-medium rounded-lg px-3.5 py-2 transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                New Application
              </Link>
              {actionRequired > 0 && (
                <a
                  href="#action-required"
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 text-[13px] font-medium rounded-lg px-3.5 py-2 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Resolve {actionRequired} {actionRequired === 1 ? 'issue' : 'issues'}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-navy-800 border border-white/5 rounded-xl p-4 w-full lg:w-[258px]">
          {/* A 0% gauge would read as a bad score, so an empty state is shown instead. */}
          {required === 0 ? (
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-white/5 grid place-items-center shrink-0">
                <FileText className="w-[18px] h-[18px] text-slate-400" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white">
                  {total === 0 ? 'No documents yet' : 'Nothing to upload'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {total === 0
                    ? 'Readiness appears once you start an application.'
                    : 'Tracking starts at verification.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-white">Document Readiness</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across active applications</p>

              {/* The percentage sits inside the arc so the dial reads as one unit. */}
              <div className="relative max-w-[148px] mx-auto mt-1">
                <Gauge percent={percent} />
                <p className="absolute inset-x-0 bottom-0.5 text-center text-[22px] font-semibold tabular-nums text-white leading-none">
                  {percent}%
                </p>
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-1">
                {uploadedCount} of {required} documents uploaded
              </p>

              {missingCount > 0 ? (
                <p className="text-[11px] text-amber-400 mt-1.5 text-center">
                  {missingCount} document{missingCount === 1 ? '' : 's'} still required
                </p>
              ) : percent === 100 ? (
                <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  All documents uploaded
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
