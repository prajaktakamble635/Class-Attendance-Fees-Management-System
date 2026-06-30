import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import ParentSidenav from "@/widgets/layout/parent-sidenav.jsx";
import axios from "axios";
import parentRoutesLinks from "@/parent-routes-links.jsx";
import { useMaterialTailwindController } from "@/context/index.jsx";

export function Parent() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { openSidenav } = controller;
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    document.title = "Gurukul Academy Test Series | Parent Portal";
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/checkAdminToken`)
      .then((response) => {
        if (response.status === 200) {
          if (response.data.userRole === 5) {
            setLoading(false);
          }
          else {
            navigate('/auth/sign-in', { replace: true });
          }
        }
      })
      .catch((errors) => {
        navigate('/auth/sign-in', { replace: true });
      });
  }, [navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gradient-to-br from-blue-gray-500 to-blue-gray-700">
      <img
        alt='Login Background'
        className='fixed inset-0 z-0 h-full w-full object-cover brightness-50 blur'
        src='/img/books.webp'
      />
      <ParentSidenav />
      <div
        className={`p-2 pl-2 xl:pl-4 ${openSidenav
            ? "xl:ml-72"
            : ""
          }`}>
        <DashboardNavbar />
        <Configurator />
        <React.Suspense fallback={<div className="flex justify-center items-center h-[50vh] text-white">Loading...</div>}>
          <Routes>
            {parentRoutesLinks.map(
              ({ layout, pages }) =>
                layout === "parent" &&
                pages.map(({ path, element }) => (
                  <Route key={path} exact path={path} element={element} />
                ))
            )}
          </Routes>
        </React.Suspense>
        <div className="text-blue-gray-700 dark:text-gray-200">
          <Footer />
        </div>
      </div>
    </div>
  );
}

Parent.displayName = "/src/layout/parent";

export default Parent;
