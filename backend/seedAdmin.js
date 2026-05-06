/**
 * seedAdmin.js
 * ─────────────────────────────────────────────────────────────
 * Run locally :  node backend/seedAdmin.js
 * Run on Render:  (Render Shell) node seedAdmin.js
 *
 * Creates demo accounts if they don't already exist.
 * Safe to run multiple times — skips existing accounts.
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');

// ── Accounts to seed ──────────────────────────────────────────
const ACCOUNTS = [
  {
    name:     'Admin User',
    email:    'admin@toyota.com',
    password: 'Admin@1234',        // ← change this to your preferred password
    role:     'admin',
  },
  {
    name:     'Mechanic User',
    email:    'mechanic@toyota.com',
    password: 'Mechanic@1234',
    role:     'mechanic',
  },
  {
    name:     'Customer User',
    email:    'customer@toyota.com',
    password: 'Customer@1234',
    role:     'customer',
  },
];

// ── Main ──────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set. Check your .env file.');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅  Connected.\n');

  for (const account of ACCOUNTS) {
    const existing = await User.findOne({ email: account.email });

    if (existing) {
      // Force-update the password so we always know the correct one
      existing.password = account.password;
      await existing.save();
      console.log(`🔄  Updated  [${account.role}]  ${account.email}`);
    } else {
      await User.create(account);
      console.log(`✅  Created  [${account.role}]  ${account.email}`);
    }
  }

  console.log('\n🎉  Seeding complete!');
  console.log('─────────────────────────────────────────────');
  console.log('  Admin    → admin@toyota.com    / Admin@1234');
  console.log('  Mechanic → mechanic@toyota.com / Mechanic@1234');
  console.log('  Customer → customer@toyota.com / Customer@1234');
  console.log('─────────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
