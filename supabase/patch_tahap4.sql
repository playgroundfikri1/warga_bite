-- PATCH TAHAP 4A (BELUM DIJALANKAN — menunggu persetujuan user)
-- Isi: kolom bukti serah terima, bucket Storage privat, RPC place_order,
-- advance_order_status, complete_order_with_proof, get_reorder_items, guard status pesanan.

-- 1. Kolom bukti serah terima
ALTER TABLE orders ADD COLUMN IF NOT EXISTS food_photo_path TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS house_photo_path TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_by UUID REFERENCES profiles(id);

-- 2. Bucket privat bukti serah terima. Path: {uid_pengirim}/{order_id}/{food|house}.jpg
INSERT INTO storage.buckets (id, name, public)
VALUES ('handoff-proofs', 'handoff-proofs', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Pengirim upload bukti serah terima" ON storage.objects;
CREATE POLICY "Pengirim upload bukti serah terima"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'handoff-proofs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Pihak terkait baca bukti serah terima" ON storage.objects;
CREATE POLICY "Pihak terkait baca bukti serah terima"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'handoff-proofs'
    AND (
        (storage.foldername(name))[1] = (SELECT auth.uid())::text
        OR EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id::text = (storage.foldername(name))[2]
              AND (SELECT auth.uid()) IN (o.customer_id, o.seller_id, o.courier_id)
        )
    )
);

-- 3. Guard: status COMPLETED / bukti hanya boleh lewat RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION guard_order_direct_update()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL OR current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  NEW.order_status := OLD.order_status;
  NEW.payment_status := OLD.payment_status;
  NEW.total_amount := OLD.total_amount;
  NEW.customer_id := OLD.customer_id;
  NEW.seller_id := OLD.seller_id;
  NEW.qr_handoff_token := OLD.qr_handoff_token;
  NEW.food_photo_path := OLD.food_photo_path;
  NEW.house_photo_path := OLD.house_photo_path;
  NEW.delivered_at := OLD.delivered_at;
  NEW.delivered_by := OLD.delivered_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_guard_order_direct_update ON orders;
CREATE TRIGGER trg_guard_order_direct_update
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION guard_order_direct_update();

