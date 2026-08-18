require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const raw = await mongoose.connection.db.collection('validationresults')
    .findOne({ application: new mongoose.Types.ObjectId('6a8363f07095a38d249f444d') });
  console.log('top-level keys:', Object.keys(raw).join(', '));
  console.log('checks[0] RAW:', JSON.stringify(raw.checks[0], null, 2));
  console.log('all check keys union:', JSON.stringify([...new Set(raw.checks.flatMap(c => Object.keys(c)))]));
  console.log('check identifiers:', JSON.stringify(raw.checks.map(c => ({ t: c.type, ct: c.checkType, n: c.name, code: c.code, s: c.status, sev: c.severity }))));
  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
