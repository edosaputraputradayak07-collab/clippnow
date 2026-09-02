BEGIN;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan = ANY (ARRAY['trial'::text, 'starter'::text, 'creator'::text, 'pro'::text, 'owner'::text]));

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  ip_address inet NULL,
  user_agent text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_user_id_idx ON public.security_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON public.security_events (severity, created_at DESC);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_events TO service_role;

CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  hits integer NOT NULL DEFAULT 0 CHECK (hits >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_rate_limits FROM anon, authenticated;
GRANT ALL ON public.security_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.clippnow_security_guard(p_key text, p_limit integer DEFAULT 30, p_window_seconds integer DEFAULT 60)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_now timestamptz := now(); v_row public.security_rate_limits%ROWTYPE;
BEGIN
  IF p_key IS NULL OR length(p_key) < 3 OR p_limit < 1 OR p_window_seconds < 1 THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_key, 0));
  SELECT * INTO v_row FROM public.security_rate_limits WHERE key = p_key FOR UPDATE;
  IF NOT FOUND OR v_now - v_row.window_started_at >= make_interval(secs => p_window_seconds) THEN
    INSERT INTO public.security_rate_limits(key, window_started_at, hits, updated_at)
    VALUES (p_key, v_now, 1, v_now)
    ON CONFLICT (key) DO UPDATE SET window_started_at = EXCLUDED.window_started_at, hits = 1, updated_at = EXCLUDED.updated_at;
    RETURN true;
  END IF;
  IF v_row.hits >= p_limit THEN
    UPDATE public.security_rate_limits SET updated_at = v_now WHERE key = p_key;
    RETURN false;
  END IF;
  UPDATE public.security_rate_limits SET hits = hits + 1, updated_at = v_now WHERE key = p_key;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_clippnow_security_event(p_user_id uuid, p_event_type text, p_severity text, p_ip_address inet DEFAULT NULL, p_user_agent text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_event_type IS NULL OR length(p_event_type) < 2 THEN RAISE EXCEPTION 'invalid_security_event'; END IF;
  IF p_severity NOT IN ('info','warning','critical') THEN RAISE EXCEPTION 'invalid_security_severity'; END IF;
  INSERT INTO public.security_events(user_id,event_type,severity,ip_address,user_agent,metadata)
  VALUES (p_user_id, left(p_event_type,120), p_severity, p_ip_address, left(p_user_agent,500), COALESCE(p_metadata,'{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clippnow_security_guard(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clippnow_security_guard(text, integer, integer) TO service_role;
REVOKE ALL ON FUNCTION public.log_clippnow_security_event(uuid, text, text, inet, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_clippnow_security_event(uuid, text, text, inet, text, jsonb) TO service_role;
COMMIT;
