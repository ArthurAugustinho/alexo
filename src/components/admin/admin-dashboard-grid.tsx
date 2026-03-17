import { TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCentsToBRL } from "@/helpers/money";
import type {
  AdminDashboardData,
  DashboardChart,
} from "@/lib/admin-dashboard";

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCurrencyFromUnits(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function SourceBadge({
  source,
}: {
  source: DashboardChart<unknown>["source"];
}) {
  return (
    <Badge variant={source === "real" ? "secondary" : "outline"}>
      {source === "real" ? "Dados reais" : "Estimado"}
    </Badge>
  );
}

function SummaryCard({ label, value, description }: SummaryCardProps) {
  return (
    <Card className="border-border/70 bg-background/90 rounded-3xl">
      <CardContent className="space-y-2 p-6">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          {label}
        </p>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  source,
  children,
}: {
  title: string;
  description: string;
  source: DashboardChart<unknown>["source"];
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-background/95 min-w-0 overflow-hidden rounded-3xl shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="max-w-lg">{description}</CardDescription>
        </div>
        <SourceBadge source={source} />
      </CardHeader>
      <CardContent className="min-w-0">{children}</CardContent>
    </Card>
  );
}

function buildPolylinePoints(values: number[], width = 100, height = 64) {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function RevenueChart({
  chart,
}: {
  chart: AdminDashboardData["revenueTrend"];
}) {
  const values = chart.data.map((point) => point.value);
  const polylinePoints = buildPolylinePoints(values);
  const areaPoints = `0,64 ${polylinePoints} 100,64`;
  const currentValue = chart.data.at(-1)?.value ?? 0;
  const previousValue = chart.data.at(-2)?.value ?? 0;

  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      source={chart.source}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr] sm:items-end">
          <div className="rounded-3xl bg-[linear-gradient(180deg,_rgba(139,92,246,0.14),_rgba(139,92,246,0.02))] p-4">
            <svg viewBox="0 0 100 64" className="h-44 w-full overflow-visible">
              <defs>
                <linearGradient id="admin-revenue-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139,92,246,0.35)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0.02)" />
                </linearGradient>
              </defs>

              {[16, 32, 48].map((line) => (
                <line
                  key={line}
                  x1="0"
                  y1={line}
                  x2="100"
                  y2={line}
                  stroke="rgba(148, 163, 184, 0.25)"
                  strokeDasharray="2 4"
                />
              ))}

              <polygon
                points={areaPoints}
                fill="url(#admin-revenue-gradient)"
              />
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="rgb(139, 92, 246)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border bg-muted/35 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                Hoje
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrencyFromUnits(currentValue)}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/35 p-4">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="size-4 text-primary" />
                <p className="text-sm font-medium">Variação diária</p>
              </div>
              <p className="mt-2 text-xl font-semibold">
                {currentValue >= previousValue ? "+" : ""}
                {formatCurrencyFromUnits(currentValue - previousValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {chart.data.slice(-4).map((point) => (
            <div key={point.label} className="rounded-2xl border px-3 py-3">
              <p className="text-muted-foreground text-xs">{point.label}</p>
              <p className="mt-1 font-semibold">
                {formatCurrencyFromUnits(point.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function VerticalBarChart({
  chart,
  formatter = formatNumber,
  suffix,
}: {
  chart:
    | AdminDashboardData["topProducts"]
    | AdminDashboardData["returnRateByCategory"];
  formatter?: (value: number) => string;
  suffix?: string;
}) {
  const max = Math.max(...chart.data.map((point) => point.value), 1);

  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      source={chart.source}
    >
      <div className="flex h-64 min-w-0 items-end gap-3 overflow-hidden">
        {chart.data.map((point) => {
          const height = (point.value / max) * 100;

          return (
            <div
              key={point.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-3"
            >
              <div className="flex h-48 w-full items-end">
                <div
                  className="w-full rounded-t-3xl bg-[linear-gradient(180deg,_rgba(139,92,246,0.92),_rgba(139,92,246,0.36))]"
                  style={{ height: `${Math.max(height, 12)}%` }}
                />
              </div>

              <div className="w-full text-center">
                <p className="truncate text-sm font-medium">{point.label}</p>
                <p className="text-muted-foreground text-xs">
                  {formatter(point.value)}
                  {suffix}
                </p>
                {point.description ? (
                  <p className="text-muted-foreground truncate text-[11px]">
                    {point.description}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

function FunnelChart({
  chart,
}: {
  chart:
    | AdminDashboardData["conversionFunnel"]
    | AdminDashboardData["logisticsFunnel"];
}) {
  const max = Math.max(...chart.data.map((point) => point.value), 1);

  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      source={chart.source}
    >
      <div className="space-y-3 overflow-hidden">
        {chart.data.map((point, index) => {
          const width = `${Math.max((point.value / max) * 100, 22)}%`;

          return (
            <div key={point.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{point.label}</span>
                <span className="text-muted-foreground">{formatNumber(point.value)}</span>
              </div>
              <div className="flex min-w-0 justify-center overflow-hidden">
                <div
                  className="max-w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white"
                  style={{
                    width,
                    background:
                      index % 2 === 0
                        ? "linear-gradient(90deg, rgba(124,58,237,1), rgba(167,139,250,1))"
                        : "linear-gradient(90deg, rgba(168,85,247,1), rgba(216,180,254,1))",
                  }}
                >
                  {formatNumber(point.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

function DonutChart({
  chart,
}: {
  chart: AdminDashboardData["paymentMethods"];
}) {
  const total = chart.data.reduce((sum, item) => sum + item.value, 0);
  const colors = ["#7c3aed", "#06b6d4", "#f97316"];
  let offset = 0;

  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      source={chart.source}
    >
      <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
        <div className="relative mx-auto size-44">
          <svg viewBox="0 0 42 42" className="size-full -rotate-90">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke="rgba(148,163,184,0.16)"
              strokeWidth="4"
            />
            {chart.data.map((item, index) => {
              const dash = (item.value / total) * 100;
              const segment = (
                <circle
                  key={item.label}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth="4"
                  strokeDasharray={`${dash} ${100 - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return segment;
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Total
            </span>
            <span className="text-2xl font-semibold">{formatNumber(total)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {chart.data.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              <span className="text-muted-foreground text-sm">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function ScatterChart({
  chart,
}: {
  chart: AdminDashboardData["averageTicketScatter"];
}) {
  const maxX = Math.max(...chart.data.map((point) => point.x), 1);
  const maxY = Math.max(...chart.data.map((point) => point.y), 1);
  const maxSize = Math.max(...chart.data.map((point) => point.size), 1);

  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      source={chart.source}
    >
      <div className="space-y-4">
        <svg viewBox="0 0 100 70" className="h-56 w-full rounded-3xl bg-muted/25 p-3">
          {[20, 40, 60].map((line) => (
            <line
              key={line}
              x1="8"
              y1={line}
              x2="96"
              y2={line}
              stroke="rgba(148, 163, 184, 0.24)"
              strokeDasharray="2 4"
            />
          ))}

          {chart.data.map((point) => {
            const x = 10 + (point.x / maxX) * 84;
            const y = 62 - (point.y / maxY) * 50;
            const radius = 2 + (point.size / maxSize) * 3;

            return (
              <circle
                key={point.label}
                cx={x}
                cy={y}
                r={radius}
                fill="rgba(124,58,237,0.75)"
                stroke="rgba(124,58,237,1)"
              />
            );
          })}
        </svg>

        <div className="grid gap-2 sm:grid-cols-2">
          {chart.data.slice(0, 4).map((point) => (
            <div key={point.label} className="rounded-2xl border px-4 py-3 text-sm">
              <p className="font-medium">{point.label}</p>
              <p className="text-muted-foreground">
                {point.x} pedidos • {formatCurrencyFromUnits(point.y)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function HeatmapChart({
  chart,
}: {
  chart: AdminDashboardData["geoHeatmap"];
}) {
  const max = Math.max(
    ...chart.data.flatMap((row) => row.values.map((cell) => cell.value)),
    1,
  );

  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      source={chart.source}
    >
      <div className="space-y-3 overflow-x-auto">
        {chart.data.map((row) => (
          <div key={row.label} className="grid min-w-[320px] grid-cols-[72px_repeat(4,minmax(0,1fr))] gap-2">
            <div className="text-muted-foreground flex items-center text-sm font-medium">
              {row.label}
            </div>
            {row.values.map((cell) => {
              const opacity = 0.16 + (cell.value / max) * 0.84;

              return (
                <div
                  key={`${row.label}-${cell.label}`}
                  className="rounded-2xl px-3 py-4 text-center text-xs font-medium"
                  style={{
                    backgroundColor: `rgba(124, 58, 237, ${opacity})`,
                    color: cell.value / max > 0.58 ? "white" : "rgb(88, 28, 135)",
                  }}
                >
                  <p>{cell.label}</p>
                  <p className="mt-2 text-sm font-semibold">{cell.value}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function StackedBarChart({
  chart,
}: {
  chart: AdminDashboardData["orderStatusBoard"];
}) {
  const colors = ["#f59e0b", "#8b5cf6", "#10b981"];

  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      source={chart.source}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 text-xs">
          {chart.data[0]?.segments.map((segment, index) => (
            <div key={segment.label} className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span>{segment.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {chart.data.map((entry) => {
            const total = entry.segments.reduce(
              (sum, segment) => sum + segment.value,
              0,
            );

            return (
              <div key={entry.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{entry.label}</span>
                  <span className="text-muted-foreground">{formatNumber(total)}</span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full bg-muted/50">
                  {entry.segments.map((segment, index) => (
                    <div
                      key={segment.label}
                      style={{
                        width: `${total === 0 ? 0 : (segment.value / total) * 100}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

export function AdminDashboardGrid({
  analytics,
}: {
  analytics: AdminDashboardData;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Receita Confirmada"
          value={formatCentsToBRL(analytics.summary.totalRevenueInCents)}
          description="Soma dos pedidos pagos capturados pela loja."
        />
        <SummaryCard
          label="Pedidos Pagos"
          value={formatNumber(analytics.summary.paidOrders)}
          description="Volume concluído considerado no painel comercial."
        />
        <SummaryCard
          label="Catálogo Ativo"
          value={formatNumber(analytics.summary.catalogSize)}
          description="Produtos cadastrados e disponíveis para venda."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <RevenueChart chart={analytics.revenueTrend} />
        <VerticalBarChart chart={analytics.topProducts} />
        <FunnelChart chart={analytics.conversionFunnel} />
        <DonutChart chart={analytics.paymentMethods} />
        <ScatterChart chart={analytics.averageTicketScatter} />
        <HeatmapChart chart={analytics.geoHeatmap} />
        <StackedBarChart chart={analytics.orderStatusBoard} />
        <VerticalBarChart
          chart={analytics.returnRateByCategory}
          suffix="%"
          formatter={formatNumber}
        />
        <FunnelChart chart={analytics.logisticsFunnel} />
      </div>
    </div>
  );
}
