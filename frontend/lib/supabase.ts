import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqbauwlgnbokeokleajm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Horario {
  id: string;
  data: string;
  hora: string;
  turno: 'manha' | 'tarde' | 'noite';
  status: 'livre' | 'ocupado' | 'bloqueado';
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  email?: string;
  telefone?: string;
}

export interface Agendamento {
  id: string;
  aluno_id: string;
  horario_id: string;
  motivo: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'realizado';
  observacao?: string;
  created_at: string;
  updated_at: string;
  alunos?: Aluno;
  horarios?: Horario;
}
