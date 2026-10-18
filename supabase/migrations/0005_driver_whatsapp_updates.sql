-- Add pickup and delivery departure messages for existing notification installations.
BEGIN;
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
 IF o.whatsapp_opt_in AND NEW.status IN ('pending','scheduled','on_the_way','picked_up','ready','delivering','completed','cancelled') THEN
   INSERT INTO public.notification_outbox(order_id,history_id,channel,order_status)
   VALUES(o.id,NEW.id,'whatsapp_customer',NEW.status) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END;
$$;
COMMIT;
