import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics') 
export class MetricsController {
  @Get()
  async getMetrics(): Promise<string> {
    console.log("METRICS");
    return await register.metrics();
  }
}