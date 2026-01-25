import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const mockBusinesses = [
  { id: "1", name: "Green Farm Co.", description: "Organic produce farm focusing on export-grade fruits and vegetables." },
  { id: "2", name: "Sunrise Textiles", description: "Small textile mill producing ethically sourced fabrics for local designers." },
  { id: "3", name: "Ocean Harvest", description: "Sustainable seafood processing and cold-chain logistics." },
];

export default function BusinessDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ?? "";

  const business = mockBusinesses.find((b) => b.id === id) || {
    id,
    name: `Business ${id}`,
    description: "No details available for this business.",
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{business.name}</h1>
        <p className="text-muted-foreground mb-6">{business.description}</p>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="gradient" onClick={() => alert(`Invest flow (mock) for ${business.name}`)}>
            Invest
          </Button>
        </div>
      </div>
    </div>
  );
}