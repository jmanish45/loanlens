/**
 * Mock data for development — Stage 1 only.
 * All mock/development data is isolated here.
 * Do NOT import this file in production service layers.
 */

export const MOCK_USER = {
  name: 'Aarav Mehta',
  email: 'aarav.mehta@email.com',
  role: 'applicant',
};

export const MOCK_APPLICATION = {
  id: 'LA-2026-001847',
  loanType: 'home',
  requestedAmount: 4500000,
  tenureMonths: 240,
  employmentType: 'salaried',
  declaredMonthlyIncome: 125000,
  status: 'draft',
  createdAt: '2026-08-14T10:30:00Z',
};

export const MOCK_ACTIVITY = [
  {
    id: 1,
    description: 'Application created',
    timestamp: '2026-08-14T10:30:00Z',
    type: 'info',
  },
  {
    id: 2,
    description: 'Loan details submitted',
    timestamp: '2026-08-14T10:32:00Z',
    type: 'success',
  },
];

export const LOAN_TYPES = [
  { value: 'personal', label: 'Personal Loan' },
  { value: 'home', label: 'Home Loan' },
  { value: 'auto', label: 'Auto Loan' },
  { value: 'education', label: 'Education Loan' },
];

export const DOCUMENT_REQUIREMENTS = {
  personal: [
    { type: 'pan', label: 'PAN Card', description: 'Identity Proof' },
    { type: 'aadhaar', label: 'Aadhaar Card', description: 'Identity Proof' },
    { type: 'salary_slip', label: 'Salary Slip', description: 'Last 3 Months' },
    { type: 'bank_statement', label: 'Bank Statement', description: 'Last 6 Months' },
    { type: 'form16', label: 'Form 16', description: 'Latest' }
  ],
  home: [
    { type: 'pan', label: 'PAN Card', description: 'Identity Proof' },
    { type: 'aadhaar', label: 'Aadhaar Card', description: 'Identity Proof' },
    { type: 'salary_slip', label: 'Salary Slip', description: 'Last 3 Months' },
    { type: 'bank_statement', label: 'Bank Statement', description: 'Last 6 Months' },
    { type: 'property_document', label: 'Property Documents', description: 'Agreement / Title Deed' }
  ],
  auto: [
    { type: 'pan', label: 'PAN Card', description: 'Identity Proof' },
    { type: 'aadhaar', label: 'Aadhaar Card', description: 'Identity Proof' },
    { type: 'salary_slip', label: 'Salary Slip', description: 'Last 3 Months' },
    { type: 'bank_statement', label: 'Bank Statement', description: 'Last 6 Months' }
  ],
  education: [
    { type: 'pan', label: 'PAN Card', description: 'Identity Proof' },
    { type: 'aadhaar', label: 'Aadhaar Card', description: 'Identity Proof' },
    { type: 'bank_statement', label: 'Bank Statement', description: 'Last 6 Months' }
  ]
};

export const EMPLOYMENT_TYPES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self-employed', label: 'Self-Employed' },
  { value: 'business-owner', label: 'Business Owner' },
];

export const APPLICATION_STEPS = [
  { step: 1, label: 'Loan Details', status: 'active' },
  { step: 2, label: 'Documents', status: 'upcoming' },
  { step: 3, label: 'Verification', status: 'upcoming' },
  { step: 4, label: 'Review', status: 'upcoming' },
];
