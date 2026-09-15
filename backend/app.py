"""
Backend API Flask - Sistema de Agendamento
Conecta no Neon PostgreSQL (não toca nos projetos existentes)
"""
import os
from datetime import datetime, date
from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import token_requerido, gerar_token, hash_senha

app = Flask(__name__)
CORS(app)

# ===========================================
# CONFIGURAÇÃO NEON (PostgreSQL)
# ===========================================
DATABASE_URL = os.environ.get('DATABASE_URL', '')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL é obrigatório (neon.co ou railway)")

# ===========================================
# DATABASE CONNECTOR
# ===========================================
import psycopg2
import psycopg2.extras

def get_connection():
    """Cria conexão com PostgreSQL"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)

# ===========================================
# HORÁRIOS PADRÃO (8:30 - 12:00, 14:00 - 21:00)
# ===========================================
def gerar_horarios_padrao():
    """Gera horários padrão para o mês"""
    horarios = []
    
    # Manhã: 8:30 - 12:00
    horarios.append({'horario': '08:30', 'periodo': 'manha'})
    for h in range(9, 12):
        horarios.append({'horario': f'{h:02d}:00', 'periodo': 'manha'})
        horarios.append({'horario': f'{h:02d}:30', 'periodo': 'manha'})
    
    # Tarde: 14:00 - 18:00
    for h in range(14, 18):
        horarios.append({'horario': f'{h:02d}:00', 'periodo': 'tarde'})
        horarios.append({'horario': f'{h:02d}:30', 'periodo': 'tarde'})
    
    # Noite: 19:00 - 21:00
    for h in range(19, 21):
        horarios.append({'horario': f'{h:02d}:00', 'periodo': 'noite'})
        horarios.append({'horario': f'{h:02d}:30', 'periodo': 'noite'})
    
    return horarios

# ===========================================
# ROTAS API
# ===========================================
@app.route('/api/horarios', methods=['GET'])
def listar_horarios_diarios():
    """Retorna horários de um dia específico"""
    data_str = request.args.get('data', date.today().isoformat())
    
    try:
        datetime.strptime(data_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'erro': 'Data inválida. Use YYYY-MM-DD'}), 400
    
    # Buscar no Neon
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT * FROM horarios WHERE data = %s ORDER BY horario",
        (data_str,)
    )
    horarios = cur.fetchall() or []
    
    # Converter time para string
    for h in horarios:
        if 'horario' in h and hasattr(h['horario'], 'isoformat'):
            h['horario'] = h['horario'].isoformat()
    
    cur.close()
    conn.close()
    
    return jsonify({
        'data': data_str,
        'horarios': horarios,
        'total': len(horarios)
    })


@app.route('/api/agendar', methods=['POST'])
def agendar_atendimento():
    """Registra novo agendamento e marca horário como agendado (atômico)"""
    dados = request.get_json()
    
    nome = dados.get('nome', '').strip()
    matricula = dados.get('matricula', '').strip()
    email = dados.get('email', '').strip()
    horario = dados.get('horario', '').strip()
    data_str = dados.get('data', date.today().isoformat())
    motivo = dados.get('motivo', '').strip()
    telefone = dados.get('telefone', '').strip()
    
    # Validação
    if not nome or not matricula or not horario or not data_str:
        return jsonify({
            'erro': 'Nome, matrícula, horário e data são obrigatórios'
        }), 400
    
    try:
        datetime.strptime(data_str, '%Y-%m-%d')
        datetime.strptime(horario, '%H:%M')
    except ValueError:
        return jsonify({'erro': 'Formato de data/horário inválido'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    # Transação atômica: lock da linha + insert + update status
    try:
        # Lock na linha do horário para evitar race condition
        cur.execute(
            "SELECT status FROM horarios WHERE data = %s AND horario = %s FOR UPDATE",
            (data_str, horario)
        )
        existente = cur.fetchone()
        
        if not existente:
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({'erro': 'Horário não encontrado'}), 404
        
        if existente['status'] != 'livre':
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({'erro': 'Horário já ocupado'}), 409
        
        # Atualizar status na tabela horarios
        cur.execute(
            "UPDATE horarios SET status = 'agendado' WHERE data = %s AND horario = %s",
            (data_str, horario)
        )
        
        # Criar agendamento
        cur.execute(
            """INSERT INTO agendamentos 
               (data, horario, nome, matricula, email, telefone, motivo, status, criado_em)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
               RETURNING id""",
            (data_str, horario, nome, matricula, email or None, telefone or None, motivo or None, 'pendente')
        )
        agendamento_id = cur.fetchone()['id']
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Agendamento criado com sucesso! Aguardando confirmação.',
            'id': agendamento_id
        }), 201
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({'erro': str(e)}), 500


@app.route('/api/admin/agendamentos', methods=['GET'])
@token_requerido
def listar_agendamentos():
    """Lista agendamentos (admin)"""
    status = request.args.get('status', 'pendente')
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT * FROM agendamentos WHERE status = %s ORDER BY criado_em DESC",
        (status,)
    )
    agendamentos = cur.fetchall() or []
    
    # Converter time para string (JSON serializable)
    for a in agendamentos:
        if 'horario' in a and hasattr(a['horario'], 'isoformat'):
            a['horario'] = a['horario'].isoformat()
    
    cur.close()
    conn.close()
    
    return jsonify({'agendamentos': agendamentos})


@app.route('/api/admin/agendamentos/<int:id>', methods=['PATCH'])
@token_requerido
def atualizar_agendamento(id):
    """Atualiza status do agendamento"""
    dados = request.get_json()
    novo_status = dados.get('status')
    
    if novo_status not in ['pendente', 'confirmado', 'recusado', 'realizado']:
        return jsonify({'erro': 'Status inválido'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "UPDATE agendamentos SET status = %s, atualizado_em = NOW() WHERE id = %s",
        (novo_status, id)
    )
    
    if cur.rowcount > 0:
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'sucesso': True, 'mensagem': f'Agendamento {novo_status}'})
    else:
        cur.close()
        conn.close()
        return jsonify({'erro': 'Agendamento não encontrado'}), 404


@app.route('/api/admin/horarios/bloquear', methods=['POST'])
@token_requerido
def bloquear_horario():
    """Bloqueia um horário específico"""
    dados = request.get_json()
    data_str = dados.get('data')
    horario = dados.get('horario')
    observacao = dados.get('observacao', 'Bloqueado pelo coordenador')
    
    if not data_str or not horario:
        return jsonify({'erro': 'Data e horário são obrigatórios'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    # Verificar se já existe
    cur.execute(
        "SELECT id FROM horarios WHERE data = %s AND horario = %s",
        (data_str, horario)
    )
    existente = cur.fetchone()
    
    if existente:
        cur.execute(
            "UPDATE horarios SET status = 'bloqueado', observacao = %s WHERE id = %s",
            (observacao, existente['id'])
        )
    else:
        cur.execute(
            """INSERT INTO horarios 
               (data, horario, periodo, status, observacao, eh_ativo, criado_em)
               VALUES (%s, %s, 'personalizado', 'bloqueado', %s, TRUE, NOW())""",
            (data_str, horario, observacao)
        )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'sucesso': True, 'mensagem': 'Horário bloqueado'})


@app.route('/api/admin/horarios/liberar', methods=['POST'])
@token_requerido
def liberar_horario():
    """Libera um horário bloqueado"""
    dados = request.get_json()
    data_str = dados.get('data')
    horario = dados.get('horario')
    
    if not data_str or not horario:
        return jsonify({'erro': 'Data e horário são obrigatórios'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "UPDATE horarios SET status = 'livre', observacao = '' WHERE data = %s AND horario = %s",
        (data_str, horario)
    )
    
    if cur.rowcount > 0:
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'sucesso': True, 'mensagem': 'Horário liberado'})
    else:
        cur.close()
        conn.close()
        return jsonify({'erro': 'Horário não encontrado'}), 404


@app.route('/api/admin/horarios/adicionar', methods=['POST'])
@token_requerido
def adicionar_horarios():
    """Adiciona horários de atendimento (um ou vários)"""
    dados = request.get_json()
    
    data_str = dados.get('data')
    horarios = dados.get('horarios', [])  # lista de horários ['08:00', '08:30', ...]
    
    if not data_str or not horarios:
        return jsonify({'erro': 'Data e lista de horários são obrigatórios'}), 400
    
    try:
        datetime.strptime(data_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'erro': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    for h in horarios:
        try:
            datetime.strptime(h, '%H:%M')
        except ValueError:
            return jsonify({'erro': f'Horário inválido: {h}. Use HH:MM'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    resultados = []
    for horario in horarios:
        # Verificar se já existe
        cur.execute(
            "SELECT id, status FROM horarios WHERE data = %s AND horario = %s",
            (data_str, horario)
        )
        existente = cur.fetchone()
        
        if existente:
            # Se estiver bloqueado/inexistente, reativar como livre
            cur.execute(
                "UPDATE horarios SET status = 'livre', observacao = '', eh_ativo = TRUE WHERE id = %s",
                (existente['id'],)
            )
            resultados.append({'horario': horario, 'acao': 'reativado'})
        else:
            # Determinar período
            hora = int(horario.split(':')[0])
            if hora < 12:
                periodo = 'manha'
            elif hora < 18:
                periodo = 'tarde'
            else:
                periodo = 'noite'
            
            cur.execute(
                """INSERT INTO horarios 
                   (data, horario, periodo, status, eh_ativo, criado_em)
                   VALUES (%s, %s, %s, 'livre', TRUE, NOW())""",
                (data_str, horario, periodo)
            )
            resultados.append({'horario': horario, 'acao': 'criado'})
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'sucesso': True,
        'mensagem': f'{len(resultados)} horários processados',
        'resultados': resultados
    })


@app.route('/api/admin/horarios/remover', methods=['POST'])
@token_requerido
def remover_horarios():
    """Remove horários de atendimento (um ou vários) de uma data"""
    dados = request.get_json()
    
    data_str = dados.get('data')
    horarios = dados.get('horarios', [])  # lista de horários ou ['todos']
    
    if not data_str or not horarios:
        return jsonify({'erro': 'Data e lista de horários são obrigatórios'}), 400
    
    try:
        datetime.strptime(data_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'erro': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    if 'todos' in horarios:
        # Verificar se algum horário tem agendamento pendente
        cur.execute(
            "SELECT COUNT(*) as total FROM agendamentos WHERE data = %s AND status = 'pendente'",
            (data_str,)
        )
        pendentes = cur.fetchone()['total']
        if pendentes > 0:
            cur.close()
            conn.close()
            return jsonify({'erro': f'Não é possível remover: {pendentes} agendamento(s) pendente(s)'}), 409
        
        cur.execute("DELETE FROM horarios WHERE data = %s", (data_str,))
        removidos = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'sucesso': True,
            'mensagem': f'Todos os horários de {data_str} foram removidos',
            'removidos': removidos
        })
    
    # Remover horários específicos
    removidos = 0
    erros = []
    for horario in horarios:
        try:
            datetime.strptime(horario, '%H:%M')
        except ValueError:
            erros.append(f'Horário inválido: {horario}')
            continue
        
        # Verificar agendamento pendente
        cur.execute(
            "SELECT COUNT(*) as total FROM agendamentos WHERE data = %s AND horario = %s AND status = 'pendente'",
            (data_str, horario)
        )
        pendentes = cur.fetchone()['total']
        if pendentes > 0:
            erros.append(f'{horario}: possui agendamento pendente')
            continue
        
        cur.execute(
            "DELETE FROM horarios WHERE data = %s AND horario = %s",
            (data_str, horario)
        )
        removidos += cur.rowcount
    
    conn.commit()
    cur.close()
    conn.close()
    
    resposta = {
        'sucesso': len(erros) == 0,
        'mensagem': f'{removidos} horário(s) removido(s)',
        'removidos': removidos
    }
    if erros:
        resposta['erros'] = erros
    
    status_code = 200 if len(erros) == 0 else 409
    return jsonify(resposta), status_code


@app.route('/api/admin/horarios/inicializar', methods=['POST'])
@token_requerido
def inicializar_horarios_mensal():
    """Inicializa horarios padrao para o mes atual usando batch import"""
    import calendar
    hoje = date.today()
    horarios_padrao = gerar_horarios_padrao()
    
    # Numero real de dias do mes
    _, dias_no_mes = calendar.monthrange(hoje.year, hoje.month)
    
    conn = get_connection()
    cur = conn.cursor()
    
    # Gerar todos os registros de uma vez com ON CONFLICT
    registros = []
    for dia in range(1, dias_no_mes + 1):
        data_str = f'{hoje.year}-{hoje.month:02d}-{dia:02d}'
        for h in horarios_padrao:
            try:
                data_obj = date(hoje.year, hoje.month, dia)
                if data_obj.weekday() < 5:  # 0=seg, 6=dom
                    registros.append((data_str, h['horario'], h['periodo']))
            except ValueError:
                continue
    
    if registros:
        psycopg2.extras.execute_values(
            cur,
            """INSERT INTO horarios (data, horario, periodo, status, eh_ativo, criado_em) 
               VALUES %s 
               ON CONFLICT (data, horario) DO NOTHING""",
            registros,
            template="(%s::date, %s::time, %s, 'livre', TRUE, NOW())"
        )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'sucesso': True,
        'mensagem': f'{len(registros)} horarios preparados para {hoje.month:02d}/{hoje.year} (dias uteis)'
    })


@app.route('/api/whatsapp/mensagens', methods=['GET'])
def listar_mensagens():
    """Lista mensagens WhatsApp recebidas"""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT * FROM mensagens_whatsapp ORDER BY timestamp DESC LIMIT 100"
    )
    mensagens = cur.fetchall() or []
    
    cur.close()
    conn.close()
    
    return jsonify({'mensagens': mensagens})


@app.route('/api/whatsapp/mensagens', methods=['POST'])
def receber_mensagem_whatsapp():
    """Webhook recebe mensagem do WhatsApp"""
    dados = request.get_json()
    
    numero = dados.get('numero', '')
    mensagem = dados.get('mensagem', '')
    timestamp = dados.get('timestamp', datetime.now().isoformat())
    nome_contato = dados.get('nome_contato', '')
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        """INSERT INTO mensagens_whatsapp 
           (numero, nome_contato, mensagem, timestamp, processado)
           VALUES (%s, %s, %s, %s, FALSE)
           RETURNING id""",
        (numero, nome_contato, mensagem, timestamp)
    )
    msg_id = cur.fetchone()['id']
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'sucesso': True, 'id': msg_id})


@app.route('/api/sms/numeros', methods=['GET'])
def listar_numeros_sms():
    """Lista números cadastrados para SMS"""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM numeros_sms WHERE ativado = TRUE")
    numeros = cur.fetchall() or []
    
    cur.close()
    conn.close()
    
    return jsonify({'numeros': numeros})


@app.route('/api/sms/numeros', methods=['POST'])
def cadastrar_numero_sms():
    """Cadastra novo número para notificação SMS"""
    dados = request.get_json()
    
    numero = dados.get('numero', '').strip()
    nome = dados.get('nome', '').strip()
    tipo = dados.get('tipo', 'coordenador')
    
    if not numero:
        return jsonify({'erro': 'Número é obrigatório'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """INSERT INTO numeros_sms 
               (numero, nome, tipo, ativado, criado_em)
               VALUES (%s, %s, %s, TRUE, NOW())
               RETURNING id""",
            (numero, nome, tipo)
        )
        num_id = cur.fetchone()['id']
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'sucesso': True, 'id': num_id}), 201
    except psycopg2.IntegrityError:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({'erro': 'Número já cadastrado'}), 409


@app.route('/api/sms/numeros/<int:id>', methods=['DELETE'])
def excluir_numero_sms(id):
    """Remove número de SMS"""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("DELETE FROM numeros_sms WHERE id = %s", (id,))
    
    if cur.rowcount > 0:
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'sucesso': True})
    else:
        cur.close()
        conn.close()
        return jsonify({'erro': 'Número não encontrado'}), 404


@app.route('/api/admin/stats', methods=['GET'])
@token_requerido
def estatisticas():
    """Retorna estatísticas do sistema"""
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) as total FROM agendamentos")
    total_agendamentos = cur.fetchone()['total']
    
    cur.execute("SELECT COUNT(*) as total FROM mensagens_whatsapp WHERE processado = FALSE")
    total_mensagens = cur.fetchone()['total']
    
    cur.execute("SELECT COUNT(*) as total FROM numeros_sms WHERE ativado = TRUE")
    total_numeros_sms = cur.fetchone()['total']
    
    cur.close()
    conn.close()
    
    return jsonify({
        'total_agendamentos': total_agendamentos,
        'total_mensagens_whatsapp': total_mensagens,
        'total_numeros_sms': total_numeros_sms
    })


# ============================================
# HEALTH CHECK
# ============================================
@app.route('/health', methods=['GET'])
def health():
    """Verifica se API está funcionando"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'database': 'Neon PostgreSQL'
    })


