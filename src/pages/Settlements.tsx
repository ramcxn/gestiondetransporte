import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, CheckCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Settlements() {
  const settlements = [
    {
      id: "LIQ-001",
      date: "2024-10-20",
      operator: "Juan Pérez",
      amount: "$45,000",
      freight: "$50,000",
      tolls: "$2,500",
      fuel: "$2,500",
      km: "920",
      status: "authorized",
    },
    {
      id: "LIQ-002",
      date: "2024-10-22",
      operator: "María González",
      amount: "$52,000",
      freight: "$58,000",
      tolls: "$3,200",
      fuel: "$2,800",
      km: "1,150",
      status: "pending",
    },
    {
      id: "LIQ-003",
      date: "2024-10-24",
      operator: "Carlos Rodríguez",
      amount: "$38,000",
      freight: "$42,000",
      tolls: "$2,000",
      fuel: "$2,000",
      km: "750",
      status: "paid",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Liquidaciones</h1>
            <p className="text-muted-foreground">Pagos a operadores por viajes realizados</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <DollarSign className="h-4 w-4 mr-2" />
          Nueva Liquidación
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$1.2M</div>
            <p className="text-xs text-muted-foreground mt-1">156 liquidaciones</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">$285K</div>
            <p className="text-xs text-muted-foreground mt-1">Por autorizar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Autorizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$450K</div>
            <p className="text-xs text-muted-foreground mt-1">Por pagar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">$465K</div>
            <p className="text-xs text-muted-foreground mt-1">Completadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Liquidaciones Recientes</CardTitle>
          <CardDescription>Estado de pagos a operadores</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Liquidación</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Flete</TableHead>
                <TableHead>Casetas</TableHead>
                <TableHead>Diesel</TableHead>
                <TableHead>km</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell className="text-muted-foreground">{settlement.date}</TableCell>
                  <TableCell className="font-medium">{settlement.id}</TableCell>
                  <TableCell>{settlement.operator}</TableCell>
                  <TableCell className="font-semibold text-foreground">{settlement.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{settlement.freight}</TableCell>
                  <TableCell className="text-muted-foreground">{settlement.tolls}</TableCell>
                  <TableCell className="text-muted-foreground">{settlement.fuel}</TableCell>
                  <TableCell className="text-muted-foreground">{settlement.km}</TableCell>
                  <TableCell>
                    {settlement.status === "paid" && (
                      <Badge className="bg-accent text-accent-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pagada
                      </Badge>
                    )}
                    {settlement.status === "authorized" && (
                      <Badge className="bg-primary text-primary-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Autorizada
                      </Badge>
                    )}
                    {settlement.status === "pending" && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
