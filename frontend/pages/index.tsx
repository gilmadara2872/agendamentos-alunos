import { useEffect, useState } from 'react';
import { supabase, Horario } from '../lib/supabase';

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
      const { data: dados, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('data', data)
        .eq('status', 'livre')
        .order('hora');
      
      if (error) throw error;
      setHorarios(dados || []);
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
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .upsert({ nome, matricula, email, telefone })
        .select()
        .single();

      if (alunoError) throw alunoError;

      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert({
          aluno_id: aluno.id,
          horario_id: horario.id,
          motivo,
          status: 'pendente'
        });

      if (agendamentoError) throw agendamentoError;

      setSucesso(`Agendamento realizado para ${horario.hora}!`);
      carregarHorarios();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Agendamento ADS</h1>
              <p className="text-base text-gray-500">UNINASSAU Teresina</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Bem-vindo(a)!</h2>
          <p className="text-gray-600 text-lg text-center mb-6">
            Escolha o melhor horário para seu atendimento com o coordenador do curso de Análise e Desenvolvimento de Sistemas.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <label className="text-lg font-medium text-gray-700">Data:</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            />
          </div>
        </div>

        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-600 text-lg text-center">{sucesso}</p>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600 text-lg text-center">{erro}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(horariosPorPeriodo).map(([periodo, hs]) => (
              <div key={periodo} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-xl font-medium text-gray-800 flex items-center justify-center gap-2">
                    <span>{periodoIcon(periodo)}</span>
                    <span>{periodoNome(periodo)}</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {hs.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => handleAgendar(h)}
                        className="px-4 py-3 rounded-lg text-lg font-medium transition-all bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                      >
                        {h.hora}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {Object.keys(horariosPorPeriodo).length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 text-lg">
                  Nenhum horário disponível para esta data. Tente outra data ou entre em contato com a coordenação.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Legenda</h3>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded border border-green-300"></div>
              <span className="text-lg text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded border border-gray-300"></div>
              <span className="text-lg text-gray-600">Ocupado</span>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
