-- ===========================================
-- NEON - Sistema de Agendamento ADS
-- PostgreSQL serverless (não mexe em projetos existentes)
-- ===========================================

-- Tabela: Horários disponíveis
CREATE TABLE IF NOT EXISTS horarios (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- manha, tarde, noite
    status VARCHAR(20) DEFAULT 'livre', -- livre, bloqueado, pendente, confirmado, recusado, realizado
    observacao TEXT DEFAULT '',
    eh_ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(data, horario)
);

-- Tabela: Agendamentos dos alunos
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    nome VARCHAR(200) NOT NULL,
    matricula VARCHAR(50) NOT NULL,
    email VARCHAR(200),
    telefone VARCHAR(20),
    motivo TEXT,
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, confirmado, recusado, realizado
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: Mensagens WhatsApp recebidas
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) NOT NULL,
    nome_contato VARCHAR(200),
    mensagem TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    processado BOOLEAN DEFAULT FALSE
);

-- Tabela: Números para notificação SMS
CREATE TABLE IF NOT EXISTS numeros_sms (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(200),
    tipo VARCHAR(50) DEFAULT 'coordenador', -- coordenador, professor, admin
    ativado BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: Histórico de SMS enviados
CREATE TABLE IF NOT EXISTS sms_enviados (
    id SERIAL PRIMARY KEY,
    numero_destino VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'enviado', -- enviado, falha
    resposta_api TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ÍNDICES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data);
CREATE INDEX IF NOT EXISTS idx_horarios_status ON horarios(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_mensagens_numero ON mensagens_whatsapp(numero);
CREATE INDEX IF NOT EXISTS idx_mensagens_processado ON mensagens_whatsapp(processado);

-- ===========================================
-- HORÁRIOS PADRÃO (8:30 - 12:00, 14:00 - 21:00)
-- ===========================================
-- Manhã: 8:30, 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
-- Tarde: 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30
-- Noite: 19:00, 19:30, 20:00, 20:30