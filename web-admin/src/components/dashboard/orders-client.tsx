"use client";

import { useEffect, useMemo, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Radio, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Order, OrderStatus } from "@/types/database";

export interface OrderRow extends Order {
  customer?: { full_name: string; house_block: string } | null;
  seller?: { full_name: string; shop_name: string | null } | null;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu Bayar",
  CONFIRMED: "Dikonfirmasi",
  PREPARING: "Dimasak",
  SENT: "Diantar",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

function getStatusVariant(status: OrderStatus) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "danger";
  if (status === "SENT" || status === "PREPARING") return "warning";
  return "primary";
}

export function OrdersClient({
  initialOrders,
  complexId,
  isSuperAdmin,
}: {
  initialOrders: OrderRow[];
  complexId: string;
  isSuperAdmin: boolean;
}) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders-admin-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async () => {
          let query = supabase
            .from("orders")
            .select(
              "*, customer:profiles!orders_customer_id_fkey(full_name, house_block), seller:profiles!orders_seller_id_fkey(full_name, shop_name)"
            )
            .order("created_at", { ascending: false })
            .limit(200);

          if (!isSuperAdmin) {
            query = query.eq("seller_complex_id", complexId);
          }

          const { data } = await query;
          if (data) {
            setOrders(data as unknown as OrderRow[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [complexId, isSuperAdmin]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchQuery =
        !q ||
        order.order_code.toLowerCase().includes(q) ||
        (order.customer?.full_name ?? "").toLowerCase().includes(q) ||
        (order.seller?.shop_name ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || order.order_status === statusFilter;
      const orderDate = order.created_at.slice(0, 10);
      const matchStart = !startDate || orderDate >= startDate;
      const matchEnd = !endDate || orderDate <= endDate;
      return matchQuery && matchStatus && matchStart && matchEnd;
    });
  }, [orders, search, statusFilter, startDate, endDate]);

  const columns = useMemo<LegacyColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: "order_code",
        header: "Kode Pesanan",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-[#1E293B]">
              {row.original.order_code}
            </p>
            <p className="text-xs text-[#64748B]">
              {new Date(row.original.created_at).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ),
      },
      {
        id: "customer",
        header: "Pembeli",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-[#1E293B]">
              {row.original.customer?.full_name ?? "-"}
            </p>
            <p className="text-xs text-[#64748B]">
              {row.original.customer?.house_block ?? "-"}
            </p>
          </div>
        ),
      },
      {
        id: "seller",
        header: "Penjual",
        cell: ({ row }) => (
          <span className="text-[#1E293B]">
            {row.original.seller?.shop_name ||
              row.original.seller?.full_name ||
              "-"}
          </span>
        ),
      },
      {
        accessorKey: "total_amount",
        header: "Total COD",
        cell: ({ row }) => (
          <span className="font-semibold text-[#1E293B]">
            {formatRupiah(row.original.total_amount)}
          </span>
        ),
      },
      {
        accessorKey: "payment_status",
        header: "Pembayaran",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.payment_status === "paid" ? "success" : "neutral"
            }
          >
            {row.original.payment_method.toUpperCase()} •{" "}
            {row.original.payment_status === "paid" ? "Lunas" : "Belum Bayar"}
          </Badge>
        ),
      },
      {
        accessorKey: "order_status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.order_status)}>
            {STATUS_LABELS[row.original.order_status]}
          </Badge>
        ),
      },
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useLegacyTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function buildExportRows() {
    return filteredData.map((o) => ({
      "Kode Pesanan": o.order_code,
      Tanggal: new Date(o.created_at).toLocaleString("id-ID"),
      Pembeli: o.customer?.full_name ?? "-",
      "Blok Rumah": o.customer?.house_block ?? "-",
      Toko: o.seller?.shop_name || o.seller?.full_name || "-",
      "Metode Bayar": o.payment_method.toUpperCase(),
      "Status Bayar": o.payment_status,
      "Status Pesanan": STATUS_LABELS[o.order_status],
      "Total (Rp)": o.total_amount,
      Catatan: o.delivery_notes ?? "",
    }));
  }

  function handleExportCsv() {
    const csv = Papa.unparse(buildExportRows());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pesanan-wargabite-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pesanan COD");
    XLSX.writeFile(
      workbook,
      `pesanan-wargabite-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
          <Radio className="h-3.5 w-3.5" />
          Pembaruan Real-time Aktif
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5 text-[#EA580C]" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Excel (.xlsx)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Cari kode pesanan, pembeli, atau nama toko..."
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
          <option value="all">Semua Status Pesanan</option>
          <option value="CONFIRMED">Dikonfirmasi</option>
          <option value="PREPARING">Dimasak</option>
          <option value="SENT">Diantar</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Tanggal mulai"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="Tanggal akhir"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#64748B]">
              Belum ada pesanan COD yang sesuai filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="py-3 px-4">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F8FAFC]">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-3 px-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
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
