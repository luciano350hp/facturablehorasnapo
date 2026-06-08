DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist_signups;

CREATE POLICY "Anyone can join waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND char_length(email) BETWEEN 3 AND 320
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND (source IS NULL OR char_length(source) <= 64)
);