const express = require("express");
const app = express();
app.use(express.json());

// =============================================
// ⚙️  CONFIGURAÇÕES — edite aqui
// =============================================
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1479166160997056736/nX81l-iMrr1XP1MhyG15Dt2-SogPobv17h0--hWuC8Ht5327iTNrn92t23XbZ5BkjygL";
const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk1NjhlZGFjLTQzZTEtNGYyOC05ZTJjLTA3N2IyMTQyZjcwODo6JGFhY2hfYTZhYmNjOWUtM2E2ZS00ODkxLWEwZDItN2YzMDI1OTRlODY1";
const PORT = 3000;
// =============================================

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

const CORES = {
  PAYMENT_CONFIRMED: 0x00c851,
  PAYMENT_RECEIVED: 0x00c851,
  PAYMENT_CREATED: 0x33b5e5,
  PAYMENT_OVERDUE: 0xff4444,
  PAYMENT_DELETED: 0x888888,
  PAYMENT_RESTORED: 0xffbb33,
  PAYMENT_REFUNDED: 0xff8800,
  PAYMENT_UPDATED: 0xaa66cc,
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
  const match = descricao.match(/parcela\s+(\d+)\s+de\s+(\d+)/i);
  if (match) return `Parcela ${match[1]} de ${match[2]}`;
  return descricao.length > 60 ? descricao.substring(0, 60) + "..." : descricao;
}

async function buscarNomeCliente(customerId) {
  try {
    if (!customerId || typeof customerId !== "string") return null;
    const res = await fetch(`https://api.asaas.com/v3/customers/${customerId}`, {
      headers: { "access_token": ASAAS_API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.name || data.tradingName || null;
  } catch (err) {
    console.error("Erro ao buscar cliente:", err.message);
    return null;
  }
}

async function enviarParaDiscord(pagamento, evento) {
  const tituloEvento = EVENTOS[evento] || `📌 ${evento}`;
  const cor = CORES[evento] || 0x5865f2;
  const parcela = descricaoParcela(pagamento.description);

  let nomeCliente =
    pagamento.customer?.name ||
    pagamento.customerName ||
    pagamento.customer?.tradingName ||
    null;

  if (!nomeCliente && pagamento.customer) {
    const customerId = typeof pagamento.customer === "string"
      ? pagamento.customer
      : pagamento.customer?.id;
    if (customerId) nomeCliente = await buscarNomeCliente(customerId);
  }

  nomeCliente = nomeCliente || "Desconhecido";

  const fields = [
    { name: "👤 Cliente", value: nomeCliente, inline: true },
    { name: "💵 Valor Bruto", value: formatarMoeda(pagamento.value || 0), inline: true },
    { name: "💳 Valor Líquido", value: formatarMoeda(pagamento.netValue || pagamento.value || 0), inline: true },
  ];

  if (parcela) fields.push({ name: "📄 Descrição", value: parcela, inline: false });

  if (pagamento.billingType) {
    const tipos = {
      BOLETO: "🧾 Boleto",
      CREDIT_CARD: "💳 Cartão de Crédito",
      PIX: "⚡ Pix",
      DEBIT_CARD: "💳 Cartão de Débito",
      TRANSFER: "🔄 Transferência",
    };
    fields.push({ name: "💳 Forma de Pagamento", value: tipos[pagamento.billingType] || pagamento.billingType, inline: true });
  }

  if (pagamento.paymentDate || pagamento.confirmedDate) {
    fields.push({ name: "📅 Data Pagamento", value: formatarData(pagamento.paymentDate || pagamento.confirmedDate), inline: true });
  }

  if (pagamento.dueDate) {
    fields.push({ name: "📆 Vencimento", value: formatarData(pagamento.dueDate), inline: true });
  }

  if (pagamento.id) {
    fields.push({ name: "🔑 ID Asaas", value: `\`${pagamento.id}\``, inline: false });
  }

  const payload = {
    username: "Captain Hook 🪝",
    avatar_url: "https://i.imgur.com/4M34hi2.png",
    embeds: [{ title: tituloEvento, color: cor, fields, footer: { text: "Asaas • Captain Hook" }, timestamp: new Date().toISOString() }],
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("❌ Erro ao enviar pro Discord:", await res.text());
  } else {
    console.log(`✅ [${evento}] Enviado — Cliente: ${nomeCliente}`);
  }
}

app.post("/webhook/asaas", async (req, res) => {
  try {
    const body = req.body;
    const evento = body.event;
    const pagamento = body.payment;
    if (!evento || !pagamento) return res.status(400).json({ error: "Payload inválido" });
    if (evento.startsWith("PAYMENT_")) await enviarParaDiscord(pagamento, evento);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Erro interno:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Captain Hook online 🪝", hora: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🪝 Captain Hook rodando na porta ${PORT}`);
});
