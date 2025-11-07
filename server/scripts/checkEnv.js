const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 Environment Variables Check:');
console.log('================================');

const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
const optionalVars = ['PORT'];

console.log('\n📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'MONGO_URI') {
      // Mask the password in the URI for security
      const maskedValue = value.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1****$2');
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else if (varName === 'JWT_SECRET') {
      console.log(`✅ ${varName}: ${'*'.repeat(value.length)} (${value.length} characters)`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (using default)`);
  }
});

console.log('\n🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('================================');