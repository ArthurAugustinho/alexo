"use client";

import { useState } from "react";

import { REASON_LABELS } from "@/components/orders/return-request-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReturnRequestWithOrder } from "@/lib/queries/return-requests";

import { CompleteReturnDialog } from "./complete-return-dialog";
import { ReviewDialog } from "./review-dialog";

type Props = { requests: ReturnRequestWithOrder[] };

const STATUS_TABS = [
  { value: "all", label: "Todas" },
  { value: "pending_review", label: "Pendentes" },
  { value: "approved", label: "Aprovadas" },
  { value: "rejected", label: "Rejeitadas" },
  { value: "completed", label: "Concluídas" },
] as const;

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending_review: { label: "Pendente", variant: "default" },
  approved: { label: "Aprovada", variant: "outline" },
  rejected: { label: "Rejeitada", variant: "destructive" },
  completed: { label: "Concluída", variant: "secondary" },
};

type ActiveTab = (typeof STATUS_TABS)[number]["value"];

export function ReturnTable({ requests }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [reviewTarget, setReviewTarget] = useState<ReturnRequestWithOrder | null>(null);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);

  const filtered =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              activeTab === tab.value
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
            {tab.value === "pending_review" && (
              <span className="ml-1.5">
                ({requests.filter((r) => r.status === "pending_review").length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Nenhuma solicitação encontrada.
        </p>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b text-left">
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((request) => {
                  const badgeInfo = STATUS_BADGE[request.status];
                  return (
                    <tr key={request.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">
                        #{request.orderId.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{request.user.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {request.user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {REASON_LABELS[request.reason] ?? request.reason}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {request.createdAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        {badgeInfo && (
                          <Badge variant={badgeInfo.variant}>
                            {badgeInfo.label}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {request.status === "pending_review" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReviewTarget(request)}
                            >
                              Analisar
                            </Button>
                          )}
                          {request.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCompleteTarget(request.id)}
                            >
                              Concluir
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewTarget && (
        <ReviewDialog
          request={reviewTarget}
          open={!!reviewTarget}
          onOpenChange={(open) => { if (!open) setReviewTarget(null); }}
        />
      )}

      {completeTarget && (
        <CompleteReturnDialog
          returnRequestId={completeTarget}
          open={!!completeTarget}
          onOpenChange={(open) => { if (!open) setCompleteTarget(null); }}
        />
      )}
    </div>
  );
}
