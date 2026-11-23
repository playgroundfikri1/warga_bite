"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crosshair, MapPin, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { City, PostalCode, Province } from "@/types/database";

interface Props {
  provinces: Province[];
  cities: City[];
  postalCodes: PostalCode[];
  adminUserId: string;
}

const LOCATION_PRESETS = [
  { label: "Kota Serang (Cipocok)", lat: -6.1264, lng: 106.1705 },
  { label: "Kota Serang (Cipare)", lat: -6.1118, lng: 106.1539 },
  { label: "Jakarta Selatan", lat: -6.3324, lng: 106.8227 },
];

export function NewComplexForm({
  provinces,
  cities,
  postalCodes,
  adminUserId,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clusterName, setClusterName] = useState("");
  const [provinceId, setProvinceId] = useState(provinces[0]?.id ?? "");
  const [cityId, setCityId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [address, setAddress] = useState("");

  const [lat, setLat] = useState("-6.1264");
  const [lng, setLng] = useState("106.1705");
  const [maxRadiusKm, setMaxRadiusKm] = useState("10");
  const [monthlyFee, setMonthlyFee] = useState("25000");
  const [isCourierEnabled, setIsCourierEnabled] = useState(false);
  const [allowCrossComplex, setAllowCrossComplex] = useState(false);

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCities = useMemo(
    () => cities.filter((c) => c.province_id === provinceId),
    [cities, provinceId]
  );

  const activeCityId = filteredCities.some((c) => c.id === cityId)
    ? cityId
    : (filteredCities[0]?.id ?? "");

  const filteredPostalCodes = useMemo(
    () => postalCodes.filter((p) => p.city_id === activeCityId),
    [postalCodes, activeCityId]
  );

  const activePostalCode = filteredPostalCodes.some(
    (p) => p.postal_code === postalCode
  )
    ? postalCode
    : (filteredPostalCodes[0]?.postal_code ?? "");

  function handleUseBrowserGps() {
    if (!navigator.geolocation) {
      setErrorMsg("Browser tidak mendukung fitur GPS.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      () => {
        setErrorMsg("Gagal mengambil lokasi GPS browser. Izinkan akses lokasi.");
        setGpsLoading(false);
      }
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      setErrorMsg("Koordinat Latitude dan Longitude harus berupa angka valid.");
      return;
    }

    if (!provinceId || !activeCityId || !activePostalCode) {
      setErrorMsg("Provinsi, Kota/Kabupaten, dan Kode Pos wajib dipilih.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("complexes").insert({
        province_id: provinceId,
        city_id: activeCityId,
        postal_code: activePostalCode,
        name: name.trim(),
        cluster_name: clusterName.trim() || null,
        rt: rt.trim() || null,
        rw: rw.trim() || null,
        address: address.trim(),
        location: `SRID=4326;POINT(${parsedLng} ${parsedLat})`,
        is_courier_enabled: isCourierEnabled,
        allow_cross_complex: allowCrossComplex,
        max_delivery_radius_km: Number(maxRadiusKm) || 10,
        monthly_subscription_price: Number(monthlyFee) || 25000,
        created_by: adminUserId,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard/complexes");
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan komplek baru."
      );
      setLoading(false);
    }
  }

  const parsedLatNum = Number(lat) || -6.1264;
  const parsedLngNum = Number(lng) || 106.1705;
  const bbox = `${parsedLngNum - 0.01},${parsedLatNum - 0.01},${parsedLngNum + 0.01},${parsedLatNum + 0.01}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${parsedLatNum},${parsedLngNum}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Wilayah & Alamat */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Wilayah &amp; Alamat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1E293B]">
                Nama Komplek / Perumahan *
              </label>
              <Input
                required
                placeholder="cth: Taman Graha Asri Serang"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1E293B]">
                Nama Cluster (Opsional)
              </label>
              <Input
                placeholder="cth: Cluster Bougenville"
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Provinsi *
                </label>
                <select
                  value={provinceId}
                  onChange={(e) => {
                    setProvinceId(e.target.value);
                    setCityId("");
                    setPostalCode("");
                  }}
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                >
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Kota / Kabupaten *
                </label>
                <select
                  value={activeCityId}
                  onChange={(e) => {
                    setCityId(e.target.value);
                    setPostalCode("");
                  }}
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                >
                  {filteredCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1E293B]">
                Kode Pos &amp; Kelurahan *
              </label>
              <select
                value={activePostalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              >
                {filteredPostalCodes.map((pc) => (
                  <option key={pc.id} value={pc.postal_code}>
                    {pc.postal_code} — {pc.subdistrict_name}, Kec.{" "}
                    {pc.district_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Cakupan RT
                </label>
                <Input
                  placeholder="cth: 001-006"
                  value={rt}
                  onChange={(e) => setRt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Cakupan RW
                </label>
                <Input
                  placeholder="cth: 004"
                  value={rw}
                  onChange={(e) => setRw(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1E293B]">
                Alamat Lengkap Komplek *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Jl. Raya Cipocok Jaya, Kec. Cipocok Jaya, Kota Serang, Banten"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Kolom Kanan: Titik Lokasi & Pengaturan */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#EA580C]" />
                Titik Lokasi GPS Komplek
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseBrowserGps}
                disabled={gpsLoading}
              >
                <Crosshair className="h-3.5 w-3.5 text-[#EA580C]" />
                {gpsLoading ? "Mencari GPS..." : "Ambil GPS Saat Ini"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLat(String(preset.lat));
                      setLng(String(preset.lng));
                    }}
                    className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#64748B] hover:border-[#EA580C] hover:text-[#EA580C] transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#E2E8F0] h-52 bg-[#F8FAFC]">
                <iframe
                  title="Pratinjau Peta Lokasi Komplek"
                  src={mapUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64748B]">
                    Latitude *
                  </label>
                  <Input
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64748B]">
                    Longitude *
                  </label>
                  <Input
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Layanan &amp; Langganan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1E293B]">
                    Batas Radius Antar-Komplek (KM)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    step="0.5"
                    value={maxRadiusKm}
                    onChange={(e) => setMaxRadiusKm(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1E293B]">
                    Biaya Langganan Seller / Bulan (Rp)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">
                    Aktifkan Layanan Kurir Komplek
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Penjual dapat menugaskan pesanan COD ke kurir warga.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isCourierEnabled}
                  onChange={(e) => setIsCourierEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#EA580C]"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">
                    Izinkan Pesanan Antar-Komplek (Fase 2)
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Biarkan nonaktif untuk fokus Fase 1 (dalam 1 komplek).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowCrossComplex}
                  onChange={(e) => setAllowCrossComplex(e.target.checked)}
                  className="h-4 w-4 accent-[#EA580C]"
                />
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard/complexes"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#1E293B] hover:bg-[#F8FAFC]"
        >
          Batal
        </Link>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? "Menyimpan..." : "Simpan Komplek"}
        </Button>
      </div>
    </form>
  );
}
