import React, { useState } from "react";
import { isMobile } from "react-device-detect";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  IconButton,
  Typography
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { Home, Building2, Users2, FileText, Globe2, Map, Landmark, Shield, Mailbox, SquareChartGantt, MessageSquareWarning, ChevronUp, ChevronDown, Package, GitBranch, User, UserPlus, BarChart2, Wallet, UserCheck } from "lucide-react";
import { MapPin } from "lucide-react";  // add this import at top

export function HrStaffSidenav() {
  const navigate = useNavigate();
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [openProductSubMenu, setOpenProductSubMenu] = useState(false);
  const [openReportSubMenu, setOpenReportSubMenu] = useState(false);
  React.useEffect(() => {
    if (!isMobile) setOpenSidenav(dispatch, true);
  }, []);

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-blue-gray-800 to-blue-gray-900",
    white: "bg-white shadow-lg",
    transparent: "bg-transparent",
  };
  const { pathname } = useLocation();
  const [layout] = pathname.split("/").filter((el) => el !== "");

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${openSidenav ? "translate-x-0" : "-translate-x-80"
        } animate-fade-in fixed inset-0 z-50 my-1 ml-2 h-[calc(100vh-15px)] w-72 transform rounded-xl transition-transform duration-300`}
    >
      <div
        className={`relative flex flex-row border-b ${sidenavType === "dark" ? "border-white/20" : "border-blue-gray-50"
          }`}
      >
        <Link
          to={`/${layout}/dashboard`}
          className="flex w-10/12 items-center px-2 py-2"
        >
          <img
            src="/logo.jpg"
            className="h-full w-full rounded-md bg-white object-cover"
            alt="logo"
          />
        </Link>
        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className="grid h-16 w-16 max-sm:h-20 max-sm:w-20 self-center rounded-br-none rounded-tl-none"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          {sidenavType === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 max-sm:h-6 max-sm:w-6 text-blue-gray-500"
              viewBox="0 0 24 24"
            >
              <path
                fill="#f2f2f2"
                d="M21 15.61L19.59 17l-5.01-5l5.01-5L21 8.39L17.44 12L21 15.61M3 6h13v2H3V6m0 7v-2h10v2H3m0 5v-2h13v2H3Z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 max-sm:h-6 max-sm:w-6 text-blue-gray-500"
              viewBox="0 0 24 24"
            >
              <path
                fill="#888888"
                d="M21 15.61L19.59 17l-5.01-5l5.01-5L21 8.39L17.44 12L21 15.61M3 6h13v2H3V6m0 7v-2h10v2H3m0 5v-2h13v2H3Z"
              />
            </svg>
          )}
        </IconButton>



      </div>
      <div className="overflow-y-auto max-h-[calc(105vh-150px)] pr-1">
        <ul
          key={"dashboard"}
          className="mb-2 mt-0.5 flex flex-col gap-1 px-1"
        >
          <li key={"home"} className="text-md">
            <NavLink to={`/hrStaff/dashboard`}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "gradient" : "text"}
                  onClick={() => {
                    if (isMobile) setOpenSidenav(dispatch, false);
                  }}
                  color={
                    isActive
                      ? sidenavColor
                      : sidenavType === "dark"
                        ? "white"
                        : "blue-gray"
                  }
                  className="flex items-center gap-2 px-3 py-1 capitalize"
                  fullWidth
                >
                  <Home className="h-5 w-5" />
                  <Typography
                    color="inherit"
                    className="subpixel-antialiased font-bold text-base"
                  >
                    DASHBOARD
                  </Typography>
                </Button>
              )}
            </NavLink>
          </li>

          <li key={"branch"} className="text-md">
            <NavLink to={`/hrStaff/branch`}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "gradient" : "text"}
                  onClick={() => {
                    if (isMobile) setOpenSidenav(dispatch, false);
                  }}
                  color={
                    isActive
                      ? sidenavColor
                      : sidenavType === "dark"
                        ? "white"
                        : "blue-gray"
                  }
                  className="flex items-center gap-2 px-3 py-1 capitalize"
                  fullWidth
                >
                  <Landmark className="h-5 w-5" />
                  <Typography
                    color="inherit"
                    className="subpixel-antialiased font-bold text-base"
                  >
                    BRANCH
                  </Typography>
                </Button>
              )}
            </NavLink>
          </li>



          <li key={"report-master"} className="text-md">
            <Button
              variant="text"
              onClick={() => setOpenReportSubMenu(!openReportSubMenu)}
              color={sidenavType === "dark" ? "white" : "blue-gray"}
              className="flex items-center justify-between gap-2 px-3 py-1 capitalize w-full"
              fullWidth
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <Typography color="inherit" className="subpixel-antialiased font-bold text-base">
                  REPORT MASTER
                </Typography>
              </div>
              {openReportSubMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {openReportSubMenu && (
              <ul className="ml-6 mt-1 flex flex-col gap-1">
                {/* Casa Report */}
                <li>
                  <NavLink to={`/hrStaff/casa-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Casa Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>

                {/* Lead Report */}
                <li>
                  <NavLink to={`/hrStaff/lead-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Lead Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>

                {/* Sales Report */}
                <li>
                  <NavLink to={`/hrStaff/sales-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Sales Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>

                {/* Staff HR Report */}
                <li>
                  <NavLink to={`/hrStaff/staff-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Staff Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>

                {/* Branch HR Report */}
                <li>
                  <NavLink to={`/hrStaff/branch-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Branch Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>

                {/* User HR Report */}
                {/* <li>
                  <NavLink to={`/hrStaff/user-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">User Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li> */}

                {/* Location HR Report */}
                <li>
                  <NavLink to={`/hrStaff/location-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Location Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>

                {/* Recovery HR Report */}
                <li>
                  <NavLink to={`/hrStaff/recovery-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Recovery Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>
                <li>
                  <NavLink to={`/hrStaff/not-login-staff-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Not Login Staff Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>
                <li>
                  <NavLink to={`/hrStaff/lead-closed-delete-report`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                        color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                        className="flex items-center gap-2 px-3 py-1 capitalize"
                        fullWidth
                      >
                        <Typography className="font-medium text-base">Lead Closed & Deleted Report</Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>
              </ul>
            )}

          </li>
          {/* <li key={"report"} className="text-md">
            <NavLink to={`/hrStaff/report`}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "gradient" : "text"}
                  onClick={() => {
                    if (isMobile) setOpenSidenav(dispatch, false);
                  }}
                  color={
                    isActive
                      ? sidenavColor
                      : sidenavType === "dark"
                        ? "white"
                        : "blue-gray"
                  }
                  className="flex items-center gap-2 px-3 py-1 capitalize"
                  fullWidth
                >
                  <BarChart2 className="h-5 w-5" />
                  <Typography
                    color="inherit"
                    className="subpixel-antialiased font-bold text-base"
                  >
                    REPORT
                  </Typography>
                </Button>
              )}
            </NavLink>
          </li> */}
          <li key={"location-tracking"} className="text-md">
            <NavLink to={`/hrStaff/location-tracking`}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "gradient" : "text"}
                  onClick={() => {
                    if (isMobile) setOpenSidenav(dispatch, false);
                  }}
                  color={
                    isActive
                      ? sidenavColor
                      : sidenavType === "dark"
                        ? "white"
                        : "blue-gray"
                  }
                  className="flex items-center gap-2 px-3 py-1 capitalize"
                  fullWidth
                >
                  <MapPin className="h-5 w-5" />
                  <Typography
                    color="inherit"
                    className="subpixel-antialiased font-bold text-base"
                  >
                    LOCATION TRACKING
                  </Typography>
                </Button>
              )}
            </NavLink>
          </li>
          <li key={"staff-login-report"} className="text-md">
            <NavLink to={`/hrStaff/staff-login-report`}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "gradient" : "text"}
                  onClick={() => {
                    if (isMobile) setOpenSidenav(dispatch, false);
                  }}
                  color={
                    isActive
                      ? sidenavColor
                      : sidenavType === "dark"
                        ? "white"
                        : "blue-gray"
                  }
                  className="flex items-center gap-2 px-3 py-1 capitalize"
                  fullWidth
                >
                  <UserCheck className="h-5 w-5" />
                  <Typography
                    color="inherit"
                    className="subpixel-antialiased font-bold text-base"
                  >
                    STAFF LOGIN REPORT
                  </Typography>
                </Button>
              )}
            </NavLink>
          </li>

        </ul>
      </div>
    </aside>
  );
}

HrStaffSidenav.defaultProps = {};

HrStaffSidenav.displayName = "/src/widgets/layout/hrStaff-staff-sidenav";

export default HrStaffSidenav;
