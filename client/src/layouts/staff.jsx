import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  AdminSidenav,
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import axios from "axios";
import adminRoutesLinks from "@/admin-routes-links.jsx";
import { useMaterialTailwindController } from "@/context/index.jsx";
import StaffSidenav from "@/widgets/layout/staff-sidenav";
import staffRoutes from "@/staff-routes-links";

export function Staff() {
  const navigate = useNavigate();
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav } = controller;

  React.useEffect(() => {
    document.title = "Gurukul Academy Test Series | Login";
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/checkAdminToken`)
      .then((response) => {
        if (response.status === 200) {
          if (![1, 2].includes(response.data.userRole)) {
            navigate('/auth/sign-in', { replace: true });
          }
        } else {
          navigate('/auth/sign-in', { replace: true });
        }
      })
      .catch((errors) => {
        navigate('/auth/sign-in', { replace: true });
        setLoading(false);
      });
  }, []);


  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gradient-to-br from-blue-gray-500 to-blue-gray-700">
      <img
        alt='Login Background'
        className='fixed inset-0 z-0 h-full w-full object-cover brightness-50 blur'
        src='/img/books.webp'
      />
      <StaffSidenav />
      <div
        className={`p-2 pl-2 xl:pl-4 ${openSidenav
            ? "xl:ml-72"
            : ""
          }`}>
        <DashboardNavbar />
        <Configurator />
        <Routes>
          {staffRoutes.map(
            ({ layout, pages }) =>
              layout === "batchCoord" &&
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

Staff.displayName = "/src/layout/staff";

export default Staff;
