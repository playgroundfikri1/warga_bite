"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

export interface DailyChartPoint {
  date: string;
  total: number;
  count: number;
}

export function DailyTransactionsChart({ data }: { data: DailyChartPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Transaksi COD Harian (14 Hari Terakhir)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-[#64748B]">
            Belum ada data transaksi COD pada periode ini.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickFormatter={(v) => `Rp${Math.round(Number(v) / 1000)}rb`}
                />
                <Tooltip
                  formatter={(value) => [
                    formatRupiah(Number(value ?? 0)),
                    "Omzet COD",
                  ]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    color: "#1E293B",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  dot={{ fill: "#EA580C", r: 4 }}
                  activeDot={{ r: 6, fill: "#F97316" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
