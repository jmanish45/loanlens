require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('./src/models/Activity');
const Document = require('./src/models/Document');
const ValidationResult = require('./src/models/ValidationResult');
const LoanApplication = require('./src/models/LoanApplication');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('activity actions:', JSON.stringify(await Activity.aggregate([{ $group: { _id: '$action', n: { $sum: 1 } } }])));
  console.log('doc statuses:', JSON.stringify(await Document.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])));
  console.log('app statuses:', JSON.stringify(await LoanApplication.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])));
  const vrs = await ValidationResult.find({}).select('application status riskLevel checks').lean();
  console.log('validationResults:', vrs.length);
  for (const v of vrs) {
    const bad = (v.checks || []).filter(c => c.status !== 'PASSED');
    const app = await LoanApplication.findById(v.application).select('applicant status loanType bankName').lean();
    console.log(`  app=${v.application} applicant=${app && app.applicant} appStatus=${app && app.status} vrStatus=${v.status} nonPassed=${bad.length}`);
    bad.forEach(c => console.log(`     - ${c.checkType} ${c.status}/${c.severity}: ${String(c.message || '').slice(0, 110)}`));
  }
  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
