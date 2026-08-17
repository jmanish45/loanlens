import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Upload,
  FileText as FileIcon,
  Loader2,
  ShieldCheck,
  HelpCircle,
  FileCheck,
  X,
  Building,
  Landmark,
  Check,
  Sparkles,
  Percent,
  Calendar,
  Briefcase,
  User,
  Home,
  GraduationCap,
  Car,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validation';
import { applicationService } from '../services/applicationService';
import { LOAN_TYPES, EMPLOYMENT_TYPES, DOCUMENT_REQUIREMENTS } from '../constants/mockData';
import { AVAILABLE_BANKS, LOAN_TYPE_DETAILS } from '../constants/banks';
import { ROUTES } from '../constants/routes';

const APPLICATION_STEPS = [
  { step: 1, label: 'Bank & Loan Details' },
  { step: 2, label: 'Upload Documents' },
  { step: 3, label: 'Verification' },
  { step: 4, label: 'Review' },
];

const LOAN_ICONS = {
  personal: User,
  home: Home,
  business: Briefcase,
  lap: Building,
  education: GraduationCap,
  vehicle: Car,
  auto: Car,
};

const BANK_SELECT_OPTIONS = AVAILABLE_BANKS.map((b) => ({
  value: b.id,
  label: `${b.name} (${b.tagline})`,
}));

const LOAN_SELECT_OPTIONS = LOAN_TYPE_DETAILS.map((lt) => ({
  value: lt.value,
  label: `${lt.label} (${lt.rateRange})`,
}));

const validationRules = {
  bankId: [(v) => validators.required(v, 'Bank')],
  loanType: [validators.select('loan type')],
  requestedAmount: [
    (v) => validators.required(v, 'Loan amount'),
    validators.numericRange(10000, 100000000, 'Loan amount'),
  ],
  tenureMonths: [
    (v) => validators.required(v, 'Tenure'),
    validators.numericRange(6, 360, 'Tenure'),
  ],
  employmentType: [validators.select('employment type')],
  declaredMonthlyIncome: [
    (v) => validators.required(v, 'Monthly income'),
    validators.numericRange(1000, 100000000, 'Monthly income'),
  ],
};

