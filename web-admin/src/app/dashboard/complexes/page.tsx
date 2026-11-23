import Link from "next/link";
import { Building2, MapPin, Plus, Truck } from "lucide-react";
import { requireAdminProfile } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

interface ComplexRow {
  id: string;
  name: string;
  cluster_name: string | null;
  postal_code: string;
  rt: string | null;
  rw: string | null;
  address: string;
  is_courier_enabled: boolean;
  allow_cross_complex: boolean;
  max_delivery_radius_km: number;
  monthly_subscription_price: number;
  provinces?: { name: string } | null;
  cities?: { name: string } | null;
}

export default async function ComplexesPage() {
  await requireAdminProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("complexes")
    .select(
      "id, name, cluster_name, postal_code, rt, rw, address, is_courier_enabled, allow_cross_complex, max_delivery_radius_km, monthly_subscription_price, provinces(name), cities(name)"
    )
    .order("created_at", { ascending: false });

  const complexes = (data ?? []) as unknown as ComplexRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Kelola Komplek</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Admin Komplek &amp; Super Admin dapat mendaftarkan komplek/cluster
            baru (termasuk wilayah Kota Serang &amp; Jabodetabek).
          </p>
        </div>
        <Link
          href="/dashboard/complexes/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EA580C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#F97316] transition"
        >
          <Plus className="h-4 w-4" />
          Tambah Komplek Baru
        </Link>
      </div>

      {complexes.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-[#64748B]">
            Belum ada data komplek. Klik &ldquo;Tambah Komplek Baru&rdquo; untuk
            memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {complexes.map((item) => (
            <Card key={item.id} className="hover:border-[#EA580C]/40 transition">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#EA580C]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-[#1E293B] leading-tight">
                        {item.name}
                      </h2>
                      {item.cluster_name && (
                        <p className="text-xs text-[#64748B]">
                          {item.cluster_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="primary">
                    {formatRupiah(item.monthly_subscription_price)}/bln
                  </Badge>
                </div>

                <div className="text-xs text-[#64748B] space-y-1">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#EA580C] shrink-0 mt-0.5" />
                    <span>
                      {item.address} ({item.cities?.name ?? "-"},{" "}
                      {item.provinces?.name ?? "-"} {item.postal_code})
                    </span>
                  </p>
                  {(item.rt || item.rw) && (
                    <p>
                      Cakupan RT {item.rt || "-"} / RW {item.rw || "-"} • Radius
                      maks {item.max_delivery_radius_km} km
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E8F0]">
                  <Badge variant={item.is_courier_enabled ? "success" : "neutral"}>
                    <Truck className="h-3 w-3 mr-1" />
                    {item.is_courier_enabled ? "Kurir Aktif" : "Tanpa Kurir"}
                  </Badge>
                  <Badge
                    variant={item.allow_cross_complex ? "primary" : "neutral"}
                  >
                    {item.allow_cross_complex
                      ? "Antar-Komplek Aktif"
                      : "Khusus 1 Komplek"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
