export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ingreso_unidades: {
        Row: {
          created_at: string
          created_by: string
          descripcion_incidente: string | null
          foto_1_url: string | null
          foto_2_url: string | null
          id: string
          incidente: boolean | null
          numero_economico: string
          numero_unidad: string
          odometro: number
          operador: string
          puntos_seguridad: Json | null
          requiere_mantenimiento: boolean | null
          tipo_movimiento: string
          tipo_unidad: string
        }
        Insert: {
          created_at?: string
          created_by: string
          descripcion_incidente?: string | null
          foto_1_url?: string | null
          foto_2_url?: string | null
          id?: string
          incidente?: boolean | null
          numero_economico: string
          numero_unidad: string
          odometro: number
          operador: string
          puntos_seguridad?: Json | null
          requiere_mantenimiento?: boolean | null
          tipo_movimiento: string
          tipo_unidad: string
        }
        Update: {
          created_at?: string
          created_by?: string
          descripcion_incidente?: string | null
          foto_1_url?: string | null
          foto_2_url?: string | null
          id?: string
          incidente?: boolean | null
          numero_economico?: string
          numero_unidad?: string
          odometro?: number
          operador?: string
          puntos_seguridad?: Json | null
          requiere_mantenimiento?: boolean | null
          tipo_movimiento?: string
          tipo_unidad?: string
        }
        Relationships: []
      }
      operadores: {
        Row: {
          created_at: string
          created_by: string
          direccion: string
          estado: string
          fecha_alta: string
          fecha_vencimiento_contrato: string
          fecha_vencimiento_licencia: string | null
          id: string
          nombre: string
          numero_empleado: string
          numero_licencia: string | null
          pdf_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          direccion: string
          estado?: string
          fecha_alta: string
          fecha_vencimiento_contrato: string
          fecha_vencimiento_licencia?: string | null
          id?: string
          nombre: string
          numero_empleado: string
          numero_licencia?: string | null
          pdf_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          direccion?: string
          estado?: string
          fecha_alta?: string
          fecha_vencimiento_contrato?: string
          fecha_vencimiento_licencia?: string | null
          id?: string
          nombre?: string
          numero_empleado?: string
          numero_licencia?: string | null
          pdf_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          puesto: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          puesto?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          puesto?: string | null
        }
        Relationships: []
      }
      pruebas_alcoholimetro: {
        Row: {
          archivo_url: string | null
          created_at: string
          created_by: string
          id: string
          nivel: number | null
          nombre: string
          observaciones: string | null
          resultado: string
          tipo_persona: string
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          nivel?: number | null
          nombre: string
          observaciones?: string | null
          resultado: string
          tipo_persona: string
        }
        Update: {
          archivo_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          nivel?: number | null
          nombre?: string
          observaciones?: string | null
          resultado?: string
          tipo_persona?: string
        }
        Relationships: []
      }
      rondines: {
        Row: {
          codigo_qr: string
          created_at: string
          created_by: string
          descripcion_incidente: string | null
          foto_url: string | null
          id: string
          incidente: boolean | null
          ubicacion: string
        }
        Insert: {
          codigo_qr: string
          created_at?: string
          created_by: string
          descripcion_incidente?: string | null
          foto_url?: string | null
          id?: string
          incidente?: boolean | null
          ubicacion: string
        }
        Update: {
          codigo_qr?: string
          created_at?: string
          created_by?: string
          descripcion_incidente?: string | null
          foto_url?: string | null
          id?: string
          incidente?: boolean | null
          ubicacion?: string
        }
        Relationships: []
      }
      rutas: {
        Row: {
          activa: boolean
          costo_casetas: number | null
          costo_combustible: number | null
          costo_estimado: number
          created_at: string
          created_by: string
          destino: string
          distancia_km: number
          id: string
          nombre: string
          origen: string
          rentabilidad: string | null
          tiempo_estimado_horas: number
        }
        Insert: {
          activa?: boolean
          costo_casetas?: number | null
          costo_combustible?: number | null
          costo_estimado: number
          created_at?: string
          created_by: string
          destino: string
          distancia_km: number
          id?: string
          nombre: string
          origen: string
          rentabilidad?: string | null
          tiempo_estimado_horas: number
        }
        Update: {
          activa?: boolean
          costo_casetas?: number | null
          costo_combustible?: number | null
          costo_estimado?: number
          created_at?: string
          created_by?: string
          destino?: string
          distancia_km?: number
          id?: string
          nombre?: string
          origen?: string
          rentabilidad?: string | null
          tiempo_estimado_horas?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viajes: {
        Row: {
          cliente: string
          created_at: string
          created_by: string
          destino: string
          distancia_km: number
          estado: string
          fecha_llegada_estimada: string | null
          fecha_llegada_real: string | null
          fecha_salida: string
          flete: number
          id: string
          operador: string
          origen: string
          ruta_id: string | null
          sucursal: string
          ubicacion_actual: string | null
          ultima_actualizacion_ubicacion: string | null
          unidad: string
        }
        Insert: {
          cliente: string
          created_at?: string
          created_by: string
          destino: string
          distancia_km: number
          estado?: string
          fecha_llegada_estimada?: string | null
          fecha_llegada_real?: string | null
          fecha_salida: string
          flete: number
          id?: string
          operador: string
          origen: string
          ruta_id?: string | null
          sucursal: string
          ubicacion_actual?: string | null
          ultima_actualizacion_ubicacion?: string | null
          unidad: string
        }
        Update: {
          cliente?: string
          created_at?: string
          created_by?: string
          destino?: string
          distancia_km?: number
          estado?: string
          fecha_llegada_estimada?: string | null
          fecha_llegada_real?: string | null
          fecha_salida?: string
          flete?: number
          id?: string
          operador?: string
          origen?: string
          ruta_id?: string | null
          sucursal?: string
          ubicacion_actual?: string | null
          ultima_actualizacion_ubicacion?: string | null
          unidad?: string
        }
        Relationships: []
      }
      visitas: {
        Row: {
          area_visita: string
          created_at: string
          created_by: string
          credencial_url: string | null
          empresa: string
          estado: string
          fecha_salida: string | null
          id: string
          motivo: string
          nombre: string
          tipo: string
        }
        Insert: {
          area_visita: string
          created_at?: string
          created_by: string
          credencial_url?: string | null
          empresa: string
          estado?: string
          fecha_salida?: string | null
          id?: string
          motivo: string
          nombre: string
          tipo: string
        }
        Update: {
          area_visita?: string
          created_at?: string
          created_by?: string
          credencial_url?: string | null
          empresa?: string
          estado?: string
          fecha_salida?: string | null
          id?: string
          motivo?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      zonas_seguridad: {
        Row: {
          activa: boolean
          codigo_qr: string
          created_at: string
          created_by: string
          id: string
          nombre: string
          ubicacion: string
        }
        Insert: {
          activa?: boolean
          codigo_qr: string
          created_at?: string
          created_by: string
          id?: string
          nombre: string
          ubicacion: string
        }
        Update: {
          activa?: boolean
          codigo_qr?: string
          created_at?: string
          created_by?: string
          id?: string
          nombre?: string
          ubicacion?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "usuario"],
    },
  },
} as const
