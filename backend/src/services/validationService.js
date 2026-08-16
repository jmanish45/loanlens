const LoanApplication = require('../models/LoanApplication');
const ValidationResult = require('../models/ValidationResult');
const Document = require('../models/Document');
const { logActivity } = require('../utils/activityLogger');
const stringSimilarity = require('string-similarity');

// Helper to normalize strings for comparison
const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
};

const fuzzyMatch = (str1, str2, threshold = 0.8) => {
  if (!str1 || !str2) return false;
  const n1 = normalizeString(str1);
  const n2 = normalizeString(str2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Use string-similarity if available, else simple fallback
  if (stringSimilarity) {
    const score = stringSimilarity.compareTwoStrings(n1, n2);
    return score >= threshold;
  }
  return false;
};

const parseAmount = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Runs cross-document validation for a loan application.
 * Compares AI-extracted data points across documents.
 * 
 * @param {string} applicationId 
 */
const runValidation = async (applicationId) => {
  try {
    const application = await LoanApplication.findById(applicationId).populate('documents');
    if (!application) {
      console.error(`[Validation] Application ${applicationId} not found.`);
      return;
    }

    const docs = application.documents.filter(d => 
      d.aiProcessing && d.aiProcessing.status === 'completed' && d.aiProcessing.extractedData
    );

    const checks = [];
    let hasFlagged = false;

    // Group extracted data by document type
    const dataByType = {};
    docs.forEach(doc => {
      const type = doc.aiProcessing.predictedType;
      if (!dataByType[type]) dataByType[type] = [];
      dataByType[type].push(doc.aiProcessing.extractedData);
    });

    const getFirstData = (type) => dataByType[type]?.[0] || null;

    // 1. Income Validation
    const declaredIncome = application.declaredMonthlyIncome;
    const salarySlipData = getFirstData('SALARY_SLIP');
    const bankStatementData = getFirstData('BANK_STATEMENT');
    const form16Data = getFirstData('FORM_16');
    
    if (declaredIncome) {
      let incomeCheck = {
        type: 'INCOME_CONSISTENCY',
        severity: 'HIGH',
        status: 'PASSED',
        message: 'Income sources are consistent with declared values.',
        evidence: { declared_monthly: declaredIncome }
      };

      let minExpected = declaredIncome * 0.8; // 20% variance allowed
      let maxExpected = declaredIncome * 1.5;

      if (salarySlipData && salarySlipData.net_salary) {
        incomeCheck.evidence.salary_slip_net = salarySlipData.net_salary;
        const net = parseAmount(salarySlipData.net_salary);
        if (net < minExpected || net > maxExpected) {
          incomeCheck.status = 'FLAGGED';
          incomeCheck.message = 'Salary Slip net income differs significantly from declared income.';
        }
      }

      if (bankStatementData && bankStatementData.salary_credits && bankStatementData.salary_credits.length > 0) {
        // Calculate average salary credit
        let total = 0;
        bankStatementData.salary_credits.forEach(c => total += parseAmount(c.amount));
        const avg = total / bankStatementData.salary_credits.length;
        incomeCheck.evidence.bank_avg_salary_credit = Math.round(avg);
        
        if (avg < minExpected || avg > maxExpected) {
          incomeCheck.status = incomeCheck.status === 'FLAGGED' ? 'FLAGGED' : 'WARNING';
          incomeCheck.message = 'Bank statement average salary credit differs from declared income.';
          if (avg < minExpected) incomeCheck.severity = 'HIGH';
        }
      }

      if (form16Data && form16Data.gross_salary) {
        const monthlyGross = parseAmount(form16Data.gross_salary) / 12;
        incomeCheck.evidence.form16_monthly_gross = Math.round(monthlyGross);
        // Form 16 gross will be higher than net, so just check if it's too low
        if (monthlyGross < declaredIncome * 0.9) {
          incomeCheck.status = 'FLAGGED';
          incomeCheck.message = 'Form 16 annualized gross salary is lower than declared monthly income.';
        }
      }

      if (incomeCheck.status === 'FLAGGED') hasFlagged = true;
      checks.push(incomeCheck);
    }

    // 2. Identity Consistency
    const panData = getFirstData('PAN');
    const aadhaarData = getFirstData('AADHAAR');
    
    // Collect all names found
    const names = [];
    if (panData && panData.name) names.push({ source: 'PAN', name: panData.name });
    if (aadhaarData && aadhaarData.name) names.push({ source: 'Aadhaar', name: aadhaarData.name });
    if (salarySlipData && salarySlipData.employee_name) names.push({ source: 'Salary Slip', name: salarySlipData.employee_name });
    if (bankStatementData && bankStatementData.account_holder) names.push({ source: 'Bank Statement', name: bankStatementData.account_holder });
    if (form16Data && form16Data.employee_name) names.push({ source: 'Form 16', name: form16Data.employee_name });

    if (names.length > 1) {
      let identityCheck = {
        type: 'IDENTITY_CONSISTENCY',
        severity: 'HIGH',
        status: 'PASSED',
        message: 'Applicant names match across all provided documents.',
        evidence: {}
      };

      const baseName = names[0].name;
      let mismatch = false;

      names.forEach(n => {
        identityCheck.evidence[n.source] = n.name;
        if (!fuzzyMatch(baseName, n.name)) {
          mismatch = true;
        }
      });

      if (mismatch) {
        identityCheck.status = 'FLAGGED';
        identityCheck.message = 'Significant mismatch in applicant names across documents.';
        hasFlagged = true;
      }
      
      checks.push(identityCheck);
    }

    // 3. Employer Consistency
    const employers = [];
    if (salarySlipData && salarySlipData.employer) employers.push({ source: 'Salary Slip', name: salarySlipData.employer });
    if (form16Data && form16Data.employer_name) employers.push({ source: 'Form 16', name: form16Data.employer_name });
    
    if (employers.length > 1) {
      let employerCheck = {
        type: 'EMPLOYER_CONSISTENCY',
        severity: 'MEDIUM',
        status: 'PASSED',
        message: 'Employer names match across documents.',
        evidence: {}
      };

      const baseEmp = employers[0].name;
      let empMismatch = false;

      employers.forEach(e => {
        employerCheck.evidence[e.source] = e.name;
        if (!fuzzyMatch(baseEmp, e.name, 0.6)) { // Lower threshold for employers
          empMismatch = true;
        }
      });

      if (empMismatch) {
        employerCheck.status = 'WARNING';
        employerCheck.message = 'Potential mismatch in employer names across documents.';
      }
      
      checks.push(employerCheck);
    }

    // Calculate Overall Status
    let overallStatus = 'VERIFIED';
    if (hasFlagged) {
      overallStatus = 'REVIEW_REQUIRED';
    } else if (checks.some(c => c.status === 'WARNING')) {
      overallStatus = 'REVIEW_REQUIRED'; // Warnings also require review
    }

    // Save or Update ValidationResult
    await ValidationResult.findOneAndUpdate(
      { application: applicationId },
      {
        application: applicationId,
        status: overallStatus,
        checks: checks,
        validatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`[Validation] Completed for application ${applicationId}. Status: ${overallStatus}`);
    
    // Log Activity (only log if it changed or it's a significant run)
    await logActivity(applicationId, null, 'Cross-Document Validation Run', {
      status: overallStatus,
      flaggedCount: checks.filter(c => c.status === 'FLAGGED').length,
    });

  } catch (error) {
    console.error(`[Validation] Engine failed for application ${applicationId}:`, error);
  }
};

module.exports = {
  runValidation,
};
