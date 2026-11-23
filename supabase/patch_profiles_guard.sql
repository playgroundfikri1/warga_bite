-- PATCH KEAMANAN (BELUM DIJALANKAN — menunggu persetujuan user)
-- Masalah: policy "Users manage own profile" (FOR ALL) memungkinkan user biasa mengubah
-- kolom sensitif sendiri (is_admin, verification_status, is_seller, subscription_*, dll).
-- Solusi: trigger yang mengembalikan kolom sensitif ke nilai lama / memaksa nilai awal
-- kecuali pelaku adalah admin (atau service role / RPC SECURITY DEFINER).

CREATE OR REPLACE FUNCTION guard_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role / koneksi tanpa JWT user (mis. dashboard SQL) dilewatkan
  IF auth.uid() IS NULL OR current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  -- Admin boleh mengubah apa pun
  IF is_current_user_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'pending';
    NEW.is_customer := TRUE;
    NEW.is_seller := FALSE;
    NEW.is_courier := FALSE;
    NEW.is_admin := FALSE;
    NEW.is_super_admin := FALSE;
    NEW.seller_request_status := 'none';
    NEW.subscription_status := 'none';
    NEW.subscription_expires_at := NULL;
    NEW.seller_approved_at := NULL;
  ELSE
    NEW.verification_status := OLD.verification_status;
    NEW.is_seller := OLD.is_seller;
    NEW.is_courier := OLD.is_courier;
    NEW.is_admin := OLD.is_admin;
    NEW.is_super_admin := OLD.is_super_admin;
    NEW.subscription_status := OLD.subscription_status;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
    NEW.seller_approved_at := OLD.seller_approved_at;
    NEW.complex_id := OLD.complex_id;
    -- user hanya boleh mengajukan seller (none/rejected -> pending)
    IF NEW.seller_request_status IS DISTINCT FROM OLD.seller_request_status
       AND NOT (NEW.seller_request_status = 'pending' AND OLD.seller_request_status IN ('none','rejected')) THEN
      NEW.seller_request_status := OLD.seller_request_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_guard_profile_sensitive ON profiles;
CREATE TRIGGER trg_guard_profile_sensitive
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION guard_profile_sensitive_columns();
