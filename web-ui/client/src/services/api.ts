/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance } from 'axios';
import { Session, Message, Command, ApiResponse } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Session APIs
  async getSessions(userId: string): Promise<Session[]> {
    const response = await this.client.get<ApiResponse<Session[]>>('/sessions', {
      params: { userId },
    });
    return response.data || [];
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await this.client.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
    return response.data!;
  }

  async createSession(userId: string, name: string): Promise<Session> {
    const response = await this.client.post<ApiResponse<Session>>('/sessions', {
      userId,
      name,
    });
    return response.data!;
  }

  async updateSession(sessionId: string, name: string): Promise<Session> {
    const response = await this.client.put<ApiResponse<Session>>(`/sessions/${sessionId}`, {
      name,
    });
    return response.data!;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`/sessions/${sessionId}`);
  }

  async activateSession(sessionId: string): Promise<Session> {
    const response = await this.client.post<ApiResponse<Session>>(
      `/sessions/${sessionId}/activate`
    );
    return response.data!;
  }

  async deactivateSession(sessionId: string): Promise<Session> {
    const response = await this.client.post<ApiResponse<Session>>(
      `/sessions/${sessionId}/deactivate`
    );
    return response.data!;
  }

  // Message APIs
  async getMessages(sessionId: string, limit = 100, offset = 0): Promise<Message[]> {
    const response = await this.client.get<ApiResponse<Message[]>>('/messages', {
      params: { sessionId, limit, offset },
    });
    return response.data || [];
  }

  async createMessage(
    sessionId: string,
    type: Message['type'],
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const response = await this.client.post<ApiResponse<Message>>('/messages', {
      sessionId,
      type,
      content,
      metadata,
    });
    return response.data!;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.client.delete(`/messages/${messageId}`);
  }

  // Command APIs
  async getCommands(sessionId: string, limit = 50): Promise<Command[]> {
    const response = await this.client.get<ApiResponse<Command[]>>('/commands', {
      params: { sessionId, limit },
    });
    return response.data || [];
  }

  async getCommand(commandId: string): Promise<Command> {
    const response = await this.client.get<ApiResponse<Command>>(`/commands/${commandId}`);
    return response.data!;
  }

  async executeCommand(sessionId: string, command: string): Promise<Command> {
    const response = await this.client.post<ApiResponse<Command>>('/commands', {
      sessionId,
      command,
    });
    return response.data!;
  }

  async getCommandStats(sessionId: string): Promise<{
    total: number;
    pending: number;
    executing: number;
    completed: number;
    failed: number;
  }> {
    const response = await this.client.get<ApiResponse<any>>(`/commands/stats/${sessionId}`);
    return response.data!;
  }
}

export const apiService = new ApiService();
export default apiService;
