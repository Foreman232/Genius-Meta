const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "geniushomes_ig";
const PAGE_ACCESS_TOKEN = "EAAJpmMVuEZBYBPImazbkCW8ZCZBn2D3WeaJCY6l8UIHFwnsH7whyrH1yTxvGJ9mqDrZCFAiLA1vTg0ZAUwsTr2aJBXCNjeXNFSgsc1yDGh9r9IfYTRuZAPUgdPl9UYEEwAtZBsgIBJr8NoEnxBsleb0ypHqb1t4tZBPDliZAboZAUhFawZAAVzPe3jKANCBeJyTUA9HpTFlRL7R0QZDZD";

const esperaFotos = {};
const yaSaludo = new Set();

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

        const normalizado = messageText.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

        const saludos = /(hola|buenos dias|buenas tardes|buenas noches)/i;
        const intenciones = /(interesad[oa]|precio|informaci[oó]n|cu[aá]nto cuesta|quiero saber|cotizar|vi su publicaci[oó]n|chapas|cerraduras|cerradura digital|busco una|quiero comprar)/i;

        if ((saludos.test(normalizado) || intenciones.test(normalizado)) && !yaSaludo.has(senderId)) {
          yaSaludo.add(senderId);
          return send(senderId, `Hola, te saluda Estuardo de Genius Homes 👋

¿Podrías indicarme en qué puerta deseas colocarla y si es de madera o MDF?`);
        }

        if (normalizado.includes("madera") || normalizado.includes("mdf")) {
          esperaFotos[senderId] = true;

          await send(senderId, `Con gusto te comparto los beneficios:

Nuestras chapas cuentan con:

📱Desbloqueo a través del app.
👆🏻Huella digital.
🔢Código.
🪪Tarjeta.
🔑Llave física
👥Hasta 200 usuarios
📶 Wi-Fi con app TUYA
🚨 Carga de emergencia y alertas`);

          await send(senderId, `📸 ¿Podrías enviarme una foto de la puerta (frontal y área de la chapa)? Así podremos asesorarte mejor. 😊`);
          return;
        }

        const fragmentosNegativosPromesa = [
          "no puedo", "no tengo foto", "no estoy en casa", "no la tengo", "no cuento con",
          "al rato", "más tarde", "después mando", "cuando pueda", "cuando llegue", "cuando la tenga", "al tenerla te mando"
        ];

        if (fragmentosNegativosPromesa.some(frag => normalizado.includes(frag))) {
          esperaFotos[senderId] = true;
          return send(senderId, `Entiendo perfectamente, no hay inconveniente.

📸 Quedamos atentos a que puedas compartir la fotografía cuando te sea posible. En cuanto la recibamos, uno de nuestros asesores se pondrá en contacto contigo para continuar con la asesoría 😊.`);
        }

        const promesasFoto = /(luego|más tarde|al rato|cuando (llegue|regrese)|no estoy en casa|al llegar|despu[eé]s mando|te mando fotos|te la paso|ahorita te mando|te la mando|ya casi te la mando|gracias en un rato te envio|ahora te la paso|te envio la foto)/i;
        if (promesasFoto.test(normalizado)) {
          if (!esperaFotos[senderId]) {
            esperaFotos[senderId] = true;

            await send(senderId, "¡Perfecto! Te agradezco mucho. Quedo atento a que me envíes las fotos en cuanto te sea posible 😊.");

            const delay = 10000;
            setTimeout(() => {
              if (esperaFotos[senderId]) {
                send(senderId, `Hola, te saluda Estuardo de Genius Homes.

¿Te fue posible tomar la fotografía de la puerta para poder continuar con el proceso de asesoría?`);
              }
            }, delay);
          }
          return;
        }

        const preguntaPrecio = /(precio|cu[aá]nto cuesta|vale|costo)/i;
        const preguntaPago = /(forma[s]? de pago|m[eé]todos de pago|como pagar|opciones de pago|puedo pagar)/i;

        if (preguntaPrecio.test(normalizado)) {
          await send(senderId, `💲 *Precio*
Tiene un valor de Q2,000.00

Incluye:
- Cerradura
- Dos llaves
- Dos tarjetas de acceso
- Capacitación para su uso

✅ Queda activada al finalizar la instalación`);

          if (esperaFotos[senderId]) {
            await send(senderId, `📸 Recuerda enviarnos la fotografía de la puerta (vista frontal y donde va la chapa) para poder confirmar el modelo que mejor se adapta a tus necesidades 😊.`);
          }
          return;
        }

        if (preguntaPago.test(normalizado)) {
          await send(senderId, `💳 *Formas de pago*

🏦 Depósito o transferencia bancaria.  
💳 Hasta 12 Visa Cuotas sin recargo con cualquier tarjeta.`);

          if (esperaFotos[senderId]) {
            await send(senderId, `📸 Recuerda enviarnos la fotografía de la puerta para continuar con la asesoría.`);
          }
          return;
        }

        await send(senderId, "Gracias por tu mensaje 🙌 ¿Cómo podemos ayudarte con tu puerta o chapa?");
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

async function send(senderId, text) {
  try {
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      recipient: { id: senderId },
      message: { text }
    });
  } catch (err) {
    console.error("❌ Error al enviar respuesta:", err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
