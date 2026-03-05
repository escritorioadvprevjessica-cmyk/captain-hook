const express = require("express");
const app = express();
app.use(express.json());

// =============================================
// ⚙️  CONFIGURAÇÕES — edite aqui
// =============================================
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1479166160997056736/nX8lL-iMrrIXPlMhyG15Dt2-SogPobv17h0--hWuC8Ht5327iTNrn92t23XbZ5BkjygL";
const PORT = 3000;
// =============================================

// Mapa de eventos para descrição amigável
const EVENTOS = {
  PAYMENT_CONFIRMED: "✅ Pagamento Confirmado",
  PAYMENT_RECEIVED: "💰 Pagamento Recebido",
  PAYMENT_CREATED: "📋 Cobrança Criada",
  PAYMENT_OVERDUE: "⚠️ Pagamento Vencido",
  PAYMENT_DELETED: "🗑️ Cobrança Deletada",
  PAYMENT_RESTORED: "♻️ Cobrança Restaurada",
  PAYMENT_REFUNDED: "↩️ Pagamento Estornado",
  PAYMENT_UPDATED: "✏️ Pagamento Atualizado",
};

// Cores por tipo de evento
const CORES = {
  PAYMENT_CONFIRMED: 0x00c851,   // verde
  PAYMENT_RECEIVED: 0x00c851,    // verde
  PAYMENT_CREATED: 0x33b5e5,     // azul
  PAYMENT_OVERDUE: 0xff4444,     // vermelho
  PAYMENT_DELETED: 0x888888,     // cinza
  PAYMENT_RESTORED: 0xffbb33,    // amarelo
  PAYMENT_REFUNDED: 0xff8800,    // laranja
  PAYMENT_UPDATED: 0xaa66cc,     // roxo
};

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(dataStr) {
  if (!dataStr) return "—";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function descricaoParcela(descricao) {
  if (!descricao) return null;
  // tenta extrair "Parcela X de Y" da descrição
  const match = descricao.match(/parcela\s+(\d+)\s+de\s+(\d+)/i);
  if (match) return `Parcela ${match[1]} de ${match[2]}`;
  return descricao.length > 60 ? descricao.substring(0, 60) + "..." : descricao;
}

async function enviarParaDiscord(pagamento, evento) {
  const tituloEvento = EVENTOS[evento] || `📌 ${evento}`;
  const cor = CORES[evento] || 0x5865f2;

  const parcela = descricaoParcela(pagamento.description);

  const fields = [
    {
      name: "👤 Cliente",
      value: pagamento.customer?.name || pagamento.customerName || "Desconhecido",
      inline: true,
    },
    {
      name: "💵 Valor Bruto",
      value: formatarMoeda(pagamento.value || 0),
      inline: true,
    },
    {
      name: "💳 Valor Líquido",
      value: formatarMoeda(pagamento.netValue || pagamento.value || 0),
      inline: true,
    },
  ];

  if (parcela) {
    fields.push({
      name: "📄 Descrição",
      value: parcela,
      inline: false,
    });
  }

  if (pagamento.billingType) {
    const tipos = {
      BOLETO: "🧾 Boleto",
      CREDIT_CARD: "💳 Cartão de Crédito",
      PIX: "⚡ Pix",
      DEBIT_CARD: "💳 Cartão de Débito",
      TRANSFER: "🔄 Transferência",
    };
    fields.push({
      name: "💳 Forma de Pagamento",
      value: tipos[pagamento.billingType] || pagamento.billingType,
      inline: true,
    });
  }

  if (pagamento.paymentDate || pagamento.confirmedDate) {
    fields.push({
      name: "📅 Data Pagamento",
      value: formatarData(pagamento.paymentDate || pagamento.confirmedDate),
      inline: true,
    });
  }

  if (pagamento.dueDate) {
    fields.push({
      name: "📆 Vencimento",
      value: formatarData(pagamento.dueDate),
      inline: true,
    });
  }

  if (pagamento.id) {
    fields.push({
      name: "🔑 ID Asaas",
      value: `\`${pagamento.id}\``,
      inline: false,
    });
  }

  const payload = {
    username: "Captain Hook 🪝",
    avatar_url: "https://i.imgur.com/4M34hi2.png",
    embeds: [
      {
        title: tituloEvento,
        color: cor,
        fields,
        footer: {
          text: "Asaas • Captain Hook",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const erro = await res.text();
    console.error("❌ Erro ao enviar pro Discord:", erro);
  } else {
    console.log(`✅ [${evento}] Enviado pro Discord — Cliente: ${pagamento.customer?.name || pagamento.customerName}`);
  }
}

// ── Rota principal do webhook ──────────────────────
app.post("/webhook/asaas", async (req, res) => {
  try {
    const body = req.body;
    console.log("📩 Webhook recebido:", JSON.stringify(body, null, 2));

    const evento = body.event;
    const pagamento = body.payment;

    if (!evento || !pagamento) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    // Só processa eventos de pagamento
    if (evento.startsWith("PAYMENT_")) {
      await enviarParaDiscord(pagamento, evento);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Erro interno:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Health check ───────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Captain Hook online 🪝", hora: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🪝 Captain Hook rodando na porta ${PORT}`);
  console.log(`📡 Webhook URL: http://SEU_SERVIDOR:${PORT}/webhook/asaas`);
});
