import { setOpenSidenav, useMaterialTailwindController } from "@/context";
import {
  Button,
  IconButton,
  Typography
} from "@material-tailwind/react";
import {
  Banknote,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCheck,
  FileText,
  Home,
  IdCard,
  UserPlus,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { isMobile } from "react-device-detect";
import { Link, NavLink, useLocation } from "react-router-dom";

export function CounsellorSidenav() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    exam: true,
    reports: true,
  });

  React.useEffect(() => {
    if (!isMobile) setOpenSidenav(dispatch, true);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-900 via-blue-gray-900 to-gray-900",
    white: "bg-white shadow-2xl",
    transparent: "bg-white/95 backdrop-blur-md shadow-xl",
  };

  const { pathname } = useLocation();
  const [layout] = pathname.split("/").filter((el) => el !== "");

  const handleLinkClick = () => {
    if (isMobile) setOpenSidenav(dispatch, false);
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <li className="group">
      <NavLink to={to}>
        {({ isActive }) => (
          <Button
            variant={isActive ? "gradient" : "text"}
            onClick={handleLinkClick}
            color={
              isActive
                ? sidenavColor
                : sidenavType === "dark"
                  ? "white"
                  : "blue-gray"
            }
            className={`
              flex items-center gap-3 px-4 py-2.5 capitalize
              transition-all duration-200 ease-in-out
              ${isActive ? "shadow-md" : "hover:bg-blue-gray-50/10"}
              ${!isActive && "group-hover:translate-x-1"}
            `}
            fullWidth
          >
            <Icon className={`h-5 w-5 ${isActive ? "animate-pulse" : ""}`} />
            <Typography
              color="inherit"
              className="text-sm font-semibold tracking-wide"
            >
              {label}
            </Typography>
          </Button>
        )}
      </NavLink>
    </li>
  );

  const SectionHeader = ({ title, sectionKey }) => (
    <div
      className={`
        mb-1 mt-3 flex cursor-pointer items-center justify-between px-4 py-2
        ${sidenavType === "dark" ? "text-blue-gray-300" : "text-blue-gray-600"}
        rounded-lg transition-colors duration-200 hover:bg-blue-gray-50/5
      `}
      onClick={() => toggleSection(sectionKey)}
    >
      <Typography
        variant="small"
        className="text-xs font-bold uppercase tracking-wider"
      >
        {title}
      </Typography>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && openSidenav && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpenSidenav(dispatch, false)}
        />
      )}

      {/* Sidenav */}
      <aside
        className={`
          ${sidenavTypes[sidenavType]}
          ${openSidenav ? "translate-x-0" : "-translate-x-80"}
          fixed inset-0 z-50 my-1 ml-2 flex h-[calc(100vh-8px)]
          w-72 transform flex-col rounded-xl transition-all
          duration-300
          ease-in-out lg:translate-x-0
        `}
      >
        {/* Header */}
        <div
          className={`
            relative flex items-center justify-between border-b p-1
            ${sidenavType === "dark"
              ? "border-white/10"
              : "border-blue-gray-100"
            }
          `}
        >
          <Link
            to={`/${layout}/dashboard`}
            className="flex w-full items-center justify-center px-1 py-2"
          >
            <img
              src="/logo-main.webp"
              className="h-auto w-3/4 max-w-[150px] object-contain drop-shadow-lg transition-transform duration-300 hover:scale-105 lg:max-w-[180px]"
              alt="Gurukul Logo"
            />
          </Link>

          {/* Close button - only visible on mobile */}
          <IconButton
            variant="text"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
            size="sm"
            ripple={false}
            className="ml-2 rounded-lg hover:bg-blue-gray-50/10 lg:hidden"
            onClick={() => setOpenSidenav(dispatch, false)}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Navigation Menu */}
        <div className="scrollbar-thin scrollbar-thumb-blue-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
          {/* Main Section */}
          <nav>

            <SectionHeader title="Admission & Fees" sectionKey="main" />
            {expandedSections.main && (
              <ul className="mb-2 flex flex-col gap-0.5">
                <NavItem
                  to="/counsellor/add-admission"
                  icon={UserPlus}
                  label="Admission"
                />
                <NavItem to="/counsellor/view-all-student-fees" icon={Banknote} label="Fees" />
              </ul>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div
          className={`
            border-t p-4
            ${sidenavType === "dark"
              ? "border-white/10"
              : "border-blue-gray-100"
            }
          `}
        >
          <Typography
            variant="small"
            className={`
              text-center text-xs
              ${sidenavType === "dark"
                ? "text-blue-gray-400"
                : "text-blue-gray-600"
              }
            `}
          >
            {new Date().getFullYear()} Gurukul Academy
          </Typography>
        </div>
      </aside>
    </>
  );
}

CounsellorSidenav.defaultProps = {};

CounsellorSidenav.displayName = "/src/widgets/layout/counsellor-sidenav";

export default CounsellorSidenav;
