const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "geniushomes_ig";
const PAGE_ACCESS_TOKEN = "EAAJpmMVuEZBYBPImazbkCW8ZCZBn2D3WeaJCY6l8UIHFwnsH7whyrH1yTxvGJ9mqDrZCFAiLA1vTg0ZAUwsTr2aJBXCNjeXNFSgsc1yDGh9r9IfYTRuZAPUgdPl9UYEEwAtZBsgIBJr8NoEnxBsleb0ypHqb1t4tZBPDliZAboZAUhFawZAAVzPe3jKANCBeJyTUA9HpTFlRL7R0QZDZD";

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("🟢 Webhook verificado.");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        if (!senderId || !messageText) continue;

        const lower = messageText.toLowerCase();
        let response;

        if (/hola|buenos dias|buenas tardes/.test(lower)) {
          response = "Hola, te saluda Estuardo de Genius Homes 👋 ¿Es tu puerta de madera o MDF?";
        } else if (/madera|mdf/.test(lower)) {
          response = `🛠️ Nuestras chapas cuentan con:

📱 App TUYA  
🔢 Código  
🔑 Llave física  
🪪 Tarjeta  
👆 Huella digital  

📸 ¿Podrías enviarnos una foto de tu puerta?`;
        } else if (/precio|cu[aá]nto cuesta/.test(lower)) {
          response = "💲 Precio: Q2,000. Incluye instalación, 2 llaves y capacitación.";
        } else {
          response = "Gracias por tu mensaje 🙌 ¿Cómo podemos ayudarte con tu puerta o chapa?";
        }

        try {
          await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: senderId },
            message: { text: response }
          });
        } catch (err) {
          console.error("❌ Error al responder:", err.response?.data || err.message);
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});