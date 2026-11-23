-- ============================================================================
-- SKEMA DATABASE FINAL — APLIKASI KATALOG MAKANAN KOMPLEK (MVP FASE 1)
-- Jalankan seluruh skrip ini di menu SQL Editor Supabase.
-- Fitur: Dropdown Wilayah, PostGIS 10 km, Browse-Only Pending, COD,
--        QR Handoff, Gratis 30 Hari Seller -> Wajib Langganan,
--        & Tambah Komplek oleh Admin (Mobile & Web Admin).
-- ============================================================================

-- 1. EKSTENSI WAJIB
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. MASTER DATA WILAYAH (Dropdown Berjenjang untuk Form Admin Komplek)
CREATE TABLE provinces (
    id VARCHAR(10) PRIMARY KEY, -- Kode BPS/Kemendagri, cth: '36' (Banten)
    name VARCHAR(100) NOT NULL
);

CREATE TABLE cities (
    id VARCHAR(10) PRIMARY KEY, -- cth: '3673' (Kota Serang)
    province_id VARCHAR(10) NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE postal_codes (
    id SERIAL PRIMARY KEY,
    city_id VARCHAR(10) NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    district_name VARCHAR(100) NOT NULL,
    subdistrict_name VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL
);

CREATE INDEX idx_cities_province ON cities(province_id);
CREATE INDEX idx_postal_city ON postal_codes(city_id);
CREATE INDEX idx_postal_code ON postal_codes(postal_code);

-- 3. MASTER KOMPLEK / CLUSTER (Bisa didaftarkan Admin via Mobile & Web Admin)
CREATE TABLE complexes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province_id VARCHAR(10) NOT NULL REFERENCES provinces(id),
    city_id VARCHAR(10) NOT NULL REFERENCES cities(id),
    postal_code VARCHAR(10) NOT NULL,
    name VARCHAR(150) NOT NULL,
    cluster_name VARCHAR(100),
    rt VARCHAR(20),
    rw VARCHAR(20),
    address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,           -- Titik tengah GPS Komplek (lng, lat)
    is_courier_enabled BOOLEAN DEFAULT FALSE,
    allow_cross_complex BOOLEAN DEFAULT FALSE,
    max_delivery_radius_km NUMERIC(5,2) DEFAULT 10.00,  -- Default batas 10 km
    monthly_subscription_price INTEGER DEFAULT 25000,   -- Harga langganan bulanan seller (Rp)
    created_by UUID REFERENCES auth.users(id),          -- Admin yang mendaftarkan komplek
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complexes_location ON complexes USING GIST (location);
CREATE INDEX idx_complexes_city_postal ON complexes(city_id, postal_code);

-- 4. PROFIL PENGGUNA (Multi-Role + Sistem Langganan Seller 30 Hari Trial)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    complex_id UUID NOT NULL REFERENCES complexes(id),
    
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(25) NOT NULL,                         -- Nomor WA untuk info kontak saja (bukan login)
    house_block VARCHAR(100) NOT NULL,                  -- cth: 'Blok C4 No. 12'
    full_address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),                    -- Titik GPS rumah (opsional)
    
    -- Status Verifikasi Manual Admin ('pending' = Browse-Only)
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    
    -- Multi-Role Flags
    is_customer BOOLEAN DEFAULT TRUE,
    is_seller BOOLEAN DEFAULT FALSE,
    seller_request_status VARCHAR(20) DEFAULT 'none'
        CHECK (seller_request_status IN ('none', 'pending', 'approved', 'rejected')),
    is_courier BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    
    -- Data Toko & Langganan Penjual (Gratis 30 hari, lalu wajib berlangganan)
    shop_name VARCHAR(150),
    shop_description TEXT,
    is_shop_open BOOLEAN DEFAULT TRUE,
    seller_approved_at TIMESTAMPTZ,
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'none'
        CHECK (subscription_status IN ('none', 'trial', 'active', 'expired')),
    subscription_expires_at TIMESTAMPTZ,                -- Kunci utama: produk hanya tampil jika > NOW()
    expo_push_token TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_complex ON profiles(complex_id);
CREATE INDEX idx_profiles_verification ON profiles(complex_id, verification_status);
CREATE INDEX idx_profiles_seller_sub ON profiles(complex_id, is_seller, subscription_expires_at);

-- 5. RIWAYAT LANGGANAN PENJUAL (Log Trial 30 Hari & Perpanjangan Berbayar)
CREATE TABLE seller_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    complex_id UUID NOT NULL REFERENCES complexes(id),
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('trial_30d', 'monthly', 'custom')),
    amount_paid INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    duration_days INTEGER NOT NULL DEFAULT 30 CHECK (duration_days > 0),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    payment_notes TEXT,
    activated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seller_subs_seller ON seller_subscriptions(seller_id, ends_at DESC);
CREATE INDEX idx_seller_subs_complex ON seller_subscriptions(complex_id, created_at DESC);

