import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizarCorreo(correo: unknown): string {
  return String(correo || "").trim().toLowerCase();
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function readSmtpResponse(conn: Deno.TlsConn): Promise<{ code: number; raw: string }> {
  const decoder = new TextDecoder();
  const buf = new Uint8Array(4096);
  let full = "";

  while (true) {
    const n = await conn.read(buf);
    if (n === null) break;
    full += decoder.decode(buf.subarray(0, n));
    const lines = full.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length > 0) {
      const last = lines[lines.length - 1];
      // Standard SMTP final line has space after 3-digit code (e.g., "250 OK"),
      // whereas continuation lines have a hyphen (e.g., "250-SIZE ...").
      if (/^\d{3} /.test(last)) {
        return { code: parseInt(last.slice(0, 3), 10), raw: full.trim() };
      }
    }
  }

  const code = /^\d{3}/.test(full) ? parseInt(full.slice(0, 3), 10) : 0;
  return { code, raw: full.trim() };
}

async function sendSmtpCommand(conn: Deno.TlsConn, cmd: string): Promise<{ code: number; raw: string }> {
  const encoder = new TextEncoder();
  await conn.write(encoder.encode(cmd + "\r\n"));
  return await readSmtpResponse(conn);
}

async function enviarCorreoSmtpGmail(params: {
  to: string;
  codigo: string;
  gmailUser: string;
  gmailPass: string;
}): Promise<void> {
  const { to, codigo, gmailUser, gmailPass } = params;
  const cleanPass = gmailPass.replace(/\s+/g, "");
  if (!cleanPass) {
    throw new Error("GMAIL_APP_PASSWORD no configurado.");
  }

  const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });
  try {
    const greet = await readSmtpResponse(conn);
    if (greet.code !== 220) throw new Error(`SMTP saludo inesperado (${greet.code}): ${greet.raw}`);

    const ehlo = await sendSmtpCommand(conn, "EHLO supabase-edge");
    if (ehlo.code !== 250) throw new Error(`SMTP EHLO error (${ehlo.code}): ${ehlo.raw}`);

    const auth = await sendSmtpCommand(conn, "AUTH LOGIN");
    if (auth.code !== 334) throw new Error(`SMTP AUTH error (${auth.code}): ${auth.raw}`);

    const userRes = await sendSmtpCommand(conn, encodeBase64Utf8(gmailUser));
    if (userRes.code !== 334) throw new Error(`SMTP user error (${userRes.code}): ${userRes.raw}`);

    const passRes = await sendSmtpCommand(conn, encodeBase64Utf8(cleanPass));
    if (passRes.code !== 235) throw new Error(`SMTP autenticación fallida (${passRes.code}): ${passRes.raw}`);

    const mailFrom = await sendSmtpCommand(conn, `MAIL FROM:<${gmailUser}>`);
    if (mailFrom.code !== 250) throw new Error(`SMTP MAIL FROM error (${mailFrom.code}): ${mailFrom.raw}`);

    const rcptTo = await sendSmtpCommand(conn, `RCPT TO:<${to}>`);
    if (rcptTo.code !== 250) throw new Error(`SMTP RCPT TO error (${rcptTo.code}): ${rcptTo.raw}`);

    const dataCmd = await sendSmtpCommand(conn, "DATA");
    if (dataCmd.code !== 354) throw new Error(`SMTP DATA error (${dataCmd.code}): ${dataCmd.raw}`);

    const subject = "Tu código de acceso - Misericordia Planillas";
    const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1565c0; padding-bottom: 16px;">
    <h2 style="color: #1565c0; margin: 0; font-size: 22px;">Panel de Administración de Grado</h2>
    <p style="color: #616161; font-size: 14px; margin-top: 6px; margin-bottom: 0;">Colegio Nuestra Señora de la Misericordia</p>
  </div>
  <p style="font-size: 15px; color: #333333; line-height: 1.5;">Hola,</p>
  <p style="font-size: 15px; color: #333333; line-height: 1.5;">Has solicitado acceder a la plataforma. Tu código de verificación es:</p>
  <div style="background-color: #f0f7ff; border: 2px dashed #1565c0; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
    <span style="font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #1565c0; font-family: monospace;">${codigo}</span>
  </div>
  <p style="font-size: 13px; color: #666666; line-height: 1.5;">
    Copia este código e ingrésalo en la pantalla de inicio de sesión.<br>
    Este código coincide exactamente con el registrado en el sistema.
  </p>
  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0 16px 0;" />
  <p style="font-size: 11px; color: #9e9e9e; text-align: center; margin: 0;">
    Este correo fue enviado de forma automática desde la plataforma oficial de Misericordia Planillas.
  </p>
</div>`;

    const mimeMessage = [
      `From: "Misericordia Planillas" <${gmailUser}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${encodeBase64Utf8(subject)}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodeBase64Utf8(htmlBody),
      ".",
    ].join("\r\n");

    const msgRes = await sendSmtpCommand(conn, mimeMessage);
    if (msgRes.code !== 250) throw new Error(`SMTP envío error (${msgRes.code}): ${msgRes.raw}`);

    await sendSmtpCommand(conn, "QUIT").catch(() => {});
  } finally {
    try {
      conn.close();
    } catch {
      // ignore close errors
    }
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ exito: false, mensaje: "Método no permitido." }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const emailNorm = normalizarCorreo(body?.email);

    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return jsonResponse({ exito: false, motivo: "EMAIL_INVALIDO", mensaje: "Ingresa un correo válido." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ exito: false, motivo: "CONFIG_ERROR", mensaje: "Falta configuración de Supabase." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabaseAdmin.from("app_adm_config").select("*");
    if (error) {
      return jsonResponse({ exito: false, motivo: "DB_ERROR", mensaje: error.message }, 500);
    }

    const coincidentes = (data || []).filter((fila: Record<string, unknown>) => {
      const correoFila = normalizarCorreo(
        fila.email ?? fila.Email ?? fila.EMAIL ?? fila.correo ?? fila.Correo ?? fila["E-mail"] ?? ""
      );
      return correoFila === emailNorm;
    });

    if (coincidentes.length === 0) {
      return jsonResponse(
        { exito: false, motivo: "NO_AUTORIZADO", mensaje: "El correo no figura en el listado de docentes autorizados." },
        404
      );
    }

    coincidentes.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const cantA = Array.isArray(a.planillas) && a.planillas.length > 0 ? 1 : 0;
      const cantB = Array.isArray(b.planillas) && b.planillas.length > 0 ? 1 : 0;
      if (cantA !== cantB) return cantB - cantA;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    const usuario = coincidentes[0];
    const clave = String(
      usuario.clave ?? usuario["Contraseña"] ?? usuario.contrasena ?? usuario["contraseña"] ?? usuario.password ?? ""
    ).trim();

    if (!clave) {
      return jsonResponse(
        { exito: false, motivo: "SIN_CLAVE", mensaje: "El docente figura pero no tiene contraseña asignada en la tabla." },
        400
      );
    }

    const gmailUser = Deno.env.get("GMAIL_USER") || "misericordiaplanillas@gmail.com";
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD") || "";

    if (!gmailPass.replace(/\s+/g, "")) {
      return jsonResponse(
        {
          exito: false,
          motivo: "SMTP_NO_CONFIGURADO",
          mensaje: "Falta configurar el secreto GMAIL_APP_PASSWORD en Supabase Edge Functions.",
        },
        500
      );
    }

    await enviarCorreoSmtpGmail({
      to: emailNorm,
      codigo: clave,
      gmailUser,
      gmailPass,
    });

    return jsonResponse({ exito: true, metodo: "supabase-edge-smtp" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error en enviar-codigo:", message);
    return jsonResponse({ exito: false, motivo: "ERROR_ENVIO", mensaje: message }, 500);
  }
});
