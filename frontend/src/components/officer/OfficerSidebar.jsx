import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Aperture,
  LayoutDashboard,
  Files,
  Inbox,
  AlertTriangle,
  ClipboardCheck,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { initialsOf } from '../../lib/officerData';

/**
 * Queue links carry a ?status= filter that ApplicationsList reads on mount, so
 * the sidebar doubles as the officer's work queue.
 */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.OFFICER },
  { key: 'all', label: 'All Applications', icon: Files, to: ROUTES.OFFICER_APPLICATIONS },
];

const QUEUE_ITEMS = [
  {
    key: 'submitted',
    label: 'New Submissions',
    icon: Inbox,
    status: 'submitted',
    countKey: 'submitted',
  },
  {
    key: 'under_review',
    label: 'Under Review',
    icon: ClipboardCheck,
    status: 'under_review',
    countKey: 'underReview',
  },
  {
    key: 'documents_required',
    label: 'Documents Required',
    icon: AlertTriangle,
    status: 'documents_required',
    countKey: 'docsRequired',
    urgent: true,
  },
];

const BASE =
  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
const IDLE = 'text-slate-300 hover:bg-white/5 hover:text-white';
const ACTIVE = 'bg-navy-800 text-white';

function NavContents({ counts, onNavigate }) {
  const location = useLocation();
  const [params] = useSearchParams();
  const { user, logout } = useAuth();

  const activeStatus = params.get('status') || '';
  const onList = location.pathname.startsWith(ROUTES.OFFICER_APPLICATIONS);
  const onDetails = /\/officer\/applications\/[^/]+$/.test(location.pathname);

  const activeKey = onDetails
    ? 'all'
    : onList
      ? activeStatus || 'all'
      : location.pathname === ROUTES.OFFICER
        ? 'dashboard'
        : null;

  return (
    <>
      <div className="flex items-center gap-3 h-16 px-5 border-b border-white/5 shrink-0">
        <span className="w-9 h-9 rounded-lg bg-emerald-500 grid place-items-center shrink-0">
          <Aperture className="w-5 h-5 text-navy-900" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-white leading-tight">LoanLens</span>
          <span className="block text-[11px] text-slate-400 truncate">Officer workspace</span>
        </span>
      </div>

      <nav aria-label="Officer navigation" className="px-3 pt-5 overflow-y-auto">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
          Menu
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <li key={item.key} className="relative">
                {isActive && (
                  <span
                    className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                )}
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={`${BASE} ${isActive ? ACTIVE : IDLE}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mt-6 mb-2">
          Work Queue
        </p>
        <ul className="space-y-1">
          {QUEUE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            const count = counts?.[item.countKey] ?? null;
            return (
              <li key={item.key} className="relative">
                {isActive && (
                  <span
                    className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                )}
                <Link
                  to={`${ROUTES.OFFICER_APPLICATIONS}?status=${item.status}`}
                  onClick={onNavigate}
                  className={`${BASE} ${isActive ? ACTIVE : IDLE}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums shrink-0 ${
                        item.urgent ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto p-3 space-y-2">
        <div className="bg-navy-800 border border-white/5 rounded-xl p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-emerald-500 text-navy-900 text-xs font-semibold grid place-items-center shrink-0">
              {initialsOf(user?.name)}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-white truncate">
                {user?.name || 'Officer'}
              </span>
              <span className="block text-[11px] text-slate-400 capitalize truncate">
                {user?.role || 'officer'} access
              </span>
            </span>
          </div>
          <p className="flex items-start gap-1.5 text-[11px] text-slate-400 leading-relaxed mt-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-px" aria-hidden="true" />
            Every decision you record is written to the application audit trail.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function OfficerSidebar({ counts = null, open = false, onClose = () => {} }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-navy-900 h-screen sticky top-0">
        <NavContents counts={counts} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="absolute inset-0 w-full h-full bg-navy-950/60 cursor-pointer"
          />
          <div className="relative flex flex-col w-72 h-full bg-navy-900">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={onClose}
              className="absolute top-4 right-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
            <NavContents counts={counts} onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
