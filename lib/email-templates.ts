const CLASS_LABELS: Record<string, string> = {
  guerrero: "Guerrero",
  mago: "Mago",
  explorador: "Explorador",
};

export function welcomeStudentEmail(params: {
  name: string;
  username: string;
  password: string;
  characterClass: string;
  siteUrl: string;
}): string {
  const { name, username, password, characterClass, siteUrl } = params;
  const classLabel = CLASS_LABELS[characterClass] ?? characterClass;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Academia Dialéctica</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:36px 40px;text-align:center;">
              <img src="${siteUrl}/logo.png" alt="Academia Dialéctica" height="64" style="margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">¡Bienvenido a Academia Dialéctica!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Querido estudiante <strong>${name}</strong>,</p>

              <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.7;">
                Gracias por preferirnos. Has sido aceptado en nuestra academia.
                Tu personaje escogido es <strong>${classLabel}</strong> — prepárate para una experiencia de aprendizaje única.
              </p>

              <!-- Credentials card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border-radius:14px;margin:24px 0;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 14px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Tus credenciales de acceso</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:15px;color:#1f2937;white-space:nowrap;padding-right:12px;font-weight:600;">Usuario:</td>
                        <td style="padding:4px 0;font-size:15px;color:#2563eb;font-weight:700;font-family:monospace;">${username}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:15px;color:#1f2937;white-space:nowrap;padding-right:12px;font-weight:600;">Contraseña:</td>
                        <td style="padding:4px 0;font-size:15px;color:#2563eb;font-weight:700;font-family:monospace;">${password}</td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:12px;color:#9ca3af;">
                      Te recomendamos cambiar tu contraseña la primera vez que inicies sesión.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
                Puedes entrar cuando gustes a tu cuenta y comenzar tu aventura de aprendizaje.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/login"
                       style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.3px;">
                      Iniciar Sesión
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.7;">
                Un abrazo,<br/>
                <strong>Academia Dialéctica</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Este correo fue enviado porque participaste en Neuron Hunt en
                <a href="${siteUrl}" style="color:#6b7280;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
