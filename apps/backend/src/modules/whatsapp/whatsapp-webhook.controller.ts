import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { WhatsappService } from './whatsapp.service';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';

@ApiTags('WhatsApp Webhook')
@Controller('webhook/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = this.configService.get<string>('whatsapp.verifyToken');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return parseInt(challenge);
    }

    this.logger.warn('Webhook verification failed');
    return 'Verification failed';
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WhatsApp webhook events' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    const appSecret = this.configService.get<string>('whatsapp.appSecret');

    if (appSecret && signature) {
      const rawBody = JSON.stringify(body);
      const isValid = this.whatsappService.verifyWebhookSignature(rawBody, signature, appSecret);
      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }
    }

    try {
      const entries = body?.entry || [];

      for (const entry of entries) {
        const changes = entry?.changes || [];

        for (const change of changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          const messages = value?.messages || [];
          const statuses = value?.statuses || [];
          const contacts = value?.contacts || [];

          for (const message of messages) {
            await this.handleIncomingMessage(message, contacts, value.metadata);
          }

          for (const status of statuses) {
            await this.handleStatusUpdate(status);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error processing webhook', error);
    }

    return { status: 'ok' };
  }

  private async handleIncomingMessage(message: any, contacts: any[], metadata: any) {
    const contactInfo = contacts.find((c: any) => c.wa_id === message.from);
    const phoneNumberId = metadata?.phone_number_id;

    const config = await this.findConfigByPhoneNumberId(phoneNumberId);
    if (!config) {
      this.logger.warn(`No config found for phone number ID: ${phoneNumberId}`);
      return;
    }

    const workspace = await this.findDefaultWorkspace(config.organizationId);
    if (!workspace) return;

    const { conversation } = await this.chatsService.getOrCreateConversation(
      message.from,
      workspace.id,
      contactInfo?.profile?.name,
    );

    const content = this.extractMessageContent(message);

    await this.messagesService.create({
      conversationId: conversation.id,
      direction: 'INBOUND',
      type: this.mapMessageType(message.type),
      content,
      waMessageId: message.id,
      mediaUrl: message.image?.link || message.document?.link || message.video?.link,
    });

    this.logger.log(`Incoming message processed for conversation ${conversation.id}`);
  }

  private async handleStatusUpdate(status: any) {
    const statusMap: Record<string, any> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };

    if (statusMap[status.status]) {
      await this.messagesService.updateStatus(status.id, statusMap[status.status]);
    }
  }

  private extractMessageContent(message: any): string {
    switch (message.type) {
      case 'text': return message.text?.body || '';
      case 'image': return message.image?.caption || '[Image]';
      case 'video': return message.video?.caption || '[Video]';
      case 'audio': return '[Audio message]';
      case 'document': return message.document?.filename || '[Document]';
      case 'location': return `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
      default: return `[${message.type}]`;
    }
  }

  private mapMessageType(type: string): any {
    const typeMap: Record<string, string> = {
      text: 'TEXT',
      image: 'IMAGE',
      video: 'VIDEO',
      audio: 'AUDIO',
      document: 'DOCUMENT',
      location: 'LOCATION',
    };
    return typeMap[type] || 'TEXT';
  }

  private async findConfigByPhoneNumberId(phoneNumberId: string) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      return await prisma.whatsappConfig.findFirst({
        where: { phoneNumberId },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  private async findDefaultWorkspace(organizationId: string) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      return await prisma.workspace.findFirst({
        where: { organizationId },
      });
    } finally {
      await prisma.$disconnect();
    }
  }
}
