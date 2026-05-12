const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('./models/Car');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Archive all 'closed' (Delivered) cars so they leave the active list
  const result = await Car.updateMany({ status: 'closed' }, { status: 'archived' });
  console.log(`✅ Archived ${result.modifiedCount} delivered car(s). They now appear under "Show Archived".`);
  await mongoose.disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
