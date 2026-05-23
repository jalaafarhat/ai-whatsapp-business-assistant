import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  chunkCount: number;
  createdAt: string;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    DatePipe,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Upload and manage knowledge base documents for RAG</p>
        </div>
        <label
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
          <mat-icon>upload</mat-icon>
          <span>Upload PDF</span>
          <input type="file" accept=".pdf" class="hidden" (change)="onFileSelected($event)">
        </label>
      </div>

      <!-- Ask AI Section -->
      <mat-card class="!shadow-sm">
        <mat-card-content class="p-4">
          <div class="flex gap-3">
            <mat-icon class="text-primary-600 mt-1">smart_toy</mat-icon>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white mb-2">Ask AI about your documents</p>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="question"
                  (keyup.enter)="askQuestion()"
                  placeholder="Ask a question about your uploaded documents..."
                  class="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-sm text-gray-900 dark:text-white">
                <button mat-flat-button color="primary" (click)="askQuestion()" [disabled]="askingAi()">
                  Ask
                </button>
              </div>
              @if (aiAnswer()) {
                <div class="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p class="text-sm text-gray-800 dark:text-gray-200">{{ aiAnswer() }}</p>
                </div>
              }
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Documents List -->
      @if (loading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      } @else if (documents().length === 0) {
        <mat-card class="!shadow-sm">
          <mat-card-content class="p-8 text-center">
            <mat-icon class="!text-5xl text-gray-300 mb-3">description</mat-icon>
            <p class="text-gray-500">No documents uploaded yet</p>
            <p class="text-sm text-gray-400 mt-1">Upload PDFs to build your knowledge base for AI answers</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="grid gap-3">
          @for (doc of documents(); track doc.id) {
            <mat-card class="!shadow-sm hover:!shadow-md transition-shadow">
              <mat-card-content class="p-4 flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <mat-icon class="text-red-600">picture_as_pdf</mat-icon>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900 dark:text-white">{{ doc.originalName }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ (doc.size / 1024).toFixed(1) }}KB &middot; {{ doc.chunkCount }} chunks &middot; {{ doc.createdAt | date:'medium' }}
                  </p>
                </div>
                <span [class]="'px-2 py-1 rounded-full text-xs font-medium ' + getStatusClass(doc.status)">
                  {{ doc.status }}
                </span>
                <button mat-icon-button color="warn" (click)="deleteDocument(doc.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class DocumentsComponent implements OnInit {
  loading = signal(true);
  documents = signal<Document[]>([]);
  question = '';
  aiAnswer = signal('');
  askingAi = signal(false);

  constructor(
    private api: ApiService,
    private notification: NotificationService,
  ) {}

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.api.get<Document[]>('documents').subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.api.upload<Document>('documents/upload', file).subscribe({
      next: (doc) => {
        this.documents.update((docs) => [doc, ...docs]);
        this.notification.success('Document uploaded and processing');
      },
      error: () => this.notification.error('Upload failed'),
    });
  }

  askQuestion() {
    if (!this.question.trim()) return;
    this.askingAi.set(true);

    this.api.post<{ answer: string }>('ai/ask', { question: this.question }).subscribe({
      next: (res) => {
        this.aiAnswer.set(res.answer);
        this.askingAi.set(false);
      },
      error: () => {
        this.askingAi.set(false);
        this.notification.error('Failed to get AI answer');
      },
    });
  }

  deleteDocument(id: string) {
    this.api.delete(`documents/${id}`).subscribe({
      next: () => {
        this.documents.update((docs) => docs.filter((d) => d.id !== id));
        this.notification.success('Document deleted');
      },
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      READY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      PROCESSING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      UPLOADING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return classes[status] || '';
  }
}
