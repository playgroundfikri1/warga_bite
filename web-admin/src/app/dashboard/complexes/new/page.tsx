import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAdminProfile } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { NewComplexForm } from "@/components/dashboard/new-complex-form";
import type { City, PostalCode, Province } from "@/types/database";

export default async function NewComplexPage() {
  const { profile } = await requireAdminProfile();
  const supabase = await createClient();

  const [{ data: provinces }, { data: cities }, { data: postalCodes }] =
    await Promise.all([
      supabase.from("provinces").select("*").order("name"),
      supabase.from("cities").select("*").order("name"),
      supabase.from("postal_codes").select("*").order("postal_code"),
    ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Link href="/dashboard/complexes" className="hover:text-[#EA580C]">
            Kelola Komplek
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-[#1E293B]">Tambah Baru</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Tambah Komplek Baru
        </h1>
      </div>

      <NewComplexForm
        provinces={(provinces ?? []) as Province[]}
        cities={(cities ?? []) as City[]}
        postalCodes={(postalCodes ?? []) as PostalCode[]}
        adminUserId={profile.id}
      />
    </div>
  );
}
