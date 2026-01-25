import { Link } from "react-router-dom";

const mockBusinesses = [
  { id: "1", name: "Green Farm Co." },
  { id: "2", name: "Sunrise Textiles" },
  { id: "3", name: "Ocean Harvest" },
];

export default function Businesses() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Businesses</h1>
        <p className="mb-6 text-muted-foreground">Browse businesses available for investment.</p>

        <div className="grid gap-4">
          {mockBusinesses.map((b) => (
            <Link
              key={b.id}
              to={`/businesses/${b.id}`}
              className="block p-4 border rounded-md hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-sm text-muted-foreground">Short description about the business</div>
                </div>
                <div className="text-sm text-primary">View</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}