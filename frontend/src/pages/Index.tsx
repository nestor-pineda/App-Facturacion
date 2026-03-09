import { Plus, FileText, Receipt, Users, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const recentItems = [
  { id: 1, type: "quote" as const, number: "Q-001", client: "Acme Corp", amount: 2500, status: "sent" as const, date: "2026-03-05" },
  { id: 2, type: "invoice" as const, number: "INV-001", client: "TechStart Ltd", amount: 4200, status: "paid" as const, date: "2026-03-04" },
  { id: 3, type: "quote" as const, number: "Q-002", client: "Design Studio", amount: 1800, status: "draft" as const, date: "2026-03-03" },
  { id: 4, type: "invoice" as const, number: "INV-002", client: "Acme Corp", amount: 3100, status: "overdue" as const, date: "2026-02-28" },
  { id: 5, type: "quote" as const, number: "Q-003", client: "CloudNine Inc", amount: 6700, status: "accepted" as const, date: "2026-02-25" },
  { id: 6, type: "invoice" as const, number: "INV-003", client: "Design Studio", amount: 1800, status: "issued" as const, date: "2026-02-22" },
];

const actions = [
  { label: "New Quote", icon: FileText, path: "/quotes/new", description: "Create a price proposal" },
  { label: "New Invoice", icon: Receipt, path: "/invoices/new", description: "Generate an invoice" },
  { label: "Add Client", icon: Users, path: "/clients/new", description: "Register a new client" },
];

type FilterType = "all" | "quote" | "invoice";

const Index = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const filtered = recentItems.filter((item) => {
    const matchesType = filter === "all" || item.type === filter;
    const matchesSearch =
      item.number.toLowerCase().includes(search.toLowerCase()) ||
      item.client.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Quick actions and recent activity</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="action-card text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <action.icon className="h-6 w-6 text-foreground" />
            </div>
            <span className="font-bold text-base">{action.label}</span>
            <span className="text-sm text-muted-foreground">{action.description}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Activity</h2>
        </div>

        <div className="filter-bar">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["all", "quote", "invoice"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "quote" ? "Quotes" : "Invoices"}
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-sm font-medium">{item.number}</td>
                  <td className="px-5 py-4 text-sm">{item.client}</td>
                  <td className="px-5 py-4 text-sm capitalize text-muted-foreground">{item.type}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4 text-sm text-right font-mono font-medium">${item.amount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-right text-muted-foreground">{item.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Index;
