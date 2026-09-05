import { Module } from '@nestjs/common';

import { UploadsController } from './uploads.controller';
import { UploadAccessService } from './upload-access.service';
import { UploadTokenService } from './upload-token.service';
import { UploadsService } from './uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, UploadTokenService, UploadAccessService],
  exports: [UploadsService],
})
export class UploadsModule {}
