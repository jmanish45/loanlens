import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, Briefcase, Download, Clock,
  CheckCircle2, XCircle, MessageSquare, Activity as ActivityIcon,
  Send, AlertTriangle, Eye
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { officerService } from '../../services/officerService';
import { DOCUMENT_REQUIREMENTS } from '../../constants/mockData';

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const TAB_OPTIONS = [
  { key: 'overview', label: 'Overview', icon: Eye },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'notes', label: 'Notes & Activity', icon: MessageSquare },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'documents_pending', label: 'Documents Pending' },
  { value: 'documents_required', label: 'Documents Required' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function ApplicationDetails() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(false);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Activity state
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Document review modal
  const [reviewModal, setReviewModal] = useState(null); // { docId, action }
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const response = await officerService.getApplicationById(id);
        setApp(response.data);
      } catch (error) {
        console.error('Failed to fetch application', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'notes' && notes.length === 0 && !notesLoading) {
      fetchNotes();
      fetchActivity();
    }
  }, [activeTab]);

  const fetchNotes = async () => {
    try {
      setNotesLoading(true);
      const response = await officerService.getNotes(id);
      setNotes(response.data);
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setNotesLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await officerService.getActivity(id);
      setActivity(response.data);
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await officerService.updateApplicationStatus(id, newStatus);
      setApp(prev => ({ ...prev, ...response.data }));
      // Refresh activity if on that tab
      if (activeTab === 'notes') fetchActivity();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const response = await officerService.downloadDocument(docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert('Failed to download document');
    }
  };

  const handleDocumentReview = async (docId, status) => {
    if (status === 'rejected') {
      setReviewModal({ docId, action: 'rejected' });
      return;
    }
    try {
      setReviewSubmitting(true);
      const response = await officerService.reviewDocument(docId, status, null);
      // Update the document in local state
      setApp(prev => ({
        ...prev,
        documents: prev.documents.map(d => d._id === docId ? response.data : d),
      }));
      if (activeTab === 'notes') fetchActivity();
    } catch (error) {
      alert('Failed to review document: ' + error.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const submitRejectReview = async () => {
    if (!reviewComment.trim()) return;
    try {
      setReviewSubmitting(true);
      const response = await officerService.reviewDocument(reviewModal.docId, 'rejected', reviewComment.trim());
      setApp(prev => ({
        ...prev,
        documents: prev.documents.map(d => d._id === reviewModal.docId ? response.data : d),
      }));
      setReviewModal(null);
      setReviewComment('');
      if (activeTab === 'notes') fetchActivity();
    } catch (error) {
      alert('Failed to reject document: ' + error.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setAddingNote(true);
      const response = await officerService.addNote(id, noteText.trim());
      setNotes([response.data, ...notes]);
      setNoteText('');
      fetchActivity();
    } catch (error) {
      alert('Failed to add note: ' + error.message);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
        <div className="h-8 bg-cream-300 rounded w-1/3"></div>
        <div className="h-64 bg-cream-300 rounded-lg"></div>
      </div>
    );
  }

  if (!app) {
    return <div className="p-8 text-center text-charcoal-500">Application not found.</div>;
  }

  const requiredDocs = DOCUMENT_REQUIREMENTS[app.loanType] || [];
  const uploadedDocTypes = app.documents.map(d => d.documentType);
  const missingDocs = requiredDocs.filter(r => !uploadedDocTypes.includes(r.type));

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
      {/* Back Link */}
      <Link to="/officer/applications" className="inline-flex items-center text-sm font-medium text-charcoal-500 hover:text-charcoal-900 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Applications
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Application #{app._id.slice(-6)}</h1>
          <p className="text-sm text-charcoal-500 mt-1">
            {app.applicant?.name} • Created {formatShortDate(app.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={app.status} />
          <select
            disabled={updating}
            value={app.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-cream-300 rounded-lg py-2 px-3 bg-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-cream-300">
        <div className="flex gap-1">
          {TAB_OPTIONS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-charcoal-900 text-charcoal-900'
                    : 'border-transparent text-charcoal-500 hover:text-charcoal-700 hover:border-cream-400'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <OverviewTab app={app} formatAmount={formatAmount} formatDate={formatDate} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            app={app}
            requiredDocs={requiredDocs}
            missingDocs={missingDocs}
            onDownload={handleDownload}
            onReview={handleDocumentReview}
            reviewSubmitting={reviewSubmitting}
          />
        )}
        {activeTab === 'notes' && (
          <NotesActivityTab
            notes={notes}
            notesLoading={notesLoading}
            activity={activity}
            activityLoading={activityLoading}
            noteText={noteText}
            setNoteText={setNoteText}
            addingNote={addingNote}
            onAddNote={handleAddNote}
            formatDate={formatDate}
          />
        )}
      </div>

      {/* Reject Comment Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-error-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-charcoal-900">Reject Document</h3>
                <p className="text-xs text-charcoal-500">The applicant will see this reason.</p>
              </div>
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Explain why this document needs to be re-uploaded..."
              rows={4}
              className="w-full border border-cream-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" size="sm" onClick={() => { setReviewModal(null); setReviewComment(''); }}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={submitRejectReview}
                loading={reviewSubmitting}
                disabled={!reviewComment.trim()}
                className="bg-error-600 hover:bg-error-700"
              >
                Reject Document
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ===================== Overview Tab ===================== */
function OverviewTab({ app, formatAmount, formatDate }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-5 border-t-4 border-t-accent-500">
        <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-charcoal-400" /> Applicant Information
        </h3>
        <div className="space-y-4">
          <InfoRow label="Full Name" value={app.applicant?.name} />
          <InfoRow label="Email Address" value={app.applicant?.email} />
          <InfoRow label="Role" value={app.applicant?.role} capitalize />
        </div>
      </Card>

      <Card className="p-5 border-t-4 border-t-charcoal-300">
        <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2 mb-5">
          <Briefcase className="w-4 h-4 text-charcoal-400" /> Loan Details
        </h3>
        <div className="space-y-4">
          <InfoRow label="Loan Type" value={app.loanType} capitalize />
          <InfoRow label="Requested Amount" value={formatAmount(app.requestedAmount)} />
          <InfoRow label="Tenure" value={`${app.tenureMonths} months`} />
          <div className="border-t border-cream-200 pt-3">
            <InfoRow label="Employment Type" value={app.employmentType?.replace('-', ' ')} capitalize />
            <div className="mt-3">
              <InfoRow label="Declared Monthly Income" value={formatAmount(app.declaredMonthlyIncome)} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 md:col-span-2">
        <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-charcoal-400" /> Application Timeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoRow label="Created" value={formatDate(app.createdAt)} />
          <InfoRow label="Last Updated" value={formatDate(app.updatedAt)} />
          <InfoRow label="Documents" value={`${app.documents.length} uploaded`} />
          <InfoRow label="Current Status" value={<StatusBadge status={app.status} />} />
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-xs text-charcoal-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium text-charcoal-900 mt-0.5 ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

/* ===================== Documents Tab ===================== */
function DocumentsTab({ app, requiredDocs, missingDocs, onDownload, onReview, reviewSubmitting }) {
  return (
    <div className="space-y-6">
      {/* Uploaded Documents */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-charcoal-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-600" /> Uploaded Documents
          </h3>
          <span className="text-xs font-medium bg-cream-200 text-charcoal-600 px-2.5 py-1 rounded-full">
            {app.documents.length} files
          </span>
        </div>

        {app.documents.length > 0 ? (
          <div className="space-y-3">
            {app.documents.map((doc) => (
              <div key={doc._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-cream-50 border border-cream-300 rounded-lg hover:border-cream-400 transition-colors gap-3">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    doc.status === 'approved' ? 'bg-success-100 text-success-600' :
                    doc.status === 'rejected' ? 'bg-error-100 text-error-600' :
                    'bg-accent-100 text-accent-600'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal-900">{doc.originalName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-charcoal-500 capitalize">{doc.documentType.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-charcoal-300">•</span>
                      <span className="text-xs text-charcoal-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="text-xs text-charcoal-300">•</span>
                      <span className="text-xs text-charcoal-500">{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {doc.status === 'rejected' && doc.reviewComment && (
                      <p className="text-xs text-error-600 mt-1.5 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        {doc.reviewComment}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status indicator */}
                  {doc.status === 'approved' && (
                    <span className="text-xs font-medium text-success-600 bg-success-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  )}
                  {doc.status === 'rejected' && (
                    <span className="text-xs font-medium text-error-600 bg-error-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                  {doc.status === 'pending_review' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReview(doc._id, 'approved')}
                        disabled={reviewSubmitting}
                        className="text-success-600 hover:bg-success-50"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReview(doc._id, 'rejected')}
                        disabled={reviewSubmitting}
                        className="text-error-600 hover:bg-error-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onDownload(doc._id, doc.originalName)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-cream-50 rounded-lg border border-dashed border-cream-300">
            <Clock className="w-8 h-8 text-charcoal-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-charcoal-900">No documents uploaded yet</p>
          </div>
        )}
      </Card>

      {/* Missing Documents */}
      {missingDocs.length > 0 && (
        <Card className="p-6 border-l-4 border-l-warning-500">
          <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-warning-500" /> Missing Documents
          </h3>
          <div className="space-y-2">
            {missingDocs.map((doc) => (
              <div key={doc.type} className="flex items-center gap-3 p-3 bg-warning-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-warning-100 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal-900">{doc.label}</p>
                  <p className="text-xs text-charcoal-500">{doc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ===================== Notes & Activity Tab ===================== */
function NotesActivityTab({ notes, notesLoading, activity, activityLoading, noteText, setNoteText, addingNote, onAddNote, formatDate }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Notes Panel */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-charcoal-900 flex items-center gap-2 mb-5">
          <MessageSquare className="w-5 h-5 text-accent-600" /> Internal Notes
        </h3>

        <form onSubmit={onAddNote} className="mb-6">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add an internal note about this application..."
            rows={3}
            className="w-full border border-cream-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none mb-3"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={addingNote} disabled={!noteText.trim()}>
              <Send className="w-4 h-4 mr-1.5" /> Add Note
            </Button>
          </div>
        </form>

        {notesLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-cream-200 rounded-lg"></div>
            <div className="h-16 bg-cream-200 rounded-lg"></div>
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {notes.map((note) => (
              <div key={note._id} className="p-4 bg-cream-50 border border-cream-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-charcoal-700">{note.author?.name}</p>
                  <p className="text-xs text-charcoal-400">{formatDate(note.createdAt)}</p>
                </div>
                <p className="text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-charcoal-400 text-center py-6">No notes yet.</p>
        )}
      </Card>

      {/* Activity Timeline */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-charcoal-900 flex items-center gap-2 mb-5">
          <ActivityIcon className="w-5 h-5 text-accent-600" /> Activity Timeline
        </h3>

        {activityLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-cream-200 rounded-lg"></div>
            <div className="h-12 bg-cream-200 rounded-lg"></div>
            <div className="h-12 bg-cream-200 rounded-lg"></div>
          </div>
        ) : activity.length > 0 ? (
          <div className="relative max-h-[500px] overflow-y-auto pr-1">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-cream-300"></div>
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item._id} className="relative flex items-start gap-4 pl-8">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 ${
                    item.action.includes('Approved') ? 'bg-success-500' :
                    item.action.includes('Rejected') ? 'bg-error-500' :
                    item.action.includes('Status') ? 'bg-accent-500' :
                    item.action.includes('Note') ? 'bg-charcoal-400' :
                    'bg-cream-400'
                  }`}>
                    {item.action.includes('Approved') ? <CheckCircle2 className="w-3 h-3" /> :
                     item.action.includes('Rejected') ? <XCircle className="w-3 h-3" /> :
                     item.action.includes('Status') ? <Clock className="w-3 h-3" /> :
                     item.action.includes('Document') ? <FileText className="w-3 h-3" /> :
                     <ActivityIcon className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-900">{item.action}</p>
                    {item.details && (
                      <p className="text-xs text-charcoal-500 mt-0.5">
                        {item.details.from && item.details.to && (
                          <span>{item.details.from.replace(/_/g, ' ')} → {item.details.to.replace(/_/g, ' ')}</span>
                        )}
                        {item.details.documentType && (
                          <span className="capitalize">{item.details.documentType.replace(/_/g, ' ')}</span>
                        )}
                        {item.details.reviewComment && (
                          <span className="block text-error-500 mt-0.5">"{item.details.reviewComment}"</span>
                        )}
                        {item.details.preview && (
                          <span className="italic">"{item.details.preview}"</span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-charcoal-400 mt-1">
                      {item.actor?.name || 'System'} • {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-charcoal-400 text-center py-6">No activity recorded yet.</p>
        )}
      </Card>
    </div>
  );
}
