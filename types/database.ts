/**
 * Supabase Database Type Definitions
 *
 * Auto-generated type definitions for Supabase database
 * To regenerate: npx supabase gen types typescript --project-id seybhemcarmdinrvazmn > src/types/database.ts
 *
 * @module types/database
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Define tables here or use supabase gen types
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      [key: string]: string;
    };
  };
}