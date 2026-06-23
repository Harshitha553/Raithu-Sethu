import client from "./client";

export const buyerApi = {
  getMarketplaceCrops: (params) => client.get("/marketplace/crops", { params }),
  getCropDetails: (cropId) => client.get(`/marketplace/crops/${cropId}`),
  requestCrop: (data) => client.post("/buyer/request-crop", data),
  getMyRequests: () => client.get("/buyer/requests"),

  createRequirement: (data) => client.post("/buyer/requirements", data),
  getMyRequirements: () => client.get("/buyer/requirements"),
  updateRequirement: (requirementId, data) =>
    client.put(`/buyer/requirements/${requirementId}`, data),
  deleteRequirement: (requirementId) =>
    client.delete(`/buyer/requirements/${requirementId}`),
  getRequirementResponses: () => client.get("/buyer/requirements/responses"),
  acceptRequirementResponse: (responseId) =>
    client.post(`/buyer/requirements/accept-response/${responseId}`),
};
