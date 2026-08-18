require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { getApplicantNotifications } = require('./src/services/notificationService');

const IDS = ['6a82f354e42781410b027c75', '6a835c067095a38d249f4412', '6a82fff4c0a3b62d5d4fcfc7'];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const id of IDS) {
    const u = await User.findById(id).select('name email').lean();
    console.log(`\n=== ${u ? u.name : '?'} <${u ? u.email : id}> ===`);
    const out = await getApplicantNotifications(id);
    console.log('counts:', JSON.stringify(out.counts));
    out.notifications.forEach(n => {
      console.log(`- [${n.kind}/${n.tone}${n.actionRequired ? '/ACTION' : ''}] ${n.title}`);
      console.log(`    ${n.message}`);
      console.log(`    app: ${n.application.loanType} ${n.application.requestedAmount} ${n.application.bankName || '(no bank)'}`);
      (n.reasons || []).forEach(r => console.log(`    * ${r.label} [${r.severity}] — ${r.detail}`));
    });
  }
  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.stack); process.exit(1); });