export default function ApplyLoan() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState(null);
  
  // Step 2 State
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [file, setFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadSuccessState, setUploadSuccessState] = useState(false);

  // Step 3 State
  const [verifying, setVerifying] = useState(false);

  // Step 4 State
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      bankId: 'hdfc',
      bankName: 'HDFC Bank',
      loanType: 'personal',
      requestedAmount: '',
      tenureMonths: '',
      employmentType: '',
      declaredMonthlyIncome: '',
    },
    validationRules,
    onSubmit: async (data) => {
      const selectedBankObj = AVAILABLE_BANKS.find((b) => b.id === data.bankId) || AVAILABLE_BANKS[0];
      const payload = {
        bankId: selectedBankObj.id,
        bankName: selectedBankObj.name,
        loanType: data.loanType,
        requestedAmount: Number(data.requestedAmount),
        tenureMonths: Number(data.tenureMonths),
        employmentType: data.employmentType,
        declaredMonthlyIncome: Number(data.declaredMonthlyIncome),
      };
      const response = await applicationService.create(payload);
      setApplicationId(response.data._id);
      setCurrentStep(2);
    },
  });

  const handleBankSelect = (bankId) => {
    const selectedBankObj = AVAILABLE_BANKS.find((b) => b.id === bankId) || AVAILABLE_BANKS[0];
    form.setFieldValue('bankId', selectedBankObj.id);
    form.setFieldValue('bankName', selectedBankObj.name);
  };

  const handleLoanTypeSelect = (loanVal) => {
    form.setFieldValue('loanType', loanVal);
  };

  const requiredDocs = form.values.loanType ? (DOCUMENT_REQUIREMENTS[form.values.loanType] || DOCUMENT_REQUIREMENTS.personal) : [];
  const allDocsUploaded = currentDocIndex >= requiredDocs.length;
  const currentDocType = !allDocsUploaded ? requiredDocs[currentDocIndex] : null;

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !currentDocType) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', currentDocType.type);
      if ((currentDocType.type === 'pan' || currentDocType.type === 'aadhaar') && manualText.trim()) {
        formData.append('manualText', manualText.trim());
      }

      const response = await applicationService.uploadDocument(applicationId, formData);
      setUploadedDocs([...uploadedDocs, response.data]);
      
      setUploadSuccessState(true);
      
      setTimeout(() => {
        setUploadSuccessState(false);
        setFile(null);
        setManualText('');
        setCurrentDocIndex((prev) => prev + 1);
      }, 1500);

    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVerification = () => {
    setCurrentStep(3);
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setCurrentStep(4);
    }, 2000);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      await applicationService.submit(applicationId);
      setSuccess(true);
    } catch (error) {
      console.error('Submit failed', error);
      alert('Submission failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-success-600" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900 mb-2">Application Submitted!</h2>
        <p className="text-charcoal-600 mb-2 leading-relaxed">
          Your loan application with <strong className="text-charcoal-900">{form.values.bankName}</strong> for a <strong className="text-charcoal-900">{form.values.loanType.toUpperCase()} Loan</strong> has been submitted successfully.
        </p>
        <p className="text-xs text-charcoal-500 mb-8">
          Our AI Document Intelligence system and loan officers will review your application shortly.
        </p>
        <div className="flex justify-center gap-4">
          <Link to={ROUTES.APPLICANT_PORTAL}>
            <Button size="lg">Go to Applicant Portal</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedBank = AVAILABLE_BANKS.find((b) => b.id === form.values.bankId) || AVAILABLE_BANKS[0];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <PageHeader
        title="Apply for a Loan"
        description="Select your preferred lending partner, choose your loan type, and submit your details."
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-cream-300 w-full z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-accent-600 transition-all duration-300 z-0" 
            style={{ width: `${((currentStep - 1) / (APPLICATION_STEPS.length - 1)) * 100}%` }}
          />

          {APPLICATION_STEPS.map((s) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <div key={s.step} className="flex flex-col items-center relative z-10">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300
                    ${isCompleted ? 'bg-accent-600 text-white shadow-sm' : ''}
                    ${isCurrent ? 'bg-white border-2 border-accent-600 text-accent-600 shadow-md ring-4 ring-accent-50' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-white border-2 border-cream-300 text-charcoal-400' : ''}
                  `}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.step}
                </div>
                <span className={`text-xs mt-2 font-medium hidden sm:block ${isCurrent ? 'text-charcoal-900 font-bold' : 'text-charcoal-500'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Bank & Loan Details */}
      {currentStep === 1 && (
        <Card className="animate-slide-up shadow-soft">
          <form onSubmit={form.handleSubmit} noValidate className="space-y-8">
            {/* ── 1. Select Lending Partner Bank ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-accent-600" />
                  <label className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                    1. Select Lending Partner Bank <span className="text-error-500">*</span>
                  </label>
                </div>
                <span className="text-xs text-charcoal-500">Click any bank card or use dropdown</span>
              </div>

              {/* Quick Select Dropdown for accessibility */}
              <div className="mb-3.5">
                <select
                  value={form.values.bankId}
                  onChange={(e) => handleBankSelect(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-cream-50/80 border border-cream-300 rounded-lg text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  {AVAILABLE_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.tagline} (From {b.minRate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bank Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {AVAILABLE_BANKS.map((bank) => {
                  const isSelected = form.values.bankId === bank.id;
                  return (
                    <button
                      type="button"
                      key={bank.id}
                      onClick={() => handleBankSelect(bank.id)}
                      className={`
                        text-left w-full relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between
                        ${isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20 transform scale-[1.01]'
                          : 'border-cream-300 hover:border-indigo-300 bg-white hover:bg-cream-50/60 shadow-xs'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 w-full">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${bank.color} text-white text-xs font-black flex items-center justify-center shadow-xs shrink-0`}>
                            {bank.initials}
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold leading-snug ${isSelected ? 'text-indigo-950 font-black' : 'text-charcoal-900'}`}>{bank.name}</h4>
                            <span className="text-[11px] text-charcoal-500 block">{bank.tagline}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-scale-in">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-cream-200 mt-2 w-full">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-200 text-charcoal-700">
                          {bank.tag}
                        </span>
                        <span className="text-xs font-extrabold text-indigo-700">
                          From {bank.minRate}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 2. Select Loan Type ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-accent-600" />
                  <label className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                    2. Select Loan Type <span className="text-error-500">*</span>
                  </label>
                </div>
                <span className="text-xs text-charcoal-500">Choose your loan category</span>
              </div>

              {/* Quick Select Dropdown for Loan Type */}
              <div className="mb-3.5">
                <select
                  value={form.values.loanType}
                  onChange={(e) => handleLoanTypeSelect(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-cream-50/80 border border-cream-300 rounded-lg text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  {LOAN_TYPE_DETAILS.map((lt) => (
                    <option key={lt.value} value={lt.value}>
                      {lt.label} — {lt.rateRange} ({lt.tenure})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Type Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {LOAN_TYPE_DETAILS.map((lt) => {
                  const isSelected = form.values.loanType === lt.value;
                  const IconComponent = LOAN_ICONS[lt.value] || User;

                  return (
                    <button
                      type="button"
                      key={lt.value}
                      onClick={() => handleLoanTypeSelect(lt.value)}
                      className={`
                        text-left w-full relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between
                        ${isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20 transform scale-[1.01]'
                          : 'border-cream-300 hover:border-indigo-300 bg-white hover:bg-cream-50/60 shadow-xs'
                        }
                      `}
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between gap-2 mb-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-cream-200 text-charcoal-700'}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-950 font-black' : 'text-charcoal-900'}`}>{lt.label}</h4>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-scale-in">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-charcoal-500 leading-relaxed line-clamp-2 mt-1">
                          {lt.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-cream-200 mt-3 text-[11px] w-full">
                        <span className="text-charcoal-500">{lt.tenure}</span>
                        <span className="font-bold text-indigo-700">{lt.rateRange}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.touched.loanType && form.errors.loanType && (
                <p className="text-xs text-error-600 mt-1.5">{form.errors.loanType}</p>
              )}
            </div>

            {/* ── 3. Loan Terms & Income Details ── */}
            <div className="border-t border-cream-200 pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-accent-600" />
                <h4 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                  3. Amount, Tenure & Financials
                </h4>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Requested Loan Amount"
                  name="requestedAmount"
                  type="number"
                  value={form.values.requestedAmount}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.requestedAmount ? form.errors.requestedAmount : null}
                  placeholder="e.g. 1500000"
                  helperText="Amount in INR"
                  required
                  min="10000"
                />
                <Input
                  label="Preferred Tenure (Months)"
                  name="tenureMonths"
                  type="number"
                  value={form.values.tenureMonths}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.tenureMonths ? form.errors.tenureMonths : null}
                  placeholder="e.g. 36"
                  helperText="Duration in months (6 – 360)"
                  required
                  min="6"
                  max="360"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Select
                  label="Employment Type"
                  name="employmentType"
                  value={form.values.employmentType}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  options={EMPLOYMENT_TYPES}
                  error={form.touched.employmentType ? form.errors.employmentType : null}
                  placeholder="Select employment type"
                  required
                />
                <Input
                  label="Approximate Monthly Net Income"
                  name="declaredMonthlyIncome"
                  type="number"
                  value={form.values.declaredMonthlyIncome}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.declaredMonthlyIncome ? form.errors.declaredMonthlyIncome : null}
                  placeholder="e.g. 75000"
                  helperText="Monthly take-home income in INR"
                  required
                  min="1000"
                />
              </div>
            </div>

            {form.submitError && (
              <div className="p-3 rounded-lg bg-error-100 text-error-600 text-sm" role="alert">
                {form.submitError}
              </div>
            )}

            {/* Selected Summary Bar */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${selectedBank.color} text-white text-xs font-black flex items-center justify-center shadow-xs`}>
                  {selectedBank.initials}
                </div>
                <div>
                  <span className="text-[11px] text-indigo-600 uppercase font-bold tracking-wider block">Selected Application:</span>
                  <span className="text-sm font-black text-indigo-950">{selectedBank.name} • {form.values.loanType.toUpperCase()} Loan</span>
                </div>
              </div>

              <Button type="submit" loading={form.isSubmitting} size="lg">
                Save & Continue to Documents <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 2: Upload Documents */}
      {currentStep === 2 && (
        <div className="animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Upload Required Documents</h1>
              <p className="text-charcoal-500 mt-2">
                Uploading for <strong className="text-charcoal-900">{form.values.bankName}</strong> ({form.values.loanType.toUpperCase()} Loan).
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-cream-300">
              <span className="text-sm font-medium text-charcoal-900">
                Step 2 of 4
              </span>
              <div className="w-32 h-2 bg-cream-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-600 transition-all duration-500 ease-out" 
                  style={{ width: `${Math.round((currentDocIndex / requiredDocs.length) * 100)}%` }}
                />
              </div>
              <span className="text-sm text-charcoal-500 font-medium w-8 text-right">
                {Math.round((currentDocIndex / requiredDocs.length) * 100)}%
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left Checklist */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="p-0 overflow-hidden bg-white/60 backdrop-blur-md">
                <div className="p-4 border-b border-cream-300/50">
                  <h3 className="text-sm font-semibold text-charcoal-900">Required Documents</h3>
                </div>
                <div className="p-2">
                  {requiredDocs.map((doc, index) => {
                    const isCompleted = index < currentDocIndex;
                    const isActive = index === currentDocIndex;
                    const isPending = index > currentDocIndex;

                    return (
                      <div 
                        key={doc.type} 
                        className={`
                          flex items-center justify-between p-3 rounded-lg mb-1 transition-all duration-300
                          ${isActive ? 'bg-accent-50/80 border border-accent-100 shadow-sm' : 'border border-transparent'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex items-center justify-center w-6 h-6 rounded-full shrink-0 text-xs font-semibold
                            ${isCompleted ? 'bg-success-50 text-success-600' : ''}
                            ${isActive ? 'bg-accent-600 text-white shadow-sm' : ''}
                            ${isPending ? 'bg-cream-200 text-charcoal-400' : ''}
                          `}>
                            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : (index + 1)}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isActive ? 'text-charcoal-900' : 'text-charcoal-600'}`}>
                              {doc.label}
                            </p>
                            <p className="text-xs text-charcoal-400 mt-0.5">{doc.description}</p>
                          </div>
                        </div>
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-success-500" />}
                        {isActive && <ArrowRight className="w-4 h-4 text-accent-500" />}
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 bg-cream-50/50 border-t border-cream-300/50 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-charcoal-400" />
                  <p className="text-xs text-charcoal-500">Your documents are encrypted and stored securely.</p>
                </div>
              </Card>
            </div>

            {/* Middle Upload Box */}
            <div className="lg:col-span-6">
              <Card className="p-8 shadow-soft border-cream-300/80 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
                {!allDocsUploaded ? (
                  uploadSuccessState ? (
                    <div className="animate-fade-in text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-success-600" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal-900 mb-2">
                        {currentDocType.label} uploaded successfully
                      </h3>
                      <p className="text-charcoal-500 animate-pulse">Moving to next document...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleFileUpload} className="w-full flex flex-col items-center">
                      <div className="text-center mb-6">
                        <span className="text-xs font-semibold text-accent-600 uppercase tracking-wider mb-1 block">
                          Document {currentDocIndex + 1} of {requiredDocs.length}
                        </span>
                        <h3 className="text-2xl font-bold text-charcoal-900">
                          Upload your {currentDocType?.label}
                        </h3>
                        <p className="text-sm text-charcoal-500 mt-1 max-w-sm">
                          {currentDocType?.description}
                        </p>
                      </div>

                      {/* Dropzone */}
                      <div className="w-full max-w-md mb-6">
                        <label className={`
                          flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200
                          ${file ? 'border-accent-500 bg-accent-50/20' : 'border-cream-300 hover:border-accent-400 bg-cream-50/50 hover:bg-cream-50'}
                        `}>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setFile(e.target.files[0])}
                          />
                          <div className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center mb-4 text-accent-600">
                            {file ? <FileCheck className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                          </div>
                          
                          {file ? (
                            <div className="text-center">
                              <p className="text-sm font-semibold text-charcoal-900 truncate max-w-xs">{file.name}</p>
                              <p className="text-xs text-charcoal-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              <span className="text-xs text-accent-600 font-medium mt-2 inline-block">Click to replace</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm font-semibold text-charcoal-900">Click to upload or drag & drop</p>
                              <p className="text-xs text-charcoal-500 mt-1">PDF, JPG, or PNG (up to 10MB)</p>
                            </div>
                          )}
                        </label>
                      </div>

                      {(currentDocType?.type === 'pan' || currentDocType?.type === 'aadhaar') && (
                        <div className="w-full max-w-md mb-6">
                          <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                            {currentDocType.type === 'pan' ? 'PAN Number (Optional backup)' : 'Aadhaar Number (Optional backup)'}
                          </label>
                          <input
                            type="text"
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            placeholder={currentDocType.type === 'pan' ? 'e.g. ABCDE1234F' : 'e.g. 1234 5678 9012'}
                            className="w-full text-xs p-2.5 border border-cream-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-500"
                          />
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        size="lg" 
                        disabled={!file || uploading}
                        loading={uploading}
                        className="w-full max-w-md"
                      >
                        Upload & Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  )
                ) : (
                  <div className="animate-fade-in text-center flex flex-col items-center py-8">
                    <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-success-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-charcoal-900 mb-3">
                      All required documents uploaded
                    </h2>
                    <p className="text-charcoal-500 mb-8 max-w-sm">
                      Your application with {form.values.bankName} is ready for verification.
                    </p>
                    <Button onClick={handleVerification} size="lg" className="w-full sm:w-auto">
                      Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Info */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="bg-cream-50/50">
                <h4 className="text-sm font-bold text-charcoal-900 mb-4">Why we need these?</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><ShieldCheck className="w-4 h-4 text-charcoal-400" /></div>
                    <p className="text-xs text-charcoal-600 leading-relaxed">To securely verify your true identity and income.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><CheckCircle2 className="w-4 h-4 text-charcoal-400" /></div>
                    <p className="text-xs text-charcoal-600 leading-relaxed">To cross-check against bank policy rules.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {currentStep === 3 && (
        <Card className="max-w-2xl mx-auto animate-slide-up text-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-accent-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-charcoal-900">Analyzing Documents with AI...</h3>
          <p className="text-sm text-charcoal-500 mt-2">
            Extracting financial figures and cross-referencing with {form.values.bankName} policy guidelines.
          </p>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <Card className="max-w-2xl mx-auto animate-slide-up shadow-soft">
          <h3 className="text-lg font-bold text-charcoal-900 mb-6">Review & Submit Application</h3>
          
          <div className="bg-cream-100 p-4 rounded-xl mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${selectedBank.color} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}>
              {selectedBank.initials}
            </div>
            <div>
              <span className="text-xs text-charcoal-500 block">Lending Partner</span>
              <span className="text-base font-bold text-charcoal-900">{selectedBank.name}</span>
            </div>
          </div>

          <div className="space-y-3.5 mb-8">
            <div className="flex justify-between border-b border-cream-300 pb-2.5">
              <span className="text-sm text-charcoal-500">Selected Bank</span>
              <span className="text-sm font-bold text-charcoal-900">{selectedBank.name}</span>
            </div>
            <div className="flex justify-between border-b border-cream-300 pb-2.5">
              <span className="text-sm text-charcoal-500">Loan Type</span>
              <span className="text-sm font-semibold text-charcoal-900 capitalize">{form.values.loanType} Loan</span>
            </div>
            <div className="flex justify-between border-b border-cream-300 pb-2.5">
              <span className="text-sm text-charcoal-500">Requested Amount</span>
              <span className="text-sm font-bold text-accent-700">₹{Number(form.values.requestedAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b border-cream-300 pb-2.5">
              <span className="text-sm text-charcoal-500">Tenure</span>
              <span className="text-sm font-semibold text-charcoal-900">{form.values.tenureMonths} Months</span>
            </div>
            <div className="flex justify-between border-b border-cream-300 pb-2.5">
              <span className="text-sm text-charcoal-500">Declared Monthly Net Income</span>
              <span className="text-sm font-semibold text-charcoal-900">₹{Number(form.values.declaredMonthlyIncome).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b border-cream-300 pb-2.5">
              <span className="text-sm text-charcoal-500">Documents Attached</span>
              <span className="text-sm font-semibold text-charcoal-900">{uploadedDocs.length} documents</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={handleFinalSubmit} loading={submitting} size="lg">
              Submit Application to {selectedBank.shortName} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
