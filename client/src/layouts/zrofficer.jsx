import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
    DashboardNavbar,
    Configurator,
    Footer,
} from "@/widgets/layout";
import axios from "axios";
import {useMaterialTailwindController} from "@/context/index.jsx";
import sroRoutes from "@/sro-routes-links";
import zrofficerRoutes from "@/zrofficer-routes-links";
import ZrofficerSidenav from "@/widgets/layout/zrofficer-sidenav";

export function Zrofficer() {
    const navigate = useNavigate();
    const [controller, dispatch] = useMaterialTailwindController();
    const { openSidenav } = controller;
  React.useEffect(() => {
    let intervalId;
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/checkAdminToken`)
      .then((response) => {
        if (response.status === 200) {
          const userType = response.data.userType;
          if (userType === 'HR') {
            navigate('/hr/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'STAFF') {
            navigate('/staff/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'HOD') {
            navigate('/hod/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'ZONAL') {
            navigate('/zonal/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'DIVISION') {
            navigate('/division/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'RHOD') {
            navigate('/rhod/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'BRANCH') {
            navigate('/branch/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'SRO') {
            navigate('/sro/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'AGENT') {
            navigate('/agent/dashboard', { replace: true });
            window.location.reload();
            // Call once immediately
          } else if (userType === 'ZROFFICER') {
            // navigate('/zrofficer/dashboard', { replace: true });
            // window.location.reload();
            if (window.AndroidBridge?.sendLocationToServer) {
              window.AndroidBridge.sendLocationToServer();
            }
            // Set up interval every 5 minutes (300,000 ms)
            intervalId = setInterval(() => {
              if (window.AndroidBridge?.sendLocationToServer) {
                window.AndroidBridge.sendLocationToServer();
              }
            }, 5 * 60 * 1000);
          } else if (userType === 'DROFFICER') {
            navigate('/drofficer/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'HODSTAFF') {
            navigate('/hodStaff/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'ZSTAFF') {
            navigate('/zonalStaff/dashboard', { replace: true });
            window.location.reload();
          } else if (userType === 'DSTAFF') {
            navigate('/divisionalStaff/dashboard', { replace: true });
            window.location.reload();
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
            <ZrofficerSidenav />
            <div
                className={`p-2 pl-2 xl:pl-4 ${
                    openSidenav
                        ? "xl:ml-72"
                        : ""
                }`}>
                <DashboardNavbar />
                <Configurator />
                <Routes>
                    {zrofficerRoutes.map(
                        ({ layout, pages }) =>
                            layout === "zrofficer" &&
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

Zrofficer.displayName = "/src/layout/zrofficer";

export default Zrofficer;
