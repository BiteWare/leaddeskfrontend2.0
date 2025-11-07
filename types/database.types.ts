export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      enrichment_jobs: {
        Row: {
          correlation_id: string;
          run_user_id: string | null;
          created_at: string | null;
          overall_job_status: string | null;
          input_customer_name: string | null;
          input_street_address: string | null;
          input_city: string | null;
          input_state: string | null;
          url_worker_job_id: string | null;
          url_worker_results_json: Json | null;
          scraper_worker_job_id: string | null;
          scraper_worker_results_json: Json | null;
          url_worker_resulting_url: string | null;
          cohort: string | null;
          exclusion_reason: string | null;
        };
        Insert: {
          correlation_id: string;
          run_user_id?: string | null;
          created_at?: string | null;
          overall_job_status?: string | null;
          input_customer_name?: string | null;
          input_street_address?: string | null;
          input_city?: string | null;
          input_state?: string | null;
          url_worker_job_id?: string | null;
          url_worker_results_json?: Json | null;
          scraper_worker_job_id?: string | null;
          scraper_worker_results_json?: Json | null;
          url_worker_resulting_url?: string | null;
          cohort?: string | null;
          exclusion_reason?: string | null;
        };
        Update: {
          correlation_id?: string;
          run_user_id?: string | null;
          created_at?: string | null;
          overall_job_status?: string | null;
          input_customer_name?: string | null;
          input_street_address?: string | null;
          input_city?: string | null;
          input_state?: string | null;
          url_worker_job_id?: string | null;
          url_worker_results_json?: Json | null;
          scraper_worker_job_id?: string | null;
          scraper_worker_results_json?: Json | null;
          url_worker_resulting_url?: string | null;
          cohort?: string | null;
          exclusion_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrichment_jobs_run_user_id_fkey";
            columns: ["run_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

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
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

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
    : never;

// Helper type for enrichment jobs with user relationship
export interface EnrichmentJob extends Tables<"enrichment_jobs"> {
  users?: {
    email: string | null;
  } | null;
}
