# 🪝 Captain Hook — Asaas → Discord

Receba notificações de pagamento do Asaas direto no seu servidor do Discord, igual ao da imagem!

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Uma VPS ou servidor (Railway, Render, Heroku, etc.) **OU** usar o ngrok para testes locais
- Acesso ao painel do Asaas
- Um servidor Discord com permissão de criar webhooks

---

## 🚀 Instalação

```bash
# 1. Entre na pasta
cd asaas-discord-bot

# 2. Instale as dependências
npm install

# 3. Edite o arquivo server.js e cole sua URL do Discord
# Linha 9: const DISCORD_WEBHOOK_URL = "COLE_AQUI_A_URL_DO_WEBHOOK_DO_DISCORD";

# 4. Inicie o servidor
npm start
```

---

## ⚙️ Configuração

### 1. Criar Webhook no Discord

1. Abra o Discord → vá no canal desejado
2. Clique em ⚙️ **Configurações do Canal**
3. Vá em **Integrações → Webhooks → Criar Webhook**
4. Dê um nome (ex: "Captain Hook 🪝")
5. Copie a **URL do Webhook**
6. Cole na linha 9 do `server.js`

### 2. Configurar Webhook no Asaas

1. Acesse **Asaas → Configurações → Integrações → Webhooks**
2. Clique em **Adicionar Webhook**
3. Cole a URL do seu servidor:
   ```
   https://SEU_SERVIDOR/webhook/asaas
   ```
4. Marque os eventos que quer receber:
   - ✅ `PAYMENT_CONFIRMED`
   - ✅ `PAYMENT_RECEIVED`
   - ✅ `PAYMENT_OVERDUE`
   - (e outros que quiser)
5. Salve

---

## ☁️ Deploy Gratuito (Railway)

1. Crie conta em [railway.app](https://railway.app)
2. Crie novo projeto → Deploy from GitHub
3. Suba esta pasta no GitHub e conecte
4. A URL pública será gerada automaticamente
5. Use essa URL no Asaas

---

## 🧪 Teste Local com ngrok

```bash
# Instale o ngrok: https://ngrok.com
ngrok http 3000

# Copie a URL gerada (ex: https://abc123.ngrok.io)
# Use: https://abc123.ngrok.io/webhook/asaas
```

---

## 📨 Eventos Suportados

| Evento | Emoji | Cor |
|--------|-------|-----|
| PAYMENT_CONFIRMED | ✅ | Verde |
| PAYMENT_RECEIVED | 💰 | Verde |
| PAYMENT_CREATED | 📋 | Azul |
| PAYMENT_OVERDUE | ⚠️ | Vermelho |
| PAYMENT_REFUNDED | ↩️ | Laranja |
| PAYMENT_DELETED | 🗑️ | Cinza |

---

## 💬 Suporte

Qualquer dúvida, volte no Claude e pergunte! 🤖
