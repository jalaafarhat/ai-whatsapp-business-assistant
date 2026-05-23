import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateReplyDto {
  @ApiProperty()
  @IsString()
  conversationHistory: string;

  @ApiProperty()
  @IsString()
  customerMessage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;
}
