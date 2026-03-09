import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";

const mockInvoices = [
  { id: 1, number: "INV-001", client: "TechStart Ltd", amount: 4200, status: "paid" as const, date: "2026-03-04", dueDate: "2026-04-04" },
  { id: 2, number: "INV-002", client: "Acme Corp", amount: 3100, status: "overdue" as const, date: "2026-02-28", dueDate: "2026-03-28" },
  { id: 3, number: "INV-003", client: "Design Studio", amount: 1800, status: "issued" as const, date: "2026-02-22", dueDate: "2026-03-22" },
  { id: 4, number: "INV-004", client: "CloudNine Inc", amount: 6700, status: "draft" as const, date: "2026-02-20", dueDate: "2026-03-20" },
  { id: 5, number: "INV-005", client: "TechStart Ltd", amount: 2100, status: "paid" as const, date: "2026-02-15", dueDate: "2026-03-15" },
];

type StatusFilter = "all" | "draft" | "issued" | "paid" | "overdue";

const Invoices = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = mockInvoices.filter((inv) => {
    const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) || inv.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{mockInvoices.length} total invoices</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["all", "draft", "issued", "paid", "overdue"] as StatusFilter[]).map((f) => (
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
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Due Date</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors">
                <td className="px-5 py-4 font-mono text-sm font-medium">{inv.number}</td>
                <td className="px-5 py-4 text-sm">{inv.client}</td>
                <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                <td className="px-5 py-4 text-sm text-right font-mono font-medium">${inv.amount.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{inv.date}</td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{inv.dueDate}</td>
                <td className="px-3 py-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
