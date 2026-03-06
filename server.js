const express = require("express");
const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1479166160997056736/nX81l-iMrr1XP1MhyG15Dt2-SogPobv17h0--hWuC8Ht5327iTNrn92t23XbZ5BkjygL";
const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk1NjhlZGFjLTQzZTEtNGYyOC05ZTJjLTA3N2IyMTQyZjcwODo6JGFhY2hfYTZhYmNjOWUtM2E2ZS00ODkxLWEwZDItN2YzMDI1OTRlODY1";
const PORT = 3000;

const EVENTOS = {
  PAYMENT_CONFIRMED: "✅ Pagamento Confirmado",
  PAYMENT_RECEIVED: "💰 Pagamento Recebido",
  PAYMENT_CREATED: "🗒️ Cobrança Criada",
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
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
}

function formatarData(dataStr) {
  if (!dataStr) return "—";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function extrairParcela(descricao) {
  if (!descricao) return null;
  const match = descricao.match(/parcela\s+(\d+)\s+de\s+(\d+)/i);
  if (match) return `${match[1]} de ${match[2]}`;
  return null;
}

function formatarMetodo(metodo) {
  const map = { PIX: "⚡ Pix", BOLETO: "🗒️ Boleto", CREDIT_CARD: "💳 Cartão de Crédito", DEBIT_CARD: "💳 Cartão de Débito", TRANSFER: "🔄 Transferência", CASH: "💵 Dinheiro" };
  return map[metodo] || metodo || "—";
}

async function buscarNomeCliente(customerId) {
  try {
    console.log("Buscando cliente:", customerId);
    const url = `https://api.asaas.com/v3/customers/${customerId}`;
    const resp = await fetch(url, {
      headers: {
        "access_token": ASAAS_API_KEY,
        "Content-Type": "application/json"
      }
    });
    console.log("Status da busca:", resp.status);
    if (!resp.ok) {
      const txt = await resp.text();
      console.log("Erro ao buscar cliente:", txt);
      return "Desconhecido";
    }
    const data = await resp.json();
    console.log("Cliente encontrado:", data.name);
    return data.name || "Desconhecido";
  } catch (err) {
    console.error("Erro na busca do cliente:", err.message);
    return "Desconhecido";
  }
}

async function buscarPagamento(paymentId) {
  try {
    const url = `https://api.asaas.com/v3/payments/${paymentId}`;
    const resp = await fetch(url, {
      headers: {
        "access_token": ASAAS_API_KEY,
        "Content-Type": "application/json"
      }
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    console.error("Erro ao buscar pagamento:", err.message);
    return null;
  }
}

app.post("/webhook/asaas", async (req, res) => {
  res.status(200).json({ received: true });

  try {
    const { event, payment } = req.body;
    if (!payment) return;

    console.log("Webhook recebido:", event, "Payment ID:", payment.id);
    console.log("Customer no payload:", payment.customer);

    // Busca dados completos do pagamento para garantir todos os campos
    const pagamentoCompleto = await buscarPagamento(payment.id);
    const pag = pagamentoCompleto || payment;

    // Busca nome do cliente
    let nomeCliente = "Desconhecido";
    const customerId = pag.customer || payment.customer;
    
    if (customerId && typeof customerId === "string" && customerId.startsWith("cus_")) {
      nomeCliente = await buscarNomeCliente(customerId);
    } else if (pag.customerName) {
      nomeCliente = pag.customerName;
    } else if (payment.customerName) {
      nomeCliente = payment.customerName;
    }

    const titulo = EVENTOS[event] || `📋 ${event}`;
    const cor = CORES[event] || 0x5865f2;
    const parcela = extrairParcela(pag.description || payment.description);

    const campos = [
      { name: "👤 Cliente", value: nomeCliente, inline: true },
      { name: "💵 Valor Bruto", value: formatarMoeda(pag.value || payment.value), inline: true },
      { name: "💸 Valor Líquido", value: formatarMoeda(pag.netValue || payment.netValue), inline: true },
    ];

    if (pag.description || payment.description) {
      campos.push({ name: "📋 Descrição", value: String(pag.description || payment.description), inline: false });
    }
    if (parcela) {
      campos.push({ name: "🔢 Parcela", value: parcela, inline: true });
    }

    campos.push(
      { name: "🏦 Forma de Pagamento", value: formatarMetodo(pag.billingType || payment.billingType), inline: true },
      { name: "📅 Data Pagamento", value: formatarData(pag.paymentDate || pag.confirmedDate || payment.paymentDate || payment.confirmedDate), inline: true },
      { name: "📅 Vencimento", value: formatarData(pag.dueDate || payment.dueDate), inline: true },
      { name: "🔑 ID Asaas", value: String(pag.id || payment.id), inline: false }
    );

    const payload = {
      username: "Captain Hook 🪝",
      embeds: [{
        title: titulo,
        color: cor,
        fields: campos,
        footer: { text: "Asaas • Captain Hook" },
        timestamp: new Date().toISOString(),
      }],
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify(payload),
    });

  } catch (err) {
    console.error("Erro no webhook:", err.message);
  }
});

app.get("/", (req, res) => res.send("🪝 Capitão Gancho rodando na porta " + PORT));
app.listen(PORT, () => console.log("🪝 Capitão Gancho rodando na porta " + PORT));
