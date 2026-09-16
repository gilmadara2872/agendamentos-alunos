import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Agendamento {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  telefone: string;
  data: string;
  hora: string;
  motivo: string;
  status: string;
  criado_em: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function authedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

export default function Admin() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [status, setStatus] = useState('pendente');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    carregarAgendamentos();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      carregarAgendamentos();
    }
  }, [status]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const response = await authedFetch(`${API_URL}/api/admin/agendamentos?status=${status}`);
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const dados = await response.json();
      setAgendamentos(dados.agendamentos || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      const response = await authedFetch(`${API_URL}/api/admin/agendamentos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus })
      });
      if (response.ok) {
        carregarAgendamentos();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white',
      confirmado: 'bg-gradient-to-r from-green-400 to-green-600 text-white',
      recusado: 'bg-gradient-to-r from-red-400 to-red-600 text-white',
      realizado: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
    };
    return colors[s] || 'bg-gray-200 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg shadow-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-2xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel da Coordenação</h1>
                <p className="text-base text-gray-500">Sistema de Agendamento ADS - UNINASSAU</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-base font-bold hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-200"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Filtros */}
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-6">
          <div className="flex gap-4 flex-wrap justify-center">
            {['pendente', 'confirmado', 'recusado', 'realizado'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all transform hover:scale-105 active:scale-95 capitalize ${
                  status === s
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-12 text-center">
            <p className="text-gray-500 text-xl">Nenhum agendamento com status "{status}"</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {agendamentos.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{a.nome}</h3>
                      <span className={`px-4 py-2 rounded-xl text-base font-bold ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="text-lg text-gray-600 space-y-2">
                      <p>Matrícula: {a.matricula}</p>
                      {a.email && <p>Email: {a.email}</p>}
                      {a.telefone && <p>Telefone: {a.telefone}</p>}
                      <p className="font-semibold text-gray-800">Data: {a.data} às {a.hora}</p>
                      {a.motivo && <p>Motivo: {a.motivo}</p>}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-4 flex-wrap">
                    {a.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => atualizarStatus(a.id, 'confirmado')}
                          className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl text-lg font-bold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-200"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => atualizarStatus(a.id, 'recusado')}
                          className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl text-lg font-bold hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-200"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {a.status === 'confirmado' && (
                      <button
                        onClick={() => atualizarStatus(a.id, 'realizado')}
                        className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-200"
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
