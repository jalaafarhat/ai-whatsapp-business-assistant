import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskDocumentDto {
  @ApiProperty({ description: 'Question to ask about uploaded documents' })
  @IsString()
  @MinLength(3)
  question: string;
}
