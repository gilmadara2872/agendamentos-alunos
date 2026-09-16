import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, Agendamento } from '../lib/supabase';

export default function Admin() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<(Agendamento & { alunos: any; horarios: any })[]>([]);
  const [status, setStatus] = useState('pendente');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/login');
      return;
    }
    carregarAgendamentos();
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      carregarAgendamentos();
    }
  }, [status]);

  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          alunos (*),
          horarios (*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      carregarAgendamentos();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/login');
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      realizado: 'bg-blue-100 text-blue-800'
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Painel da Coordenação</h1>
              <p className="text-indigo-200 text-lg">Sistema de Agendamento ADS - UNINASSAU</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-800 rounded-lg text-lg font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex gap-4 flex-wrap justify-center">
            {['pendente', 'confirmado', 'cancelado', 'realizado'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-6 py-3 rounded-lg text-lg font-medium capitalize ${
                  status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-xl">Nenhum agendamento com status "{status}"</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {agendamentos.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{a.alunos?.nome}</h3>
                      <span className={`px-3 py-1 rounded text-base font-medium ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="text-lg text-gray-600 space-y-2">
                      <p>Matrícula: {a.alunos?.matricula}</p>
                      {a.alunos?.email && <p>Email: {a.alunos?.email}</p>}
                      {a.alunos?.telefone && <p>Telefone: {a.alunos?.telefone}</p>}
                      <p>Data: {a.horarios?.data} às {a.horarios?.hora}</p>
                      {a.motivo && <p>Motivo: {a.motivo}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {a.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => atualizarStatus(a.id, 'confirmado')}
                          className="px-5 py-3 bg-green-600 text-white rounded-lg text-lg hover:bg-green-700"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => atualizarStatus(a.id, 'cancelado')}
                          className="px-5 py-3 bg-red-600 text-white rounded-lg text-lg hover:bg-red-700"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {a.status === 'confirmado' && (
                      <button
                        onClick={() => atualizarStatus(a.id, 'realizado')}
                        className="px-5 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700"
                      >
                        Marcar Realizado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
