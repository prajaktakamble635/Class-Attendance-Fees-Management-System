import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import axios from "axios";
import { useMaterialTailwindController } from "@/context/index.jsx";
import HodRoutesLinks from "@/hod-routes-links.jsx";
import HodSidenav from "@/widgets/layout/hod-sidenav";

export function Hod() {
  const navigate = useNavigate();
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav } = controller;
  React.useEffect(() => {
    let intervalId;
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/checkAdminToken`)
      .then((response) => {
        if (response.status === 200) {
          const userType = response.data.userRole;
          if (![1, 4].includes(userType)) {
            navigate('/auth/sign-in', { replace: true });
          }
        }
      })
      .catch((err) => {
        navigate('/auth/sign-in', { replace: true });
      });
    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gradient-to-br from-blue-gray-500 to-blue-gray-700">
      <img
        alt='Login Background'
        className='fixed inset-0 z-0 h-full w-full object-cover brightness-50 blur'
        src='/img/dashboard.webp'
      />
      <HodSidenav />
      <div
        className={`p-2 pl-2 xl:pl-4 ${openSidenav
            ? "xl:ml-72"
            : ""
          }`}>
        <DashboardNavbar />
        <Configurator />
        <Routes>
          {HodRoutesLinks.map(
            ({ layout, pages }) =>
              layout === "hod" &&
              pages.map(({ path, element }) => (
                <Route exact path={path} element={element} />
              ))
          )}
        </Routes>
        <div className="text-blue-gray-700 dark:text-gray-200">
          <Footer />
        </div>
      </div>
    </div>
  );
}

Hod.displayName = "/src/layout/hod.jsx";

export default Hod;
