import { useEffect, useState } from 'react';
import { supabase, Agendamento, Horario } from '../lib/supabase';

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState<(Agendamento & { alunos: any; horarios: any })[]>([]);
  const [status, setStatus] = useState('pendente');
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setLoggedIn(true);
      carregarAgendamentos();
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      carregarAgendamentos();
    }
  }, [status, loggedIn]);

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

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const senha = formData.get('senha') as string;

    if (email === 'desousabarbosafilho@gmail.com' && senha === 'TesteADS2026@') {
      localStorage.setItem('admin_auth', 'true');
      setLoggedIn(true);
      carregarAgendamentos();
    } else {
      alert('Credenciais inválidas');
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Acesso da Coordenação</h1>
            <p className="text-gray-500 text-sm mt-2">Sistema de Agendamento ADS - UNINASSAU</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="coordenador@uninassau.edu.br"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                name="senha"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-indigo-600 hover:underline">← Voltar para agendamento</a>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Painel da Coordenação</h1>
          <p className="text-indigo-200 text-sm">Sistema de Agendamento ADS - UNINASSAU</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['pendente', 'confirmado', 'cancelado', 'realizado'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                  status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Nenhum agendamento com status "{status}"</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {agendamentos.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{a.alunos?.nome}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Matrícula: {a.alunos?.matricula}</p>
                      {a.alunos?.email && <p>Email: {a.alunos?.email}</p>}
                      {a.alunos?.telefone && <p>Telefone: {a.alunos?.telefone}</p>}
                      <p>Data: {a.horarios?.data} às {a.horarios?.hora}</p>
                      {a.motivo && <p>Motivo: {a.motivo}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {a.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => atualizarStatus(a.id, 'confirmado')}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => atualizarStatus(a.id, 'cancelado')}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {a.status === 'confirmado' && (
                      <button
                        onClick={() => atualizarStatus(a.id, 'realizado')}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
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
