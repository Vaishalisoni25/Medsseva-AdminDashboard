import api from './api';

export const chatService = {
  getAllConversations: (params?: { status?: string; search?: string }) =>
    api.get('/chat/conversations', { params }).then((r) => r.data),

  getConversationById: (id: string) =>
    api.get(`/chat/conversation/${id}`).then((r) => r.data),

  getMessages: (conversationId: string, cursor?: string) =>
    api.get(`/chat/conversation/${conversationId}/messages`, {
      params: cursor ? { cursor } : {},
    }).then((r) => r.data),

  assignConversation: (id: string, adminUserId: string) =>
    api.patch(`/chat/conversation/${id}/assign`, { adminUserId }).then((r) => r.data),
};