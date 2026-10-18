BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_opt_out_at timestamptz;
CREATE TABLE public.admin_notifications (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
 title text NOT NULL, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,order_id)
);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_notifications_select ON public.admin_notifications FOR SELECT TO authenticated USING (user_id=auth.uid() AND public.is_admin());
CREATE POLICY admin_notifications_update ON public.admin_notifications FOR UPDATE TO authenticated USING (user_id=auth.uid() AND public.is_admin()) WITH CHECK (user_id=auth.uid() AND public.is_admin());
REVOKE ALL ON public.admin_notifications FROM anon, authenticated;
GRANT SELECT ON public.admin_notifications TO authenticated;
GRANT UPDATE(read_at) ON public.admin_notifications TO authenticated;
CREATE TABLE public.push_devices (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 token text NOT NULL UNIQUE, platform text NOT NULL CHECK(platform IN ('android','ios')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
-- Tokens are managed only through role-checked API routes, never exposed publicly.
CREATE TABLE public.notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
 history_id bigint NOT NULL REFERENCES public.order_status_history(id) ON DELETE CASCADE,
 channel text NOT NULL CHECK(channel IN ('push_admin','whatsapp_customer','whatsapp_admin')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','sent','failed','blocked')),
 order_status text NOT NULL,
 attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
 locked_at timestamptz, lock_token uuid, provider_ids text[], last_error text,
 delivery_status text, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz,
 UNIQUE(history_id,channel)
);
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.notification_push_receipts (
 job_id uuid NOT NULL REFERENCES public.notification_outbox(id) ON DELETE CASCADE,
 device_id bigint NOT NULL REFERENCES public.push_devices(id) ON DELETE CASCADE,
 sent_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(job_id,device_id)
);
ALTER TABLE public.notification_push_receipts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.notification_push_receipts TO service_role;
CREATE INDEX notification_outbox_due ON public.notification_outbox(available_at) WHERE status IN ('pending','processing','blocked');
CREATE OR REPLACE FUNCTION public.queue_order_notifications() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; first_event boolean;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=NEW.order_id;
 SELECT NOT EXISTS (SELECT 1 FROM public.order_status_history WHERE order_id=NEW.order_id AND id<>NEW.id) INTO first_event;
 IF first_event THEN
   INSERT INTO public.admin_notifications(user_id,order_id,title)
   SELECT id,o.id,'طلب جديد وصل' FROM public.profiles WHERE role='admin' ON CONFLICT DO NOTHING;
   INSERT INTO public.notification_outbox(order_id,history_id,channel,order_status)
   VALUES(o.id,NEW.id,'push_admin',NEW.status),(o.id,NEW.id,'whatsapp_admin',NEW.status) ON CONFLICT DO NOTHING;
 END IF;
 IF o.whatsapp_opt_in AND NEW.status IN ('pending','scheduled','picked_up','ready','completed','cancelled') THEN
   INSERT INTO public.notification_outbox(order_id,history_id,channel,order_status)
   VALUES(o.id,NEW.id,'whatsapp_customer',NEW.status) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER history_queue_notifications AFTER INSERT ON public.order_status_history FOR EACH ROW EXECUTE FUNCTION public.queue_order_notifications();
CREATE OR REPLACE FUNCTION public.claim_notifications(batch_size integer DEFAULT 10)
RETURNS SETOF public.notification_outbox LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE public.notification_outbox SET status='failed',last_error='lease_exhausted' WHERE status='processing' AND attempts>=5 AND locked_at<now()-interval '5 minutes';
 UPDATE public.notification_outbox SET status='processing',locked_at=now(),lock_token=gen_random_uuid(),attempts=attempts+1
 WHERE id IN (SELECT id FROM public.notification_outbox WHERE attempts<5 AND
 ((status IN ('pending','blocked') AND available_at<=now()) OR (status='processing' AND locked_at<now()-interval '5 minutes'))
 ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT least(greatest(batch_size,1),20)) RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_notifications(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notifications(integer) TO service_role;
GRANT ALL ON public.admin_notifications,public.push_devices,public.notification_outbox TO service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
CREATE OR REPLACE FUNCTION public.record_notification_delivery(message_id text,next_state text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE public.notification_outbox SET delivery_status=next_state
 WHERE provider_ids @> ARRAY[message_id] AND next_state IN ('sent','delivered','read','failed') AND
 (delivery_status IS NULL OR
  (next_state='failed' AND delivery_status NOT IN ('delivered','read')) OR
  array_position(ARRAY['failed','sent','delivered','read'],next_state)>array_position(ARRAY['failed','sent','delivered','read'],delivery_status));
$$;
REVOKE ALL ON FUNCTION public.record_notification_delivery(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_notification_delivery(text,text) TO service_role;
COMMIT;
