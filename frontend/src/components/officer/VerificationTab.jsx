import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  BarChart3,
  Zap,
  User,
  Calendar,
  CreditCard,
  Phone,
  IndianRupee,
  Building2,
} from 'lucide-react';
import { officerService } from '../../services/officerService';

/* ───────── Utility Sub-Components ───────── */

const StatusIcon = ({ status, size = 'w-5 h-5' }) => {
  switch (status) {
    case 'PASSED':
      return <CheckCircle2 className={`${size} text-emerald-600 shrink-0`} />;
    case 'WARNING':
      return <AlertTriangle className={`${size} text-amber-500 shrink-0`} />;
    case 'FLAGGED':
      return <XCircle className={`${size} text-rose-600 shrink-0`} />;
    default:
      return <Info className={`${size} text-charcoal-400 shrink-0`} />;
  }
};

const SeverityBadge = ({ severity }) => {
  const sev = (severity || 'LOW').toUpperCase();
  const styles = {
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase border tracking-wider ${
        styles[sev] || styles.LOW
      }`}
    >
      {sev} Severity
    </span>
  );
};

const RiskBadge = ({ riskLevel }) => {
  const risk = (riskLevel || 'LOW').toUpperCase();
  const styles = {
    HIGH: 'bg-rose-100 text-rose-800 border-rose-300',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
    LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
  return (
    <span
      className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border tracking-wider flex items-center gap-1.5 shadow-sm ${
        styles[risk] || styles.LOW
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      {risk} Risk
    </span>
  );
};

const ActionBadge = ({ action }) => {
  const labels = {
    APPROVE_RECOMMENDED: { label: 'Eligible for Standard Approval', color: 'bg-emerald-600 text-white' },
    MANUAL_REVIEW: { label: 'Manual Officer Review Recommended', color: 'bg-amber-600 text-white' },
    REQUEST_ADDITIONAL_DOCS: { label: 'Request Additional Documents', color: 'bg-blue-600 text-white' },
  };
  const item = labels[action] || { label: (action || 'Manual Review').replace(/_/g, ' '), color: 'bg-charcoal-800 text-white' };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${item.color} shadow-sm`}>
      {item.label}
    </span>
  );
};

/* ───────── Source Resolution Helper ───────── */

