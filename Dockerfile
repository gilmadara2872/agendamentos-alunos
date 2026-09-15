# Dockerfile raiz - Evolution API (WhatsApp Monitor)
# Redireciona pro Dockerfile.evolution dentro da pasta railway/

FROM node:20-slim

WORKDIR /app

# Dependências
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

# Clonar Evolution API
RUN git clone https://github.com/EvolutionAPI/evolution-api.git .

# Evolution API usa pnpm internamente mas npm tambem funciona
RUN npm install --legacy-peer-deps

# Gerar Prisma Client (necessário pro Evolution API funcionar)
RUN npx prisma generate

# Porta padrão
EXPOSE 8080

CMD ["npm", "start"]
