import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function useNavigation() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const login = (dashboardPath) => {
    navigate(dashboardPath);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const goToLogin = () => {
    navigate("/login");
  };

  const goToRegister = () => {
    navigate("/register");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const goToSubscription = () => {
    navigate("/subscription");
  };

  return {
    login,
    logout: handleLogout,
    goToLogin,
    goToRegister,
    goToDashboard,
    goToProfile,
    goToSubscription,
    navigate
  };
}
