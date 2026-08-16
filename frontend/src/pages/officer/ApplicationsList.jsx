import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { officerService } from '../../services/officerService';
import { LOAN_TYPES } from '../../constants/mockData';

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApplicationsList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await officerService.getApplications();
        setApplications(response.data);
      } catch (error) {
        console.error('Failed to load applications', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const filteredApps = applications.filter((app) => {
    const matchesSearch = app.applicant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || app._id.includes(searchTerm);
    const matchesStatus = statusFilter ? app.status === statusFilter : true;
    const matchesType = typeFilter ? app.loanType === typeFilter : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 bg-cream-300 w-1/4 rounded"></div>
      <div className="h-96 bg-cream-300 rounded-lg"></div>
    </div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="All Applications"
        subtitle="Manage and process customer loan requests."
      />

      <Card>
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="documents_pending">Documents Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">All Types</option>
              {LOAN_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-cream-300/50">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-cream-100/50">
              <tr>
                <th className="px-4 py-3 font-medium text-charcoal-600">ID</th>
                <th className="px-4 py-3 font-medium text-charcoal-600">Applicant</th>
                <th className="px-4 py-3 font-medium text-charcoal-600">Type</th>
                <th className="px-4 py-3 font-medium text-charcoal-600">Amount</th>
                <th className="px-4 py-3 font-medium text-charcoal-600">Tenure</th>
                <th className="px-4 py-3 font-medium text-charcoal-600">Submitted</th>
                <th className="px-4 py-3 font-medium text-charcoal-600">Status</th>
                <th className="px-4 py-3 font-medium text-charcoal-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300/50">
              {filteredApps.length > 0 ? filteredApps.map((app) => (
                <tr key={app._id} className="hover:bg-cream-100/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-charcoal-500">{app._id.slice(-6)}</td>
                  <td className="px-4 py-3 text-charcoal-900 font-medium">{app.applicant?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-charcoal-600 capitalize">{app.loanType}</td>
                  <td className="px-4 py-3 text-charcoal-900">{formatAmount(app.requestedAmount)}</td>
                  <td className="px-4 py-3 text-charcoal-600">{app.tenureMonths} mo</td>
                  <td className="px-4 py-3 text-charcoal-500">{formatDate(app.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/officer/applications/${app._id}`} className="text-accent-600 hover:text-accent-700 font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-charcoal-400">
                    No applications match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
