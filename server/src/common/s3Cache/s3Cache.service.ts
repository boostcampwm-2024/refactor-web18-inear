import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { Cache } from 'cache-manager';
import { Counter } from 'prom-client';

@Injectable()
export class S3CacheService {
  private readonly s3: S3;
  private readonly cacheHitCounter: Counter<string>;
  private readonly cacheMissCounter: Counter<string>;
  private readonly cacheErrorCounter: Counter<string>;
  
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.s3 = new S3({
      endpoint: this.configService.get('S3_END_POINT'),
      region: this.configService.get('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      },
    });

    this.cacheHitCounter = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
    });

    this.cacheMissCounter = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
    });

    this.cacheErrorCounter = new Counter({
      name: 'cache_errors_total',
      help: 'Total number of cache errors',
    });
  }

  async fetchFromS3<T extends string | Buffer>({
    cacheKey,
    s3Key,
    cacheTTL,
    transform,
  }: {
    cacheKey: string;
    s3Key: string;
    cacheTTL: number;
    transform: (data: Buffer) => T;
  }): Promise<T> {
    const cached = await this.cacheManager.get<T>(cacheKey);
    if (cached) {
      this.cacheHitCounter.inc();
      return cached;
    }

    try {
      this.cacheMissCounter.inc();

      const s3Response = await this.s3
        .getObject({
          Bucket: this.configService.get('S3_BUCKET_NAME'),
          Key: s3Key,
        })
        .promise();

      const content = transform(s3Response.Body as Buffer);
      await this.cacheManager.set(cacheKey, content, cacheTTL);
      return content;
    } catch (e) {
      this.cacheErrorCounter.inc();
      const fileType = cacheKey.startsWith('m3u8:') ? 'M3U8' : 'Segment(ts)';
      throw new NotFoundException(`❗ ${fileType} Not Found : ${s3Key}`);
    }
  }
}
