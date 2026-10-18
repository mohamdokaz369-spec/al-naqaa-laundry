BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) CHECK (total_amount >= 0);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
CREATE OR REPLACE FUNCTION public.touch_cash_payment() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.total_amount IS NULL THEN
    RAISE EXCEPTION 'حدد المبلغ قبل تسجيل التحصيل';
  END IF;
  IF NEW.payment_status = 'paid' THEN
    IF TG_OP = 'INSERT' THEN NEW.paid_at := now();
    ELSIF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN NEW.paid_at := now();
    ELSE NEW.paid_at := OLD.paid_at;
    END IF;
  ELSE NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS orders_touch_cash_payment ON public.orders;
CREATE TRIGGER orders_touch_cash_payment BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_cash_payment();
COMMIT;
