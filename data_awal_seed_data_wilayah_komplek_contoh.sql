-- ============================================================================
-- SEED DATA AWAL — JALANKAN SETELAH schema.sql BERHASIL DI SUPABASE
-- Berisi wilayah Jabodetabek + Kota Serang (Banten) & contoh komplek awal.
-- ============================================================================

-- 1. CONTOH PROVINSI
INSERT INTO provinces (id, name) VALUES
    ('31', 'DKI Jakarta'),
    ('32', 'Jawa Barat'),
    ('36', 'Banten')
ON CONFLICT (id) DO NOTHING;

-- 2. CONTOH KOTA / KABUPATEN (Termasuk Kota Serang - 3673)
INSERT INTO cities (id, province_id, name) VALUES
    ('3174', '31', 'Jakarta Selatan'),
    ('3175', '31', 'Jakarta Timur'),
    ('3276', '32', 'Kota Depok'),
    ('3275', '32', 'Kota Bekasi'),
    ('3673', '36', 'Kota Serang'),
    ('3674', '36', 'Kota Tangerang Selatan')
ON CONFLICT (id) DO NOTHING;

-- 3. CONTOH KODE POS (Termasuk Kecamatan Utama di Kota Serang)
INSERT INTO postal_codes (city_id, district_name, subdistrict_name, postal_code) VALUES
    -- Kota Serang (Banten)
    ('3673', 'Serang', 'Cipare', '42117'),
    ('3673', 'Serang', 'Sumurpecung', '42118'),
    ('3673', 'Serang', 'Kotabaru', '42112'),
    ('3673', 'Serang', 'Unyur', '42111'),
    ('3673', 'Cipocok Jaya', 'Cipocok Jaya', '42121'),
    ('3673', 'Cipocok Jaya', 'Banjaragung', '42122'),
    ('3673', 'Cipocok Jaya', 'Panancangan', '42124'),
    ('3673', 'Taktakan', 'Taktakan', '42162'),
    ('3673', 'Taktakan', 'Drangong', '42162'),
    ('3673', 'Walantaka', 'Walantaka', '42183'),
    ('3673', 'Curug', 'Curug', '42171'),
    ('3673', 'Kasemen', 'Kasemen', '42191'),
    -- Jakarta Selatan, Depok & Tangerang Selatan
    ('3174', 'Jagakarsa', 'Jagakarsa', '12620'),
    ('3174', 'Cilandak', 'Cilandak Barat', '12430'),
    ('3174', 'Pasar Minggu', 'Ragunan', '12550'),
    ('3276', 'Cinere', 'Cinere', '16514'),
    ('3674', 'Serpong', 'Rawa Buntu', '15318');

-- 4. CONTOH KOMPLEK AWAL (Siap dites di Dropdown Registrasi Mobile & Web Admin)
INSERT INTO complexes (
    province_id, city_id, postal_code, name, cluster_name,
    rt, rw, address, location,
    is_courier_enabled, allow_cross_complex, max_delivery_radius_km, monthly_subscription_price
) VALUES
(
    '36', '3673', '42121',
    'Taman Graha Asri Serang',
    'Cluster Bougenville',
    '001-006', '004',
    'Jl. Raya Cipocok Jaya, Kec. Cipocok Jaya, Kota Serang, Banten',
    ST_SetSRID(ST_MakePoint(106.1705, -6.1264), 4326)::geography,
    FALSE, FALSE, 10.00, 25000
),
(
    '36', '3673', '42117',
    'Perumahan Bumi Agung Permai',
    'Tahap 1',
    '001-008', '005',
    'Jl. Raya Banten, Cipare, Kec. Serang, Kota Serang, Banten',
    ST_SetSRID(ST_MakePoint(106.1539, -6.1118), 4326)::geography,
    TRUE, FALSE, 10.00, 25000
),
(
    '31', '3174', '12620',
    'Perumahan Taman Melati Residence',
    'Cluster Melati',
    '001-005', '008',
    'Jl. Raya Jagakarsa No. 88, Jakarta Selatan',
    ST_SetSRID(ST_MakePoint(106.8227, -6.3324), 4326)::geography,
    FALSE, FALSE, 10.00, 25000
);

-- ============================================================================
-- CATATAN AKTIVASI ADMIN / SUPER ADMIN PERTAMA:
-- 1. Daftar 1 akun biasa lewat aplikasi Mobile atau menu Authentication -> Users di Supabase.
-- 2. Setelah akun dibuat, jalankan perintah di bawah ini (ganti email-nya):
--
-- UPDATE profiles
-- SET verification_status = 'approved',
--     is_admin = TRUE,
--     is_super_admin = TRUE
-- WHERE email = 'email-super-admin-kamu@gmail.com';
-- ============================================================================