-- 6. KATALOG PRODUK (Makanan, Minuman & Jajanan)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    complex_id UUID NOT NULL REFERENCES complexes(id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL CHECK (price >= 0),
    category VARCHAR(50) NOT NULL,                      -- 'Makanan Berat', 'Jajanan', 'Minuman', 'Lainnya'
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,                  -- Toggle Tersedia / Habis
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_complex_avail ON products(complex_id, is_available);
CREATE INDEX idx_products_seller ON products(seller_id);

-- 7. PESANAN & ITEM PESANAN (Fase 1: Khusus COD, Max 10 km, QR Handoff)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(25) UNIQUE NOT NULL,
    buyer_complex_id UUID NOT NULL REFERENCES complexes(id),
    seller_complex_id UUID NOT NULL REFERENCES complexes(id),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    seller_id UUID NOT NULL REFERENCES profiles(id),
    courier_id UUID REFERENCES profiles(id),
    
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    delivery_fee INTEGER DEFAULT 0,
    distance_km NUMERIC(5,2) DEFAULT 0.00 CHECK (distance_km <= 10.00),
    
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cod'
        CHECK (payment_method IN ('cod', 'qris')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
        
    order_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED'
        CHECK (order_status IN ('PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'SENT', 'COMPLETED', 'CANCELLED')),
        
    qr_handoff_token UUID UNIQUE DEFAULT uuid_generate_v4(),
    delivery_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name_snapshot VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase INTEGER NOT NULL
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_complex_status ON orders(seller_complex_id, order_status);

-- 8. SISTEM RATING & ULASAN
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id),
    seller_id UUID NOT NULL REFERENCES profiles(id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. FUNGSI HELPER (RPC)
-- ============================================================================

-- 9A. Approve Seller Baru + Otomatis Beri Gratis 30 Hari
CREATE OR REPLACE FUNCTION approve_seller_with_trial(p_seller_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_admin RECORD;
    v_seller RECORD;
    v_start TIMESTAMPTZ := NOW();
    v_end TIMESTAMPTZ := NOW() + INTERVAL '30 days';
BEGIN
    SELECT * INTO v_admin FROM profiles WHERE id = auth.uid();
    SELECT * INTO v_seller FROM profiles WHERE id = p_seller_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User tidak ditemukan.');
    END IF;

    IF NOT (v_admin.is_super_admin = TRUE OR (v_admin.is_admin = TRUE AND v_admin.complex_id = v_seller.complex_id)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
    END IF;

    UPDATE profiles
    SET is_seller = TRUE,
        seller_request_status = 'approved',
        seller_approved_at = v_start,
        subscription_status = 'trial',
        subscription_expires_at = v_end,
        updated_at = NOW()
    WHERE id = p_seller_id;

    INSERT INTO seller_subscriptions (seller_id, complex_id, plan_type, amount_paid, duration_days, starts_at, ends_at, payment_notes, activated_by)
    VALUES (p_seller_id, v_seller.complex_id, 'trial_30d', 0, 30, v_start, v_end, 'Gratis 30 hari pertama (Trial)', auth.uid());

    RETURN jsonb_build_object('success', true, 'expires_at', v_end, 'message', 'Penjual disetujui dengan gratis 30 hari!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9B. Perpanjang Langganan Berbayar Penjual
CREATE OR REPLACE FUNCTION extend_seller_subscription(
    p_seller_id UUID,
    p_duration_days INTEGER DEFAULT 30,
    p_amount_paid INTEGER DEFAULT 25000,
    p_notes TEXT DEFAULT 'Perpanjangan bulanan'
)
RETURNS JSONB AS $$
DECLARE
    v_admin RECORD;
    v_seller RECORD;
    v_start TIMESTAMPTZ;
    v_end TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_admin FROM profiles WHERE id = auth.uid();
    SELECT * INTO v_seller FROM profiles WHERE id = p_seller_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Penjual tidak ditemukan.');
    END IF;

    IF NOT (v_admin.is_super_admin = TRUE OR (v_admin.is_admin = TRUE AND v_admin.complex_id = v_seller.complex_id)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
    END IF;

    v_start := GREATEST(NOW(), COALESCE(v_seller.subscription_expires_at, NOW()));
    v_end := v_start + (p_duration_days || ' days')::INTERVAL;

    UPDATE profiles
    SET is_seller = TRUE,
        subscription_status = 'active',
        subscription_expires_at = v_end,
        updated_at = NOW()
    WHERE id = p_seller_id;

    INSERT INTO seller_subscriptions (seller_id, complex_id, plan_type, amount_paid, duration_days, starts_at, ends_at, payment_notes, activated_by)
    VALUES (p_seller_id, v_seller.complex_id, CASE WHEN p_duration_days = 30 THEN 'monthly' ELSE 'custom' END, p_amount_paid, p_duration_days, v_start, v_end, p_notes, auth.uid());

    RETURN jsonb_build_object('success', true, 'expires_at', v_end, 'message', 'Langganan penjual berhasil diperpanjang!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9C. Pencarian Produk Radius 10 km (HANYA Penjual dengan Langganan/Trial Aktif)
CREATE OR REPLACE FUNCTION get_products_within_radius(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 10.0,
    only_my_complex BOOLEAN DEFAULT TRUE,
    my_complex_id UUID DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    price INTEGER,
    category VARCHAR,
    image_url TEXT,
    is_available BOOLEAN,
    seller_id UUID,
    shop_name VARCHAR,
    complex_name VARCHAR,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.price, p.category, p.image_url, p.is_available,
        p.seller_id, pr.shop_name, c.name AS complex_name,
        ROUND((ST_Distance(
            c.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000.0)::numeric, 2)::DOUBLE PRECISION AS distance_km
    FROM products p
    JOIN profiles pr ON p.seller_id = pr.id
    JOIN complexes c ON p.complex_id = c.id
    WHERE pr.is_seller = TRUE
      AND pr.is_shop_open = TRUE
      AND pr.subscription_expires_at > NOW()
      AND (
          (only_my_complex = TRUE AND p.complex_id = my_complex_id)
          OR
          (only_my_complex = FALSE AND c.allow_cross_complex = TRUE AND ST_DWithin(
              c.location,
              ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
              radius_km * 1000
          ))
      )
    ORDER BY distance_km ASC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9D. Selesaikan Pesanan via Scan QR Code (oleh Seller / Kurir)
CREATE OR REPLACE FUNCTION complete_order_by_qr(p_qr_token UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM orders WHERE qr_handoff_token = p_qr_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'QR Code pesanan tidak valid.');
    END IF;

    IF auth.uid() NOT IN (v_order.seller_id, v_order.courier_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda tidak memiliki akses untuk menyelesaikan pesanan ini.');
    END IF;

    IF v_order.order_status <> 'SENT' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Status pesanan harus dalam tahap Diantar (SENT).');
    END IF;

    UPDATE orders
    SET order_status = 'COMPLETED',
        payment_status = 'paid',
        updated_at = NOW()
    WHERE id = v_order.id;

    RETURN jsonb_build_object('success', true, 'order_id', v_order.id, 'message', 'Pesanan selesai!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Complexes: Bisa dibaca publik; bisa ditambah & dikelola oleh Admin maupun Super Admin (Mobile & Web)
CREATE POLICY "Public can read complexes" ON complexes FOR SELECT USING (TRUE);
CREATE POLICY "Admins and super admins can manage complexes" ON complexes
FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE))
);

-- Profiles
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "Admins manage complex profiles" ON profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles admin_p
        WHERE admin_p.id = auth.uid()
          AND (admin_p.is_super_admin = TRUE OR (admin_p.is_admin = TRUE AND admin_p.complex_id = profiles.complex_id))
    )
);

-- Seller Subscriptions
CREATE POLICY "Sellers view own subscriptions" ON seller_subscriptions FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Admins manage complex subscriptions" ON seller_subscriptions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles admin_p
        WHERE admin_p.id = auth.uid()
          AND (admin_p.is_super_admin = TRUE OR (admin_p.is_admin = TRUE AND admin_p.complex_id = seller_subscriptions.complex_id))
    )
);

-- Products
CREATE POLICY "Browse active subscribed products in same complex" ON products FOR SELECT USING (
    complex_id = (SELECT complex_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM profiles s
        WHERE s.id = products.seller_id
          AND s.is_seller = TRUE
          AND s.is_shop_open = TRUE
          AND s.subscription_expires_at > NOW()
    )
);
CREATE POLICY "Sellers manage own products" ON products FOR ALL USING (
    seller_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_seller = TRUE AND verification_status = 'approved')
);
CREATE POLICY "Admins view all complex products" ON products FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles admin_p
        WHERE admin_p.id = auth.uid()
          AND (admin_p.is_super_admin = TRUE OR (admin_p.is_admin = TRUE AND admin_p.complex_id = products.complex_id))
    )
);

-- Orders
CREATE POLICY "Only approved users can order from active subscribed sellers" ON orders FOR INSERT WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND verification_status = 'approved')
    AND EXISTS (
        SELECT 1 FROM profiles s
        WHERE s.id = orders.seller_id
          AND s.is_seller = TRUE
          AND s.is_shop_open = TRUE
          AND s.subscription_expires_at > NOW()
    )
);
CREATE POLICY "View related orders" ON orders FOR SELECT USING (
    auth.uid() IN (customer_id, seller_id, courier_id) OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND (is_super_admin = TRUE OR (is_admin = TRUE AND complex_id = orders.seller_complex_id))
    )
);
CREATE POLICY "Seller or courier update order status" ON orders FOR UPDATE USING (
    auth.uid() IN (seller_id, courier_id)
);

-- Order Items
CREATE POLICY "Manage order items via order access" ON order_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id
          AND (auth.uid() IN (o.customer_id, o.seller_id, o.courier_id))
    )
);

-- Reviews
CREATE POLICY "Read reviews" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Only buyer of completed order can review" ON reviews FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid() AND order_status = 'COMPLETED')
);