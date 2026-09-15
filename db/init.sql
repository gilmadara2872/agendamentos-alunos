-- ===========================================
-- SISTEMA DE AGENDAMENTO - BANCO DE DADOS
-- VM Oracle Cloud + PostgreSQL Local
-- ===========================================

-- Tabela de usuarios (coordenador)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(64) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(20),
    motivo TEXT,
    status VARCHAR(20) DEFAULT 'pendente',
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(data, horario)
);

-- Tabela de horarios
CREATE TABLE IF NOT EXISTS horarios (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'livre',
    observacao TEXT,
    eh_ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(data, horario)
);

-- Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    nome_contato VARCHAR(100),
    timestamp TIMESTAMP,
    processado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de numeros SMS
CREATE TABLE IF NOT EXISTS numeros_sms (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100),
    ativado BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- INDICES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data);
CREATE INDEX IF NOT EXISTS idx_horarios_status ON horarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ===========================================
-- DADOS INICIAIS
-- ===========================================

-- Inserir coordenador padrao (senha: TesteADS2026@)
INSERT INTO usuarios (nome, email, senha_hash) 
VALUES (
    'Coordenador ADS',
    'desousabarbosafilho@gmail.com',
    '68ec577642229e62c192d06d08ebb8b904469cbbb3a7328cf754639bac187b3d'
) ON CONFLICT (email) DO NOTHING;

-- Inserir numero SMS padrao
INSERT INTO numeros_sms (numero, nome, ativado)
VALUES ('86999999999', 'Coordenador', TRUE)
ON CONFLICT (numero) DO NOTHING;
