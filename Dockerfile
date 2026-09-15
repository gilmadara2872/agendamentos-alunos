# Dockerfile raiz - Evolution API (WhatsApp Monitor)
# Imagem oficial do Docker Hub

FROM evoapicloud/evolution-api:latest

# Porta padrão
EXPOSE 8080

CMD ["npm", "start"]
