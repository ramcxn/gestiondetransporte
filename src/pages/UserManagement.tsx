import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Shield, User, RefreshCw, Plus, Settings, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  puesto: string;
  role: "admin" | "usuario";
  created_at: string;
}

interface NewUserForm {
  email: string;
  password: string;
  full_name: string;
  puesto: string;
  role: "admin" | "usuario";
}

const AVAILABLE_MODULES = [
  { name: "Dashboard", key: "dashboard" },
  { name: "Visitas/Proveedores", key: "visitas" },
  { name: "Rondines de Seguridad", key: "rondines" },
  { name: "Ingreso de Unidades", key: "unidades" },
  { name: "Inventario de Equipo", key: "inventario" },
  { name: "Almacén Refacciones", key: "almacen" },
  { name: "Gestión del Operador", key: "operadores" },
  { name: "Personal", key: "personal" },
  { name: "Asistencia Personal", key: "asistencia" },
  { name: "Antidoping", key: "antidoping" },
  { name: "Alcoholímetro", key: "alcoholimetro" },
  { name: "Mantenimiento", key: "mantenimiento" },
  { name: "Viajes", key: "viajes" },
  { name: "Liquidaciones", key: "liquidaciones" },
  { name: "Análisis de Ruta", key: "analisis-ruta" },
  { name: "Análisis de Riesgos", key: "analisis-riesgos" },
  { name: "Sellos de Seguridad", key: "sellos" },
  { name: "Ciberseguridad", key: "ciberseguridad" },
  { name: "Gestión de Usuarios", key: "usuarios" },
];

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    email: "",
    password: "",
    full_name: "",
    puesto: "",
    role: "usuario",
  });
  const { toast } = useToast();
  const { clientId } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, puesto, created_at");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "usuario",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_module_permissions")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const permissions: Record<string, boolean> = {};
      AVAILABLE_MODULES.forEach(module => {
        const perm = data?.find(p => p.module_name === module.key);
        permissions[module.key] = perm ? perm.can_access : true;
      });

      setUserPermissions(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleOpenPermissions = async (user: UserWithRole) => {
    setSelectedUser(user);
    await fetchUserPermissions(user.id);
    setIsPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      // Delete existing permissions
      await supabase
        .from("user_module_permissions")
        .delete()
        .eq("user_id", selectedUser.id);

      // Insert new permissions
      const permissions = Object.entries(userPermissions).map(([module, canAccess]) => ({
        user_id: selectedUser.id,
        module_name: module,
        can_access: canAccess,
      }));

      const { error } = await supabase
        .from("user_module_permissions")
        .insert(permissions);

      if (error) throw error;

      toast({
        title: "Permisos actualizados",
        description: "Los permisos del usuario han sido actualizados correctamente",
      });

      setIsPermissionsDialogOpen(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los permisos",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "admin" | "usuario") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado correctamente",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const handleOpenDeleteDialog = (user: UserWithRole) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId: userToDelete.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario. Solo los administradores pueden eliminar usuarios.",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.puesto) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!clientId) {
      toast({
        title: "Error",
        description: "No se pudo obtener el ID del cliente",
        variant: "destructive",
      });
      return;
    }

    setCreatingUser(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: newUser.full_name,
            puesto: newUser.puesto,
            role: newUser.role,
            client_id: clientId,
          },
        },
      });

      if (error) throw error;

      // Send welcome email
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            email: newUser.email,
            fullName: newUser.full_name,
            password: newUser.password,
            role: newUser.role,
          },
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail user creation if email fails
      }

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente y se ha enviado un correo de bienvenida",
      });

      setNewUser({
        email: "",
        password: "",
        full_name: "",
        puesto: "",
        role: "usuario",
      });
      setIsDialogOpen(false);
      
      setTimeout(() => {
        fetchUsers();
      }, 1000);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra roles y permisos de usuarios
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa todos los campos para crear un nuevo usuario en el sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">Correo Electrónico</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-name">Nombre Completo</Label>
                  <Input
                    id="new-name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-puesto">Puesto</Label>
                  <Input
                    id="new-puesto"
                    type="text"
                    placeholder="Supervisor, Operador, etc."
                    value={newUser.puesto}
                    onChange={(e) => setNewUser({ ...newUser, puesto: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Rol</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "admin" | "usuario") =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger id="new-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="usuario">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                >
                  {creatingUser ? "Creando..." : "Crear Usuario"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchUsers} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Asigna roles y gestiona permisos de módulos para cada usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Cambiar Rol</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {user.full_name || "Sin nombre"}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.puesto || "No especificado"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                      >
                        {user.role === "admin" ? "Administrador" : "Usuario"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: "admin" | "usuario") =>
                          handleRoleChange(user.id, value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="usuario">Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPermissions(user)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenDeleteDialog(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permisos de Módulos - {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>
              Selecciona los módulos a los que este usuario puede acceder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser?.role === "admin" ? (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  Los administradores tienen acceso a todos los módulos por defecto
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_MODULES.map((module) => (
                  <div key={module.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={module.key}
                      checked={userPermissions[module.key] ?? true}
                      onCheckedChange={(checked) =>
                        setUserPermissions({
                          ...userPermissions,
                          [module.key]: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor={module.key} className="cursor-pointer">
                      {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {selectedUser?.role !== "admin" && (
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPermissionsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSavePermissions}>
                  Guardar Permisos
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
              <strong>{userToDelete?.full_name || userToDelete?.email}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUser ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Permisos por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Administrador
              </h3>
              <p className="text-sm text-muted-foreground">
                Acceso completo a todos los módulos del sistema (no requiere configuración de permisos)
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-secondary" />
                Usuario
              </h3>
              <p className="text-sm text-muted-foreground">
                Acceso personalizable por módulo. Configure individualmente los permisos de cada usuario.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;