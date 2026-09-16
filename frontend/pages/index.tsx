import { useEffect, useState } from 'react';

interface Horario {
  id: number;
  hora: string;
  turno: string;
  status: string;
}

export default function Home() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarHorarios();
  }, [data]);

  const carregarHorarios = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/horarios?data=${data}`
      );
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

  const handleAgendar = async (horario: Horario) => {
    const nome = prompt('Seu nome:');
    if (!nome) return;

    const matricula = prompt('Sua matrícula:');
    if (!matricula) return;

    const email = prompt('Seu email (opcional):') || '';
    const telefone = prompt('Seu telefone (opcional):') || '';
    const motivo = prompt('Motivo do atendimento:') || '';

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/agendar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            matricula,
            email,
            telefone,
            motivo,
            data,
            horario: horario.hora,
          }),
        }
      );

      const dados = await response.json();

      if (response.ok) {
        setSucesso(`Agendamento realizado para ${horario.hora}!`);
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
    if (!acc[h.turno]) acc[h.turno] = [];
    acc[h.turno].push(h);
    return acc;
  }, {} as Record<string, Horario[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agendamento ADS</h1>
              <p className="text-base text-gray-500 mt-1">UNINASSAU Teresina</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Bem-vindo(a)!</h2>
          <p className="text-gray-500 text-lg mb-6 leading-relaxed">
            Escolha o melhor horário para seu atendimento com o coordenador do curso de Análise e Desenvolvimento de Sistemas.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <label className="text-lg font-semibold text-gray-700">Data:</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-lg font-medium transition-all"
            />
          </div>
        </div>

        {/* Success Message */}
        {sucesso && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 text-lg font-semibold">{sucesso}</p>
          </div>
        )}

        {/* Error Message */}
        {erro && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 text-lg font-semibold">{erro}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Horários por Período */}
            {Object.entries(horariosPorPeriodo).length === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
                <p className="text-yellow-800 text-lg">
                  Nenhum horário disponível para esta data. Tente outra data ou entre em contato com a coordenação.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(horariosPorPeriodo).map(([periodo, hs]) => (
                  <div
                    key={periodo}
                    className="bg-white rounded-3xl shadow-lg shadow-gray-100 overflow-hidden"
                  >
                    {/* Period Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-3">
                        <span className="text-2xl">{periodoIcon(periodo)}</span>
                        <span>{periodoNome(periodo)}</span>
                      </h3>
                    </div>

                    {/* Horários Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {hs.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => handleAgendar(h)}
                            disabled={h.status !== 'livre'}
                            className={`px-4 py-4 rounded-2xl text-lg font-bold transition-all transform hover:scale-105 active:scale-95 ${
                              h.status === 'livre'
                                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300'
                                : h.status === 'bloqueado'
                                ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-70'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {h.hora}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Legenda */}
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Legenda</h3>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-md"></div>
              <span className="text-lg font-medium text-gray-700">Disponível</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl shadow-md"></div>
              <span className="text-lg font-medium text-gray-700">Bloqueado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl shadow-md"></div>
              <span className="text-lg font-medium text-gray-700">Ocupado</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
