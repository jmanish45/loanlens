require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { getApplicantNotifications } = require('./src/services/notificationService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const u = await User.findOne({ email: 'ui.preview.test@loanlens.local' }).select('_id name').lean();
  console.log('user:', u && String(u._id), u && u.name);
  if (u) {
    const out = await getApplicantNotifications(u._id);
    console.log('counts:', JSON.stringify(out.counts));
    out.notifications.forEach(n => {
      console.log(`- [${n.kind}/${n.tone}] ${n.title} :: ${n.message}`);
      (n.reasons || []).forEach(r => console.log(`    * ${r.label} (${r.severity}) — ${r.detail}`));
    });
  }
  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
