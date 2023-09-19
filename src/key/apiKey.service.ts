// api-key.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Injectable()
export class ApiKeyService {
  private readonly apiKeyFilePath = '../.env';

   generateAndSaveApiKey(): string {
    const newApiKey =  uuidv4();
     fs.writeFileSync(this.apiKeyFilePath, `API_KEY=${newApiKey}\n`, { flag: 'a' });
    return newApiKey;
  }

  getCurrentApiKey(): string {
    const data = fs.readFileSync(this.apiKeyFilePath, 'utf-8');
    const match = data.match(/API_KEY=(.*)/);
    return match ? match[1] : '';
  }
}
