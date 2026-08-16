import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../services/applicationService';
import { ROUTES } from '../constants/routes';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ApplicantPortal() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Document replacement state
  const [replacingDocId, setReplacingDocId] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationService.getApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceDocument = async (applicationId, docType) => {
    if (!replaceFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', replaceFile);
      formData.append('documentType', docType);

      await applicationService.uploadDocument(applicationId, formData);

      // Refresh applications to reflect the new upload
      await fetchApplications();
      setReplacingDocId(null);
      setReplaceFile(null);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const currentApplication = applications[0];
  const hasApplication = !!currentApplication;

  // Find rejected documents
  const rejectedDocs = hasApplication
    ? (currentApplication.documents || []).filter(d => d.status === 'rejected')
    : [];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl mt-8">
        <div className="h-8 bg-cream-300 rounded w-1/3"></div>
        <div className="h-32 bg-cream-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name ? user.name.split(' ')[0] : 'User'}`}
        subtitle="Track your loan application and next steps."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Application */}
          {hasApplication ? (
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-charcoal-400 uppercase tracking-wider">
                    Current Application
                  </p>
                  <p className="text-sm font-mono font-semibold text-charcoal-900 mt-1 truncate max-w-[200px] sm:max-w-none">
                    {currentApplication._id}
                  </p>
                </div>
                <StatusBadge status={currentApplication.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-cream-300/60">
                <div>
                  <p className="text-xs text-charcoal-400">Loan Type</p>
                  <p className="text-sm font-medium text-charcoal-900 capitalize mt-0.5">
                    {currentApplication.loanType} Loan
                  </p>
                </div>
                <div>
                  <p className="text-xs text-charcoal-400">Amount</p>
                  <p className="text-sm font-medium text-charcoal-900 mt-0.5">
                    {formatAmount(currentApplication.requestedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-charcoal-400">Created</p>
                  <p className="text-sm font-medium text-charcoal-900 mt-0.5">
                    {formatDate(currentApplication.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-charcoal-500">
                  Your application is in <strong className="capitalize">{currentApplication.status.replace(/_/g, ' ')}</strong> status.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <FileText className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-charcoal-900">No applications yet</h3>
              <p className="text-sm text-charcoal-500 mt-1 mb-5">
                Start your first loan application to get started.
              </p>
              <Link to={ROUTES.APPLY}>
                <Button>
                  Start Application
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          )}

          {/* Action Required: Rejected Documents */}
          {rejectedDocs.length > 0 && (
            <Card className="border-l-4 border-l-error-500">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-error-500" />
                <h3 className="text-base font-semibold text-charcoal-900">Action Required</h3>
              </div>
              <p className="text-sm text-charcoal-500 mb-5">
                The following documents were flagged by our review team. Please upload corrected versions.
              </p>

              <div className="space-y-4">
                {rejectedDocs.map((doc) => (
                  <div key={doc._id} className="p-4 bg-error-50/50 border border-error-200 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-error-100 flex items-center justify-center shrink-0 mt-0.5">
                          <XCircle className="w-5 h-5 text-error-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900 capitalize">
                            {doc.documentType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-charcoal-500 mt-0.5">{doc.originalName}</p>
                          {doc.reviewComment && (
                            <p className="text-sm text-error-700 mt-2 bg-error-100 p-2 rounded-md">
                              <strong>Reason:</strong> {doc.reviewComment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replacement Upload */}
                    <div className="mt-4 pt-3 border-t border-error-200">
                      {replacingDocId === doc._id ? (
                        <div className="space-y-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,image/jpeg,image/png"
                            onChange={(e) => setReplaceFile(e.target.files[0])}
                            className="block w-full text-sm text-charcoal-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-100 file:text-accent-600 hover:file:bg-accent-200 cursor-pointer"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              loading={uploading}
                              disabled={!replaceFile}
                              onClick={() => handleReplaceDocument(currentApplication._id, doc.documentType)}
                            >
                              <Upload className="w-4 h-4 mr-1" /> Upload Replacement
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setReplacingDocId(null); setReplaceFile(null); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReplacingDocId(doc._id)}
                        >
                          <Upload className="w-4 h-4 mr-1" /> Replace Document
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Document Summary */}
          {hasApplication && currentApplication.documents && currentApplication.documents.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-charcoal-400" />
                <h3 className="text-sm font-semibold text-charcoal-900">Your Documents</h3>
              </div>
              <div className="space-y-2">
                {currentApplication.documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        doc.status === 'approved' ? 'bg-success-600' :
                        doc.status === 'rejected' ? 'bg-error-600' :
                        'bg-accent-500'
                      }`} />
                      <div>
                        <p className="text-sm text-charcoal-800 capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      doc.status === 'approved' ? 'bg-success-50 text-success-600' :
                      doc.status === 'rejected' ? 'bg-error-50 text-error-600' :
                      'bg-cream-200 text-charcoal-600'
                    }`}>
                      {doc.status === 'pending_review' ? 'Pending Review' : doc.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Action */}
          {hasApplication && (
            <Card className={`border-l-4 ${
              currentApplication.status === 'documents_required' ? 'border-l-error-500' :
              currentApplication.status === 'approved' ? 'border-l-success-500' :
              'border-l-accent-500'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-accent-600" />
                <h3 className="text-sm font-semibold text-charcoal-900">Status Update</h3>
              </div>
              <p className="text-sm text-charcoal-500 leading-relaxed">
                {currentApplication.status === 'draft' && 'Your application is saved as a draft. Complete and submit it to proceed.'}
                {currentApplication.status === 'submitted' && 'Your application has been submitted. A loan officer will review it shortly.'}
                {currentApplication.status === 'documents_pending' && 'Your documents have been received and are awaiting review.'}
                {currentApplication.status === 'documents_required' && 'Some documents need your attention. Please check the Action Required section.'}
                {currentApplication.status === 'under_review' && 'Your application is currently under review by our team.'}
                {currentApplication.status === 'approved' && '🎉 Congratulations! Your loan application has been approved.'}
                {currentApplication.status === 'rejected' && 'Unfortunately, your application was not approved at this time.'}
              </p>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h3 className="text-sm font-semibold text-charcoal-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to={ROUTES.APPLY}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-cream-100 hover:bg-cream-200 transition-colors text-left cursor-pointer"
                >
                  <span className="text-sm text-charcoal-700">New Application</span>
                  <ArrowRight className="w-4 h-4 text-charcoal-400" />
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
