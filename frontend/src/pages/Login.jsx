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
  Building,
  Brain,
  FileCheck2,
  PieChart,
  Shield,
  Smartphone,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Zap,
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
  const [activePortal, setActivePortal] = useState('applicant'); // 'applicant' | 'officer'
  const [selectedLang, setSelectedLang] = useState('English');

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
      email: 'rohit.sharma@example.com',
      password: 'Password123!',
    },
    validationRules,
    onSubmit: async (data) => {
      const authUser = await login(data.email, data.password);
      const destination = authUser.role === 'officer' ? '/officer' : ROUTES.APPLICANT;
      navigate(location.state?.from?.pathname || destination, { replace: true });
    },
  });

  const handleSwitchToOfficer = () => {
    setActivePortal('officer');
    setValues({
      email: 'officer@loanlens.ai',
      password: 'Password123!',
    });
  };

  const handleSwitchToApplicant = () => {
    setActivePortal('applicant');
    setValues({
      email: 'rohit.sharma@example.com',
      password: 'Password123!',
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-white">
      
      {/* ─────────────────────────────────────────────────────────────
          LEFT SIDE: Dark Navy Hero & Feature Showcase (Exact Structure)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[54%] bg-gradient-to-br from-navy-950 via-[#0A192F] to-[#0D2137] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Brand Logo */}
        <div className="relative z-10">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Aperture className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                LoanLens <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">AI</span>
              </span>
              <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-1 block">
                FOR CREDIT & UNDERWRITING INTELLIGENCE
              </span>
            </div>
          </Link>

          {/* Sub-tag */}
          <div className="mt-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-400 mb-3">
              AI-POWERED LOAN PLATFORM
            </p>

            {/* Prominent Large Headline in Glass Box */}
            <div className="inline-block p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black uppercase tracking-tight text-white leading-none">
                YOUR LOAN. YOUR FUTURE.
              </h1>
            </div>

            {/* Paragraph Description */}
            <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mt-6 max-w-lg">
              Every document you submit is verified with bank-grade AI accuracy. Join thousands securing faster loan approvals with real-time policy underwriting.
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400/90 mt-3">
              VERIFY · EVALUATE · APPROVE
            </p>
          </div>
        </div>

        {/* Middle: 3 Feature Cards in Vertical Stack (Matching Reference) */}
        <div className="relative z-10 my-8 space-y-3.5">
          {/* Card 1 */}
          <div className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm transition-all duration-200 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">Hybrid RAG Policy Assistant</h4>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                Ask loan officer questions grounded in 14 indexed bank policy clauses
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm transition-all duration-200 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">Cross-Document Verification</h4>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                Automated OCR cross-checks across PAN, Aadhaar, Payslips & Bank Statements
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm transition-all duration-200 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">FOIR & Debt-Burden Engine</h4>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                Instant debt capacity calculations, proposed EMI & max sanction limits
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Live Activity Ticker & Micro-Trust Badges */}
        <div className="relative z-10 pt-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Live Verifications</span>
          </div>

          {/* Scrolling / Live Ticker Items */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Personal Loan · <strong className="text-slate-200 font-semibold">HDFC Bank</strong> · <span className="text-emerald-400">Approved ₹15L</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Home Loan · <strong className="text-slate-200 font-semibold">SBI</strong> · <span className="text-amber-400">In Review (FOIR 42%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Vehicle Loan · <strong className="text-slate-200 font-semibold">ICICI</strong> · <span className="text-cyan-400">Verified in 2m</span>
            </span>
          </div>

          {/* Footer Security Badges */}
          <div className="flex items-center gap-5 mt-4 pt-3 border-t border-slate-800/40 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure 256-Bit SSL
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Zero Data Selling
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Instant Policy RAG
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT SIDE: Crisp White Sign-In Form (Exact Layout Structure)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[46%] bg-white p-8 lg:p-14 flex flex-col justify-between">
        
        {/* Top Header / Language Picker */}
        <div className="flex justify-end items-center">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>{selectedLang}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Main Sign In Box */}
        <div className="max-w-md w-full mx-auto my-auto py-6">
          
          {/* Top Blue Device / Key Icon */}
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-2xs">
            <Smartphone className="w-6 h-6" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">
            {activePortal === 'officer'
              ? 'Enter your bank credentials to access the loan underwriting workspace.'
              : 'Enter your email & password to access your loan application.'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* Email / Mobile Input (with Prefix Tag matching reference) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                EMAIL ADDRESS / USERNAME
              </label>
              
              <div className="flex rounded-xl border border-slate-300 focus-within:border-indigo-600 focus-within:ring-3 focus-within:ring-indigo-500/10 transition-all overflow-hidden shadow-2xs">
                <div className="bg-slate-50 px-3.5 py-3 border-r border-slate-200 flex items-center gap-1 text-xs font-bold text-slate-600 shrink-0">
                  <span>IN</span>
                  <span className="text-slate-400 font-normal">@</span>
                </div>
                <input
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-3.5 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none bg-white"
                />
              </div>

              {touched.email && errors.email && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  PASSWORD
                </label>
                <span className="text-xs text-slate-400 font-medium">Default: Password123!</span>
              </div>
              
              <div className="relative rounded-xl border border-slate-300 focus-within:border-indigo-600 focus-within:ring-3 focus-within:ring-indigo-500/10 transition-all overflow-hidden shadow-2xs">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full px-3.5 py-3 pr-10 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {touched.password && errors.password && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-fade-in flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {submitError}
              </div>
            )}

            {/* Continue Button (Gradient Pill matching reference) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white
                bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700
                shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200
                flex items-center justify-center gap-2 cursor-pointer
                ${isSubmitting ? 'opacity-80 cursor-not-allowed' : 'active:scale-[0.99]'}
              `}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Terms Agreement Note (Matching Reference) */}
          <p className="text-center text-xs text-slate-400 mt-5">
            By continuing you agree to our{' '}
            <a href="#terms" className="text-indigo-600 hover:underline font-semibold">Terms of Service</a>
            {' '}and{' '}
            <a href="#privacy" className="text-indigo-600 hover:underline font-semibold">Privacy Policy</a>
          </p>

          {/* ─────────────────────────────────────────────────────────────
              Divider / Official Portal Access Button (Matching Reference)
              ───────────────────────────────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            {activePortal === 'applicant' ? (
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-3 font-medium">
                  Are you a bank loan officer?
                </p>
                <button
                  type="button"
                  onClick={handleSwitchToOfficer}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-2xs group"
                >
                  <Shield className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  Access Loan Officer Portal
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-3 font-medium">
                  Are you a loan applicant?
                </p>
                <button
                  type="button"
                  onClick={handleSwitchToApplicant}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-2xs group"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  Access Applicant Portal
                </button>
              </div>
            )}
          </div>

          {/* Quick Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors ml-1"
              >
                Apply as a New Customer
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Spacer / Subtle Copyright */}
        <div className="text-center text-[11px] text-slate-400 py-2">
          LoanLens AI Underwriting Engine © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
