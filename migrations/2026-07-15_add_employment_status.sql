-- Safe/idempotent migration for employment status on badge results and leads.

BEGIN;

ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'employed';

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'employed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'results_employment_status_check'
      AND conrelid = 'public.results'::regclass
  ) THEN
    ALTER TABLE public.results
      ADD CONSTRAINT results_employment_status_check
      CHECK (employment_status IN ('employed', 'unemployed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_employment_status_check'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_employment_status_check
      CHECK (employment_status IN ('employed', 'unemployed'));
  END IF;
END $$;

COMMIT;
