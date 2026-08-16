import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { officerService } from '../../services/officerService';

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await officerService.getDashboardStats();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-cream-300 w-1/4 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-28 bg-cream-300 rounded-lg"></div>
          <div className="h-28 bg-cream-300 rounded-lg"></div>
          <div className="h-28 bg-cream-300 rounded-lg"></div>
          <div className="h-28 bg-cream-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Applications', value: data.stats.total, icon: FileText, color: 'text-charcoal-700' },
    { label: 'Under Review', value: data.stats.underReview, icon: Clock, color: 'text-accent-600' },
    { label: 'Pending Docs', value: data.stats.pendingDocs, icon: Users, color: 'text-warning-600' },
    { label: 'Completed', value: data.stats.completed, icon: CheckCircle2, color: 'text-success-600' },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Officer Dashboard"
        subtitle="Overview of all loan applications and current queue."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <p className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-charcoal-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Applications */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-charcoal-900">Recent Applications</h3>
          <Link to="/officer/applications" className="text-sm font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-cream-300">
                <th className="pb-3 font-medium text-charcoal-500">Applicant</th>
                <th className="pb-3 font-medium text-charcoal-500">Loan Type</th>
                <th className="pb-3 font-medium text-charcoal-500">Amount</th>
                <th className="pb-3 font-medium text-charcoal-500">Date</th>
                <th className="pb-3 font-medium text-charcoal-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300/50">
              {data.recent.length > 0 ? data.recent.map((app) => (
                <tr key={app._id} className="hover:bg-cream-100/50 transition-colors">
                  <td className="py-3 text-charcoal-900 font-medium">
                    <Link to={`/officer/applications/${app._id}`} className="hover:underline">
                      {app.applicant?.name || 'Unknown'}
                    </Link>
                  </td>
                  <td className="py-3 text-charcoal-600 capitalize">{app.loanType}</td>
                  <td className="py-3 text-charcoal-900">{formatAmount(app.requestedAmount)}</td>
                  <td className="py-3 text-charcoal-500">{formatDate(app.createdAt)}</td>
                  <td className="py-3 text-right">
                    <StatusBadge status={app.status} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-charcoal-400">No applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
