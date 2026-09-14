# ===========================================
# SETUP - Sistema de Agendamento ADS
# ===========================================

## PRÉ-REQUISITOS

1. **Conta Neon** (gratuita)
   - Criar conta em https://neon.tech
   - Criar novo projeto/banco
   - Anotar: Connection string (host, database, user, password, port)

2. **Conta Railway** (gratuita para começar)
   - Criar conta em https://railway.app
   - Instalar CLI: `npm install -g @railway/cli`

3. **Conta Total Voice** (para SMS)
   - Criar conta em https://www.totalvoice.com.br
   - Anotar: Access Token

4. **Node.js 20+** e **Python 3.11+**

## PASSO A PASSO

### 1. Clonar o repositório
```bash
git clone https://github.com/gilmadara2872/agendamento-atendimento.git
cd agendamento-atendimento
```

### 2. Configurar Neon
```bash
# Copiar schema
cat neon/schema.sql

# No Neon Dashboard:
# 1. Ir em "SQL Editor"
# 2. Colar o conteúdo do schema.sql
# 3. Clicar em "Run"
```

### 3. Configurar variáveis de ambiente
```bash
# Backend
export DATABASE_URL=postgresql://user:password@host:port/database

# Frontend
export NEXT_PUBLIC_API_URL=http://localhost:5000

# SMS
export TOTAL_VOICE_URL=https://api2.totalvoice.com.br
export TOTAL_VOICE_API_KEY=seu_token
```

### 4. Instalar dependências
```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 5. Rodar localmente
```bash
# Terminal 1 - Backend
cd backend
python app.py
# API: http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Frontend: http://localhost:3000
```

### 6. Inicializar horários
```bash
# Criar horários padrão para o mês
curl -X POST http://localhost:5000/api/admin/horarios/inicializar
```

### 7. Testar
- Acesse http://localhost:3000
- Escolha uma data
- Clique em um horário verde
- Preencha os dados

## DEPLOY NO RAILWAY

### 1. Login
```bash
railway login
```

### 2. Criar projeto
```bash
railway init
```

### 3. Adicionar serviços
```bash
# Backend
railway add --service backend

# Frontend (separado)
railway add --service frontend
```

### 4. Configurar variáveis
```bash
railway variables set DATABASE_URL=postgresql://user:password@host:port/database
railway variables set TOTAL_VOICE_URL=https://api2.totalvoice.com.br
railway variables set TOTAL_VOICE_API_KEY=seu_token
```

### 5. Deploy
```bash
railway up
```

## WHATSAPP + N8N

### 1. Instalar n8n
```bash
# Opção A: Railway (recomendado)
railway add --service n8n

# Opção B: Local
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

### 2. Importar workflow
- Abrir n8n em http://localhost:5678
- Criar novo workflow
- Importar JSON de `n8n/workflows/whatsapp-to-sms.json`

### 3. Configurar Evolution API
```bash
# No Railway
railway add --service evolution

# Após deploy, acessar:
# https://evolution.up.railway.app/manager
# Criar instância → escanear QR code do coordenador
```

### 4. Conectar Evolution → n8n
- No Evolution, configurar webhook:
  - URL: https://n8n.up.railway.app/webhook/whatsapp
  - Eventos: messages.upsert

## SMS - TOTAL VOICE

### Cadastrar números
```bash
curl -X POST http://localhost:5000/api/sms/numeros \
  -H "Content-Type: application/json" \
  -d '{"numero": "86999999999", "nome": "Coordenador", "tipo": "coordenador"}'
```

### Testar envio
```bash
curl -X POST https://api2.totalvoice.com.br/sms \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numero_destino": "86999999999", "mensagem": "Teste de SMS"}'
```

## ESTRUTURA DO BANCO

### Tabelas criadas:
- `horarios` - horários disponíveis por dia
- `agendamentos` - pedidos dos alunos
- `mensagens_whatsapp` - mensagens recebidas
- `numeros_sms` - números para notificação
- `sms_enviados` - histórico de SMS

## HORÁRIOS PADRÃO

| Período | Horários |
|---------|---------|
| Manhã | 8:30, 9:00, 9:30, 10:00, 10:30, 11:00, 11:30 |
| Tarde | 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30 |
| Noite | 19:00, 19:30, 20:00, 20:30 |

## API ENDPOINTS

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/horarios?data=YYYY-MM-DD | Lista horários |
| POST | /api/agendar | Cria agendamento |
| GET | /api/admin/agendamentos | Lista agendamentos |
| PATCH | /api/admin/agendamentos/:id | Atualiza status |
| POST | /api/admin/horarios/bloquear | Bloqueia horário |
| POST | /api/admin/horarios/liberar | Libera horário |
| POST | /api/admin/horarios/inicializar | Cria horários do mês |
| POST | /api/whatsapp/mensagens | Recebe mensagem |
| GET | /api/whatsapp/mensagens | Lista mensagens |
| POST | /api/sms/numeros | Cadastra número |
| GET | /api/sms/numeros | Lista números |

## SUPORTE

Em caso de dúvidas, contate:
- Gilberto de Sousa Barbosa Filho
- Email: gilberto.sousa@alunos.uninassau.edu.br