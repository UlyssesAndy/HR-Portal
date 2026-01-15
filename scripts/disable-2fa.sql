-- Disable 2FA for andrew.ascherbev@alg.team
-- Run this SQL in Railway Postgres database

-- First, find the credentials ID
SELECT 
  e.id as employee_id,
  e."fullName",
  e.email,
  uc.id as credentials_id,
  uc."totpEnabled",
  uc."totpSecret" IS NOT NULL as has_secret,
  array_length(uc."backupCodes"::text[], 1) as backup_codes_count
FROM "Employee" e
JOIN "UserCredentials" uc ON uc."employeeId" = e.id
WHERE e.email = 'andrew.ascherbev@alg.team';

-- Disable 2FA
UPDATE "UserCredentials" 
SET 
  "totpEnabled" = false,
  "totpSecret" = NULL,
  "backupCodes" = '{}'
WHERE "employeeId" = (
  SELECT id FROM "Employee" WHERE email = 'andrew.ascherbev@alg.team'
);

-- Verify it's disabled
SELECT 
  e."fullName",
  e.email,
  uc."totpEnabled",
  uc."totpSecret",
  uc."backupCodes"
FROM "Employee" e
JOIN "UserCredentials" uc ON uc."employeeId" = e.id
WHERE e.email = 'andrew.ascherbev@alg.team';
