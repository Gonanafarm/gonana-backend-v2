
import { Module } from '@nestjs/common';
import { GeocodeService } from './service';

@Module({
  providers: [GeocodeService],
  controllers: [],
  exports: [GeocodeService],
})
export class GeocodeModule {}
