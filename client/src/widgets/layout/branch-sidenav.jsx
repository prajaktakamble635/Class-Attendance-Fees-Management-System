import React, { useState } from "react";
import { isMobile } from "react-device-detect";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    Button,
    IconButton,
    Typography
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { Home, Building2, Users2, FileText, Globe2, Map, Landmark, Shield, Mailbox, SquareChartGantt, MessageSquareWarning, ChevronUp, ChevronDown, Package, UserPlus, User, RotateCcw, Wallet, MapPin, UserCheck } from "lucide-react";


const rolesToMatch = [
    'Credit Manager',
    'Managing Director',
    'Chief Executive Office (CEO)',
    'General Manager (GM)',
    'Deputy General Manager (DGM)',
    'Assistance General Manager (AGM)',
    'Zonal Office'
];

export function BranchSidenav() {
    const navigate = useNavigate();
    const [controller, dispatch] = useMaterialTailwindController();
    const { sidenavColor, sidenavType, openSidenav } = controller;
    const [userRole, setUserRole] = useState('');
    const [openReportSubMenu, setOpenReportSubMenu] = useState(false);
    const [openProductSubMenu, setOpenProductSubMenu] = useState(false);
    React.useEffect(() => {
        if (!isMobile) setOpenSidenav(dispatch, true);
        // getUserRole()
    }, []);

    const getUserRole = async () => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/api/userApi/getUserRole`)
            .then((response) => {
                if (response.status === 200) {
                    setUserRole(response.data.userRole)
                }
            })
            .catch((err) => { });
    }

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
                        className="h-full w-auto rounded-md bg-white object-cover object-center"
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
                        <NavLink to={`/branch/dashboard`}>
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
                                        className="text-base font-bold capitalize"
                                    >
                                        DASHBOARD
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li>
                    {/* 
                    <li key={"customer"} className="text-md">
                        <NavLink to={`/branch/customer`}>
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
                                    <User className="h-5 w-5" />
                                    <Typography
                                        color="inherit"
                                        className="text-base font-bold capitalize"
                                    >
                                        CUSTOMER
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li> */}

                    {/* <li key={"walk in customer"} className="text-md">
                        <NavLink to={`/branch/walkin-customer`}>
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
                                    <User className="h-5 w-5" />
                                    <Typography
                                        color="inherit"
                                        className="text-base font-bold capitalize"
                                    >
                                        WALK-IN CUSTOMER
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li> */}

                    <li key={"leads"} className="text-md">
                        <NavLink to={`/branch/leads`}>
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
                                    <UserPlus className="h-5 w-5" />
                                    <Typography
                                        color="inherit"
                                        className="text-base font-bold capitalize"
                                    >
                                        LEADS
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li>

                    <li key={"recovery"} className="text-md">
                        <NavLink to={`/branch/recovery`}>
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
                                    <Wallet className="h-5 w-5" />
                                    <Typography
                                        color="inherit"
                                        className="text-base font-bold capitalize"
                                    >
                                        RECOVERY
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li>
                    {/* 
                    <li key={"location tracking"} className="text-md">
                        <NavLink to={`/branch/location-tracking`}>
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
                                        className="text-base font-bold capitalize"
                                    >
                                        LOCATION TRACKING
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li> */}


                    {/* <li key={"home"} className="text-md">
                    <NavLink to={`/branch/product-master`}>
                        {({isActive}) => (
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
                                <Home className="h-5 w-5"/>
                                <Typography
                                    color="inherit"
                                    className="text-base font-bold capitalize"
                                >
                                    PRODUCT MASTER
                                </Typography>
                            </Button>
                        )}
                    </NavLink>
                </li> */}
                    {/* <li key={"product-master"} className="text-md">
                        <Button
                            variant="text"
                            onClick={() => setOpenProductSubMenu(!openProductSubMenu)}
                            color={sidenavType === "dark" ? "white" : "blue-gray"}
                            className="flex items-center justify-between gap-2 px-3 py-1 capitalize w-full"
                            fullWidth
                        >
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                <Typography color="inherit" className="text-base font-bold capitalize">
                                    PRODUCT MASTER
                                </Typography>
                            </div>
                            {openProductSubMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {openProductSubMenu && (
                            <ul className="ml-6 mt-1 flex flex-col gap-1">
                                <li>
                                    <NavLink to={`/branch/product/product`}>
                                        {({ isActive }) => (
                                            <Button
                                                variant={isActive ? "gradient" : "text"}
                                                onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                                                color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                                                className="flex items-center gap-2 px-3 py-1 capitalize"
                                                fullWidth
                                            >
                                                <Typography color="inherit" className="text-base font-bold capitalize">
                                                    Product Category
                                                </Typography>
                                            </Button>
                                        )}
                                    </NavLink>
                                </li>

                                <li>
                                    <NavLink to={`/branch/product/sub-product-1`}>
                                        {({ isActive }) => (
                                            <Button
                                                variant={isActive ? "gradient" : "text"}
                                                onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                                                color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                                                className="flex items-center gap-2 px-3 py-1 capitalize"
                                                fullWidth
                                            >
                                                <Typography color="inherit" className="text-base font-bold capitalize">
                                                    Product
                                                </Typography>
                                            </Button>
                                        )}
                                    </NavLink>
                                </li>

                                <li>
                                    <NavLink to={`/branch/product/sub-product-2`}>
                                        {({ isActive }) => (
                                            <Button
                                                variant={isActive ? "gradient" : "text"}
                                                onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                                                color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                                                className="flex items-center gap-2 px-3 py-1 capitalize"
                                                fullWidth
                                            >
                                                <Typography color="inherit" className="text-base font-bold capitalize">
                                                    Sub Product
                                                </Typography>
                                            </Button>
                                        )}
                                    </NavLink>
                                </li>
                            </ul>
                        )}
                    </li> */}

                    {/* <li key={"branch"} className="text-md">
                        <NavLink to={`/branch/branch`}>
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
                                        className="text-base font-bold capitalize"
                                    >
                                        BRANCH
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li> */}

                    <li key={"staff"} className="text-md">
                        <NavLink to={`/branch/staff`}>
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
                                    <User className="h-5 w-5" />
                                    <Typography
                                        color="inherit"
                                        className="text-base font-bold capitalize"
                                    >
                                        STAFF
                                    </Typography>
                                </Button>
                            )}
                        </NavLink>
                    </li>

                    <li key={"dispute leads"} className="text-md">
                        <NavLink to={`/branch/dispute-leads`}>
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
                                    <UserPlus className="h-5 w-5" />
                                    <Typography
                                        color="inherit"
                                        className="text-base font-bold capitalize"
                                    >
                                        DISPUTE LEADS
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
                                  <NavLink to={`/branch/casa-report`}>
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
                                    <NavLink to={`/branch/lead-report`}>
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
                                    <NavLink to={`/branch/sales-report`}>
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
                                    <NavLink to={`/branch/staff-report`}>
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
                                    <NavLink to={`/branch/branch-report`}>
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


                                {/* Location HR Report */}
                                <li>
                                    <NavLink to={`/branch/location-report`}>
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
                                    <NavLink to={`/branch/recovery-report`}>
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
                                    <NavLink to={`/branch/lead-closed-delete-report`}>
                                        {({ isActive }) => (
                                            <Button
                                                variant={isActive ? "gradient" : "text"}
                                                onClick={() => isMobile && setOpenSidenav(dispatch, false)}
                                                color={isActive ? sidenavColor : sidenavType === "dark" ? "white" : "blue-gray"}
                                                className="flex items-center gap-2 px-3 py-1 capitalize"
                                                fullWidth
                                            >
                                                <Typography className="font-medium text-base">Lead Closed & Delted Report</Typography>
                                            </Button>
                                        )}
                                    </NavLink>
                                </li>

                            </ul>
                        )}

                    </li>

                    <li key={"location-tracking"} className="text-md">
                        <NavLink to={`/branch/location-tracking`}>
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
                        <NavLink to={`/branch/staff-login-report`}>
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

BranchSidenav.defaultProps = {};

BranchSidenav.displayName = "/src/widgets/layout/branch-sidenav";

export default BranchSidenav;
