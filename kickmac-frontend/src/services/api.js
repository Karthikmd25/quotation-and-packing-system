import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const managerToken = localStorage.getItem("managerToken");

    if (managerToken) {
      config.headers.Authorization = `Bearer ${managerToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "Manager authentication failed:",
        error.response?.data?.message
      );

      localStorage.removeItem("managerToken");
      localStorage.removeItem("manager");

      // Only redirect if the user is actually on a protected manager/packing page
      const protectedPaths = [
        "/manager",
        "/packing",
      ];

      const isProtectedPage = protectedPaths.some((path) =>
        window.location.pathname.startsWith(path)
      );

      if (isProtectedPage) {
        window.location.href = "/manager/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;