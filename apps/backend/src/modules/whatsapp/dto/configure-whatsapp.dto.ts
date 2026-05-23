import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfigureWhatsappDto {
  @ApiProperty({ description: 'WhatsApp Business phone number ID' })
  @IsString()
  @MinLength(1)
  phoneNumberId: string;

  @ApiProperty({ description: 'WhatsApp Business API access token' })
  @IsString()
  @MinLength(1)
  accessToken: string;

  @ApiProperty({ description: 'Business display name' })
  @IsString()
  @MinLength(2)
  businessName: string;
}
