import { Controller, Get, Response } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Response() res: ExpressResponse): Promise<void> {
    console.log('METRICS');
    res.set('Content-Type', register.contentType); 
    res.end(await register.metrics()); 
  }
}