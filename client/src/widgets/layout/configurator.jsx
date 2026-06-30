import {
  setOpenConfigurator,
  setSidenavColor,
  setSidenavType,
  useMaterialTailwindController
} from "@/context";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography
} from "@material-tailwind/react";
import React from "react";

export function Configurator() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openConfigurator, sidenavColor, sidenavType, fixedNavbar } =
    controller;

  const sidenavColors = {
    blue: "from-blue-400 to-blue-600",
    "blue-gray": "from-blue-gray-800 to-blue-gray-900",
    green: "from-green-400 to-green-600",
    orange: "from-orange-800 to-orange-900",
    red: "from-red-800 to-red-900",
    pink: "from-pink-400 to-pink-600",
  };

  React.useEffect(() => {
    setSidenavColor(dispatch, 'orange');
    setSidenavType(dispatch, "white");
    localStorage.theme = 'light';
    document.documentElement.classList.remove('dark');
    const root = document.documentElement;
    root.style.setProperty('--scrollbar-track-color', '#f1f1f1');
  },[])
 

  return (
    <aside
      className={`fixed top-0 right-0 z-50 h-screen w-96 bg-white dark:bg-gradient-to-br from-blue-gray-700 to-blue-gray-800 px-2.5 shadow-lg transition-transform duration-300 ${
        openConfigurator ? "translate-x-0" : "translate-x-96"
      }`}
    >
      <div className="flex items-start justify-between px-6 pt-8 pb-6">
        <div>
          <Typography variant="h5"  className="text-gray-800 dark:text-white">
            Theme Configurator
          </Typography>
          <Typography className="font-normal text-blue-gray-600 dark:text-white">
            See our theme options.
          </Typography>
        </div>
        <IconButton
          variant="text"
          // color="blue-gray"
            className="text-blue-gray-600 dark:text-white"
          onClick={() => setOpenConfigurator(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="py-4 px-6">
        <div className="mb-12">
          <Typography variant="h6" className="text-blue-gray-600 dark:text-white">
            Sidenav Colors
          </Typography>
          <div className="mt-3 flex items-center gap-2">
            {Object.keys(sidenavColors).map((color) => (
              <span
                key={color}
                className={`h-6 w-6 cursor-pointer rounded-full border bg-gradient-to-br transition-transform hover:scale-105 ${
                  sidenavColors[color]
                } ${
                  sidenavColor === color ? "border-black" : "border-transparent"
                }`}
                onClick={() => setSidenavColor(dispatch, color)}
              />
            ))}
          </div>
        </div>
        <div className="mb-12">
          <Typography variant="h6" className="text-blue-gray-600 dark:text-white">
            Sidenav Types
          </Typography>
          <div className="mt-3 flex items-center gap-2">
            <Button
                size="sm"
              variant={sidenavType === "dark" ? "gradient" : "outlined"}
              onClick={() => {
                setSidenavType(dispatch, "dark");
              }}
            >
              Dark
            </Button>
            <Button
                size="sm"
              variant={sidenavType === "white" ? "gradient" : "outlined"}
              onClick={() => {
                setSidenavType(dispatch, "white");
              } }
            >
              White
            </Button>
          </div>
        </div>
        <div className="mb-12">
          <Typography variant="h6" className="text-blue-gray-600 dark:text-white">
            Theme
          </Typography>
          <div className="mt-3 flex items-center gap-2">
            <Button
                size="sm"
                // variant={localStorage.theme === "dark" ? "gradient" : "outlined"}
                onClick={() => {
                  // setSidenavType(dispatch, "dark");
                  setSidenavColor(dispatch, 'blue-gray');
                  localStorage.theme = 'dark';
                  document.documentElement.classList.add('dark');
                  const root = document.documentElement;
                  root.style.setProperty('--scrollbar-track-color', '#37474f');
                }}
            >
              Dark
            </Button>
            <Button
                size="sm"
                // variant={localStorage.theme === "light" ? "gradient" : "outlined"}
                onClick={() => {
                  // setSidenavType(dispatch, "white");
                  setSidenavColor(dispatch, 'orange');
                  localStorage.theme = 'light';
                  document.documentElement.classList.remove('dark');
                  const root = document.documentElement;
                  root.style.setProperty('--scrollbar-track-color', '#f1f1f1');
                } }
            >
              White
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

Configurator.displayName = "/src/widgets/layout/configurator.jsx";

export default Configurator;
