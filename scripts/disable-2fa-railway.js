const { Client } = require('pg');

async function disable2FA() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // First, check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Available tables:', tablesResult.rows.map(r => r.table_name));

    // Disable 2FA
    const updateResult = await client.query(`
      UPDATE user_credentials 
      SET 
        totp_enabled = false, 
        totp_secret = NULL, 
        backup_codes = '{}'
      WHERE employee_id = (
        SELECT id FROM employees 
        WHERE email = 'andrew.ashichev@alg.team'
      )
    `);

    console.log(`✅ 2FA DISABLED! ${updateResult.rowCount} rows updated`);

    // Verify
    const verifyResult = await client.query(`
      SELECT 
        e.full_name,
        e.email,
        uc.totp_enabled
      FROM employees e
      JOIN user_credentials uc ON uc.employee_id = e.id
      WHERE e.email = 'andrew.ashichev@alg.team'
    `);

    console.log('✅ Result:', verifyResult.rows[0]);
    console.log('');
    console.log('✅✅✅ SUCCESS! You can now login without 2FA! ✅✅✅');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

disable2FA();
