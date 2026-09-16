import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    setTimeout(() => {
      if (email === 'desousabarbosafilho@gmail.com' && senha === 'TesteADS2026@') {
        localStorage.setItem('admin_auth', 'true');
        router.push('/admin');
      } else {
        setErro('Credenciais inválidas');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Acesso da Coordenação</h1>
          <p className="text-gray-500 text-lg mt-2">Sistema de Agendamento ADS - UNINASSAU</p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-lg text-center">{erro}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg"
              placeholder="coordenador@uninassau.edu.br"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg"
              placeholder="••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg text-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>


      </div>
    </div>
  );
}
