-- ================================
-- HR Portal - Database Initialization
-- ================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hrportal TO hrportal;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'HR Portal database initialized successfully';
END $$;
