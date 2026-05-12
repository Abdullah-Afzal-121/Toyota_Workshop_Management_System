const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('./models/Car');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Find all reg numbers that have an active (non-closed/non-archived) record
  const activeCars = await Car.find({ status: { $nin: ['closed', 'archived'] } }).select('regNumber');
  const activeRegs = [...new Set(activeCars.map(c => c.regNumber))];

  if (activeRegs.length === 0) {
    console.log('No cleanup needed — no active cars found.');
    await mongoose.disconnect();
    return;
  }

  // Archive all 'closed' records for those same reg numbers
  const result = await Car.updateMany(
    { regNumber: { $in: activeRegs }, status: 'closed' },
    { status: 'archived' }
  );

  console.log(`✅ Auto-archived ${result.modifiedCount} old delivered record(s) for cars that already have a new active service.`);
  await mongoose.disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
