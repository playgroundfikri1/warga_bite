"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  adminName: string;
  adminEmail: string;
  isSuperAdmin: boolean;
  pendingCount: number;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/verifications",
    label: "Verifikasi Warga & Seller",
    icon: CheckCircle2,
    showBadge: true,
  },
  {
    href: "/dashboard/subscriptions",
    label: "Langganan Seller",
    icon: CreditCard,
  },
  {
    href: "/dashboard/users",
    label: "Manajemen Pengguna",
    icon: Users,
  },
  {
    href: "/dashboard/orders",
    label: "Pesanan COD",
    icon: ShoppingBag,
  },
  {
    href: "/dashboard/complexes",
    label: "Kelola Komplek",
    icon: Building2,
  },
];

export function DashboardSidebar({
  adminName,
  adminEmail,
  isSuperAdmin,
  pendingCount,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#E2E8F0] bg-white flex flex-col">
      <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F97316] text-white shadow-xs">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#1E293B] truncate">WargaBite</p>
            <p className="text-xs text-[#64748B]">Panel Admin Komplek</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="lg:hidden inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#DC2626]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-x-auto lg:overflow-visible flex lg:flex-col gap-1 lg:gap-0">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition whitespace-nowrap",
                isActive
                  ? "bg-[#FFF7ED] text-[#EA580C] font-semibold"
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#EA580C]" : "text-[#94A3B8]"
                  )}
                />
                <span>{item.label}</span>
              </span>
              {item.showBadge && pendingCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EA580C] px-1.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E2E8F0] space-y-3 hidden lg:block">
        <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1E293B] truncate">
              {adminName}
            </p>
            <Badge variant={isSuperAdmin ? "primary" : "success"}>
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] truncate mt-0.5">{adminEmail}</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:border-[#FECACA] transition"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
