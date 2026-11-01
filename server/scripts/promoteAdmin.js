/**
 * Promotes an already registered account to the admin role.
 *
 *   npm run admin -- someone@example.com
 */
require('../config/env');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run admin -- <registered-email>');
    process.exitCode = 1;
    return;
  }

  await connectDB();
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(`No account found for ${email} — register it first, then run this script.`);
  }

  user.role = 'admin';
  await user.save();
  console.log(`Success: ${user.email} now has the admin role.`);
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(closeDB);
