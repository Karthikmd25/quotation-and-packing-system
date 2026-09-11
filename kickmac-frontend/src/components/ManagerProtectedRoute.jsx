import { Navigate, Outlet } from "react-router-dom";

function ManagerProtectedRoute() {
  const token = localStorage.getItem("managerToken");
  const managerData = localStorage.getItem("manager");

  if (!token || !managerData) {
    return <Navigate to="/manager/login" replace />;
  }

  try {
    const manager = JSON.parse(managerData);

    if (manager.role !== "MANAGER") {
      localStorage.removeItem("managerToken");
      localStorage.removeItem("manager");

      return <Navigate to="/manager/login" replace />;
    }
  } catch (error) {
    console.error("Invalid manager session:", error);

    localStorage.removeItem("managerToken");
    localStorage.removeItem("manager");

    return <Navigate to="/manager/login" replace />;
  }

  return <Outlet />;
}

export default ManagerProtectedRoute;