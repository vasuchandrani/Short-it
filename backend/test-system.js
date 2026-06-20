const db = require('./db');
const redis = require('./redis');

async function runTests() {
  console.log('=== SYSTEM VALIDATION TESTS ===');
  
  // 1. Test PostgreSQL Connection
  try {
    console.log('\nTesting PostgreSQL (Neon DB) Connection...');
    const dbRes = await db.query('SELECT NOW()');
    console.log('✓ PostgreSQL connected successfully. Server time:', dbRes.rows[0].now);
    
    // Check tables
    const tableCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✓ Public tables detected:', tableCheck.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('✕ PostgreSQL connection failed:', err.message);
  }

  // 2. Test Upstash Redis Cache Connection
  try {
    console.log('\nTesting Upstash Redis Connection...');
    const testKey = 'test:connection_check';
    const testVal = 'success-' + Date.now();
    
    await redis.set(testKey, testVal, { ex: 10 });
    const fetchedVal = await redis.get(testKey);
    
    if (fetchedVal === testVal) {
      console.log('✓ Upstash Redis read/write operation successful. Fetched value:', fetchedVal);
    } else {
      console.error('✕ Upstash Redis value mismatch. Expected:', testVal, 'Got:', fetchedVal);
    }
    
    await redis.del(testKey);
    console.log('✓ Upstash Redis cleanup completed.');
  } catch (err) {
    console.error('✕ Upstash Redis connection failed:', err.message);
  }

  console.log('\n=== VALIDATION COMPLETED ===');
  process.exit(0);
}

runTests();