# ============================================
# AUTENTICACAO (JWT)
# ============================================
@app.route('/api/auth/registrar', methods=['POST'])
def registrar_usuario():
    """Registra o coordenador (primeiro usuario)"""
    dados = request.get_json()
    
    nome = dados.get('nome', '').strip()
    email = dados.get('email', '').strip().lower()
    senha = dados.get('senha', '')
    
    if not nome or not email or not senha:
        return jsonify({'erro': 'Nome, email e senha sao obrigatorios'}), 400
    
    if len(senha) < 4:
        return jsonify({'erro': 'Senha deve ter pelo menos 4 caracteres'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    # Verificar se ja existe
    cur.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({'erro': 'Email ja cadastrado'}), 409
    
    # Criar usuario
    cur.execute(
        """INSERT INTO usuarios (nome, email, senha_hash, criado_em) 
           VALUES (%s, %s, %s, NOW()) RETURNING id""",
        (nome, email, hash_senha(senha))
    )
    usuario_id = cur.fetchone()['id']
    
    conn.commit()
    cur.close()
    conn.close()
    
    token = gerar_token(usuario_id, nome)
    
    return jsonify({
        'sucesso': True,
        'mensagem': 'Coordenador registrado',
        'token': token,
        'usuario': {'id': usuario_id, 'nome': nome, 'email': email}
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login do coordenador"""
    dados = request.get_json()
    
    email = dados.get('email', '').strip().lower()
    senha = dados.get('senha', '')
    
    if not email or not senha:
        return jsonify({'erro': 'Email e senha sao obrigatorios'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT id, nome, senha_hash FROM usuarios WHERE email = %s",
        (email,)
    )
    usuario = cur.fetchone()
    
    if not usuario or usuario['senha_hash'] != hash_senha(senha):
        cur.close()
        conn.close()
        return jsonify({'erro': 'Email ou senha incorretos'}), 401
    
    conn.close()
    
    token = gerar_token(usuario['id'], usuario['nome'])
    
    return jsonify({
        'sucesso': True,
        'token': token,
        'usuario': {'id': usuario['id'], 'nome': usuario['nome'], 'email': email}
    })


@app.route('/api/auth/perfil', methods=['GET'])
@token_requerido
def perfil():
    """Retorna dados do usuario logado"""
    return jsonify({
        'usuario': {
            'id': request.usuario['usuario_id'],
            'nome': request.usuario['nome']
        }
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)