import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface Conversation {
  id: string;
  contact: { name: string; phone: string; waId: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: string;
}

interface Message {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  timestamp: string;
  type: string;
  status: string;
}

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  template: `
    <div class="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <!-- Conversations List (Left Panel) -->
      <div class="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <!-- Search -->
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <div class="relative">
            <mat-icon class="absolute left-3 top-2.5 text-gray-400 text-[20px]">search</mat-icon>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search conversations..."
              class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white">
          </div>
        </div>

        <!-- Conversation List -->
        <div class="flex-1 overflow-y-auto">
          @if (loadingConversations()) {
            <div class="flex justify-center py-8">
              <mat-spinner diameter="30"></mat-spinner>
            </div>
          } @else if (conversations().length === 0) {
            <div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <mat-icon class="!text-5xl mb-3">chat_bubble_outline</mat-icon>
              <p class="text-sm">No conversations yet</p>
              <p class="text-xs mt-1">Messages will appear here when customers contact you</p>
            </div>
          } @else {
            @for (conv of conversations(); track conv.id) {
              <div
                (click)="selectConversation(conv)"
                [class.bg-primary-50]="selectedConversation()?.id === conv.id"
                class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium shrink-0">
                  {{ (conv.contact.name || conv.contact.phone).charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {{ conv.contact.name || conv.contact.phone }}
                    </span>
                    <span class="text-xs text-gray-500">{{ conv.lastMessageAt | date:'shortTime' }}</span>
                  </div>
                  <div class="flex justify-between items-center mt-0.5">
                    <span class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ conv.lastMessage }}</span>
                    @if (conv.unreadCount > 0) {
                      <span class="ml-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {{ conv.unreadCount }}
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Chat Area (Right Panel) -->
      <div class="flex-1 flex flex-col">
        @if (selectedConversation()) {
          <!-- Chat Header -->
          <div class="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                {{ (selectedConversation()!.contact.name || selectedConversation()!.contact.phone).charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ selectedConversation()!.contact.name || selectedConversation()!.contact.phone }}</p>
                <p class="text-xs text-gray-500">{{ selectedConversation()!.contact.phone }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button mat-icon-button matTooltip="AI Summary" (click)="generateSummary()">
                <mat-icon>auto_awesome</mat-icon>
              </button>
              <button mat-icon-button [matMenuTriggerFor]="chatMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #chatMenu="matMenu">
                <button mat-menu-item (click)="generateSummary()">
                  <mat-icon>summarize</mat-icon>
                  <span>AI Summary</span>
                </button>
                <button mat-menu-item (click)="analyzeSentiment()">
                  <mat-icon>mood</mat-icon>
                  <span>Sentiment Analysis</span>
                </button>
                <button mat-menu-item>
                  <mat-icon>label</mat-icon>
                  <span>Smart Tags</span>
                </button>
              </mat-menu>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] dark:bg-gray-900">
            @for (msg of messages(); track msg.id) {
              <div [class]="msg.direction === 'OUTBOUND' ? 'flex justify-end' : 'flex justify-start'">
                <div [class]="msg.direction === 'OUTBOUND'
                  ? 'bg-[#dcf8c6] dark:bg-primary-900 rounded-tl-lg rounded-tr-lg rounded-bl-lg max-w-[70%] px-3 py-2 shadow-sm'
                  : 'bg-white dark:bg-gray-700 rounded-tl-lg rounded-tr-lg rounded-br-lg max-w-[70%] px-3 py-2 shadow-sm'">
                  <p class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{{ msg.content }}</p>
                  <div class="flex items-center justify-end gap-1 mt-1">
                    <span class="text-[10px] text-gray-500">{{ msg.timestamp | date:'shortTime' }}</span>
                    @if (msg.direction === 'OUTBOUND') {
                      <mat-icon class="!text-[14px] text-blue-500">
                        {{ msg.status === 'READ' ? 'done_all' : msg.status === 'DELIVERED' ? 'done_all' : 'done' }}
                      </mat-icon>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Message Input -->
          <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div class="flex items-center gap-2">
              <button mat-icon-button class="text-gray-500">
                <mat-icon>attach_file</mat-icon>
              </button>
              <input
                type="text"
                [(ngModel)]="newMessage"
                (keyup.enter)="sendMessage()"
                placeholder="Type a message..."
                class="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-sm text-gray-900 dark:text-white">
              <button mat-icon-button (click)="getAiSuggestion()" class="text-primary-600" matTooltip="AI Reply">
                <mat-icon>smart_toy</mat-icon>
              </button>
              <button mat-fab color="primary" class="!w-10 !h-10 !shadow-md" (click)="sendMessage()">
                <mat-icon class="!text-[20px]">send</mat-icon>
              </button>
            </div>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900">
            <mat-icon class="!text-7xl mb-4">forum</mat-icon>
            <h2 class="text-xl font-medium">AI WhatsApp Assistant</h2>
            <p class="text-sm mt-2">Select a conversation to start messaging</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class ChatsComponent implements OnInit {
  searchQuery = '';
  newMessage = '';
  loadingConversations = signal(true);
  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.loadingConversations.set(true);
    this.api.get<any>('chats/default', { page: 1, limit: 50 }).subscribe({
      next: (res) => {
        this.conversations.set(res.data || []);
        this.loadingConversations.set(false);
      },
      error: () => {
        this.conversations.set([]);
        this.loadingConversations.set(false);
      },
    });
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    this.loadMessages(conv.id);
  }

  loadMessages(conversationId: string) {
    this.api.get<any>(`messages/${conversationId}`).subscribe({
      next: (res) => this.messages.set(res.data || []),
      error: () => this.messages.set([]),
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation()) return;

    const content = this.newMessage;
    this.newMessage = '';

    this.api.post<Message>(`messages/${this.selectedConversation()!.id}`, { content }).subscribe({
      next: (msg) => {
        this.messages.update((msgs) => [...msgs, msg]);
      },
    });
  }

  generateSummary() {
    if (!this.selectedConversation()) return;
    this.api.post(`ai/summarize/${this.selectedConversation()!.id}`).subscribe();
  }

  analyzeSentiment() {
    if (!this.selectedConversation()) return;
    this.api.post(`ai/sentiment/${this.selectedConversation()!.id}`).subscribe();
  }

  getAiSuggestion() {
    if (!this.selectedConversation() || this.messages().length === 0) return;

    const history = this.messages()
      .slice(-10)
      .map((m) => `[${m.direction}] ${m.content}`)
      .join('\n');

    const lastInbound = this.messages().filter((m) => m.direction === 'INBOUND').pop();

    this.api.post<{ reply: string }>('ai/generate-reply', {
      conversationHistory: history,
      customerMessage: lastInbound?.content || '',
    }).subscribe({
      next: (res) => {
        this.newMessage = res.reply;
      },
    });
  }
}
