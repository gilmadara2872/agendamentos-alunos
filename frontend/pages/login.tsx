import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        }
      );

      const dados = await response.json();

      if (response.ok) {
        localStorage.setItem('token', dados.token);
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
        router.push('/admin');
      } else {
        setErro(dados.erro || 'Erro ao fazer login');
      }
    } catch (error) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card de Login */}
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          {/* Logo e Título */}
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
              <span className="text-white font-bold text-4xl">A</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Acesso da Coordenação</h1>
            <p className="text-gray-500 text-lg mt-2">
              Sistema de Agendamento ADS - UNINASSAU
            </p>
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
              <p className="text-red-700 text-lg text-center font-medium">{erro}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-lg font-medium transition-all"
                placeholder="coordenador@uninassau.edu.br"
                required
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-lg font-medium transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 rounded-xl text-lg font-bold hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-300"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
