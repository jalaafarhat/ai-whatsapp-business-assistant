import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/interfaces/role.enum';
import { ConfigureWhatsappDto } from './dto/configure-whatsapp.dto';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('configure')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Configure WhatsApp Business API credentials' })
  async configure(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: ConfigureWhatsappDto,
  ) {
    return this.whatsappService.saveWhatsappConfig(orgId, dto);
  }
}