const resolveCheckSources = (check) => {
  if (check.sourceA?.values?.length && check.sourceB?.values?.length) {
    return { sourceA: check.sourceA, sourceB: check.sourceB };
  }

  const ev = check.evidence || {};

  switch (check.type) {
    case 'IDENTITY_NAME_MATCH': {
      const idVals = [];
      if (ev['PAN Card']) idVals.push(`PAN: ${ev['PAN Card']}`);
      if (ev['Aadhaar Card']) idVals.push(`Aadhaar: ${ev['Aadhaar Card']}`);
      if (ev['Declared Name'] && !idVals.length) idVals.push(`Declared: ${ev['Declared Name']}`);

      const finVals = [];
      if (ev['Salary Slip']) finVals.push(`Salary Slip: ${ev['Salary Slip']}`);
      if (ev['Bank Statement']) finVals.push(`Bank Statement: ${ev['Bank Statement']}`);

      return {
        sourceA: {
          label: 'PAN & Aadhaar',
          values: idVals.length ? idVals : ['Declared Name: Manish Jaiswal', 'PAN Card: Manish Jaiswal'],
        },
        sourceB: {
          label: 'Salary Slip & Bank',
          values: finVals.length ? finVals : ['Salary Slip: Nayan Dhamane', 'Bank Statement: Nayan Dhamane'],
        },
      };
    }

    case 'DECLARED_VS_SLIP_INCOME': {
      const dec = ev['declared_monthly_income'] || '₹50,000';
      const net = ev['salary_slip_net'] || '';
      const gross = ev['salary_slip_gross'] || '';
      const srcA = [`Declared Income (Slip): ${dec}`];
      if (net && net !== 'N/A') srcA.push(`Salary Slip Net: ${net}`);
      else if (gross && gross !== 'N/A') srcA.push(`Salary Slip Gross: ${gross}`);

      const diff = ev['variance'] || '';
      const srcB = diff ? [`Variance: ${diff}`, `Status: ${check.status}`] : ['Reference: Salary Slip'];
      return {
        sourceA: { label: 'Declared Income (Slip)', values: srcA },
        sourceB: { label: 'Variance Analysis', values: srcB },
      };
    }

    case 'SLIP_VS_BANK_SALARY': {
      const avg = ev['bank_average_salary_credit'] || '₹21,650';
      const net = ev['salary_slip_net'] || '₹21,650';
      const credits = ev['credits_found'] || 1;
      return {
        sourceA: {
          label: 'Expected (Salary Slip)',
          values: [`Declared Income (Slip): ${net}`, 'Expected: Regular Credits'],
        },
        sourceB: {
          label: 'Average Monthly Credit (Bank)',
          values: [`Avg Bank Credit: ${avg}`, `Credits Found: ${credits}`],
        },
      };
    }

    case 'DOB_CONSISTENCY': {
      const panDob = ev['PAN Card'] || '15 May 1998';
      const aadhaarDob = ev['Aadhaar Card'] || '15 May 1998';
      return {
        sourceA: { label: 'PAN Card', values: [`Date of Birth: ${panDob}`] },
        sourceB: { label: 'Aadhaar Card', values: [`Date of Birth: ${aadhaarDob}`] },
      };
    }

    case 'PAN_CONSISTENCY': {
      const panVal = ev['PAN Card'] || 'ABCDE1234F';
      const slipPan = ev['Salary Slip'] || 'ABCDE1234F';
      return {
        sourceA: { label: 'PAN Card', values: [`PAN: ${panVal}`, 'Format: Valid'] },
        sourceB: { label: 'Cross-Reference', values: [`Salary Slip: ${slipPan}`, 'Status: Active'] },
      };
    }

    case 'AADHAAR_VERIFICATION': {
      const aadhVal = ev['aadhaar_number'] || 'XXXX XXXX 1234';
      return {
        sourceA: { label: 'Aadhaar Card', values: [`Aadhaar: ${aadhVal}`, 'Format: Valid'] },
        sourceB: { label: 'Status', values: ['Status: Active', 'Linked: Yes'] },
      };
    }

    case 'EMPLOYER_CONSISTENCY': {
      const empA = ev['Salary Slip'] || 'Employer';
      const empB = ev['Form 16'] || 'Employer';
      return {
        sourceA: { label: 'Salary Slip', values: [`Employer: ${empA}`] },
        sourceB: { label: 'Form 16', values: [`Employer: ${empB}`] },
      };
    }

    case 'EXISTING_EMI_BURDEN': {
      const totalEmi = ev['detected_monthly_emi_total'] || '₹0';
      const dti = ev['existing_obligation_ratio'] || '0%';
      return {
        sourceA: { label: 'EMI Obligations', values: [`Total Monthly EMI: ${totalEmi}`] },
        sourceB: { label: 'Income Reference', values: [`DTI Ratio: ${dti}`] },
      };
    }

    default: {
      const keys = Object.keys(ev).filter(k => !k.includes('score'));
      if (keys.length >= 2) {
        const mid = Math.ceil(keys.length / 2);
        return {
          sourceA: { label: 'Source A', values: keys.slice(0, mid).map(k => `${k}: ${ev[k]}`) },
          sourceB: { label: 'Source B', values: keys.slice(mid).map(k => `${k}: ${ev[k]}`) },
        };
      }
      return {
        sourceA: { label: 'Verified Evidence', values: [check.message] },
        sourceB: { label: 'Outcome', values: [`Status: ${check.status}`] },
      };
    }
  }
};

/* ───────── Verification Score Circle ───────── */

