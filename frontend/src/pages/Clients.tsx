import { Plus, Search, MoreHorizontal, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const mockClients = [
  { id: 1, name: "Acme Corp", email: "contact@acme.com", phone: "+1 555-0100", projects: 3 },
  { id: 2, name: "TechStart Ltd", email: "hello@techstart.io", phone: "+1 555-0200", projects: 1 },
  { id: 3, name: "Design Studio", email: "info@designstudio.co", phone: "+1 555-0300", projects: 5 },
  { id: 4, name: "CloudNine Inc", email: "team@cloudnine.com", phone: "+1 555-0400", projects: 2 },
];

const Clients = () => {
  const [search, setSearch] = useState("");

  const filtered = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{mockClients.length} registered clients</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((client) => (
          <div key={client.id} className="stat-card flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base">{client.name}</h3>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{client.projects} project{client.projects !== 1 ? "s" : ""}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clients;
