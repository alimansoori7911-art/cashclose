import { Module } from '@nestjs/common';

import { MatrixController } from './matrix.controller';
import { ReviewController } from './review.controller';
import { RegisterMatrixService } from './services/register-matrix.service';
import { ReviewService } from './services/review.service';
import { VersionsService } from './services/versions.service';

@Module({
  controllers: [ReviewController, MatrixController],
  providers: [ReviewService, VersionsService, RegisterMatrixService],
  exports: [ReviewService, VersionsService],
})
export class ReviewModule {}
