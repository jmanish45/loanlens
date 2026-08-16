import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Upload, FileText as FileIcon, Loader2, ShieldCheck, HelpCircle, FileCheck, X } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validation';
import { applicationService } from '../services/applicationService';
import { LOAN_TYPES, EMPLOYMENT_TYPES, DOCUMENT_REQUIREMENTS } from '../constants/mockData';
import { ROUTES } from '../constants/routes';

const APPLICATION_STEPS = [
  { step: 1, label: 'Loan Details' },
  { step: 2, label: 'Upload Documents' },
  { step: 3, label: 'Verification' },
  { step: 4, label: 'Review' },
];

const validationRules = {
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
      loanType: '',
      requestedAmount: '',
      tenureMonths: '',
      employmentType: '',
      declaredMonthlyIncome: '',
    },
    validationRules,
    onSubmit: async (data) => {
      const payload = {
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

  const requiredDocs = form.values.loanType ? DOCUMENT_REQUIREMENTS[form.values.loanType] : [];
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

      const response = await applicationService.uploadDocument(applicationId, formData);
      setUploadedDocs([...uploadedDocs, response.data]);
      
      setUploadSuccessState(true);
      
      setTimeout(() => {
        setUploadSuccessState(false);
        setFile(null);
        setCurrentDocIndex(prev => prev + 1);
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
    }, 2500);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      await applicationService.submit(applicationId);
      setSuccess(true);
    } catch (error) {
      alert('Submit failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto text-center py-16">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success-100 mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-success-600" />
        </div>
        <h2 className="text-xl font-semibold text-charcoal-900">Application Submitted!</h2>
        <p className="mt-2 text-charcoal-500 text-sm leading-relaxed">
          Your loan application has been submitted and is under review.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link to={ROUTES.APPLICANT}>
            <Button>Go to Dashboard <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header and Step Indicator */}
      {currentStep !== 2 && (
        <>
          <PageHeader
            title="New Loan Application"
            subtitle="Complete the steps to submit your loan application."
          />
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex items-center min-w-max gap-2">
              {APPLICATION_STEPS.map((step, idx) => {
                const isActive = step.step === currentStep;
                const isCompleted = step.step < currentStep;
                return (
                  <div key={step.step} className="flex items-center">
                    {idx > 0 && <div className={`w-8 h-px mx-1 shrink-0 ${isCompleted ? 'bg-charcoal-900' : 'bg-cream-400'}`} />}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${isActive ? 'bg-charcoal-900 text-cream-50' : isCompleted ? 'bg-success-600 text-cream-50' : 'bg-cream-300 text-charcoal-400'}`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.step}
                      </span>
                      <span className={`text-sm ${isActive ? 'font-medium text-charcoal-900' : isCompleted ? 'text-charcoal-900' : 'text-charcoal-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <Card className="max-w-2xl animate-slide-up">
          <h3 className="text-base font-semibold text-charcoal-900 mb-6">Loan Details</h3>
          <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
            <Select label="Loan Type" name="loanType" value={form.values.loanType} onChange={form.handleChange} onBlur={form.handleBlur} options={LOAN_TYPES} error={form.touched.loanType ? form.errors.loanType : null} placeholder="Select loan type" required />
            <div className="grid sm:grid-cols-2 gap-5">
              <Input label="Requested Loan Amount" name="requestedAmount" type="number" value={form.values.requestedAmount} onChange={form.handleChange} onBlur={form.handleBlur} error={form.touched.requestedAmount ? form.errors.requestedAmount : null} placeholder="e.g. 2500000" helperText="Amount in INR" required min="10000" />
              <Input label="Preferred Tenure" name="tenureMonths" type="number" value={form.values.tenureMonths} onChange={form.handleChange} onBlur={form.handleBlur} error={form.touched.tenureMonths ? form.errors.tenureMonths : null} placeholder="e.g. 120" helperText="Duration in months (6 – 360)" required min="6" max="360" />
            </div>
            <Select label="Employment Type" name="employmentType" value={form.values.employmentType} onChange={form.handleChange} onBlur={form.handleBlur} options={EMPLOYMENT_TYPES} error={form.touched.employmentType ? form.errors.employmentType : null} placeholder="Select employment type" required />
            <Input label="Approximate Monthly Income" name="declaredMonthlyIncome" type="number" value={form.values.declaredMonthlyIncome} onChange={form.handleChange} onBlur={form.handleBlur} error={form.touched.declaredMonthlyIncome ? form.errors.declaredMonthlyIncome : null} placeholder="e.g. 85000" helperText="Gross monthly income in INR" required min="1000" />
            
            {form.submitError && <div className="p-3 rounded-lg bg-error-100 text-error-600 text-sm" role="alert">{form.submitError}</div>}
            
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={form.isSubmitting} size="lg">Save & Continue <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 2: Documents (Redesigned) */}
      {currentStep === 2 && (
        <div className="animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Upload Required Documents</h1>
              <p className="text-charcoal-500 mt-2">We'll ask for documents one by one to keep things simple and accurate.</p>
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
            {/* Left Sidebar: Checklist */}
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

            {/* Middle: Upload Box */}
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
                      <p className="text-charcoal-500 animate-pulse">Moving to the next document...</p>
                    </div>
                  ) : (
                    <div className="w-full animate-fade-in">
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-50 text-accent-600 mb-4">
                          <FileIcon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-accent-600 uppercase tracking-wider mb-2">
                          Upload Document {currentDocIndex + 1} of {requiredDocs.length}
                        </p>
                        <h2 className="text-2xl font-bold text-charcoal-900 mb-2">
                          Upload {currentDocType.label}
                        </h2>
                        <p className="text-charcoal-500 text-sm">
                          Please upload your {currentDocType.label.toLowerCase()} ({currentDocType.description.toLowerCase()})
                        </p>
                      </div>

                      <form onSubmit={handleFileUpload} className="space-y-6">
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,image/jpeg,image/png"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`
                            border-2 border-dashed rounded-xl p-8 text-center transition-colors
                            ${file ? 'border-accent-400 bg-accent-50/30' : 'border-cream-400 bg-cream-50 hover:bg-cream-100/50 hover:border-accent-300'}
                          `}>
                            {file ? (
                              <div className="flex flex-col items-center">
                                <FileCheck className="w-10 h-10 text-accent-500 mb-3" />
                                <p className="text-sm font-medium text-charcoal-900">{file.name}</p>
                                <p className="text-xs text-charcoal-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <p className="text-xs font-semibold text-accent-600 mt-3 cursor-pointer z-20" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                                  Remove file
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center pointer-events-none">
                                <Upload className="w-10 h-10 text-charcoal-400 mb-3" />
                                <p className="text-sm font-medium text-charcoal-900">Drag and drop your file here</p>
                                <p className="text-sm text-charcoal-500 mt-1">or click to <span className="text-accent-600 font-semibold">browse</span></p>
                                <p className="text-xs text-charcoal-400 mt-4">PDF, JPEG, PNG • Max 10MB</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-cream-200 pt-6">
                          <Button 
                            type="submit" 
                            disabled={!file} 
                            loading={uploading}
                            className="w-full sm:w-auto"
                            size="lg"
                          >
                            Upload & Continue <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </form>
                    </div>
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
                      Your application is ready for the next step. We will now verify your submitted details.
                    </p>
                    <Button onClick={handleVerification} size="lg" className="w-full sm:w-auto">
                      Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Sidebar: Info */}
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
                    <p className="text-xs text-charcoal-600 leading-relaxed">To accurately assess your loan eligibility.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><CheckCircle2 className="w-4 h-4 text-charcoal-400" /></div>
                    <p className="text-xs text-charcoal-600 leading-relaxed">To ensure a smooth and rapid approval process.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-cream-50/50">
                <h4 className="text-sm font-bold text-charcoal-900 mb-2">Need Help?</h4>
                <p className="text-xs text-charcoal-600 leading-relaxed mb-4">
                  If you're not sure what to upload or are facing issues, contact our support team.
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  <HelpCircle className="w-4 h-4 mr-2" /> Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {currentStep === 3 && (
        <Card className="max-w-2xl animate-slide-up text-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-accent-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-charcoal-900">Analyzing Documents...</h3>
          <p className="text-sm text-charcoal-500 mt-2">
            LoanLens AI is processing your uploads to extract key financial data.
          </p>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <Card className="max-w-2xl animate-slide-up">
          <h3 className="text-base font-semibold text-charcoal-900 mb-6">Review & Submit</h3>
          
          <div className="bg-cream-100 p-4 rounded-lg mb-6">
            <p className="text-sm text-charcoal-700">
              Please review your details carefully before final submission. Your application will be sent to our loan officers.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b border-cream-300 pb-2">
              <span className="text-sm text-charcoal-500">Loan Type</span>
              <span className="text-sm font-medium text-charcoal-900 capitalize">{form.values.loanType}</span>
            </div>
            <div className="flex justify-between border-b border-cream-300 pb-2">
              <span className="text-sm text-charcoal-500">Requested Amount</span>
              <span className="text-sm font-medium text-charcoal-900">₹{Number(form.values.requestedAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b border-cream-300 pb-2">
              <span className="text-sm text-charcoal-500">Documents Attached</span>
              <span className="text-sm font-medium text-charcoal-900">{uploadedDocs.length} files</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={handleFinalSubmit} loading={submitting} size="lg">Submit Application</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
