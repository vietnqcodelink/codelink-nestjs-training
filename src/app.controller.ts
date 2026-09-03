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
  @ApiOperation({
    summary: 'Check that the API is running',
    description:
      'Returns a lightweight response without accessing the database.',
  })
  @ApiOkResponse({
    description: 'Application greeting',
    type: String,
    example: 'Hello World!',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
