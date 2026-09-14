"""
Backend API Flask - Sistema de Agendamento
Conecta no Neon PostgreSQL (não toca nos projetos existentes)
"""
import os
from datetime import datetime, date
from flask import Flask, request, jsonify
from flask_cors import CORS

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
    h_m = list(range(8, 12))
    for h in h_m:
        for m in (30 if h == 8 else 0):
            horarios.append({'horario': f'{h:02d}:{m:02d}', 'periodo': 'manha'})
    
    # Tarde: 14:00 - 18:00
    h_t = list(range(14, 18))
    for h in h_t:
        horarios.append({'horario': f'{h:02d}:00', 'periodo': 'tarde'})
        horarios.append({'horario': f'{h:02d}:30', 'periodo': 'tarde'})
    
    # Noite: 19:00 - 21:00
    h_n = list(range(19, 21))
    for h in h_n:
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
    
    cur.close()
    conn.close()
    
    return jsonify({
        'data': data_str,
        'horarios': horarios,
        'total': len(horarios)
    })


@app.route('/api/agendar', methods=['POST'])
def agendar_atendimento():
    """Registra novo agendamento"""
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
    
    # Verificar se horário está livre
    cur.execute(
        "SELECT status FROM horarios WHERE data = %s AND horario = %s",
        (data_str, horario)
    )
    existente = cur.fetchone()
    
    if existente and existente['status'] != 'livre':
        cur.close()
        conn.close()
        return jsonify({'erro': 'Horário já ocupado'}), 409
    
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


@app.route('/api/admin/agendamentos', methods=['GET'])
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
    
    cur.close()
    conn.close()
    
    return jsonify({'agendamentos': agendamentos})


@app.route('/api/admin/agendamentos/<int:id>', methods=['PATCH'])
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


@app.route('/api/admin/horarios/inicializar', methods=['POST'])
def inicializar_horarios_mensal():
    """Inicializa horários padrão para o mês atual"""
    hoje = date.today()
    horarios_padrao = gerar_horarios_padrao()
    
    conn = get_connection()
    cur = conn.cursor()
    
    criados = 0
    for dia in range(1, 32):
        data_str = f'{hoje.year}-{hoje.month:02d}-{dia:02d}'
        
        for h in horarios_padrao:
            cur.execute(
                "SELECT id FROM horarios WHERE data = %s AND horario = %s",
                (data_str, h['horario'])
            )
            if not cur.fetchone():
                cur.execute(
                    """INSERT INTO horarios 
                       (data, horario, periodo, status, observacao, eh_ativo, criado_em)
                       VALUES (%s, %s, %s, 'livre', '', TRUE, NOW())""",
                    (data_str, h['horario'], h['periodo'])
                )
                criados += 1
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'sucesso': True,
        'mensagem': f'{criados} horários criados',
        'total': criados
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


# ===========================================
# HEALTH CHECK
# ===========================================
@app.route('/health', methods=['GET'])
def health():
    """Verifica se API está funcionando"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'database': 'Neon PostgreSQL'
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)