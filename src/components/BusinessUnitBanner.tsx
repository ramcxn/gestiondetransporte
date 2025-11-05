import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function BusinessUnitBanner() {
  const [businessUnit, setBusinessUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBusinessUnit();
  }, [user]);

  const fetchBusinessUnit = async () => {
    try {
      const { data: clientId } = await supabase.rpc('get_client_id_by_email_domain');
      
      if (!clientId) {
        // Usuario puede ver todo
        setBusinessUnit("all");
      } else {
        // Usuario ve solo una unidad específica
        const { data: client } = await supabase
          .from("clientes")
          .select("nombre")
          .eq("id", clientId)
          .maybeSingle();
        
        setBusinessUnit(client?.nombre || null);
      }
    } catch (error) {
      console.error("Error fetching business unit:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !businessUnit) return null;

  return (
    <div className="mb-4">
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-lg p-3 border border-primary/20">
        <div className="flex items-center gap-2">
          {businessUnit === "all" ? (
            <>
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Viendo:
              </span>
              <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                Todas las Unidades de Negocio
              </Badge>
            </>
          ) : (
            <>
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Unidad de Negocio:
              </span>
              <Badge variant="secondary" className="font-semibold">
                {businessUnit}
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
