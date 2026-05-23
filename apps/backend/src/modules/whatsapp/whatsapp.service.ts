import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

interface SendMessagePayload {
  to: string;
  type: 'text' | 'template' | 'image' | 'document';
  text?: { body: string };
  template?: { name: string; language: { code: string }; components?: any[] };
  image?: { link: string; caption?: string };
  document?: { link: string; filename?: string };
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async sendMessage(phoneNumberId: string, accessToken: string, payload: SendMessagePayload) {
    const apiUrl = this.configService.get<string>('whatsapp.apiUrl');
    const url = `${apiUrl}/${phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      ...payload,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('WhatsApp API error', error);
        throw new HttpException(
          `WhatsApp API error: ${error.error?.message || 'Unknown error'}`,
          response.status,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to send WhatsApp message', error);
      throw new HttpException('Failed to send message via WhatsApp', 500);
    }
  }

  async sendTextMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
    return this.sendMessage(phoneNumberId, accessToken, {
      to,
      type: 'text',
      text: { body: text },
    });
  }

  async sendTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    templateName: string,
    languageCode = 'en',
    components?: any[],
  ) {
    return this.sendMessage(phoneNumberId, accessToken, {
      to,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    });
  }

  async getWhatsappConfig(organizationId: string) {
    return this.prisma.whatsappConfig.findUnique({
      where: { organizationId },
    });
  }

  async saveWhatsappConfig(
    organizationId: string,
    data: { phoneNumberId: string; accessToken: string; businessName: string },
  ) {
    return this.prisma.whatsappConfig.upsert({
      where: { organizationId },
      update: data,
      create: { ...data, organizationId },
    });
  }

  verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    return `sha256=${expectedSignature}` === signature;
  }
}
