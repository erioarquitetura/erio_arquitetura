export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          documento: string | null
          email: string | null
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          nome_completo: string
          nome_usuario: string
          email: string
          senha: string
          tipo_usuario: string
          data_criacao: string
          data_atualizacao: string
          ativo: boolean
        }
        Insert: {
          id?: string
          nome_completo: string
          nome_usuario: string
          email: string
          senha: string
          tipo_usuario: string
          data_criacao?: string
          data_atualizacao?: string
          ativo?: boolean
        }
        Update: {
          id?: string
          nome_completo?: string
          nome_usuario?: string
          email?: string
          senha?: string
          tipo_usuario?: string
          data_criacao?: string
          data_atualizacao?: string
          ativo?: boolean
        }
        Relationships: []
      }
      permissoes_usuario: {
        Row: {
          id: string
          usuario_id: string
          cadastros: boolean
          financeiro: boolean
          fiscal: boolean
          propostas: boolean
          relatorios: boolean
          gerenciamento: boolean
          teste_conexao: boolean
          data_criacao: string
          data_atualizacao: string
        }
        Insert: {
          id?: string
          usuario_id: string
          cadastros?: boolean
          financeiro?: boolean
          fiscal?: boolean
          propostas?: boolean
          relatorios?: boolean
          gerenciamento?: boolean
          teste_conexao?: boolean
          data_criacao?: string
          data_atualizacao?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          cadastros?: boolean
          financeiro?: boolean
          fiscal?: boolean
          propostas?: boolean
          relatorios?: boolean
          gerenciamento?: boolean
          teste_conexao?: boolean
          data_criacao?: string
          data_atualizacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      proposta_condicoes_pagamento: {
        Row: {
          descricao: string
          id: string
          ordem: number
          percentual: number
          proposta_id: string | null
          valor: number
        }
        Insert: {
          descricao: string
          id?: string
          ordem: number
          percentual: number
          proposta_id?: string | null
          valor: number
        }
        Update: {
          descricao?: string
          id?: string
          ordem?: number
          percentual?: number
          proposta_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposta_condicoes_pagamento_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_descricao_projeto: {
        Row: {
          area: string
          descricao: string
          id: string
          metragem: number
          ordem: number
          proposta_id: string | null
        }
        Insert: {
          area: string
          descricao: string
          id?: string
          metragem: number
          ordem: number
          proposta_id?: string | null
        }
        Update: {
          area?: string
          descricao?: string
          id?: string
          metragem?: number
          ordem?: number
          proposta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_descricao_projeto_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_etapas_projeto: {
        Row: {
          id: string
          nome: string
          ordem: number
          proposta_id: string | null
          valor: number | null
        }
        Insert: {
          id?: string
          nome: string
          ordem: number
          proposta_id?: string | null
          valor?: number | null
        }
        Update: {
          id?: string
          nome?: string
          ordem?: number
          proposta_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_etapas_projeto_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_resumo_executivo: {
        Row: {
          id: string
          ordem: number
          proposta_id: string | null
          topico: string
        }
        Insert: {
          id?: string
          ordem: number
          proposta_id?: string | null
          topico: string
        }
        Update: {
          id?: string
          ordem?: number
          proposta_id?: string | null
          topico?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposta_resumo_executivo_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          cliente_id: string | null
          codigo: string
          data_criacao: string | null
          data_validade: string | null
          endereco_interesse_bairro: string | null
          endereco_interesse_cep: string | null
          endereco_interesse_cidade: string | null
          endereco_interesse_complemento: string | null
          endereco_interesse_estado: string | null
          endereco_interesse_logradouro: string | null
          endereco_interesse_numero: string | null
          id: string
          mesmo_endereco_cliente: boolean | null
          status: string | null
          titulo: string
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          codigo: string
          data_criacao?: string | null
          data_validade?: string | null
          endereco_interesse_bairro?: string | null
          endereco_interesse_cep?: string | null
          endereco_interesse_cidade?: string | null
          endereco_interesse_complemento?: string | null
          endereco_interesse_estado?: string | null
          endereco_interesse_logradouro?: string | null
          endereco_interesse_numero?: string | null
          id?: string
          mesmo_endereco_cliente?: boolean | null
          status?: string | null
          titulo: string
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          codigo?: string
          data_criacao?: string | null
          data_validade?: string | null
          endereco_interesse_bairro?: string | null
          endereco_interesse_cep?: string | null
          endereco_interesse_cidade?: string | null
          endereco_interesse_complemento?: string | null
          endereco_interesse_estado?: string | null
          endereco_interesse_logradouro?: string | null
          endereco_interesse_numero?: string | null
          id?: string
          mesmo_endereco_cliente?: boolean | null
          status?: string | null
          titulo?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          id: string
          numero: string
          data_emissao: string
          cliente_id: string | null
          valor: number
          status: string
          data_lancamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero: string
          data_emissao: string
          cliente_id?: string | null
          valor: number
          status?: string
          data_lancamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero?: string
          data_emissao?: string
          cliente_id?: string | null
          valor?: number
          status?: string
          data_lancamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      notas_fiscais_recebidas: {
        Row: {
          id: string
          numero_nota: string
          data_emissao: string
          cnpj_emitente: string
          nome_emitente: string
          valor_total: number
          produtos: Json | null
          observacoes: string | null
          xml_base64: string | null
          data_lancamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_nota: string
          data_emissao: string
          cnpj_emitente: string
          nome_emitente: string
          valor_total: number
          produtos?: Json | null
          observacoes?: string | null
          xml_base64?: string | null
          data_lancamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_nota?: string
          data_emissao?: string
          cnpj_emitente?: string
          nome_emitente?: string
          valor_total?: number
          produtos?: Json | null
          observacoes?: string | null
          xml_base64?: string | null
          data_lancamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      receitas_itens: {
        Row: {
          id: string
          receita_id: string
          valor: number
          data_vencimento: string
          status: string
          data_pagamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          receita_id: string
          valor: number
          data_vencimento: string
          status?: string
          data_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          receita_id?: string
          valor?: number
          data_vencimento?: string
          status?: string
          data_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receitas_itens_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          }
        ]
      }
      receitas: {
        Row: {
          id: string
          cliente_id: string
          total: number
          data_criacao: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          total: number
          data_criacao: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          total?: number
          data_criacao?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      despesas: {
        Row: {
          id: string
          valor: number
          categoria_id: string
          data_lancamento: string
          data_vencimento: string
          status_pagamento: string
          fornecedor: string | null
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          valor: number
          categoria_id: string
          data_lancamento: string
          data_vencimento: string
          status_pagamento?: string
          fornecedor?: string | null
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          valor?: number
          categoria_id?: string
          data_lancamento?: string
          data_vencimento?: string
          status_pagamento?: string
          fornecedor?: string | null
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_despesas"
            referencedColumns: ["id"]
          }
        ]
      }
      categorias_despesas: {
        Row: {
          id: string
          nome: string
          cor: string | null
          despesa_fiscal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cor?: string | null
          despesa_fiscal?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cor?: string | null
          despesa_fiscal?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lista_desejos: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          categoria: string
          valor_estimado: number
          prioridade: string
          data_desejada: string | null
          status: string
          data_criacao: string
          data_atualizacao: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          categoria: string
          valor_estimado: number
          prioridade: string
          data_desejada?: string | null
          status?: string
          data_criacao?: string
          data_atualizacao?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          categoria?: string
          valor_estimado?: number
          prioridade?: string
          data_desejada?: string | null
          status?: string
          data_criacao?: string
          data_atualizacao?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_proposal_code: {
        Args: {
          client_id: string
        }
        Returns: string
      }
      get_auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_initials: {
        Args: {
          name: string
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
