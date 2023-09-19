// api-key.middleware.js
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    
    const apiKey = req.headers['api-key'];
    const validApiKey = process.env.API_KEY


    if (apiKey === validApiKey) {
      next();
    } else {
      return res.status(403).json({ message: 'Invalid API key' });
    }
  }
}
