import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { officerService } from '../../services/officerService';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'PASSED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'WARNING': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'FLAGGED': return <XCircle className="w-5 h-5 text-red-500" />;
    default: return <Info className="w-5 h-5 text-charcoal-400" />;
  }
};

const VerificationTab = ({ applicationId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedCheck, setExpandedCheck] = useState(null);

  useEffect(() => {
    fetchValidation();
  }, [applicationId]);

  const fetchValidation = async () => {
    try {
      setLoading(true);
      const res = await officerService.getApplicationValidation(applicationId);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-cream-300 rounded-lg"></div>
        <div className="h-32 bg-cream-300 rounded-lg"></div>
      </div>
    );
  }

  if (!data || data.status === 'PENDING_DOCS') {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-cream-300 text-center text-charcoal-500">
        <Info className="w-10 h-10 mx-auto text-cream-500 mb-3" />
        <h3 className="text-lg font-medium text-charcoal-900">Validation Pending</h3>
        <p>Upload more documents or wait for AI processing to complete to run verification.</p>
        <button onClick={fetchValidation} className="mt-4 px-4 py-2 bg-charcoal-100 rounded text-sm hover:bg-charcoal-200">
          Refresh
        </button>
      </div>
    );
  }

  if (data.status === 'STALE') {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-yellow-300 text-center text-charcoal-500">
        <AlertTriangle className="w-10 h-10 mx-auto text-yellow-500 mb-3" />
        <h3 className="text-lg font-medium text-charcoal-900">Validation Outdated</h3>
        <p>A document was replaced or reprocessed. Waiting for all documents to finish processing before re-running validation.</p>
        <button onClick={fetchValidation} className="mt-4 px-4 py-2 bg-yellow-100 rounded text-sm hover:bg-yellow-200">
          Refresh
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REVIEW_REQUIRED': return 'bg-red-100 text-red-800 border-red-200';
      case 'STALE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-charcoal-100 text-charcoal-800 border-charcoal-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className={`p-4 rounded-lg border flex items-center justify-between ${getStatusColor(data.status)}`}>
        <div>
          <h2 className="text-lg font-bold">
            {data.status === 'VERIFIED' ? 'AI Verification Passed' : 'Verification Review Required'}
          </h2>
          <p className="text-sm opacity-90">
            Last checked: {new Date(data.validatedAt).toLocaleString()}
          </p>
        </div>
        <button onClick={fetchValidation} className="text-sm px-3 py-1 bg-white/50 hover:bg-white/80 rounded transition">
          Refresh
        </button>
      </div>

      {/* Checks List */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-charcoal-900">Cross-Document Checks</h3>
        
        {data.checks?.length === 0 && (
          <div className="text-charcoal-500">No cross-checks could be performed yet.</div>
        )}

        {data.checks?.map((check, idx) => {
          const isExpanded = expandedCheck === idx;
          const isWarningOrFlagged = check.status === 'WARNING' || check.status === 'FLAGGED';
          
          return (
            <div key={idx} className="bg-white border border-cream-300 rounded-lg overflow-hidden shadow-sm">
              <div 
                className="p-4 flex items-start gap-4 cursor-pointer hover:bg-cream-50 transition"
                onClick={() => setExpandedCheck(isExpanded ? null : idx)}
              >
                <div className="mt-1">
                  <StatusIcon status={check.status} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-charcoal-900 capitalize">
                      {check.type.replace('_', ' ')}
                    </h4>
                    {isWarningOrFlagged && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${check.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {check.severity} SEVERITY
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal-600 mt-1">{check.message}</p>
                </div>
                <div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-charcoal-400" /> : <ChevronDown className="w-5 h-5 text-charcoal-400" />}
                </div>
              </div>
              
              {/* Evidence Section */}
              {isExpanded && (
                <div className="bg-cream-100 p-4 border-t border-cream-300 text-sm">
                  <h5 className="font-semibold text-charcoal-900 mb-2">Evidence / Extracted Values:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(check.evidence).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 rounded shadow-sm border border-cream-200">
                        <div className="text-xs text-charcoal-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</div>
                        <div className="font-medium text-charcoal-900">{value !== null && value !== undefined ? String(value) : 'Not found'}</div>
                      </div>
                    ))}
                    {Object.keys(check.evidence).length === 0 && (
                      <div className="text-charcoal-500 italic">No direct evidence mapped.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerificationTab;
