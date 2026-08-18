import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Aperture,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Brain,
  Building,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validation';
import { ROUTES } from '../constants/routes';

const validationRules = {
  email: [
    (v) => validators.required(v, 'Email address'),
    validators.email,
  ],
  password: [
    (v) => validators.required(v, 'Password'),
  ],
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('officer'); // 'officer' | 'applicant'

  const {
    values,
    setValues,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      email: 'officer@loanlens.ai',
      password: 'Password123!',
    },
    validationRules,
    onSubmit: async (data) => {
      const authUser = await login(data.email, data.password);
      const destination = authUser.role === 'officer' ? '/officer' : ROUTES.APPLICANT;
      navigate(location.state?.from?.pathname || destination, { replace: true });
    },
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'officer') {
      setValues({
        email: 'officer@loanlens.ai',
        password: 'Password123!',
      });
    } else {
      setValues({
        email: 'rohit.sharma@example.com',
        password: 'Password123!',
      });
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Brand */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
          <span className="w-10 h-10 rounded-xl bg-emerald-500 grid place-items-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Aperture className="w-5 h-5 text-navy-900" />
          </span>
          <div>
            <span className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
              LoanLens <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AI</span>
            </span>
            <span className="text-[11px] text-slate-400 block -mt-0.5">Credit Intelligence & Underwriting</span>
          </div>
        </Link>

        <Link
          to={ROUTES.HOME}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900"
        >
          ← Back to Overview
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-center">
        <div className="w-full grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Brand & Feature Showcase (Matches Post-Login System) */}
          <div className="lg:col-span-7 space-y-8 hidden md:block">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-emerald-400 shadow-xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Next-Gen Hybrid RAG Underwriting Platform
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Intelligent loan verification, <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  grounded in real bank policies.
                </span>
              </h1>
              <p className="text-slate-400 text-base max-w-xl leading-relaxed">
                Empowering loan officers and applicants with real-time OCR document intelligence, automated cross-validation, and instant policy-grounded RAG reasoning.
              </p>
            </div>

            {/* Feature Highlights (Consistent with App Functionality) */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Hybrid RAG Assistant</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time vector search across 14 bank policy clauses and rule sets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Fraud & KYC Shield</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deterministic cross-document validation across PAN, Aadhaar & payslips.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Multi-Bank Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Personal, Home, Business, LAP & Education loans for top Indian lenders.
                </p>
              </div>
            </div>

            {/* Live System Status Pill */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-navy-950 flex items-center justify-center text-[10px] font-bold text-white">HDFC</div>
                <div className="w-7 h-7 rounded-full bg-sky-600 border-2 border-navy-950 flex items-center justify-center text-[10px] font-bold text-white">SBI</div>
                <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-navy-950 flex items-center justify-center text-[10px] font-bold text-white">ICICI</div>
                <div className="w-7 h-7 rounded-full bg-rose-600 border-2 border-navy-950 flex items-center justify-center text-[10px] font-bold text-white">AXIS</div>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Integrated with 6 major banking partners & Groq LPU engine.
              </span>
            </div>
          </div>

          {/* Right Column: High-End Glassmorphic Sign In Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              
              {/* Card Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Sign In to Workspace
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Access your underwriting dashboard or applicant status
                </p>
              </div>

              {/* Role Selection Switcher (Quick-fill pre-configured accounts) */}
              <div className="mb-6">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Role & Test Account
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('officer')}
                    className={`
                      flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200
                      ${selectedRole === 'officer'
                        ? 'bg-emerald-500 text-navy-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Loan Officer
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('applicant')}
                    className={`
                      flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200
                      ${selectedRole === 'applicant'
                        ? 'bg-emerald-500 text-navy-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Applicant
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="you@loanlens.ai"
                      autoComplete="email"
                      className={`
                        w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border rounded-xl text-sm text-white placeholder-slate-500
                        focus:outline-none focus:ring-2 transition-all duration-200
                        ${touched.email && errors.email
                          ? 'border-red-500 focus:ring-red-500/30'
                          : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                        }
                      `}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-500">Default: Password123!</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className={`
                        w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border rounded-xl text-sm text-white placeholder-slate-500
                        focus:outline-none focus:ring-2 transition-all duration-200
                        ${touched.password && errors.password
                          ? 'border-red-500 focus:ring-red-500/30'
                          : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                        }
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.password}</p>
                  )}
                </div>

                {/* Error Banner */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-fade-in flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {submitError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`
                    w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-navy-950 bg-emerald-500 hover:bg-emerald-400
                    shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200
                    flex items-center justify-center gap-2 cursor-pointer
                    ${isSubmitting ? 'opacity-80 cursor-not-allowed' : 'active:scale-[0.99]'}
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In as {selectedRole === 'officer' ? 'Loan Officer' : 'Applicant'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Registration Link */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                <p className="text-xs text-slate-400">
                  New to LoanLens?{' '}
                  <Link
                    to={ROUTES.REGISTER}
                    className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                  >
                    Create Applicant Account
                  </Link>
                </p>
              </div>

              {/* Security Tag */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit SSL Encrypted • ISO 27001 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800/50">
        LoanLens AI Underwriting Platform © {new Date().getFullYear()}. All bank policies strictly grounded via Vector RAG.
      </footer>
    </div>
  );
}
