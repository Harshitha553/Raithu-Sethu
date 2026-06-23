import client from "./client";

export const farmerApi = {
  createCrop: (data) => client.post("/farmer/crops", data),
  getMyCrops: () => client.get("/farmer/crops"),
  updateCrop: (cropId, data) => client.put(`/farmer/crops/${cropId}`, data),
  deleteCrop: (cropId) => client.delete(`/farmer/crops/${cropId}`),

  getPurchaseRequests: () => client.get("/farmer/requests"),
  acceptRequest: (requestId) => client.post(`/farmer/requests/${requestId}/accept`),
  rejectRequest: (requestId) => client.post(`/farmer/requests/${requestId}/reject`),

  getBuyerRequirements: () => client.get("/farmer/buyer-requirements"),
  respondToRequirement: (data) => client.post("/farmer/requirement-response", data),
  getMyResponses: () => client.get("/farmer/my-responses"),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post("/farmer/upload-image", formData);
  },
};