-- 4. Checkout COD. p_items: [{"product_id": "...", "quantity": 2}, ...] (1 penjual per pesanan)
CREATE OR REPLACE FUNCTION place_order(p_items JSONB, p_notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_buyer profiles%ROWTYPE;
    v_seller_id UUID;
    v_seller_complex UUID;
    v_total INTEGER := 0;
    v_order_id UUID;
    v_code TEXT;
    v_item JSONB;
    v_prod products%ROWTYPE;
    v_qty INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Silakan masuk terlebih dahulu.');
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Keranjang kosong.');
    END IF;

    SELECT * INTO v_buyer FROM profiles WHERE id = v_uid;
    IF NOT FOUND OR v_buyer.verification_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akun belum diverifikasi admin komplek.');
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_qty := (v_item->>'quantity')::INTEGER;
        IF v_qty IS NULL OR v_qty <= 0 THEN
            RETURN jsonb_build_object('success', false, 'message', 'Jumlah item tidak valid.');
        END IF;
        SELECT * INTO v_prod FROM products WHERE id = (v_item->>'product_id')::UUID;
        IF NOT FOUND OR NOT v_prod.is_available THEN
            RETURN jsonb_build_object('success', false, 'message', 'Ada menu yang sudah tidak tersedia.');
        END IF;
        IF v_seller_id IS NULL THEN
            v_seller_id := v_prod.seller_id;
            v_seller_complex := v_prod.complex_id;
        ELSIF v_seller_id <> v_prod.seller_id THEN
            RETURN jsonb_build_object('success', false, 'message', 'Satu pesanan hanya untuk satu penjual.');
        END IF;
    END LOOP;

    IF v_seller_complex <> v_buyer.complex_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pesanan lintas komplek belum didukung di aplikasi ini.');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM profiles s
        WHERE s.id = v_seller_id AND s.is_seller AND s.is_shop_open
          AND s.subscription_expires_at > NOW()
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Toko sedang tutup atau tidak aktif.');
    END IF;

    v_code := 'WB-' || to_char(NOW(), 'YYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    INSERT INTO orders (order_code, buyer_complex_id, seller_complex_id, customer_id, seller_id,
                        total_amount, delivery_fee, distance_km, payment_method, payment_status,
                        order_status, delivery_notes)
    VALUES (v_code, v_buyer.complex_id, v_seller_complex, v_uid, v_seller_id,
            0, 0, 0, 'cod', 'unpaid', 'CONFIRMED', NULLIF(trim(p_notes), ''))
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_qty := (v_item->>'quantity')::INTEGER;
        SELECT * INTO v_prod FROM products WHERE id = (v_item->>'product_id')::UUID;
        INSERT INTO order_items (order_id, product_id, product_name_snapshot, quantity, price_at_purchase)
        VALUES (v_order_id, v_prod.id, v_prod.name, v_qty, v_prod.price);
        v_total := v_total + v_prod.price * v_qty;
    END LOOP;

    UPDATE orders SET total_amount = v_total WHERE id = v_order_id;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'order_code', v_code, 'total_amount', v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Transisi status oleh penjual: CONFIRMED->PREPARING->SENT, atau CANCELLED
CREATE OR REPLACE FUNCTION advance_order_status(p_order_id UUID, p_new_status TEXT)
RETURNS JSONB AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_uid UUID := auth.uid();
BEGIN
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan.');
    END IF;

    IF p_new_status = 'CANCELLED' THEN
        IF v_uid NOT IN (v_order.seller_id, v_order.customer_id)
           OR v_order.order_status NOT IN ('CONFIRMED', 'PREPARING') THEN
            RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak dapat dibatalkan.');
        END IF;
    ELSIF p_new_status = 'PREPARING' AND v_order.order_status = 'CONFIRMED' AND v_uid = v_order.seller_id THEN
        NULL;
    ELSIF p_new_status = 'SENT' AND v_order.order_status = 'PREPARING' AND v_uid = v_order.seller_id THEN
        NULL;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Perubahan status tidak diizinkan.');
    END IF;

    UPDATE orders SET order_status = p_new_status, updated_at = NOW() WHERE id = p_order_id;
    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'order_status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Serah terima: QR token (UUID) ATAU kode pesanan, WAJIB 2 foto bukti
CREATE OR REPLACE FUNCTION complete_order_with_proof(
    p_identifier TEXT,
    p_food_photo_path TEXT,
    p_house_photo_path TEXT
) RETURNS JSONB AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_uid UUID := auth.uid();
BEGIN
    IF COALESCE(trim(p_food_photo_path), '') = '' OR COALESCE(trim(p_house_photo_path), '') = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Foto makanan dan foto rumah pembeli wajib diunggah.');
    END IF;

    SELECT * INTO v_order FROM orders
    WHERE order_code = upper(trim(p_identifier))
       OR qr_handoff_token::TEXT = lower(trim(p_identifier));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kode atau QR pesanan tidak valid.');
    END IF;
    IF v_uid IS NULL OR v_uid NOT IN (v_order.seller_id, COALESCE(v_order.courier_id, v_order.seller_id)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda tidak memiliki akses untuk pesanan ini.');
    END IF;
    IF v_order.order_status <> 'SENT' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Status pesanan harus Diantar (SENT).');
    END IF;
    IF split_part(p_food_photo_path, '/', 1) <> v_uid::TEXT
       OR split_part(p_house_photo_path, '/', 1) <> v_uid::TEXT
       OR split_part(p_food_photo_path, '/', 2) <> v_order.id::TEXT
       OR split_part(p_house_photo_path, '/', 2) <> v_order.id::TEXT THEN
        RETURN jsonb_build_object('success', false, 'message', 'Path foto bukti tidak valid.');
    END IF;

    UPDATE orders
    SET order_status = 'COMPLETED',
        payment_status = 'paid',
        food_photo_path = p_food_photo_path,
        house_photo_path = p_house_photo_path,
        delivered_at = NOW(),
        delivered_by = v_uid,
        updated_at = NOW()
    WHERE id = v_order.id;

    RETURN jsonb_build_object('success', true, 'order_id', v_order.id, 'order_code', v_order.order_code, 'message', 'Pesanan selesai!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fungsi lama tanpa bukti foto dinonaktifkan agar tidak bisa dipakai melewati aturan foto wajib
REVOKE EXECUTE ON FUNCTION complete_order_by_qr(UUID) FROM PUBLIC, anon, authenticated;

-- 7. Reorder aman: item beserta status ketersediaan & langganan penjual
CREATE OR REPLACE FUNCTION get_reorder_items(p_order_id UUID)
RETURNS TABLE (
    product_id UUID, name TEXT, price INTEGER, image_url TEXT, quantity INTEGER,
    seller_id UUID, shop_name TEXT, can_order BOOLEAN, reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name::TEXT, p.price, p.image_url::TEXT, oi.quantity,
           p.seller_id, s.shop_name::TEXT,
           (p.is_available AND s.is_shop_open AND s.subscription_expires_at > NOW()) AS can_order,
           CASE
               WHEN NOT p.is_available THEN 'Menu sedang habis'
               WHEN NOT s.is_shop_open THEN 'Toko sedang tutup'
               WHEN s.subscription_expires_at IS NULL OR s.subscription_expires_at <= NOW() THEN 'Toko tidak aktif'
               ELSE NULL
           END::TEXT
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    JOIN profiles s ON s.id = p.seller_id
    WHERE oi.order_id = p_order_id AND o.customer_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
