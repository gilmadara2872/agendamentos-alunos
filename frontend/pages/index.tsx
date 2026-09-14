import Head from 'next/head';
import { useEffect, useState } from 'react';

interface Horario {
  horario: string;
  periodo: string;
  disponivel: boolean;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarHorarios();
  }, [data]);

  const carregarHorarios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/horarios?data=${data}`);
      const dados = await response.json();
      setHorarios(dados.horarios || []);
      setErro('');
    } catch (error) {
      setErro('Erro ao carregar horários');
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAgendar = async (horario: string) => {
    const nome = prompt('Seu nome:');
    if (!nome) return;

    const matricula = prompt('Sua matrícula:');
    if (!matricula) return;

    const email = prompt('Seu email (opcional):') || '';
    const telefone = prompt('Seu telefone (opcional):') || '';
    const motivo = prompt('Motivo do atendimento:') || '';

    try {
      const response = await fetch(`${API_URL}/api/agendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          matricula,
          email,
          telefone,
          motivo,
          data,
          horario
        })
      });

      const dados = await response.json();
      
      if (response.ok) {
        alert(dados.mensagem);
        carregarHorarios();
      } else {
        alert(dados.erro || 'Erro ao agendar');
      }
    } catch (error) {
      alert('Erro ao agendar. Tente novamente.');
    }
  };

  const periodoIcon = (p: string) => {
    if (p === 'manha') return '☀️';
    if (p === 'tarde') return '🌤️';
    if (p === 'noite') return '🌙';
    return '📅';
  };

  const periodoNome = (p: string) => {
    if (p === 'manha') return 'Manhã';
    if (p === 'tarde') return 'Tarde';
    if (p === 'noite') return 'Noite';
    return p;
  };

  const horariosPorPeriodo = horarios.reduce((acc, h) => {
    if (!acc[h.periodo]) acc[h.periodo] = [];
    acc[h.periodo].push(h);
    return acc;
  }, {} as Record<string, Horario[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Agendamento ADS - UNINASSAU</title>
        <meta name="description" content="Agende seu atendimento com o coordenador de ADS" />
      </Head>

      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Agendamento ADS</h1>
              <p className="text-sm text-gray-500">UNINASSAU Teresina</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Bem-vindo(a)!</h2>
          <p className="text-gray-600 text-sm mb-4">
            Escolha o melhor horário para seu atendimento com o coordenador do curso de Análise e Desenvolvimento de Sistemas.
          </p>
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Data:</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{erro}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(horariosPorPeriodo).map(([periodo, h]) => (
              <div key={periodo} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <span>{periodoIcon(periodo)}</span>
                    <span>{periodoNome(periodo)}</span>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {h.map((h) => (
                      <button
                        key={h.horario}
                        onClick={() => handleAgendar(h.horario)}
                        disabled={!h.disponivel}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          h.disponivel
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                            : h.status === 'bloqueado'
                            ? 'bg-red-100 text-red-800 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {h.horario}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {Object.keys(horariosPorPeriodo).length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800">
                  Nenhum horário disponível para esta data. Tente outra data ou entre em contato com a coordenação.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Legenda</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded border border-green-300"></div>
              <span className="text-sm text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded border border-red-300"></div>
              <span className="text-sm text-gray-600">Bloqueado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 rounded border border-gray-300"></div>
              <span className="text-sm text-gray-600">Ocupado</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/admin"
            className="text-sm text-indigo-600 hover:underline"
          >
            Acesso da Coordenação →
          </a>
        </div>
      </main>
    </div>
  );
}