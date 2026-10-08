// ==============================================================================
// Infrastructure: OutgoingWebhookService (Mejora 64)
// Notificaciones salientes asíncronas para Slack, Discord o Microsoft Teams.
// PROTEGIDO CONTRA SSRF (Server-Side Request Forgery).
// ==============================================================================

import { logger } from '../../common/utils/logger';

export interface WebhookEventPayload {
  event: 'REQUIREMENT_APPROVED_100' | 'TEST_RUN_COMPLETED' | 'DEFECT_LOGGED';
  projectId: string;
  projectName: string;
  summary: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export class OutgoingWebhookService {
  /**
   * Valida estrictamente que la URL no apunte a localhost, IPs privadas o metadatos de cloud (SSRF Guard).
   */
  public static isSafeUrl(targetUrl: string): boolean {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      const host = parsed.hostname.toLowerCase();

      // Loopback y resoluciones locales
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        host.endsWith('.localhost')
      ) {
        return false;
      }

      // Endpoints de metadatos de cloud (AWS, GCP, Azure, DigitalOcean)
      if (host === '169.254.169.254' || host.startsWith('169.254.')) {
        return false;
      }

      // Rangos RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
      const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (ipv4Match) {
        const octet1 = parseInt(ipv4Match[1], 10);
        const octet2 = parseInt(ipv4Match[2], 10);

        if (octet1 === 10) return false;
        if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;
        if (octet1 === 192 && octet2 === 168) return false;
        if (octet1 === 127) return false;
        if (octet1 === 0) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Envía un webhook con validación previa de seguridad SSRF, timeout y logging estructurado.
   */
  public static async dispatch(url: string, payload: WebhookEventPayload): Promise<boolean> {
    if (!this.isSafeUrl(url)) {
      logger.warn({ url }, 'Intento de despacho de webhook bloqueado por política de seguridad SSRF');
      return false;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TestGenAI-Platform-Webhook/1.0',
        },
        body: JSON.stringify({
          text: `🔔 [TestGenAI] ${payload.summary}`,
          ...payload,
        }),
        signal: AbortSignal.timeout(5000), // 5 segundos max
      });

      if (!response.ok) {
        logger.warn({ status: response.status, url }, 'Webhook saliente respondió con código no exitoso');
        return false;
      }

      logger.info({ event: payload.event, url }, 'Webhook saliente despachado exitosamente');
      return true;
    } catch (err) {
      logger.error({ err, url }, 'Fallo al despachar webhook saliente');
      return false;
    }
  }
}
