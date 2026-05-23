import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Stripe price ID for the plan' })
  @IsString()
  priceId: string;

  @ApiProperty({ description: 'URL to redirect after successful payment' })
  @IsUrl()
  successUrl: string;

  @ApiProperty({ description: 'URL to redirect if payment is canceled' })
  @IsUrl()
  cancelUrl: string;
}
