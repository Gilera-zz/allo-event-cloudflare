-- Add opt-out flag for automated job notifications
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS receive_job_notices boolean NOT NULL DEFAULT true;

-- Partial index for fast lookup of active subscribers when broadcasting
CREATE INDEX IF NOT EXISTS profiles_receive_job_notices_true_idx
  ON public.profiles (receive_job_notices)
  WHERE receive_job_notices = true;

-- Allow users to toggle their own flag (admins already covered by existing policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_self_update_notice_pref'
  ) THEN
    CREATE POLICY profiles_self_update_notice_pref
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
