import type { ColumnDef } from "@/types/tableau";

export type ClientLockin = {
  id_client: string;
  prenom_client: string;
  nom_societe: string;
  domaine_activite: string | null;
  forfait: "freemium" | "pro" | "enterprise";
  pays: string;
  imports_ia_count?: number;
  imports_ia_month?: string | null;
  date_inscription: string;
  updated_at?: string;
};

export type TableauRow = {
  id: string;
  user_id: string;
  name: string;
  left_columns: ColumnDef[];
  hidden_left_columns: ColumnDef[];
  cc_creditor: boolean;
  created_at: string;
};

export type RelanceStepChannel = "email" | "sms" | "both";

export type RelanceStepRow = {
  id: string;
  tableau_id: string;
  name: string;
  days: number;
  message_template: string;
  sms_template: string;
  channel: RelanceStepChannel;
  ordre: number;
};

export type LigneFactureRow = {
  id: string;
  tableau_id: string;
  values: Record<string, string>;
  created_at: string;
};

export type RelanceDeliveryStatus =
  | "pending"
  | "queued"
  | "sent"
  | "failed"
  | "cancelled";

export type RelanceDeliveryRow = {
  id: string;
  ligne_id: string;
  step_id: string;
  tableau_id: string;
  scheduled_for: string;
  status: RelanceDeliveryStatus;
  sent_at: string | null;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
};

export type TableauWithRelations = TableauRow & {
  relance_steps: RelanceStepRow[];
  lignes_factures: LigneFactureRow[];
};

export type Database = {
  public: {
    Tables: {
      clients_lockin: {
        Row: ClientLockin;
        Insert: {
          id_client: string;
          prenom_client: string;
          nom_societe: string;
          domaine_activite?: string | null;
          forfait?: ClientLockin["forfait"];
          pays?: string;
          imports_ia_count?: number;
          imports_ia_month?: string | null;
          date_inscription?: string;
          updated_at?: string;
        };
        Update: {
          prenom_client?: string;
          nom_societe?: string;
          domaine_activite?: string | null;
          forfait?: ClientLockin["forfait"];
          pays?: string;
          imports_ia_count?: number;
          imports_ia_month?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tableaux: {
        Row: TableauRow;
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          left_columns?: ColumnDef[];
          hidden_left_columns?: ColumnDef[];
          cc_creditor?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          left_columns?: ColumnDef[];
          hidden_left_columns?: ColumnDef[];
          cc_creditor?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "tableaux_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      relance_steps: {
        Row: RelanceStepRow;
        Insert: {
          id?: string;
          tableau_id: string;
          name: string;
          days: number;
          message_template?: string;
          sms_template?: string;
          channel?: RelanceStepChannel;
          ordre?: number;
        };
        Update: {
          tableau_id?: string;
          name?: string;
          days?: number;
          message_template?: string;
          sms_template?: string;
          channel?: RelanceStepChannel;
          ordre?: number;
        };
        Relationships: [
          {
            foreignKeyName: "relance_steps_tableau_id_fkey";
            columns: ["tableau_id"];
            referencedRelation: "tableaux";
            referencedColumns: ["id"];
          },
        ];
      };
      lignes_factures: {
        Row: LigneFactureRow;
        Insert: {
          id?: string;
          tableau_id: string;
          values?: Record<string, string>;
          created_at?: string;
        };
        Update: {
          values?: Record<string, string>;
        };
        Relationships: [
          {
            foreignKeyName: "lignes_factures_tableau_id_fkey";
            columns: ["tableau_id"];
            referencedRelation: "tableaux";
            referencedColumns: ["id"];
          },
        ];
      };
      relance_deliveries: {
        Row: RelanceDeliveryRow;
        Insert: {
          id?: string;
          ligne_id: string;
          step_id: string;
          tableau_id: string;
          scheduled_for: string;
          status?: RelanceDeliveryStatus;
          sent_at?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
          idempotency_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: RelanceDeliveryStatus;
          sent_at?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "relance_deliveries_ligne_id_fkey";
            columns: ["ligne_id"];
            referencedRelation: "lignes_factures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relance_deliveries_step_id_fkey";
            columns: ["step_id"];
            referencedRelation: "relance_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relance_deliveries_tableau_id_fkey";
            columns: ["tableau_id"];
            referencedRelation: "tableaux";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
