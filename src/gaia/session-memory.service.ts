import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SessionMemoryService {
  private sessions: Map<string, { role: 'user' | 'assistant' | 'system'; content: string }[]> = new Map();

  createSession(): string {
    const id = uuid();
    this.sessions.set(id, []);
    return id;
  }

  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    this.sessions.get(sessionId).push({ role, content });
  }

  getMessages(sessionId: string) {
    return this.sessions.get(sessionId) || [];
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}
