import { Module } from '@nestjs/common';

import { ReviewController } from './review.controller';
import { ReviewService } from './services/review.service';
import { VersionsService } from './services/versions.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, VersionsService],
  exports: [ReviewService, VersionsService],
})
export class ReviewModule {}
