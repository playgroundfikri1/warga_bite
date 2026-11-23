"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, MessageCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatWhatsAppUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/types/database";

export interface UserWithComplex extends Profile {
  complexes?: { name: string } | null;
}

export function UsersClient({ users }: { users: UserWithComplex[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchQuery =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.house_block.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || u.verification_status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [users, search, statusFilter]);

  async function toggleCourier(user: UserWithComplex) {
    setBusyId(user.id);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          is_courier: !user.is_courier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Cari nama warga, email, atau blok rumah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
        >
          <option value="all">Semua Status</option>
          <option value="approved">Terverifikasi</option>
          <option value="pending">Pending (Browse-Only)</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#64748B]">
              Tidak ada warga yang cocok dengan pencarian.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                  <tr>
                    <th className="py-3 px-4">Nama Warga</th>
                    <th className="py-3 px-4">Komplek &amp; Blok</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4 text-right">Kurir &amp; Kontak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#1E293B]">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-[#64748B]">{user.email}</p>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        <p className="text-[#1E293B]">{user.house_block}</p>
                        <p className="text-xs">{user.complexes?.name ?? "-"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            user.verification_status === "approved"
                              ? "success"
                              : user.verification_status === "pending"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {user.verification_status === "approved"
                            ? "Terverifikasi"
                            : user.verification_status === "pending"
                              ? "Pending"
                              : "Ditolak"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.is_super_admin && (
                            <Badge variant="primary">Super Admin</Badge>
                          )}
                          {user.is_admin && !user.is_super_admin && (
                            <Badge variant="primary">Admin</Badge>
                          )}
                          {user.is_seller && (
                            <Badge variant="success">Penjual</Badge>
                          )}
                          {user.is_courier && (
                            <Badge variant="warning">Kurir</Badge>
                          )}
                          {!user.is_admin &&
                            !user.is_super_admin &&
                            !user.is_seller &&
                            !user.is_courier && (
                              <Badge variant="neutral">Pembeli</Badge>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={formatWhatsAppUrl(user.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#16A34A] hover:bg-[#F0FDF4]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WA
                          </a>
                          <button
                            type="button"
                            disabled={
                              busyId === user.id ||
                              user.verification_status !== "approved"
                            }
                            onClick={() => toggleCourier(user)}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition disabled:opacity-40 ${
                              user.is_courier
                                ? "bg-[#EA580C] text-white"
                                : "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <Bike className="h-3.5 w-3.5" />
                            {user.is_courier ? "Kurir Aktif" : "Jadikan Kurir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
