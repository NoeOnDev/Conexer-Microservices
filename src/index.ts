import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import { Twilio } from "twilio";
import crypto from "crypto";

config();

const app = express();
const port = process.env.PORT;

const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.post("/send-verification-code", async (req, res) => {
  try {
    const { to } = req.body;

    const verificationCode = crypto.randomInt(100000, 999999).toString();

    const response = await twilio.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      body: `Tu código de verificación es: ${verificationCode}`,
      to: `whatsapp:${to}`,
    });

    res.json({ message: "Código de verificación enviado", response });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
