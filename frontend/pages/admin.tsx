import { useEffect, useState } from 'react';

interface Agendamento {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  telefone: string;
  data: string;
  horario: string;
  motivo: string;
  status: string;
  criado_em: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [status, setStatus] = useState('pendente');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
  }, [status]);

  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/agendamentos?status=${status}`);
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
      const response = await fetch(`${API_URL}/api/admin/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-green-100 text-green-800',
      recusado: 'bg-red-100 text-red-800',
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
            {['pendente', 'confirmado', 'recusado', 'realizado'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                  status === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{a.nome}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Matrícula: {a.matricula}</p>
                      {a.email && <p>Email: {a.email}</p>}
                      {a.telefone && <p>Telefone: {a.telefone}</p>}
                      <p>Data: {a.data} às {a.horario}</p>
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
                          onClick={() => atualizarStatus(a.id, 'recusado')}
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