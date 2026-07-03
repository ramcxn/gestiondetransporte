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
      acciones_correctivas: {
        Row: {
          acciones_contencion: string | null
          acciones_correctivas: string
          acciones_preventivas: string | null
          actualizacion_procedimientos: string | null
          analisis_causa_raiz: string | null
          archivos_adjuntos: Json | null
          area_afectada: string
          client_id: string | null
          created_at: string
          created_by: string
          descripcion_detallada: string
          descripcion_problema: string
          equipo_responsable: string
          estado: string
          evidencia_implementacion: string | null
          fecha_compromiso: string
          fecha_contencion: string | null
          fecha_deteccion: string
          fecha_implementacion: string | null
          folio: string
          herramientas_utilizadas: string | null
          id: string
          lecciones_aprendidas: string | null
          lider_equipo: string
          miembros_equipo: Json | null
          prioridad: string
          reconocimiento: string | null
          responsable_accion: string
          responsable_contencion: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          acciones_contencion?: string | null
          acciones_correctivas: string
          acciones_preventivas?: string | null
          actualizacion_procedimientos?: string | null
          analisis_causa_raiz?: string | null
          archivos_adjuntos?: Json | null
          area_afectada: string
          client_id?: string | null
          created_at?: string
          created_by: string
          descripcion_detallada: string
          descripcion_problema: string
          equipo_responsable: string
          estado?: string
          evidencia_implementacion?: string | null
          fecha_compromiso: string
          fecha_contencion?: string | null
          fecha_deteccion: string
          fecha_implementacion?: string | null
          folio: string
          herramientas_utilizadas?: string | null
          id?: string
          lecciones_aprendidas?: string | null
          lider_equipo: string
          miembros_equipo?: Json | null
          prioridad?: string
          reconocimiento?: string | null
          responsable_accion: string
          responsable_contencion?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          acciones_contencion?: string | null
          acciones_correctivas?: string
          acciones_preventivas?: string | null
          actualizacion_procedimientos?: string | null
          analisis_causa_raiz?: string | null
          archivos_adjuntos?: Json | null
          area_afectada?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          descripcion_detallada?: string
          descripcion_problema?: string
          equipo_responsable?: string
          estado?: string
          evidencia_implementacion?: string | null
          fecha_compromiso?: string
          fecha_contencion?: string | null
          fecha_deteccion?: string
          fecha_implementacion?: string | null
          folio?: string
          herramientas_utilizadas?: string | null
          id?: string
          lecciones_aprendidas?: string | null
          lider_equipo?: string
          miembros_equipo?: Json | null
          prioridad?: string
          reconocimiento?: string | null
          responsable_accion?: string
          responsable_contencion?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acciones_correctivas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_riesgos: {
        Row: {
          archivos_adjuntos: Json | null
          client_id: string | null
          condiciones_meteorologicas: string | null
          condiciones_via: string | null
          conductores: Json | null
          created_at: string
          created_by: string
          declaraciones: string | null
          descripcion: string
          descripcion_entorno: string | null
          descripcion_impacto: string | null
          diagrama_url: string | null
          estado: string
          estudio_escena: string | null
          factores_externos: string | null
          fecha_hora_accidente: string | null
          fecha_identificacion: string
          fecha_revision: string | null
          fotografias: Json | null
          id: string
          iluminacion: string | null
          impacto: string
          informes_medicos: Json | null
          lesionados: Json | null
          lugar_exacto: string | null
          medidas_mitigacion: string | null
          nivel_riesgo: string
          probabilidad: string
          responsable: string | null
          testigos: Json | null
          tipo_analisis: string | null
          tipo_riesgo: string
          titulo: string
          trayectoria: string | null
          vehiculos: Json | null
          velocidad_estimada: string | null
        }
        Insert: {
          archivos_adjuntos?: Json | null
          client_id?: string | null
          condiciones_meteorologicas?: string | null
          condiciones_via?: string | null
          conductores?: Json | null
          created_at?: string
          created_by: string
          declaraciones?: string | null
          descripcion: string
          descripcion_entorno?: string | null
          descripcion_impacto?: string | null
          diagrama_url?: string | null
          estado?: string
          estudio_escena?: string | null
          factores_externos?: string | null
          fecha_hora_accidente?: string | null
          fecha_identificacion: string
          fecha_revision?: string | null
          fotografias?: Json | null
          id?: string
          iluminacion?: string | null
          impacto: string
          informes_medicos?: Json | null
          lesionados?: Json | null
          lugar_exacto?: string | null
          medidas_mitigacion?: string | null
          nivel_riesgo: string
          probabilidad: string
          responsable?: string | null
          testigos?: Json | null
          tipo_analisis?: string | null
          tipo_riesgo: string
          titulo: string
          trayectoria?: string | null
          vehiculos?: Json | null
          velocidad_estimada?: string | null
        }
        Update: {
          archivos_adjuntos?: Json | null
          client_id?: string | null
          condiciones_meteorologicas?: string | null
          condiciones_via?: string | null
          conductores?: Json | null
          created_at?: string
          created_by?: string
          declaraciones?: string | null
          descripcion?: string
          descripcion_entorno?: string | null
          descripcion_impacto?: string | null
          diagrama_url?: string | null
          estado?: string
          estudio_escena?: string | null
          factores_externos?: string | null
          fecha_hora_accidente?: string | null
          fecha_identificacion?: string
          fecha_revision?: string | null
          fotografias?: Json | null
          id?: string
          iluminacion?: string | null
          impacto?: string
          informes_medicos?: Json | null
          lesionados?: Json | null
          lugar_exacto?: string | null
          medidas_mitigacion?: string | null
          nivel_riesgo?: string
          probabilidad?: string
          responsable?: string | null
          testigos?: Json | null
          tipo_analisis?: string | null
          tipo_riesgo?: string
          titulo?: string
          trayectoria?: string | null
          vehiculos?: Json | null
          velocidad_estimada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_riesgos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencia_personal: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          estado: string
          fecha_entrada: string
          fecha_salida: string | null
          id: string
          personal_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          estado?: string
          fecha_entrada?: string
          fecha_salida?: string | null
          id?: string
          personal_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          fecha_entrada?: string
          fecha_salida?: string | null
          id?: string
          personal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_personal_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_personal_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          rfc: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          rfc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          rfc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departamentos: {
        Row: {
          activo: boolean
          client_id: string
          created_at: string
          created_by: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          client_id: string
          created_at?: string
          created_by: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          client_id?: string
          created_at?: string
          created_by?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      detalle_solicitudes_refacciones: {
        Row: {
          cantidad_entregada: number | null
          cantidad_solicitada: number
          client_id: string | null
          created_at: string
          estado: string
          id: string
          inventario_asignado_id: string | null
          observaciones: string | null
          refaccion_id: string
          solicitud_id: string
        }
        Insert: {
          cantidad_entregada?: number | null
          cantidad_solicitada: number
          client_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          inventario_asignado_id?: string | null
          observaciones?: string | null
          refaccion_id: string
          solicitud_id: string
        }
        Update: {
          cantidad_entregada?: number | null
          cantidad_solicitada?: number
          client_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          inventario_asignado_id?: string | null
          observaciones?: string | null
          refaccion_id?: string
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_solicitudes_refacciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_solicitudes_refacciones_inventario_asignado_id_fkey"
            columns: ["inventario_asignado_id"]
            isOneToOne: false
            referencedRelation: "inventario_refacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_solicitudes_refacciones_refaccion_id_fkey"
            columns: ["refaccion_id"]
            isOneToOne: false
            referencedRelation: "refacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_solicitudes_refacciones_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_refacciones"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_sellos: {
        Row: {
          accion: string
          client_id: string | null
          created_at: string
          created_by: string
          descripcion: string | null
          id: string
          sello_id: string
          unidad: string | null
          viaje_id: string | null
        }
        Insert: {
          accion: string
          client_id?: string | null
          created_at?: string
          created_by: string
          descripcion?: string | null
          id?: string
          sello_id: string
          unidad?: string | null
          viaje_id?: string | null
        }
        Update: {
          accion?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          descripcion?: string | null
          id?: string
          sello_id?: string
          unidad?: string | null
          viaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_sellos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_sellos_sello_id_fkey"
            columns: ["sello_id"]
            isOneToOne: false
            referencedRelation: "sellos_seguridad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_sellos_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      incidentes: {
        Row: {
          acciones_tomadas: string | null
          client_id: string | null
          costo_estimado: number | null
          created_at: string
          created_by: string
          descripcion: string
          estado: string
          fecha_incidente: string
          foto_url: string | null
          gravedad: string
          id: string
          operador: string | null
          tipo_incidente: string
          titulo: string
          ubicacion: string | null
          unidad: string | null
          viaje_id: string | null
        }
        Insert: {
          acciones_tomadas?: string | null
          client_id?: string | null
          costo_estimado?: number | null
          created_at?: string
          created_by: string
          descripcion: string
          estado?: string
          fecha_incidente: string
          foto_url?: string | null
          gravedad: string
          id?: string
          operador?: string | null
          tipo_incidente: string
          titulo: string
          ubicacion?: string | null
          unidad?: string | null
          viaje_id?: string | null
        }
        Update: {
          acciones_tomadas?: string | null
          client_id?: string | null
          costo_estimado?: number | null
          created_at?: string
          created_by?: string
          descripcion?: string
          estado?: string
          fecha_incidente?: string
          foto_url?: string | null
          gravedad?: string
          id?: string
          operador?: string | null
          tipo_incidente?: string
          titulo?: string
          ubicacion?: string | null
          unidad?: string | null
          viaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidentes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidentes_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      ingreso_unidades: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          descripcion_incidente: string | null
          dolly_id: string | null
          foto_1_url: string | null
          foto_2_url: string | null
          id: string
          incidente: boolean | null
          numero_economico: string
          numero_unidad: string
          odometro: number
          operador: string
          operador_id: string | null
          puntos_seguridad: Json | null
          remolque_1_id: string | null
          remolque_2_id: string | null
          requiere_mantenimiento: boolean | null
          tipo_movimiento: string
          tipo_unidad: string
          tracto_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          descripcion_incidente?: string | null
          dolly_id?: string | null
          foto_1_url?: string | null
          foto_2_url?: string | null
          id?: string
          incidente?: boolean | null
          numero_economico: string
          numero_unidad: string
          odometro: number
          operador: string
          operador_id?: string | null
          puntos_seguridad?: Json | null
          remolque_1_id?: string | null
          remolque_2_id?: string | null
          requiere_mantenimiento?: boolean | null
          tipo_movimiento: string
          tipo_unidad: string
          tracto_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          descripcion_incidente?: string | null
          dolly_id?: string | null
          foto_1_url?: string | null
          foto_2_url?: string | null
          id?: string
          incidente?: boolean | null
          numero_economico?: string
          numero_unidad?: string
          odometro?: number
          operador?: string
          operador_id?: string | null
          puntos_seguridad?: Json | null
          remolque_1_id?: string | null
          remolque_2_id?: string | null
          requiere_mantenimiento?: boolean | null
          tipo_movimiento?: string
          tipo_unidad?: string
          tracto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingreso_unidades_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingreso_unidades_dolly_id_fkey"
            columns: ["dolly_id"]
            isOneToOne: false
            referencedRelation: "inventario_equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingreso_unidades_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingreso_unidades_remolque_1_id_fkey"
            columns: ["remolque_1_id"]
            isOneToOne: false
            referencedRelation: "inventario_equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingreso_unidades_remolque_2_id_fkey"
            columns: ["remolque_2_id"]
            isOneToOne: false
            referencedRelation: "inventario_equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingreso_unidades_tracto_id_fkey"
            columns: ["tracto_id"]
            isOneToOne: false
            referencedRelation: "inventario_equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      inspecciones_instalaciones: {
        Row: {
          acciones_correctivas: Json | null
          categoria: string
          client_id: string
          created_at: string
          created_by: string
          estado: string
          evidencia_fotografica: Json | null
          fecha_inspeccion: string
          folio: string
          id: string
          inspector_id: string | null
          inspector_nombre: string
          observaciones_generales: string | null
          puntos_verificacion: Json
          updated_at: string
        }
        Insert: {
          acciones_correctivas?: Json | null
          categoria: string
          client_id: string
          created_at?: string
          created_by: string
          estado?: string
          evidencia_fotografica?: Json | null
          fecha_inspeccion?: string
          folio: string
          id?: string
          inspector_id?: string | null
          inspector_nombre: string
          observaciones_generales?: string | null
          puntos_verificacion?: Json
          updated_at?: string
        }
        Update: {
          acciones_correctivas?: Json | null
          categoria?: string
          client_id?: string
          created_at?: string
          created_by?: string
          estado?: string
          evidencia_fotografica?: Json | null
          fecha_inspeccion?: string
          folio?: string
          id?: string
          inspector_id?: string | null
          inspector_nombre?: string
          observaciones_generales?: string | null
          puntos_verificacion?: Json
          updated_at?: string
        }
        Relationships: []
      }
      inventario_equipos: {
        Row: {
          año: number | null
          capacidad_carga: number | null
          client_id: string
          color: string | null
          created_at: string
          created_by: string
          estado: string
          foto_url: string | null
          id: string
          marca: string
          modelo: string
          numero_economico: string
          numero_serie: string | null
          observaciones: string | null
          operacion: string
          placas: string | null
          proximo_mantenimiento: string | null
          qr_code: string | null
          tipo_equipo: string
          ubicacion: string | null
          ultima_inspeccion: string | null
          updated_at: string
        }
        Insert: {
          año?: number | null
          capacidad_carga?: number | null
          client_id: string
          color?: string | null
          created_at?: string
          created_by: string
          estado?: string
          foto_url?: string | null
          id?: string
          marca: string
          modelo: string
          numero_economico: string
          numero_serie?: string | null
          observaciones?: string | null
          operacion?: string
          placas?: string | null
          proximo_mantenimiento?: string | null
          qr_code?: string | null
          tipo_equipo: string
          ubicacion?: string | null
          ultima_inspeccion?: string | null
          updated_at?: string
        }
        Update: {
          año?: number | null
          capacidad_carga?: number | null
          client_id?: string
          color?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          foto_url?: string | null
          id?: string
          marca?: string
          modelo?: string
          numero_economico?: string
          numero_serie?: string | null
          observaciones?: string | null
          operacion?: string
          placas?: string | null
          proximo_mantenimiento?: string | null
          qr_code?: string | null
          tipo_equipo?: string
          ubicacion?: string | null
          ultima_inspeccion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_equipos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_operador: {
        Row: {
          botas_seguridad: boolean
          casco: boolean
          chaleco_reflejante: boolean
          cinturones_seguridad: boolean
          client_id: string
          created_at: string
          created_by: string
          estado: string
          extintor: boolean
          fecha_hora: string
          firma_operador_url: string | null
          firma_supervisor_url: string | null
          gato_hidraulico: boolean
          herramienta_basica: boolean
          id: string
          lampara: boolean
          numero_unidad: string
          observaciones: string | null
          operador_nombre: string
          supervisor_id: string | null
          tipo_revision: string
          triangulos_emergencia: boolean
        }
        Insert: {
          botas_seguridad?: boolean
          casco?: boolean
          chaleco_reflejante?: boolean
          cinturones_seguridad?: boolean
          client_id: string
          created_at?: string
          created_by: string
          estado?: string
          extintor?: boolean
          fecha_hora?: string
          firma_operador_url?: string | null
          firma_supervisor_url?: string | null
          gato_hidraulico?: boolean
          herramienta_basica?: boolean
          id?: string
          lampara?: boolean
          numero_unidad: string
          observaciones?: string | null
          operador_nombre: string
          supervisor_id?: string | null
          tipo_revision: string
          triangulos_emergencia?: boolean
        }
        Update: {
          botas_seguridad?: boolean
          casco?: boolean
          chaleco_reflejante?: boolean
          cinturones_seguridad?: boolean
          client_id?: string
          created_at?: string
          created_by?: string
          estado?: string
          extintor?: boolean
          fecha_hora?: string
          firma_operador_url?: string | null
          firma_supervisor_url?: string | null
          gato_hidraulico?: boolean
          herramienta_basica?: boolean
          id?: string
          lampara?: boolean
          numero_unidad?: string
          observaciones?: string | null
          operador_nombre?: string
          supervisor_id?: string | null
          tipo_revision?: string
          triangulos_emergencia?: boolean
        }
        Relationships: []
      }
      inventario_refacciones: {
        Row: {
          client_id: string | null
          costo_unitario: number
          created_at: string
          created_by: string
          documento_recepcion: string | null
          estado: string
          fecha_caducidad: string | null
          fecha_recepcion: string
          id: string
          lote: string | null
          mantenimiento_id: string | null
          numero_serie: string | null
          proveedor: string
          refaccion_id: string
          ubicacion_id: string
        }
        Insert: {
          client_id?: string | null
          costo_unitario: number
          created_at?: string
          created_by: string
          documento_recepcion?: string | null
          estado?: string
          fecha_caducidad?: string | null
          fecha_recepcion?: string
          id?: string
          lote?: string | null
          mantenimiento_id?: string | null
          numero_serie?: string | null
          proveedor: string
          refaccion_id: string
          ubicacion_id: string
        }
        Update: {
          client_id?: string | null
          costo_unitario?: number
          created_at?: string
          created_by?: string
          documento_recepcion?: string | null
          estado?: string
          fecha_caducidad?: string | null
          fecha_recepcion?: string
          id?: string
          lote?: string | null
          mantenimiento_id?: string | null
          numero_serie?: string | null
          proveedor?: string
          refaccion_id?: string
          ubicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_refacciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_refacciones_mantenimiento_id_fkey"
            columns: ["mantenimiento_id"]
            isOneToOne: false
            referencedRelation: "mantenimientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_refacciones_refaccion_id_fkey"
            columns: ["refaccion_id"]
            isOneToOne: false
            referencedRelation: "refacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_refacciones_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "ubicaciones_almacen"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidaciones: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          deduccion: number | null
          estado: string
          fecha_liquidacion: string | null
          folio: string
          id: string
          monto_casetas: number
          monto_diesel: number
          monto_neto: number
          monto_operador: number
          monto_total: number
          observaciones: string | null
          otros_gastos: number | null
          viaje_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          deduccion?: number | null
          estado?: string
          fecha_liquidacion?: string | null
          folio: string
          id?: string
          monto_casetas: number
          monto_diesel: number
          monto_neto: number
          monto_operador: number
          monto_total: number
          observaciones?: string | null
          otros_gastos?: number | null
          viaje_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          deduccion?: number | null
          estado?: string
          fecha_liquidacion?: string | null
          folio?: string
          id?: string
          monto_casetas?: number
          monto_diesel?: number
          monto_neto?: number
          monto_operador?: number
          monto_total?: number
          observaciones?: string | null
          otros_gastos?: number | null
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidaciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      mantenimientos: {
        Row: {
          client_id: string
          costo: number
          created_at: string
          created_by: string
          descripcion: string
          equipo_id: string | null
          estado: string
          fecha_mantenimiento: string
          id: string
          odometro: number
          proveedor: string
          proximo_mantenimiento: number | null
          tipo_mantenimiento: string
          unidad: string
        }
        Insert: {
          client_id: string
          costo: number
          created_at?: string
          created_by: string
          descripcion: string
          equipo_id?: string | null
          estado?: string
          fecha_mantenimiento: string
          id?: string
          odometro: number
          proveedor: string
          proximo_mantenimiento?: number | null
          tipo_mantenimiento: string
          unidad: string
        }
        Update: {
          client_id?: string
          costo?: number
          created_at?: string
          created_by?: string
          descripcion?: string
          equipo_id?: string | null
          estado?: string
          fecha_mantenimiento?: string
          id?: string
          odometro?: number
          proveedor?: string
          proximo_mantenimiento?: number | null
          tipo_mantenimiento?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "mantenimientos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mantenimientos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "inventario_equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_refacciones: {
        Row: {
          cantidad: number
          client_id: string | null
          costo_total: number | null
          costo_unitario: number | null
          created_at: string
          created_by: string
          documento_referencia: string | null
          id: string
          inventario_id: string | null
          mantenimiento_id: string | null
          observaciones: string | null
          refaccion_id: string
          solicitud_id: string | null
          tipo_movimiento: string
          ubicacion_destino: string | null
          ubicacion_origen: string | null
        }
        Insert: {
          cantidad: number
          client_id?: string | null
          costo_total?: number | null
          costo_unitario?: number | null
          created_at?: string
          created_by: string
          documento_referencia?: string | null
          id?: string
          inventario_id?: string | null
          mantenimiento_id?: string | null
          observaciones?: string | null
          refaccion_id: string
          solicitud_id?: string | null
          tipo_movimiento: string
          ubicacion_destino?: string | null
          ubicacion_origen?: string | null
        }
        Update: {
          cantidad?: number
          client_id?: string | null
          costo_total?: number | null
          costo_unitario?: number | null
          created_at?: string
          created_by?: string
          documento_referencia?: string | null
          id?: string
          inventario_id?: string | null
          mantenimiento_id?: string | null
          observaciones?: string | null
          refaccion_id?: string
          solicitud_id?: string | null
          tipo_movimiento?: string
          ubicacion_destino?: string | null
          ubicacion_origen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_refacciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_refacciones_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario_refacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_refacciones_mantenimiento_id_fkey"
            columns: ["mantenimiento_id"]
            isOneToOne: false
            referencedRelation: "mantenimientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_refacciones_refaccion_id_fkey"
            columns: ["refaccion_id"]
            isOneToOne: false
            referencedRelation: "refacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_refacciones_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_refacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_refacciones_ubicacion_destino_fkey"
            columns: ["ubicacion_destino"]
            isOneToOne: false
            referencedRelation: "ubicaciones_almacen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_refacciones_ubicacion_origen_fkey"
            columns: ["ubicacion_origen"]
            isOneToOne: false
            referencedRelation: "ubicaciones_almacen"
            referencedColumns: ["id"]
          },
        ]
      }
      operadores: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          dias_vacaciones_disponibles: number | null
          dias_vacaciones_tomados: number | null
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
          qr_code: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          dias_vacaciones_disponibles?: number | null
          dias_vacaciones_tomados?: number | null
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
          qr_code?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          dias_vacaciones_disponibles?: number | null
          dias_vacaciones_tomados?: number | null
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
          qr_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operadores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      personal: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          departamento: string
          dias_trabajo: Json | null
          dias_vacaciones_disponibles: number | null
          dias_vacaciones_tomados: number | null
          direccion: string
          estado: string
          fecha_alta: string
          hora_entrada_esperada: string | null
          hora_salida_esperada: string | null
          hora_salida_sabado: string | null
          id: string
          nombre: string
          numero_empleado: string
          observaciones_horario: string | null
          puesto: string
          qr_code: string | null
          telefono: string | null
          turno: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          departamento: string
          dias_trabajo?: Json | null
          dias_vacaciones_disponibles?: number | null
          dias_vacaciones_tomados?: number | null
          direccion: string
          estado?: string
          fecha_alta: string
          hora_entrada_esperada?: string | null
          hora_salida_esperada?: string | null
          hora_salida_sabado?: string | null
          id?: string
          nombre: string
          numero_empleado: string
          observaciones_horario?: string | null
          puesto: string
          qr_code?: string | null
          telefono?: string | null
          turno?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          departamento?: string
          dias_trabajo?: Json | null
          dias_vacaciones_disponibles?: number | null
          dias_vacaciones_tomados?: number | null
          direccion?: string
          estado?: string
          fecha_alta?: string
          hora_entrada_esperada?: string | null
          hora_salida_esperada?: string | null
          hora_salida_sabado?: string | null
          id?: string
          nombre?: string
          numero_empleado?: string
          observaciones_horario?: string | null
          puesto?: string
          qr_code?: string | null
          telefono?: string | null
          turno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string
          created_at: string
          email: string
          full_name: string | null
          id: string
          puesto: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          puesto?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          puesto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pruebas_alcoholimetro: {
        Row: {
          archivo_url: string | null
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          nivel?: number | null
          nombre?: string
          observaciones?: string | null
          resultado?: string
          tipo_persona?: string
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_alcoholimetro_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      refacciones: {
        Row: {
          activa: boolean
          categoria: string
          client_id: string
          created_at: string
          created_by: string
          descripcion: string
          dias_vida_util: number | null
          foto_url: string | null
          id: string
          notas: string | null
          numero_parte: string
          precio_unitario: number
          proveedor: string
          punto_reorden: number
          requiere_serie: boolean
          stock_maximo: number
          stock_minimo: number
          tiene_caducidad: boolean
          ubicacion_principal: string | null
          unidad_medida: string
        }
        Insert: {
          activa?: boolean
          categoria: string
          client_id: string
          created_at?: string
          created_by: string
          descripcion: string
          dias_vida_util?: number | null
          foto_url?: string | null
          id?: string
          notas?: string | null
          numero_parte: string
          precio_unitario: number
          proveedor: string
          punto_reorden: number
          requiere_serie?: boolean
          stock_maximo: number
          stock_minimo?: number
          tiene_caducidad?: boolean
          ubicacion_principal?: string | null
          unidad_medida: string
        }
        Update: {
          activa?: boolean
          categoria?: string
          client_id?: string
          created_at?: string
          created_by?: string
          descripcion?: string
          dias_vida_util?: number | null
          foto_url?: string | null
          id?: string
          notas?: string | null
          numero_parte?: string
          precio_unitario?: number
          proveedor?: string
          punto_reorden?: number
          requiere_serie?: boolean
          stock_maximo?: number
          stock_minimo?: number
          tiene_caducidad?: boolean
          ubicacion_principal?: string | null
          unidad_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "refacciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refacciones_ubicacion_principal_fkey"
            columns: ["ubicacion_principal"]
            isOneToOne: false
            referencedRelation: "ubicaciones_almacen"
            referencedColumns: ["id"]
          },
        ]
      }
      refacciones_mantenimiento: {
        Row: {
          cantidad: number
          client_id: string | null
          costo_total: number
          costo_unitario: number
          created_at: string
          created_by: string
          id: string
          inventario_id: string
          mantenimiento_id: string
          observaciones: string | null
        }
        Insert: {
          cantidad?: number
          client_id?: string | null
          costo_total: number
          costo_unitario: number
          created_at?: string
          created_by: string
          id?: string
          inventario_id: string
          mantenimiento_id: string
          observaciones?: string | null
        }
        Update: {
          cantidad?: number
          client_id?: string | null
          costo_total?: number
          costo_unitario?: number
          created_at?: string
          created_by?: string
          id?: string
          inventario_id?: string
          mantenimiento_id?: string
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refacciones_mantenimiento_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refacciones_mantenimiento_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario_refacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refacciones_mantenimiento_mantenimiento_id_fkey"
            columns: ["mantenimiento_id"]
            isOneToOne: false
            referencedRelation: "mantenimientos"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_documental: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          empresa: string
          estado_general: string
          fecha_revision: string
          foto_analisis_fisicoquimico: string | null
          foto_dictamen_humos: string | null
          foto_licencia_operador: string | null
          foto_poliza_seguro: string | null
          foto_tarjeta_circulacion: string | null
          id: string
          numero_economico: string
          observaciones: string | null
          operador_nombre: string
          placas: string | null
          updated_at: string
          vigencia_analisis_fisicoquimico: string | null
          vigencia_dictamen_humos: string | null
          vigencia_licencia: string | null
          vigencia_poliza_seguro: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          empresa: string
          estado_general?: string
          fecha_revision?: string
          foto_analisis_fisicoquimico?: string | null
          foto_dictamen_humos?: string | null
          foto_licencia_operador?: string | null
          foto_poliza_seguro?: string | null
          foto_tarjeta_circulacion?: string | null
          id?: string
          numero_economico: string
          observaciones?: string | null
          operador_nombre: string
          placas?: string | null
          updated_at?: string
          vigencia_analisis_fisicoquimico?: string | null
          vigencia_dictamen_humos?: string | null
          vigencia_licencia?: string | null
          vigencia_poliza_seguro?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          empresa?: string
          estado_general?: string
          fecha_revision?: string
          foto_analisis_fisicoquimico?: string | null
          foto_dictamen_humos?: string | null
          foto_licencia_operador?: string | null
          foto_poliza_seguro?: string | null
          foto_tarjeta_circulacion?: string | null
          id?: string
          numero_economico?: string
          observaciones?: string | null
          operador_nombre?: string
          placas?: string | null
          updated_at?: string
          vigencia_analisis_fisicoquimico?: string | null
          vigencia_dictamen_humos?: string | null
          vigencia_licencia?: string | null
          vigencia_poliza_seguro?: string | null
        }
        Relationships: []
      }
      rondines: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          folio: string
          id: string
          incidentes_reportados: number
          observaciones: string | null
          updated_at: string
          zonas_totales: number
          zonas_visitadas: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          folio: string
          id?: string
          incidentes_reportados?: number
          observaciones?: string | null
          updated_at?: string
          zonas_totales: number
          zonas_visitadas?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          folio?: string
          id?: string
          incidentes_reportados?: number
          observaciones?: string | null
          updated_at?: string
          zonas_totales?: number
          zonas_visitadas?: number
        }
        Relationships: []
      }
      rutas: {
        Row: {
          activa: boolean
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "rutas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      sellos_seguridad: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          estado: string
          fecha_asignacion: string | null
          fecha_fabricacion: string | null
          fecha_retiro: string | null
          fecha_vencimiento: string | null
          id: string
          motivo_retiro: string | null
          numero_sello: string
          observaciones: string | null
          tipo: string
          unidad: string | null
          viaje_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          estado?: string
          fecha_asignacion?: string | null
          fecha_fabricacion?: string | null
          fecha_retiro?: string | null
          fecha_vencimiento?: string | null
          id?: string
          motivo_retiro?: string | null
          numero_sello: string
          observaciones?: string | null
          tipo?: string
          unidad?: string | null
          viaje_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          fecha_asignacion?: string | null
          fecha_fabricacion?: string | null
          fecha_retiro?: string | null
          fecha_vencimiento?: string | null
          id?: string
          motivo_retiro?: string | null
          numero_sello?: string
          observaciones?: string | null
          tipo?: string
          unidad?: string | null
          viaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellos_seguridad_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellos_seguridad_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_refacciones: {
        Row: {
          aprobador: string | null
          client_id: string
          comprador_id: string | null
          created_at: string
          created_by: string
          estado: string
          estado_compra: string | null
          fecha_aprobacion: string | null
          fecha_completada: string | null
          fecha_compra: string | null
          fecha_requerida: string | null
          fecha_solicitud: string
          folio: string
          id: string
          mantenimiento_id: string | null
          monto_compra: number | null
          motivo_cancelacion: string | null
          observaciones: string | null
          prioridad: string
          proveedor_compra: string | null
          solicitante: string
          unidad: string
        }
        Insert: {
          aprobador?: string | null
          client_id: string
          comprador_id?: string | null
          created_at?: string
          created_by: string
          estado?: string
          estado_compra?: string | null
          fecha_aprobacion?: string | null
          fecha_completada?: string | null
          fecha_compra?: string | null
          fecha_requerida?: string | null
          fecha_solicitud?: string
          folio: string
          id?: string
          mantenimiento_id?: string | null
          monto_compra?: number | null
          motivo_cancelacion?: string | null
          observaciones?: string | null
          prioridad?: string
          proveedor_compra?: string | null
          solicitante: string
          unidad: string
        }
        Update: {
          aprobador?: string | null
          client_id?: string
          comprador_id?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          estado_compra?: string | null
          fecha_aprobacion?: string | null
          fecha_completada?: string | null
          fecha_compra?: string | null
          fecha_requerida?: string | null
          fecha_solicitud?: string
          folio?: string
          id?: string
          mantenimiento_id?: string | null
          monto_compra?: number | null
          motivo_cancelacion?: string | null
          observaciones?: string | null
          prioridad?: string
          proveedor_compra?: string | null
          solicitante?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_refacciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_refacciones_mantenimiento_id_fkey"
            columns: ["mantenimiento_id"]
            isOneToOne: false
            referencedRelation: "mantenimientos"
            referencedColumns: ["id"]
          },
        ]
      }
      ubicaciones_almacen: {
        Row: {
          activa: boolean
          capacidad: number | null
          client_id: string | null
          codigo: string
          created_at: string
          created_by: string
          descripcion: string | null
          id: string
          tipo: string
        }
        Insert: {
          activa?: boolean
          capacidad?: number | null
          client_id?: string | null
          codigo: string
          created_at?: string
          created_by: string
          descripcion?: string | null
          id?: string
          tipo: string
        }
        Update: {
          activa?: boolean
          capacidad?: number | null
          client_id?: string | null
          codigo?: string
          created_at?: string
          created_by?: string
          descripcion?: string | null
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ubicaciones_almacen_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          estado: string
          id: string
          marca: string
          modelo: string
          notas: string | null
          numero_economico: string
          odometro: number
          placas: string | null
          requiere_mantenimiento: boolean
          tipo: string
          ubicacion: string
          ultima_entrada: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          estado?: string
          id?: string
          marca: string
          modelo: string
          notas?: string | null
          numero_economico: string
          odometro?: number
          placas?: string | null
          requiere_mantenimiento?: boolean
          tipo: string
          ubicacion: string
          ultima_entrada?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          estado?: string
          id?: string
          marca?: string
          modelo?: string
          notas?: string | null
          numero_economico?: string
          odometro?: number
          placas?: string | null
          requiere_mantenimiento?: boolean
          tipo?: string
          ubicacion?: string
          ultima_entrada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_permissions: {
        Row: {
          can_access: boolean
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          module_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module_name?: string
          updated_at?: string
          user_id?: string
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
      vacaciones: {
        Row: {
          aprobado_por: string | null
          client_id: string
          created_at: string
          created_by: string
          dias_disponibles_antes: number | null
          dias_totales: number
          empleado_id: string
          empleado_nombre: string
          estado: string
          excede_dias_disponibles: boolean | null
          fecha_aprobacion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          motivo: string | null
          observaciones: string | null
          requiere_aprobacion: boolean | null
          tipo_empleado: string
          updated_at: string
        }
        Insert: {
          aprobado_por?: string | null
          client_id: string
          created_at?: string
          created_by: string
          dias_disponibles_antes?: number | null
          dias_totales: number
          empleado_id: string
          empleado_nombre: string
          estado?: string
          excede_dias_disponibles?: boolean | null
          fecha_aprobacion?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          motivo?: string | null
          observaciones?: string | null
          requiere_aprobacion?: boolean | null
          tipo_empleado: string
          updated_at?: string
        }
        Update: {
          aprobado_por?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          dias_disponibles_antes?: number | null
          dias_totales?: number
          empleado_id?: string
          empleado_nombre?: string
          estado?: string
          excede_dias_disponibles?: boolean | null
          fecha_aprobacion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          motivo?: string | null
          observaciones?: string | null
          requiere_aprobacion?: boolean | null
          tipo_empleado?: string
          updated_at?: string
        }
        Relationships: []
      }
      vales_salida: {
        Row: {
          autorizado_por: string
          client_id: string | null
          created_at: string
          created_by: string
          estado: string
          fecha_vale: string
          hora_salida_autorizada: string
          id: string
          motivo: string
          observaciones: string | null
          personal_id: string
        }
        Insert: {
          autorizado_por: string
          client_id?: string | null
          created_at?: string
          created_by: string
          estado?: string
          fecha_vale?: string
          hora_salida_autorizada: string
          id?: string
          motivo: string
          observaciones?: string | null
          personal_id: string
        }
        Update: {
          autorizado_por?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          fecha_vale?: string
          hora_salida_autorizada?: string
          id?: string
          motivo?: string
          observaciones?: string | null
          personal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vales_salida_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vales_salida_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vales_salida_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
        ]
      }
      viajes: {
        Row: {
          client_id: string
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
          unidad_negocio: string
        }
        Insert: {
          client_id: string
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
          unidad_negocio?: string
        }
        Update: {
          client_id?: string
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
          unidad_negocio?: string
        }
        Relationships: [
          {
            foreignKeyName: "viajes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas: {
        Row: {
          area_visita: string
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "visitas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas_zonas: {
        Row: {
          client_id: string | null
          codigo_qr: string
          created_at: string
          created_by: string
          descripcion_incidente: string | null
          foto_url: string | null
          id: string
          incidente: boolean | null
          rondin_id: string | null
          ubicacion: string
        }
        Insert: {
          client_id?: string | null
          codigo_qr: string
          created_at?: string
          created_by: string
          descripcion_incidente?: string | null
          foto_url?: string | null
          id?: string
          incidente?: boolean | null
          rondin_id?: string | null
          ubicacion: string
        }
        Update: {
          client_id?: string | null
          codigo_qr?: string
          created_at?: string
          created_by?: string
          descripcion_incidente?: string | null
          foto_url?: string | null
          id?: string
          incidente?: boolean | null
          rondin_id?: string | null
          ubicacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "rondines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_zonas_rondin_id_fkey"
            columns: ["rondin_id"]
            isOneToOne: false
            referencedRelation: "rondines"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_seguridad: {
        Row: {
          activa: boolean
          client_id: string | null
          codigo_qr: string
          created_at: string
          created_by: string
          id: string
          nombre: string
          orden: number
          ubicacion: string
        }
        Insert: {
          activa?: boolean
          client_id?: string | null
          codigo_qr: string
          created_at?: string
          created_by: string
          id?: string
          nombre: string
          orden?: number
          ubicacion: string
        }
        Update: {
          activa?: boolean
          client_id?: string | null
          codigo_qr?: string
          created_at?: string
          created_by?: string
          id?: string
          nombre?: string
          orden?: number
          ubicacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "zonas_seguridad_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_dias_vacaciones: { Args: never; Returns: undefined }
      calcular_dias_vacaciones: {
        Args: { fecha_alta: string }
        Returns: number
      }
      can_view_all_data: { Args: never; Returns: boolean }
      generate_accion_correctiva_folio: { Args: never; Returns: string }
      generate_inspeccion_instalaciones_folio: { Args: never; Returns: string }
      generate_rondin_folio: { Args: never; Returns: string }
      generate_solicitud_folio: { Args: never; Returns: string }
      get_client_id_by_email_domain: { Args: never; Returns: string }
      get_user_client_id: { Args: never; Returns: string }
      has_any_module_permission: {
        Args: { _module_names: string[]; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_module_permission:
        | { Args: { _module_name: string; _user_id: string }; Returns: boolean }
        | {
            Args: {
              _module_name: string
              _permission: string
              _user_id: string
            }
            Returns: boolean
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_table_module_permission: {
        Args: { _permission: string; _table_name: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      matches_user_client: { Args: never; Returns: boolean }
      module_names_for_table: {
        Args: { _table_name: string }
        Returns: string[]
      }
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
