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
      analisis_riesgos: {
        Row: {
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
        Relationships: []
      }
      asistencia_personal: {
        Row: {
          created_at: string
          created_by: string
          estado: string
          fecha_entrada: string
          fecha_salida: string | null
          id: string
          personal_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          estado?: string
          fecha_entrada?: string
          fecha_salida?: string | null
          id?: string
          personal_id: string
        }
        Update: {
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
            foreignKeyName: "asistencia_personal_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_solicitudes_refacciones: {
        Row: {
          cantidad_entregada: number | null
          cantidad_solicitada: number
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
      inventario_refacciones: {
        Row: {
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
          costo: number
          created_at: string
          created_by: string
          descripcion: string
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
          costo: number
          created_at?: string
          created_by: string
          descripcion: string
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
          costo?: number
          created_at?: string
          created_by?: string
          descripcion?: string
          estado?: string
          fecha_mantenimiento?: string
          id?: string
          odometro?: number
          proveedor?: string
          proximo_mantenimiento?: number | null
          tipo_mantenimiento?: string
          unidad?: string
        }
        Relationships: []
      }
      movimientos_refacciones: {
        Row: {
          cantidad: number
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
      personal: {
        Row: {
          created_at: string
          created_by: string
          departamento: string
          direccion: string
          estado: string
          fecha_alta: string
          id: string
          nombre: string
          numero_empleado: string
          puesto: string
          telefono: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          departamento: string
          direccion: string
          estado?: string
          fecha_alta: string
          id?: string
          nombre: string
          numero_empleado: string
          puesto: string
          telefono?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          departamento?: string
          direccion?: string
          estado?: string
          fecha_alta?: string
          id?: string
          nombre?: string
          numero_empleado?: string
          puesto?: string
          telefono?: string | null
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
      refacciones: {
        Row: {
          activa: boolean
          categoria: string
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
            foreignKeyName: "refacciones_ubicacion_principal_fkey"
            columns: ["ubicacion_principal"]
            isOneToOne: false
            referencedRelation: "ubicaciones_almacen"
            referencedColumns: ["id"]
          },
        ]
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
      sellos_seguridad: {
        Row: {
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
          created_at: string
          created_by: string
          estado: string
          fecha_aprobacion: string | null
          fecha_completada: string | null
          fecha_requerida: string | null
          fecha_solicitud: string
          folio: string
          id: string
          mantenimiento_id: string | null
          motivo_cancelacion: string | null
          observaciones: string | null
          prioridad: string
          solicitante: string
          unidad: string
        }
        Insert: {
          aprobador?: string | null
          created_at?: string
          created_by: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_completada?: string | null
          fecha_requerida?: string | null
          fecha_solicitud?: string
          folio: string
          id?: string
          mantenimiento_id?: string | null
          motivo_cancelacion?: string | null
          observaciones?: string | null
          prioridad?: string
          solicitante: string
          unidad: string
        }
        Update: {
          aprobador?: string | null
          created_at?: string
          created_by?: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_completada?: string | null
          fecha_requerida?: string | null
          fecha_solicitud?: string
          folio?: string
          id?: string
          mantenimiento_id?: string | null
          motivo_cancelacion?: string | null
          observaciones?: string | null
          prioridad?: string
          solicitante?: string
          unidad?: string
        }
        Relationships: [
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
          codigo?: string
          created_at?: string
          created_by?: string
          descripcion?: string | null
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
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
      generate_solicitud_folio: { Args: never; Returns: string }
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
