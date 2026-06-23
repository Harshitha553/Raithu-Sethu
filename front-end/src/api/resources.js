import client from "./client";

export const bookingsApi = {
  create: (data) => client.post("/bookings", data),
  getAll: () => client.get("/bookings"),
  getById: (bookingId) => client.get(`/bookings/${bookingId}`),
  complete: (bookingId) => client.post(`/bookings/${bookingId}/complete`),
};

export const chatApi = {
  createConversation: (participantId) =>
    client.post("/chat/conversation", { participant_id: participantId }),
  getConversations: () => client.get("/chat/conversations"),
  getMessages: (conversationId) => client.get(`/chat/messages/${conversationId}`),
};

export const notificationsApi = {
  getAll: () => client.get("/notifications"),
  markRead: (notificationId) => client.put(`/notifications/${notificationId}/read`),
  markAllRead: () => client.put("/notifications/read-all"),
};

export const flashSalesApi = {
  getAll: (activeOnly = true) =>
    client.get("/flash-sales/", { params: { active_only: activeOnly } }),
  getById: (flashSaleId) => client.get(`/flash-sales/${flashSaleId}`),
  create: (data) => client.post("/flash-sales/", data),
  update: (flashSaleId, data) => client.put(`/flash-sales/${flashSaleId}`, data),
};

export const adminApi = {
  getDashboard: () => client.get("/admin/dashboard"),
  getFarmers: () => client.get("/admin/farmers"),
  getBuyers: () => client.get("/admin/buyers"),
  verifyUser: (userId) => client.put(`/admin/verify-user/${userId}`),
  removeListing: (cropId) => client.delete(`/admin/crops/${cropId}`),
  getAnalytics: () => client.get("/admin/analytics"),
};
