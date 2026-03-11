// backend/services/emailService.js
import nodemailer from 'nodemailer';

// Función para crear transporter (se llama cada vez que se necesita para obtener variables frescas)
function crearTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Función para generar código de cupón único (formato: MOTO-XXXX)
export function generarCodigoCupon() {
  // Generar 4 caracteres aleatorios (letras y números)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin letras confusas (I, O, 1, 0)
  let codigo = '';
  for (let i = 0; i < 4; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MOTO-${codigo}`;
}

// Función para enviar cupón de lavada gratis
export async function enviarCuponLavadaGratis(destinatario, nombreCliente, codigoCupon, lavadasCompletadas) {
  try {
    // Verificar que las credenciales de email estén configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP no configurado. Email no enviado.');
      console.log(`📧 Se habría enviado cupón ${codigoCupon} a ${destinatario}`);
      return { success: false, reason: 'smtp_not_configured' };
    }

    // Crear transporter con las variables actuales
    const transporter = crearTransporter();

    const mailOptions = {
      from: `"MotoBombón" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: '🎉 ¡Felicidades! Has ganado una lavada GRATIS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
              text-align: center;
            }
            .congratulations {
              font-size: 20px;
              color: #333;
              margin-bottom: 20px;
            }
            .cupon {
              background-color: #f0f0f0;
              border: 2px dashed #667eea;
              border-radius: 10px;
              padding: 20px;
              margin: 30px 0;
            }
            .cupon-code {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 2px;
              margin: 10px 0;
            }
            .stats {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .stats-number {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .button {
              display: inline-block;
              background-color: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 MotoBombón</h1>
              <p>Sistema de Fidelización</p>
            </div>
            <div class="content">
              <p class="congratulations">
                ¡Hola <strong>${nombreCliente}</strong>! 🎊
              </p>
              <p>
                ¡Has alcanzado un hito increíble con nosotros!
              </p>
              <div class="stats">
                <div class="stats-number">${lavadasCompletadas}</div>
                <div>Lavadas Completadas</div>
              </div>
              <p>
                Como agradecimiento por tu lealtad, te regalamos:
              </p>
              <div class="cupon">
                <h2>🎁 UNA LAVADA GRATIS</h2>
                <p>Tu código de cupón es:</p>
                <div class="cupon-code">${codigoCupon}</div>
                <p style="font-size: 14px; color: #666; margin-top: 15px;">
                  Presenta este código en tu próxima visita
                </p>
              </div>
              <p>
                <strong>¿Cómo usar tu cupón?</strong>
              </p>
              <p style="font-size: 14px; color: #666;">
                1. Agenda tu cita como siempre<br>
                2. Menciona tu código de cupón al llegar<br>
                3. ¡Disfruta de tu lavada gratis!
              </p>
              <p style="margin-top: 30px; color: #999; font-size: 12px;">
                Este cupón no tiene fecha de expiración y es válido para cualquier servicio de lavado.
              </p>
            </div>
            <div class="footer">
              <p>
                ¡Gracias por confiar en MotoBombón!<br>
                Seguimos trabajando para darte el mejor servicio.
              </p>
              <p style="margin-top: 10px;">
                Este email fue generado automáticamente, por favor no responder.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
¡Felicidades ${nombreCliente}!

Has completado ${lavadasCompletadas} lavadas con MotoBombón.

Como agradecimiento, ¡te regalamos una lavada GRATIS!

Tu código de cupón es: ${codigoCupon}

Presenta este código en tu próxima visita para redimir tu lavada gratis.

¡Gracias por tu preferencia!
- Equipo MotoBombón
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a ${destinatario}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
}

// Función para verificar la configuración de email
export async function verificarConfiguracionEmail() {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { configured: false, message: 'Credenciales SMTP no configuradas' };
    }

    // Crear transporter local para esta verificación
    const transporter = crearTransporter();
    await transporter.verify();

    return { configured: true, message: 'Configuración de email válida' };
  } catch (error) {
    return { configured: false, message: error.message };
  }
}
