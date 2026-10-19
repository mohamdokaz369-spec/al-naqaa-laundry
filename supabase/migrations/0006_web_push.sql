BEGIN;
ALTER TABLE public.push_devices DROP CONSTRAINT IF EXISTS push_devices_platform_check;
ALTER TABLE public.push_devices ADD CONSTRAINT push_devices_platform_check CHECK (platform IN ('android','ios','web'));
CREATE OR REPLACE FUNCTION public.claim_notifications(batch_size integer DEFAULT 10)
RETURNS SETOF public.notification_outbox LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE public.notification_outbox SET status='failed',last_error='lease_exhausted' WHERE status='processing' AND attempts>=5 AND locked_at<now()-interval '5 minutes';
 UPDATE public.notification_outbox SET status='processing',locked_at=now(),lock_token=gen_random_uuid(),attempts=attempts+1
 WHERE id IN (SELECT id FROM public.notification_outbox WHERE attempts<5 AND
 ((status IN ('pending','blocked') AND available_at<=now()) OR (status='processing' AND locked_at<now()-interval '5 minutes'))
 ORDER BY CASE WHEN channel='push_admin' THEN 0 ELSE 1 END, created_at DESC FOR UPDATE SKIP LOCKED LIMIT least(greatest(batch_size,1),20)) RETURNING *;
$$;
COMMIT;
