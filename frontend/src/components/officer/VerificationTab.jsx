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
  TrendingDown,
  Clock,
  ArrowRight,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { officerService } from '../../services/officerService';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'PASSED':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
    case 'WARNING':
      return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
    case 'FLAGGED':
      return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
    default:
      return <Info className="w-5 h-5 text-charcoal-400 shrink-0" />;
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
      {risk} Risk Level
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

const VerificationTab = ({ applicationId }) => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [data, setData] = useState(null);
  const [expandedCheck, setExpandedCheck] = useState(null);

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
  const isIncomplete = data.status === 'INCOMPLETE';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Top Executive Banner */}
      <div
        className={`p-6 rounded-xl border shadow-sm transition-all ${
          isConsistent
            ? 'bg-gradient-to-r from-emerald-50/90 to-emerald-100/50 border-emerald-300 text-emerald-950'
            : isReviewRequired
            ? 'bg-gradient-to-r from-rose-50/90 to-amber-50/60 border-rose-300 text-rose-950'
            : isStale
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-blue-50 border-blue-300 text-blue-950'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-white/70 border border-current">
                {isStale ? 'Status Outdated' : isConsistent ? 'Consistent' : isReviewRequired ? 'Review Required' : 'Incomplete'}
              </span>
              {data.riskLevel && <RiskBadge riskLevel={data.riskLevel} />}
              {data.recommendedAction && <ActionBadge action={data.recommendedAction} />}
            </div>
            <h2 className="text-xl font-bold text-charcoal-900 mt-2">
              {isConsistent
                ? '✅ Cross-Document Verification Consistent'
                : isReviewRequired
                ? '⚠️ Cross-Document Discrepancies Detected'
                : isStale
                ? '🔄 Document Updated — Verification Outdated'
                : 'ℹ️ Additional Documentation Required'}
            </h2>
            <p className="text-xs text-charcoal-600">
              Validated on {new Date(data.validatedAt || Date.now()).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunVerification}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-cream-50 text-charcoal-900 font-medium rounded-lg text-sm border border-cream-300 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-accent-600 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Analyzing...' : 'Re-Run Verification'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Groq AI Reasoning & Summary Card */}
      {data.summary && (
        <div className="bg-white border border-cream-300 rounded-xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ai-50 text-ai-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">AI Verification Reasoning</h3>
                <p className="text-xs text-charcoal-500">Cross-document synthesis & evidence interpretation</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ai-700 bg-ai-50 px-2.5 py-1 rounded-full border border-ai-200">
              <Sparkles className="w-3 h-3 text-ai-600" /> Groq LLaMA 3.3 Reasoning
            </span>
          </div>

          <p className="text-sm text-charcoal-800 leading-relaxed font-medium bg-cream-50/80 p-4 rounded-lg border border-cream-200">
            {data.summary}
          </p>

          {/* Key Findings List */}
          {data.findings && data.findings.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
                Key Verification Findings ({data.findings.length})
              </h4>
              <div className="grid gap-3 sm:grid-cols-1">
                {data.findings.map((finding, fIdx) => (
                  <div
                    key={fIdx}
                    className={`p-4 rounded-lg border transition-all ${
                      finding.severity === 'HIGH'
                        ? 'bg-rose-50/40 border-rose-200'
                        : finding.severity === 'MEDIUM'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-emerald-50/30 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            finding.severity === 'HIGH'
                              ? 'bg-rose-600'
                              : finding.severity === 'MEDIUM'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <h5 className="text-sm font-bold text-charcoal-900">{finding.title}</h5>
                      </div>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <p className="text-xs text-charcoal-700 leading-relaxed pl-4">{finding.explanation}</p>
                    {finding.documents && finding.documents.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2.5 pl-4 flex-wrap">
                        <span className="text-[10px] text-charcoal-400 font-medium">Involved:</span>
                        {finding.documents.map((docType, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-charcoal-700 border border-cream-300 shadow-2xs uppercase"
                          >
                            <FileText className="w-2.5 h-2.5 text-charcoal-400" />
                            {docType.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Deterministic Validation Checks Breakdown */}
      <div className="bg-white border border-cream-300 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cream-200">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900">Deterministic Mathematical & Rule Checks</h3>
            <p className="text-xs text-charcoal-500">Calculated comparisons across identity, employment, and income</p>
          </div>
          <span className="text-xs font-semibold text-charcoal-600 bg-cream-100 px-2.5 py-1 rounded-full">
            {data.checks?.length || 0} checks evaluated
          </span>
        </div>

        {(!data.checks || data.checks.length === 0) ? (
          <div className="text-center py-8 text-charcoal-400 text-sm">
            No deterministic checks have been evaluated yet.
          </div>
        ) : (
          <div className="space-y-3">
            {data.checks.map((check, idx) => {
              const isExpanded = expandedCheck === idx;
              const hasEvidence = check.evidence && Object.keys(check.evidence).length > 0;

              return (
                <div
                  key={idx}
                  className={`border rounded-lg transition-all overflow-hidden ${
                    check.status === 'FLAGGED'
                      ? 'border-rose-300 bg-rose-50/20'
                      : check.status === 'WARNING'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-cream-200 bg-white hover:border-cream-300'
                  }`}
                >
                  <div
                    className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                    onClick={() => setExpandedCheck(isExpanded ? null : idx)}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">
                        <StatusIcon status={check.status} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-charcoal-900 capitalize">
                            {check.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              check.status === 'FLAGGED'
                                ? 'bg-rose-100 text-rose-700'
                                : check.status === 'WARNING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-600 mt-1 leading-relaxed">{check.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {check.severity && <SeverityBadge severity={check.severity} />}
                      <div className="text-charcoal-400 hover:text-charcoal-700 p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Evidence Details */}
                  {isExpanded && (
                    <div className="bg-cream-50/90 border-t border-cream-200 p-4 text-xs">
                      <h5 className="font-bold text-charcoal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent-600" /> Underlying Data & Evidence
                      </h5>
                      {hasEvidence ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-2">
                          {Object.entries(check.evidence).map(([k, v]) => (
                            <div key={k} className="bg-white p-2.5 rounded-lg border border-cream-200 shadow-2xs">
                              <span className="text-[10px] font-semibold text-charcoal-400 uppercase block mb-0.5">
                                {k.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs font-bold text-charcoal-900 block truncate" title={String(v)}>
                                {v !== null && v !== undefined ? String(v) : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-charcoal-500 italic">No structured evidence fields recorded for this check.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Decision Boundary & Compliance Footer */}
      <div className="p-4 bg-cream-100/60 rounded-xl border border-cream-300 flex items-start gap-3 text-xs text-charcoal-600">
        <ShieldCheck className="w-4 h-4 text-charcoal-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Decision Boundary Notice:</strong> Cross-document verification provides objective AI analysis based solely on uploaded documentation and applicant declarations. The AI does not automatically approve or reject applications or make conclusive authenticity statements. The final underwriting and credit decision rests exclusively with the authorized loan officer.
        </p>
      </div>
    </div>
  );
};

export default VerificationTab;
