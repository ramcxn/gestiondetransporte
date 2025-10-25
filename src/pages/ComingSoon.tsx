import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  moduleName: string;
}

export default function ComingSoon({ moduleName }: ComingSoonProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 bg-primary/10 rounded-full mb-6">
            <Construction className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{moduleName}</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Este módulo está en desarrollo y estará disponible próximamente.
            Continuamos mejorando el sistema para ofrecerte la mejor experiencia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