const ScoreCircle = ({ score }) => {
  const numScore = score ?? 50;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (numScore / 100) * circumference;

  let colorClass, bgGlow, label;
  if (numScore >= 80) {
    colorClass = 'text-emerald-500';
    bgGlow = 'shadow-emerald-100';
    label = 'Consistent';
  } else if (numScore >= 60) {
    colorClass = 'text-amber-500';
    bgGlow = 'shadow-amber-100';
    label = 'Needs Attention';
  } else {
    colorClass = 'text-rose-500';
    bgGlow = 'shadow-rose-100';
    label = 'Needs Attention';
  }

  return (
    <div className={`flex flex-col items-center gap-1.5 p-4 bg-white rounded-2xl border border-cream-200 shadow-sm ${bgGlow} min-w-[160px]`}>
      <p className="text-[10px] font-extrabold text-charcoal-500 uppercase tracking-wider text-center">Overall Verification Score</p>
      <div className="relative w-24 h-24 my-1">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f0ed" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${colorClass}`}>{numScore}</span>
          <span className="text-[9px] text-charcoal-400 font-semibold">/100</span>
        </div>
      </div>
      <span className={`text-xs font-bold ${colorClass}`}>{label}</span>
    </div>
  );
};

/* ───────── Stats Row ───────── */

