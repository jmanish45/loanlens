import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ApplicantPortal from '../pages/ApplicantPortal';
import ApplyLoan from '../pages/ApplyLoan';
import AppLayout from '../layouts/AppLayout';
import OfficerLayout from '../layouts/OfficerLayout';
import RoleRoute from '../components/common/RoleRoute';
import OfficerDashboard from '../pages/officer/Dashboard';
import OfficerApplicationsList from '../pages/officer/ApplicationsList';
import OfficerApplicationDetails from '../pages/officer/ApplicationDetails';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Applicant routes */}
      <Route element={<RoleRoute allowedRoles={['applicant']} />}>
        <Route path="/applicant" element={<AppLayout />}>
          <Route index element={<ApplicantPortal />} />
          <Route path="apply" element={<ApplyLoan />} />
        </Route>
      </Route>

      {/* Officer routes */}
      <Route element={<RoleRoute allowedRoles={['officer', 'admin']} />}>
        <Route path="/officer" element={<OfficerLayout />}>
          <Route index element={<OfficerDashboard />} />
          <Route path="applications" element={<OfficerApplicationsList />} />
          <Route path="applications/:id" element={<OfficerApplicationDetails />} />
        </Route>
      </Route>
    </Routes>
  );
}
