const mongoose = require('mongoose');
require('dotenv').config();
const ServiceStage = require('./models/ServiceStage');
const JobMaster = require('./models/JobMaster');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  // Load all job templates (title → category map)
  const jobMasters = await JobMaster.find();
  const categoryMap = {};
  jobMasters.forEach(j => {
    categoryMap[j.title.trim().toLowerCase()] = j.category.toUpperCase();
  });

  console.log(`📋 Found ${jobMasters.length} job template(s):`);
  jobMasters.forEach(j => console.log(`   "${j.title}" → ${j.category.toUpperCase()}`));
  console.log('');

  // Find all stages that have no category (null or 'General' default)
  const stages = await ServiceStage.find({
    $or: [{ category: null }, { category: '' }, { category: 'General' }]
  });

  console.log(`🔍 Found ${stages.length} stage(s) without a proper category.\n`);

  let updated = 0;
  let skipped = 0;

  for (const stage of stages) {
    const key = stage.stageName.trim().toLowerCase();
    const matchedCategory = categoryMap[key];

    if (matchedCategory) {
      await ServiceStage.findByIdAndUpdate(stage._id, { category: matchedCategory });
      console.log(`   ✅ "${stage.stageName}" → ${matchedCategory}`);
      updated++;
    } else {
      console.log(`   ⚠️  "${stage.stageName}" → No matching job template found, kept as General`);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated : ${updated} stage(s)`);
  console.log(`   Skipped : ${skipped} stage(s) (no matching template)`);

  await mongoose.disconnect();
  console.log('\n✅ Done. Disconnect from MongoDB.');

}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
