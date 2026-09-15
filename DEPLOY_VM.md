# Deploy na VM Oracle Cloud (Always Free)

## O que você precisa

1. **Conta Oracle Cloud** — https://cloud.oracle.com (grátis, cartão de crédito não é cobrado)
2. **VM Always Free** — 2 núcleos, 12GB RAM, 200GB armazenamento
3. **Docker + Docker Compose** instalados na VM

## Passo a passo

### 1. Criar a VM

1. Acesse https://cloud.oracle.com
2. Crie uma conta (grátis)
3. Vá em "Compute" → "Instances"
4. Clique "Create Instance"
5. Nome: `agendamento-vm`
6. Image: "Canonical Ubuntu 22.04"
7. Shape: "VM.Standard.E2.1.Micro" (Always Free)
8. SSH Key: gere uma chave ou use a do Oracle
9. Clique "Create"

### 2. Liberar portas no firewall

Na VM, vá em:
- VCN (Virtual Cloud Network) → Security Lists → Ingress Rules
- Adicione:
  - Porta 3000 (frontend)
  - Porta 5000 (backend)
  - Porta 5678 (n8n)
  - Porta 5432 (postgres - opcional, só se quiser acesso externo)

### 3. Conectar na VM e instalar Docker

```bash
# Conectar via SSH
ssh -i sua-chave.pem ubuntu@IP_DA_VM

# Instalar Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Adicionar usuario ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Clonar o projeto e rodar

```bash
# Clonar repositório
git clone https://github.com/gilmadara2872/agendamentos-alunos.git
cd agendamento-atendimento

# Criar pastas de dados
mkdir -p data/postgres backups n8n

# Subir tudo
docker compose -f docker-compose.vm.yml up -d

# Ver logs
docker compose -f docker-compose.vm.yml logs -f
```

### 5. Acessar

- Frontend (alunos): `http://IP_DA_VM:3000`
- Login (coordenador): `http://IP_DA_VM:3000/login`
- n8n: `http://IP_DA_VM:5678`

### Dados de acesso do coordenador

- Email: `desousabarbosafilho@gmail.com`
- Senha: `TesteADS2026@`

## Comandos úteis

```bash
# Ver status dos containers
docker compose -f docker-compose.vm.yml ps

# Ver logs
docker compose -f docker-compose.vm.yml logs -f backend

# Parar tudo
docker compose -f docker-compose.vm.yml down

# Atualizar código
git pull
docker compose -f docker-compose.vm.yml up -d --build

# Backup manual do banco
docker exec agendamento-db pg_dump -U agendamento agendamento > backup_$(date +%Y%m%d).sql
```

## Estrutura dos containers

| Container | Porta | Função |
|-----------|-------|--------|
| agendamento-db | 5432 | PostgreSQL local |
| agendamento-api | 5000 | Flask backend |
| agendamento-web | 3000 | Next.js frontend |
| agendamento-n8n | 5678 | Automação |
| agendamento-backup | — | Backup diário às 3h |

## Por que essa arquitetura?

- **Sem hibernação** — VM Oracle Always Free roda 24h
- **Banco local** — PostgreSQL na VM, sem dependência externa
- **Backup automático** — todo dia às 3h da manhã
- **Zero custo** — tudo grátis
- **Controle total** — você gerencia tudo
