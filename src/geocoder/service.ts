import { Injectable } from '@nestjs/common';
import * as NodeGeocoder from 'node-geocoder';

@Injectable()
export class GeocodeService {
  private geocoder;

  constructor() {
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap', 
    });
  }

  async reverseGeocode(lat: number, lon: number) {
    try {
      const result = await this.geocoder.reverse({ lat, lon });
      if (result.length > 0) {
        return result[0].formattedAddress;
      }
      throw new Error('No address found for the provided coordinates.');
    } catch (error:any) {
      throw new Error('Error while reverse geocoding: ' + error.message);
    }
  }
}
