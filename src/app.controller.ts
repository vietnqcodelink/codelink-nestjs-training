import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';
import { AppService } from './app.service';

@Public()
@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Check that the API is running' })
  @ApiOkResponse({ description: 'Application greeting' })
  getHello(): string {
    return this.appService.getHello();
  }
}