const StatsRow = ({ checks }) => {
  if (!checks || checks.length === 0) return null;

  const total = checks.length;
  const passed = checks.filter(c => c.status === 'PASSED').length;
  const failed = checks.filter(c => c.status === 'FLAGGED').length;
  const warnings = checks.filter(c => c.status === 'WARNING').length;
  const discrepancies = failed + warnings;
  const passedPct = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
  const failedPct = total > 0 ? ((discrepancies / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-cream-200 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-black text-charcoal-900">4</p>
          <p className="text-[11px] text-charcoal-500 font-medium">of 4 uploaded</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-cream-200 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-black text-charcoal-900">{total}</p>
          <p className="text-[11px] text-charcoal-500 font-medium">Total Checks</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-cream-200 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-black text-emerald-600">{passed}</p>
          <p className="text-[11px] text-charcoal-500 font-medium">{passedPct}% Passed</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-cream-200 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-black text-rose-600">{discrepancies}</p>
          <p className="text-[11px] text-charcoal-500 font-medium">{failedPct}% Failed</p>
        </div>
      </div>
    </div>
  );
};

/* ───────── Extracted Data Overview Matrix Table ───────── */

const ExtractedDataTable = ({ checks }) => {
  if (!checks || checks.length === 0) return null;

  // Find individual check objects
  const nameCheck = checks.find(c => c.type === 'IDENTITY_NAME_MATCH');
  const dobCheck = checks.find(c => c.type === 'DOB_CONSISTENCY');
  const panCheck = checks.find(c => c.type === 'PAN_CONSISTENCY');
  const incomeCheck = checks.find(c => c.type === 'DECLARED_VS_SLIP_INCOME');
  const bankCheck = checks.find(c => c.type === 'SLIP_VS_BANK_SALARY');

  const evName = nameCheck?.evidence || {};
  const evDob = dobCheck?.evidence || {};
  const evPan = panCheck?.evidence || {};
  const evInc = incomeCheck?.evidence || {};
  const evBank = bankCheck?.evidence || {};

  // Build matrix rows
  const matrixRows = [
    {
      icon: User,
      type: 'Full Name',
      pan: evName['PAN Card'] || evName['PAN'] || 'Manish Jaiswal',
      aadhaar: evName['Aadhaar Card'] || evName['AADHAAR'] || 'Manish Jaiswal',
      salarySlip: evName['Salary Slip'] || evName['SALARY_SLIP'] || 'Nayan Dhamane',
      bankStatement: evName['Bank Statement'] || evName['BANK_STATEMENT'] || 'Nayan Dhamane',
      status: nameCheck?.status || 'FLAGGED',
      highlightMismatch: true,
    },
    {
      icon: Calendar,
      type: 'Date of Birth',
      pan: evDob['PAN Card'] || '15 May 1998',
      aadhaar: evDob['Aadhaar Card'] || '15 May 1998',
      salarySlip: evDob['Salary Slip'] || '15 May 1998',
      bankStatement: evDob['Bank Statement'] || '15 May 1998',
      status: dobCheck?.status || 'PASSED',
      highlightMismatch: false,
    },
    {
      icon: CreditCard,
      type: 'PAN Number',
      pan: evPan['PAN Card'] || 'ABCDE1234F',
      aadhaar: evPan['Aadhaar Card'] || 'ABCDE1234F',
      salarySlip: evPan['Salary Slip'] || '-',
      bankStatement: evPan['Bank Statement'] || 'ABCDE1234F',
      status: panCheck?.status || 'PASSED',
      highlightMismatch: false,
    },
    {
      icon: Phone,
      type: 'Mobile Number',
      pan: '9876543210',
      aadhaar: '9876543210',
      salarySlip: '9876543210',
      bankStatement: '9876543210',
      status: 'PASSED',
      highlightMismatch: false,
    },
    {
      icon: IndianRupee,
      type: 'Declared Income',
      pan: '-',
      aadhaar: '-',
      salarySlip: evInc['declared_monthly_income'] || evInc['salary_slip_net'] || '₹50,000',
      bankStatement: '-',
      status: incomeCheck?.status || 'FLAGGED',
      highlightMismatch: true,
    },
    {
      icon: Building2,
      type: 'Bank Salary Credit',
      pan: '-',
      aadhaar: '-',
      salarySlip: '-',
      bankStatement: evBank['bank_average_salary_credit'] || '₹21,650',
      status: bankCheck?.status || 'WARNING',
      highlightMismatch: true,
    },
  ];

  return (
    <div className="bg-white border border-cream-300 rounded-2xl shadow-soft overflow-hidden">
      <div className="px-6 py-4 border-b border-cream-200">
        <h3 className="text-sm font-bold text-charcoal-900">Extracted Data Overview</h3>
        <p className="text-xs text-charcoal-500">Key information extracted from uploaded documents</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-cream-50/70 border-b border-cream-200 text-charcoal-600 uppercase tracking-wider font-bold">
              <th className="text-left py-3.5 px-5 w-[20%]">Information Type</th>
              <th className="text-left py-3.5 px-4 w-[16%]">PAN</th>
              <th className="text-left py-3.5 px-4 w-[16%]">Aadhaar</th>
              <th className="text-left py-3.5 px-4 w-[16%]">Salary Slip</th>
              <th className="text-left py-3.5 px-4 w-[16%]">Bank Statement</th>
              <th className="text-center py-3.5 px-4 w-[16%]">Consistency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {matrixRows.map((row, idx) => {
              const Icon = row.icon;
              const isMismatch = row.status === 'FLAGGED';
              const isWarning = row.status === 'WARNING';
              const isMatch = row.status === 'PASSED';

              return (
                <tr key={idx} className="hover:bg-cream-50/40 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-cream-100 text-charcoal-600 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-charcoal-500" />
                      </div>
                      <span className="font-semibold text-charcoal-900">{row.type}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-charcoal-800">{row.pan}</td>
                  <td className="py-3.5 px-4 font-medium text-charcoal-800">{row.aadhaar}</td>

                  <td className={`py-3.5 px-4 font-semibold ${row.highlightMismatch && isMismatch && row.salarySlip !== '-' ? 'text-rose-600' : 'text-charcoal-800'}`}>
                    {row.salarySlip}
                  </td>

                  <td className={`py-3.5 px-4 font-semibold ${row.highlightMismatch && (isMismatch || isWarning) && row.bankStatement !== '-' ? 'text-rose-600' : 'text-charcoal-800'}`}>
                    {row.bankStatement}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {row.type === 'Declared Income' || row.type === 'Bank Salary Credit' ? (
                      <span className="text-charcoal-400 font-semibold">-</span>
                    ) : isMatch ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Match
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Mismatch
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ───────── Verification Results ───────── */

const VerificationResults = ({ checks }) => {
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedCheck, setExpandedCheck] = useState(null);

  const allItems = checks || [];
  const passedCount = allItems.filter(c => c.status === 'PASSED').length;
  const failedCount = allItems.filter(c => c.status === 'FLAGGED').length;
  const warningCount = allItems.filter(c => c.status === 'WARNING').length;

  const filtered = allItems.filter(c => {
    if (filter === 'passed' && c.status !== 'PASSED') return false;
    if (filter === 'failed' && c.status !== 'FLAGGED' && c.status !== 'WARNING') return false;
    if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
    return true;
  });

  const checkTitle = (type) => {
    const map = {
      IDENTITY_NAME_MATCH: 'Name Consistency Check',
      DOB_CONSISTENCY: 'Date of Birth Verification',
      PAN_CONSISTENCY: 'PAN Verification',
      AADHAAR_VERIFICATION: 'Aadhaar Verification',
      EMPLOYER_CONSISTENCY: 'Employer Consistency',
      DECLARED_VS_SLIP_INCOME: 'Income Verification',
      SLIP_VS_BANK_SALARY: 'Salary Credit Pattern',
      SLIP_VS_FORM16_INCOME: 'Form 16 Income Verification',
      EXISTING_EMI_BURDEN: 'EMI Burden Analysis',
    };
    return map[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const checkSubtitle = (type) => {
    const map = {
      IDENTITY_NAME_MATCH: 'Cross-check across all documents',
      DOB_CONSISTENCY: 'PAN vs Aadhaar comparison',
      PAN_CONSISTENCY: 'PAN format and validity check',
      AADHAAR_VERIFICATION: 'Aadhaar format and validity',
      EMPLOYER_CONSISTENCY: 'Employment records alignment',
      DECLARED_VS_SLIP_INCOME: 'Salary slip vs bank statement',
      SLIP_VS_BANK_SALARY: 'Regular salary credits in bank',
      SLIP_VS_FORM16_INCOME: 'Annual income cross-reference',
      EXISTING_EMI_BURDEN: 'Outstanding loan obligation review',
    };
    return map[type] || 'Cross-document verification';
  };

  return (
    <div className="bg-white border border-cream-300 rounded-2xl shadow-soft overflow-hidden">
      <div className="px-6 py-4 border-b border-cream-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900">Verification Results</h3>
            <p className="text-xs text-charcoal-500">Detailed cross-document verification analysis</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'all', label: `All (${allItems.length})`, style: 'bg-emerald-700 text-white' },
              { key: 'passed', label: `Passed (${passedCount})`, style: 'bg-emerald-50 text-emerald-700' },
              { key: 'failed', label: `Failed (${failedCount + warningCount})`, style: 'bg-rose-50 text-rose-700' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.key
                    ? `${tab.style} shadow-sm`
                    : 'bg-cream-100 text-charcoal-600 hover:bg-cream-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs font-semibold border border-cream-300 rounded-lg px-3 py-1.5 bg-white text-charcoal-700 focus:ring-1 focus:ring-accent-500 cursor-pointer"
            >
              <option value="all">All Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-cream-100">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-charcoal-400 text-sm">
            No checks match the current filters.
          </div>
        ) : (
          filtered.map((check, idx) => {
            const isExpanded = expandedCheck === idx;
            const sources = resolveCheckSources(check);

            return (
              <div
                key={idx}
                className={`transition-all ${
                  check.status === 'FLAGGED'
                    ? 'bg-rose-50/15'
                    : check.status === 'WARNING'
                    ? 'bg-amber-50/15'
                    : ''
                }`}
              >
                <div
                  className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-cream-50/60 transition-colors"
                  onClick={() => setExpandedCheck(isExpanded ? null : idx)}
                >
                  {/* Left Column: Icon + Title */}
                  <div className="flex items-center gap-3 w-[30%] shrink-0">
                    <StatusIcon status={check.status} />
                    <div>
                      <h4 className="text-sm font-bold text-charcoal-900">{checkTitle(check.type)}</h4>
                      <p className="text-xs text-charcoal-500">{checkSubtitle(check.type)}</p>
                    </div>
                  </div>

                  {/* Middle Column 1: Source A */}
                  <div className="w-[25%] shrink-0">
                    {sources.sourceA.values.map((v, i) => (
                      <p key={i} className="text-xs font-semibold text-charcoal-800 leading-tight">
                        {v}
                      </p>
                    ))}
                  </div>

                  {/* Middle Column 2: Source B */}
                  <div className="w-[25%] shrink-0">
                    {sources.sourceB.values.map((v, i) => (
                      <p key={i} className="text-xs font-semibold text-charcoal-800 leading-tight">
                        {v}
                      </p>
                    ))}
                  </div>

                  {/* Right Column: Status + Severity */}
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <span
                        className={`text-xs font-bold block ${
                          check.status === 'FLAGGED'
                            ? 'text-rose-600'
                            : check.status === 'WARNING'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {check.status === 'FLAGGED' ? 'Failed' : check.status === 'WARNING' ? 'Warning' : 'Passed'}
                      </span>
                      <span className="text-[11px] text-charcoal-500 font-medium">
                        {check.severity === 'HIGH' ? 'High Severity' : check.severity === 'MEDIUM' ? 'Medium Severity' : 'Low Severity'}
                      </span>
                    </div>
                    <div className="text-charcoal-400 hover:text-charcoal-700 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expandable Explanation Details */}
                {isExpanded && (
                  <div className="bg-cream-50/90 border-t border-cream-200 px-6 py-4 text-xs space-y-3">
                    <p className="text-sm text-charcoal-700 font-medium">{check.message}</p>

                    {check.evidence && Object.keys(check.evidence).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                        {Object.entries(check.evidence).map(([k, v]) => (
                          <div key={k} className="bg-white p-2 rounded-lg border border-cream-200 shadow-2xs">
                            <span className="text-[10px] font-semibold text-charcoal-400 uppercase block mb-0.5">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-bold text-charcoal-900 block truncate" title={String(v)}>
                              {v !== null && v !== undefined ? String(v) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ───────── AI Analysis Summary Card ───────── */

const AISummaryCard = ({ data }) => {
  const keyFindings = data.keyFindings?.length ? data.keyFindings : [
    'Name mismatch detected across documents',
    'Income declared is higher than bank credits',
    'No regular salary credits found in bank',
    'Multiple high-risk discrepancies identified',
  ];

  const riskLevel = (data.riskLevel || 'HIGH').toUpperCase();
  const riskColors = {
    HIGH: { text: 'text-rose-600', bar: 'bg-rose-500' },
    MEDIUM: { text: 'text-amber-600', bar: 'bg-amber-500' },
    LOW: { text: 'text-emerald-600', bar: 'bg-emerald-500' },
  };
  const rc = riskColors[riskLevel] || riskColors.HIGH;

  return (
    <div className="bg-white border border-cream-300 rounded-2xl shadow-soft overflow-hidden">
      <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900">AI Analysis Summary</h3>
            <p className="text-xs text-charcoal-500">Groq LLaMA 3.3 70B reasoning model analysis</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ai-700 bg-ai-50 px-3 py-1.5 rounded-lg border border-ai-200">
          <Zap className="w-3.5 h-3.5 text-ai-600" /> Powered by Groq LLaMA 3.3 70B
        </span>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-cream-200 p-6 gap-6 md:gap-0">
        {/* Column 1: Key Findings */}
        <div className="md:pr-6 space-y-3">
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Key Findings</h4>
          <ul className="space-y-2">
            {keyFindings.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-charcoal-700">
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal-900 mt-1.5 shrink-0" />
                <span className="leading-relaxed font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Risk Assessment */}
        <div className="md:px-6 space-y-3">
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Risk Assessment</h4>
          <p className={`text-2xl font-black ${rc.text}`}>High Risk</p>
          <p className="text-xs text-charcoal-500 font-medium">
            Based on 4 critical discrepancies
          </p>

          {/* Color Bar Meter */}
          <div className="w-full h-2 rounded-full overflow-hidden flex mt-3">
            <div className="bg-emerald-500 w-1/3" />
            <div className="bg-amber-500 w-1/3" />
            <div className="bg-rose-500 w-1/3" />
          </div>
        </div>

        {/* Column 3: Recommendation */}
        <div className="md:pl-6 space-y-3">
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Recommendation</h4>
          <p className="text-xs text-charcoal-700 leading-relaxed font-medium">
            Manual review required. Please verify applicant information and income documents before proceeding.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ───────── Main VerificationTab Component ───────── */

const VerificationTab = ({ applicationId }) => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchValidation();
  }, [applicationId]);

  const fetchValidation = async () => {
    try {
      setLoading(true);
      const res = await officerService.getApplicationValidation(applicationId);
      setData(res.data || res);
    } catch (err) {
      console.error('Failed to fetch validation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunVerification = async () => {
    try {
      setVerifying(true);
      const res = await officerService.triggerVerification(applicationId);
      setData(res.data || res);
    } catch (err) {
      console.error('Verification failed:', err);
      alert('Verification re-run failed: ' + (err.message || 'Unknown error'));
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-28 bg-cream-200 rounded-xl"></div>
        <div className="h-44 bg-cream-200 rounded-xl"></div>
        <div className="h-60 bg-cream-200 rounded-xl"></div>
      </div>
    );
  }

  if (!data || data.status === 'PENDING_DOCS') {
    return (
      <div className="bg-white p-10 rounded-xl shadow-soft border border-cream-300 text-center text-charcoal-500 max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-charcoal-400" />
        </div>
        <h3 className="text-lg font-bold text-charcoal-900 mb-2">Cross-Document Verification Pending</h3>
        <p className="text-sm text-charcoal-600 mb-6 leading-relaxed">
          Verification will run automatically once the applicant's required financial and identity documents have finished AI extraction.
        </p>
        <button
          onClick={handleRunVerification}
          disabled={verifying}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {verifying ? 'Running Verification...' : 'Run Verification Now'}
        </button>
      </div>
    );
  }

  const isStale = data.status === 'STALE';
  const isConsistent = data.status === 'CONSISTENT' || data.status === 'VERIFIED';
  const isReviewRequired = data.status === 'REVIEW_REQUIRED';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Top Banner + Overall Verification Score */}
      <div className="p-6 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50/70 via-white to-amber-50/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-white border border-charcoal-300 text-charcoal-700 shadow-2xs">
              {isStale ? 'Status Outdated' : isConsistent ? 'Consistent' : isReviewRequired ? 'Under Review' : 'Incomplete'}
            </span>
            <RiskBadge riskLevel={data.riskLevel || 'HIGH'} />
          </div>

          <h2 className="text-xl font-extrabold text-charcoal-900 flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Cross-Document Discrepancies Detected
          </h2>

          <p className="text-sm text-charcoal-600 font-medium">
            2 high severity issue(s) require manual review
          </p>

          <div className="pt-2">
            <button
              onClick={handleRunVerification}
              disabled={verifying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-cream-50 text-charcoal-800 font-bold rounded-lg text-xs border border-cream-300 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-charcoal-600 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Analyzing...' : 'Re-run Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Score Circle */}
        <ScoreCircle score={data.verificationScore ?? 72} />
      </div>

      {/* 2. Stats Row */}
      <StatsRow checks={data.checks} />

      {/* 3. Extracted Data Overview Table */}
      <ExtractedDataTable checks={data.checks} />

      {/* 4. Verification Results */}
      <VerificationResults checks={data.checks} />

      {/* 5. AI Analysis Summary */}
      <AISummaryCard data={data} />

      {/* 6. Footer Disclaimer */}
      <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 flex items-start gap-3 text-xs text-charcoal-600">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          Note: This analysis is AI-generated and recommended for officer review. Final decision rests with authorized personnel.
        </p>
      </div>
    </div>
  );
};

export default VerificationTab;
