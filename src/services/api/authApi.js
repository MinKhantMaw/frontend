import { apiClient, requestSanctumCsrfCookie } from "./client";

function pickFirstString(values = []) {
  return (
    values.find(
      (value) => typeof value === "string" && value.trim().length > 0,
    ) || null
  );
}

export async function loginRequest(credentials) {
  await requestSanctumCsrfCookie();
  const { data } = await apiClient.post("/auth/login", credentials);

  const token = pickFirstString([
    data?.access_token,
    data?.token,
    data?.accessToken,
    data?.data?.access_token,
    data?.data?.token,
    data?.data?.accessToken,
    data?.result?.access_token,
    data?.result?.token,
    data?.result?.accessToken,
  ]);

  const user = data?.user || data?.data?.user || data?.result?.user || null;
  const refreshToken = pickFirstString([
    data?.refresh_token,
    data?.refreshToken,
    data?.data?.refresh_token,
    data?.data?.refreshToken,
    data?.result?.refresh_token,
    data?.result?.refreshToken,
  ]);

  return {
    token,
    refreshToken,
    user,
  };
}

export async function logoutRequest() {
  return apiClient.post("/auth/logout");
}

export async function meRequest() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}
