import { IsIn, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Plan to subscribe to', enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'] })
  @IsString()
  @IsIn(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  plan: string;

  @ApiProperty({ description: 'URL to redirect after successful payment' })
  @IsUrl({ require_tld: false })
  successUrl: string;

  @ApiProperty({ description: 'URL to redirect if payment is canceled' })
  @IsUrl({ require_tld: false })
  cancelUrl: string;
}
