# Sistema de Agendamento de Atendimento ADS
# UNINASSAU Teresina - Coordenação do Curso de ADS

Sistema web para alunos marcarem horários de atendimento com o coordenador do curso de ADS da UNINASSAU Teresina.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Backend | Flask (Python) + psycopg2 |
| Banco | Neon PostgreSQL (serverless) |
| Automação | n8n (monitor WhatsApp + SMS) |
| WhatsApp | Evolution API (self-hosted) |
| SMS | Total Voice API |
| Deploy | Railway (Docker) |

## Funcionalidades

### 1. Agendamento de Horários
- Aluno acessa página web
- Visualiza horários disponíveis (manhã/tarde/noite)
- Marca horário desejado (nome, matrícula, motivo)
- Coordenador confirma/recusa via painel admin

### 2. Monitor WhatsApp + SMS
- Evolution API monitora WhatsApp do coordenador
- Mensagens são salvas automaticamente no banco
- Notificação via SMS para o celular do coordenador
- Suporte a números conhecidos e novos

### 3. Painel Administrativo
- Visualizar agendamentos do dia
- Bloquear/liberar horários
- Ver mensagens recebidas
- Configurar números para SMS

## Estrutura do Projeto

```
agendamento-atendimento/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt
│   └── venv/               # Ambiente virtual Python
├── frontend/
│   ├── pages/
│   │   ├── index.tsx       # Página do aluno
│   │   ├── agendar.tsx     # Formulário de agendamento
│   │   └── admin/
│   │       └── index.tsx   # Painel do coordenador
│   ├── components/
│   └── styles/
├── neon/
│   └── schema.sql          # Schema do banco
├── n8n/
│   └── workflows/
│       └── whatsapp-to-sms.json
├── railway/
│   ├── Dockerfile.backend
│   ├── Dockerfile.evolution
│   └── railway.json
└── docs/
    └── setup.md
```

## Horários de Atendimento

| Período | Horários |
|---------|---------|
| Manhã | 08:30 - 12:00 (intervalos de 30min) |
| Tarde | 14:00 - 18:00 (intervalos de 30min) |
| Noite | 19:00 - 21:00 (intervalos de 30min) |

## Setup Local

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://user:password@host:port/database
python app.py
# API rodando em http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend rodando em http://localhost:3000
```

## Deploy no Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up

# Adicionar variáveis de ambiente
railway variables set DATABASE_URL=postgresql://user:password@host:port/database
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/horarios?data=YYYY-MM-DD` | Lista horários do dia |
| POST | `/api/agendar` | Cria novo agendamento |
| PUT | `/api/admin/horarios` | Bloqueia/libera horário |
| GET | `/api/admin/agendamentos` | Lista agendamentos |
| POST | `/api/admin/agendamentos/{id}/confirmar` | Confirma agendamento |
| POST | `/api/admin/agendamentos/{id}/recusar` | Recusa agendamento |
| POST | `/api/webhook/whatsapp` | Recebe mensagem WhatsApp |
| GET | `/api/admin/mensagens` | Lista mensagens WhatsApp |
| POST | `/api/admin/numeros-sms` | Cadastra número SMS |
| GET | `/api/admin/numeros-sms` | Lista números SMS |

## WhatsApp + SMS (n8n)

O workflow do n8n:
1. Evolution API detecta nova mensagem no WhatsApp
2. Salva no banco via `/api/webhook/whatsapp`
3. Verifica se número está na lista de conhecidos
4. Envia SMS via Total Voice para o coordenador

## Equipe

- **Aluno:** Gilberto de Sousa Barbosa Filho (01785373)
- **Professor/Coordenador:** Vinícius

## Licença

Projeto acadêmico - uso livre.