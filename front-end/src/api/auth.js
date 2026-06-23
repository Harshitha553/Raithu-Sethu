import client from "./client";

export const authApi = {
  farmerRegister: (data) => client.post("/auth/farmer/register", data),
  farmerLogin: (data) => client.post("/auth/farmer/login", data),
  buyerRegister: (data) => client.post("/auth/buyer/register", data),
  buyerLogin: (data) => client.post("/auth/buyer/login", data),
  forgotPassword: (email) => client.post("/auth/forgot-password", { email }),
  resetPassword: (token, new_password) =>
    client.post("/auth/reset-password", { token, new_password }),
};
