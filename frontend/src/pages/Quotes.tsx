import { Plus, Search, Download, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";

const mockQuotes = [
  { id: 1, number: "Q-001", client: "Acme Corp", amount: 2500, status: "sent" as const, date: "2026-03-05", items: 3 },
  { id: 2, number: "Q-002", client: "Design Studio", amount: 1800, status: "draft" as const, date: "2026-03-03", items: 2 },
  { id: 3, number: "Q-003", client: "CloudNine Inc", amount: 6700, status: "accepted" as const, date: "2026-02-25", items: 5 },
  { id: 4, number: "Q-004", client: "TechStart Ltd", amount: 3200, status: "rejected" as const, date: "2026-02-20", items: 4 },
  { id: 5, number: "Q-005", client: "Acme Corp", amount: 950, status: "draft" as const, date: "2026-02-18", items: 1 },
];

type StatusFilter = "all" | "draft" | "sent" | "accepted" | "rejected";

const Quotes = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = mockQuotes.filter((q) => {
    const matchesSearch = q.number.toLowerCase().includes(search.toLowerCase()) || q.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Quotes</h1>
          <p className="page-subtitle">{mockQuotes.length} total quotes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Quote
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search quotes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["all", "draft", "sent", "accepted", "rejected"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                statusFilter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Number</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Items</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quote) => (
              <tr key={quote.id} className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors">
                <td className="px-5 py-4 font-mono text-sm font-medium">{quote.number}</td>
                <td className="px-5 py-4 text-sm">{quote.client}</td>
                <td className="px-5 py-4"><StatusBadge status={quote.status} /></td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{quote.items}</td>
                <td className="px-5 py-4 text-sm text-right font-mono font-medium">${quote.amount.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{quote.date}</td>
                <td className="px-3 py-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No quotes found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quotes;
