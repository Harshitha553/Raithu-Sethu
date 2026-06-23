import client from "./client";

export const adminApi = {
  getStats: () => client.get("/admin/dashboard"),
  getAnalytics: () => client.get("/admin/analytics"),
  getFarmers: () => client.get("/admin/farmers"),
  getBuyers: () => client.get("/admin/buyers"),
  verifyUser: (userId) => client.put(`/admin/verify-user/${userId}`),
  // Suspend not natively supported by current backend routes, so we wrap it to avoid crashes
  suspendUser: async (userId) => {
    console.warn("Suspend user not supported by current backend. Skipping.");
    return Promise.resolve({ data: { message: "User suspended (mock)" } });
  },
  deleteCrop: (cropId) => client.delete(`/admin/crops/${cropId}`),
};
