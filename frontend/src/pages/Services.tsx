import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const mockServices = [
  { id: 1, name: "Web Development", price: 150, unit: "hour", description: "Full-stack web development" },
  { id: 2, name: "UI/UX Design", price: 120, unit: "hour", description: "User interface and experience design" },
  { id: 3, name: "SEO Audit", price: 500, unit: "project", description: "Complete SEO analysis and recommendations" },
  { id: 4, name: "Consulting", price: 200, unit: "hour", description: "Technical consulting and advisory" },
  { id: 5, name: "Logo Design", price: 800, unit: "project", description: "Brand identity and logo creation" },
];

const Services = () => {
  const [search, setSearch] = useState("");

  const filtered = mockServices.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">{mockServices.length} services available</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Service</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Description</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Price</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Unit</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((service) => (
              <tr key={service.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors">
                <td className="px-5 py-4 font-medium text-sm">{service.name}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{service.description}</td>
                <td className="px-5 py-4 text-sm text-right font-mono font-medium">${service.price}</td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground capitalize">/{service.unit}</td>
                <td className="px-3 py-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Services;
