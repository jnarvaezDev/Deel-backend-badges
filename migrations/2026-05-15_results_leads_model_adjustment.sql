-- Safe/reversible migration for results/leads model adjustment
-- Changes:
-- - Rename job -> current_job_title (no duplicates)
-- - Keep email as-is (no professional_email)
-- - Add current_country with safe two-phase path
-- - Drop company

BEGIN;

DO $$
BEGIN
  -- results: rename job -> current_job_title if needed
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'job'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'current_job_title'
  ) THEN
    EXECUTE 'ALTER TABLE public.results RENAME COLUMN job TO current_job_title';
  END IF;

  -- leads: rename job -> current_job_title if needed
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'job'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'current_job_title'
  ) THEN
    EXECUTE 'ALTER TABLE public.leads RENAME COLUMN job TO current_job_title';
  END IF;

  -- results: add current_country nullable first (safe)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'current_country'
  ) THEN
    EXECUTE 'ALTER TABLE public.results ADD COLUMN current_country TEXT';
  END IF;

  -- leads: add current_country nullable first (safe)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'current_country'
  ) THEN
    EXECUTE 'ALTER TABLE public.leads ADD COLUMN current_country TEXT';
  END IF;

  -- Drop company if present
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'company'
  ) THEN
    EXECUTE 'ALTER TABLE public.results DROP COLUMN company';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'company'
  ) THEN
    EXECUTE 'ALTER TABLE public.leads DROP COLUMN company';
  END IF;
END $$;

-- Optional hardening to NOT NULL only when existing rows are already complete
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'current_country' AND is_nullable = 'YES'
  )
  AND NOT EXISTS (SELECT 1 FROM public.results WHERE current_country IS NULL)
  THEN
    EXECUTE 'ALTER TABLE public.results ALTER COLUMN current_country SET NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'current_country' AND is_nullable = 'YES'
  )
  AND NOT EXISTS (SELECT 1 FROM public.leads WHERE current_country IS NULL)
  THEN
    EXECUTE 'ALTER TABLE public.leads ALTER COLUMN current_country SET NOT NULL';
  END IF;
END $$;

COMMIT;

-- ==============================
-- DOWN (manual rollback section)
-- ==============================
-- Run manually if rollback is required.
-- NOTE: Dropped `company` data is not recoverable unless restored from backup.
--
-- BEGIN;
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'current_job_title'
--   ) AND NOT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'job'
--   ) THEN
--     EXECUTE 'ALTER TABLE public.results RENAME COLUMN current_job_title TO job';
--   END IF;
--
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'current_job_title'
--   ) AND NOT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'job'
--   ) THEN
--     EXECUTE 'ALTER TABLE public.leads RENAME COLUMN current_job_title TO job';
--   END IF;
--
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'current_country'
--   ) THEN
--     EXECUTE 'ALTER TABLE public.results DROP COLUMN current_country';
--   END IF;
--
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'current_country'
--   ) THEN
--     EXECUTE 'ALTER TABLE public.leads DROP COLUMN current_country';
--   END IF;
--
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'company'
--   ) THEN
--     EXECUTE 'ALTER TABLE public.results ADD COLUMN company TEXT';
--   END IF;
--
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'company'
--   ) THEN
--     EXECUTE 'ALTER TABLE public.leads ADD COLUMN company TEXT';
--   END IF;
-- END $$;
-- COMMIT;
