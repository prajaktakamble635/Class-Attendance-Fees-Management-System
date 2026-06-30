import { useMaterialTailwindController } from "@/context";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  BarChart3,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  PenTool,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RenewalDialog from '@/components/RenewalDialog';
import axios from "axios";


export function Dashboard() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [renewalData, setRenewalData] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    checkRenewalDate();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkRenewalDate = async () => {
    try {
      // Check if dialog was already shown in this session
      const dialogShown = sessionStorage.getItem('renewalDialogShown');
      console.log("Renewal Dialog Shown Flag:", dialogShown);
      if (dialogShown === 'true') {
        return;
      }

      // Fetch renewal date from API
      const response = await axios.get(`https://stn-projects-api.softthenext.com/api/publicApi/getClientDetails?clientId=${32780355}`);

      if (response.status === 200 && response.data.data) {
        const { projectName, developmentStartDate, renewalDate } = response.data.data;

        console.log("Renewal Date from API:", renewalDate);

        // Validate renewal date exists
        if (!renewalDate) {
          console.log("No renewal date provided");
          return;
        }

        // Calculate days remaining
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day

        const renewal = new Date(renewalDate);
        renewal.setHours(0, 0, 0, 0); // Reset time to start of day

        // Check if date is valid
        if (isNaN(renewal.getTime())) {
          console.error("Invalid renewal date:", renewalDate);
          return;
        }

        const diffTime = renewal - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log("Days remaining for renewal:", daysRemaining);

        // Show dialog if renewal is within 15 days
        if (daysRemaining <= 15) {
          setRenewalData({
            projectName: projectName || 'N/A',
            startDate: developmentStartDate || null,
            renewalDate: renewalDate
          });
          setRenewalDialogOpen(true);
          // Mark as shown in this session
          sessionStorage.setItem('renewalDialogShown', 'true');
        }
      }
    } catch (error) {
      console.error("Error checking renewal date", error);
    }
  };

  const handleCloseRenewalDialog = () => {
    setRenewalDialogOpen(false);
  };

  // Dashboard shortcuts configuration
  const shortcuts = [
    {
      title: "Add Admission",
      description: "Register new students",
      icon: UserPlus,
      link: "/superAdmin/add-admission",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Add Exam Time Table",
      description: "Create new exam timetable",
      icon: FileText,
      link: "/superAdmin/exam",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Hall Ticket",
      description: "Generate hall tickets",
      icon: CreditCard,
      link: "/superAdmin/hall-ticket",
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Attendance",
      description: "Mark student attendance",
      icon: UserCheck,
      link: "/superAdmin/attendance-sheet",
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Marks Entry",
      description: "Enter examination marks",
      icon: PenTool,
      link: "/superAdmin/marks-entry",
      gradient: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
    },
    {
      title: "Report Card",
      description: "Generate report cards",
      icon: GraduationCap,
      link: "/superAdmin/report-card",
      gradient: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Reports: Marks",
      description: "View marks reports",
      icon: BarChart3,
      link: "/superAdmin/reports",
      gradient: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      title: "Student List",
      description: "View all students",
      icon: Users,
      link: "/superAdmin/student-list",
      gradient: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    // {
    //   title: "Toppers",
    //   description: "View top performers",
    //   icon: Trophy,
    //   link: "/superAdmin/toppers",
    //   gradient: "from-yellow-500 to-yellow-600",
    //   bgColor: "bg-yellow-50",
    //   iconColor: "text-yellow-600",
    // },
  ];

  return (
    <>
      <RenewalDialog
        open={renewalDialogOpen}
        onClose={handleCloseRenewalDialog}
        renewalData={renewalData}
      />
      <div className="from-slate-50 min-h-screen bg-gradient-to-br via-blue-50 to-indigo-50 p-6">
        {/* Header Section */}
        <div
          className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl"
          data-aos="fade-down"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <Typography className="mb-2 text-xl font-bold text-white lg:text-4xl">
                Welcome to Gurukul Academy
              </Typography>
              <Typography className="text-lg font-medium text-blue-100">
                Super Admin Portal
              </Typography>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm">
              <Clock className="h-6 w-6 text-white" />
              <div className="text-right">
                <Typography className="text-xs font-medium text-white/90 md:text-sm">
                  {currentDateTime.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
                <Typography className="text-xl font-bold text-white">
                  {currentDateTime.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6" data-aos="fade-up">
          <Typography className="mb-4 text-2xl font-bold text-white">
            Quick Actions
          </Typography>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
        </div>

        {/* Shortcuts Grid */}
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          {shortcuts.map((shortcut, index) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={index}
                to={shortcut.link}
                className="group"
                data-aos="zoom-in"
                data-aos-delay={index * 50}
              >
                <Card className="h-full cursor-pointer overflow-hidden border-2 border-transparent transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-2xl">
                  <CardBody className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={`rounded-xl ${shortcut.bgColor} p-3 transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className={`h-8 w-8 ${shortcut.iconColor}`} />
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full bg-gradient-to-r ${shortcut.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                      ></div>
                    </div>
                    <Typography className="mb-2 text-xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
                      {shortcut.title}
                    </Typography>
                    <Typography className="text-sm text-gray-600">
                      {shortcut.description}
                    </Typography>
                    <div
                      className={`mt-4 h-1 w-0 rounded-full bg-gradient-to-r ${shortcut.gradient} transition-all duration-300 group-hover:w-full`}
                    ></div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer Stats Section */}
        {/* <div
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <Typography className="text-3xl font-bold">150+</Typography>
                <Typography className="text-sm font-medium text-blue-100">
                  Total Students
                </Typography>
              </div>
              <Users className="h-12 w-12 opacity-50" />
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <Typography className="text-3xl font-bold">25+</Typography>
                <Typography className="text-sm font-medium text-purple-100">
                  Active Exams
                </Typography>
              </div>
              <FileText className="h-12 w-12 opacity-50" />
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <Typography className="text-3xl font-bold">95%</Typography>
                <Typography className="text-sm font-medium text-green-100">
                  Attendance Rate
                </Typography>
              </div>
              <UserCheck className="h-12 w-12 opacity-50" />
            </CardBody>
          </Card>
        </div> */}
      </div>
    </>
  );
}

export default Dashboard;
