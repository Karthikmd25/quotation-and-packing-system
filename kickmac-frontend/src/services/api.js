import axios from "axios";

const api = axios.create({
  baseURL: "https://quotation-and-packing-system.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const managerToken = localStorage.getItem("managerToken");
    const packingToken = localStorage.getItem("packingToken");

    // Packing pages should use Packing token
    const isPackingPage =
      window.location.pathname.startsWith("/packing");

    if (isPackingPage && packingToken) {
      config.headers.Authorization = `Bearer ${packingToken}`;
    } else if (managerToken) {
      config.headers.Authorization = `Bearer ${managerToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const isPackingPage =
        window.location.pathname.startsWith("/packing");

      // =================================================
      // PACKING AUTHENTICATION FAILED
      // =================================================

      if (isPackingPage) {
        console.warn(
          "Packing authentication failed:",
          error.response?.data?.message
        );

        localStorage.removeItem("packingToken");
        localStorage.removeItem("packingUser");

        window.location.href = "/packing/login";

        return Promise.reject(error);
      }

      // =================================================
      // MANAGER AUTHENTICATION FAILED
      // =================================================

      console.warn(
        "Manager authentication failed:",
        error.response?.data?.message
      );

      localStorage.removeItem("managerToken");
      localStorage.removeItem("manager");

      const protectedPaths = [
        "/manager",
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