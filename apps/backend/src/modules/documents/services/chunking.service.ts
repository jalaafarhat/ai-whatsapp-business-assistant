import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkingService {
  private readonly defaultChunkSize = 1000;
  private readonly defaultOverlap = 200;

  chunkText(text: string, chunkSize?: number, overlap?: number): string[] {
    const size = chunkSize || this.defaultChunkSize;
    const overlapSize = overlap || this.defaultOverlap;
    const chunks: string[] = [];

    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > size && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());

        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlapSize / 5));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
