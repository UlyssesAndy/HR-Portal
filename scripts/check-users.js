const { Client } = require('pg');

async function checkUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check all employees
    const allResult = await client.query(`
      SELECT 
        e.id,
        e.email,
        e.full_name,
        uc.totp_enabled
      FROM employees e
      LEFT JOIN user_credentials uc ON uc.employee_id = e.id
      ORDER BY e.email
      LIMIT 10
    `);

    console.log('📋 First 10 employees:');
    allResult.rows.forEach(r => {
      console.log(`  - ${r.email} (${r.full_name}) - 2FA: ${r.totp_enabled ? 'ENABLED' : 'DISABLED'}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkUser();
