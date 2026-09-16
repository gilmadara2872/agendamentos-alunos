import Head from 'next/head';
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

        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-600 text-sm">{sucesso}</p>
          </div>
        )}

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
            {Object.entries(horariosPorPeriodo).map(([periodo, hs]) => (
              <div key={periodo} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <span>{periodoIcon(periodo)}</span>
                    <span>{periodoNome(periodo)}</span>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {hs.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => handleAgendar(h)}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                      >
                        {h.hora}
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
              <div className="w-6 h-6 bg-gray-100 rounded border border-gray-300"></div>
              <span className="text-sm text-gray-600">Ocupado</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/admin" className="text-sm text-indigo-600 hover:underline">
            Acesso da Coordenação →
          </a>
        </div>
      </main>
    </div>
  );
}
