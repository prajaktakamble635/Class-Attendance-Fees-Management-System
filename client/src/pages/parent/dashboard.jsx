import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Chip,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Avatar
} from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  CurrencyRupeeIcon, 
  BookOpenIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserCircleIcon
} from "@heroicons/react/24/solid";

const COLORS = ['#4caf50', '#f44336']; // Green for Paid, Red for Remaining

export default function ParentDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    fetchDashboardDetails();
  }, []);

  const fetchDashboardDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parentApi/dashboard`, {
        withCredentials: true
      });
      setStudents(res.data.students || []);
      if (res.data.students && res.data.students.length > 0) {
        setActiveTab(String(res.data.students[0].id));
      }
    } catch (err) {
      toast.error("Failed to fetch student details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-gray-500 animate-pulse">Loading Dashboard...</div>;
  }

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-transparent">
        <Typography variant="h5" color="blue-gray">No student records found for this account.</Typography>
      </div>
    );
  }

  const renderStudentDashboard = (student) => {
    const pieData = [
      { name: 'Fees Paid', value: Number(student.feesPaid) || 0 },
      { name: 'Fees Remaining', value: Number(student.feesRemaining) || 0 }
    ];

    const marksData = (student.recentMarks || []).slice().reverse().map(mark => ({
      session: mark.tbl_exam_sessions?.name || "Unknown",
      marks: mark.isAbsent === 1 ? 0 : Number(mark.marksScored) || 0
    }));

    return (
      <div className="animate-fade-in flex flex-col gap-6 w-full">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl border-0 overflow-hidden relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>
          
          <CardBody className="flex flex-col md:flex-row items-center gap-6 p-8 relative z-10">
            <div className="flex-shrink-0 bg-white/20 p-2 rounded-full backdrop-blur-sm shadow-inner">
              <Avatar
                src={student.photoPath ? `${import.meta.env.VITE_API_URL}/api/publicApi/downloadDocument?name=${student.photoPath}` : `https://ui-avatars.com/api/?name=${student.firstName}+${student.surname}&background=ffffff&color=1e3a8a`}
                alt="profile"
                size="xxl"
                className="border-4 border-white shadow-xl bg-white"
              />
            </div>
            <div className="text-center md:text-left flex-1">
              <Typography variant="h3" color="white" className="mb-2 drop-shadow-md font-bold">
                {student.firstName} {student.surname}
              </Typography>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start opacity-90 font-medium">
                <span className="flex items-center gap-1.5"><AcademicCapIcon className="h-5 w-5"/> Roll No: {student.rollNo}</span>
                <span className="flex items-center gap-1.5"><BookOpenIcon className="h-5 w-5"/> {student.tbl_boards?.name} / {student.tbl_standards?.name} / {student.tbl_mediums?.name}</span>
                <span className="flex items-center gap-1.5"><CalendarIcon className="h-5 w-5"/> Adm Date: {student.admissionDate || "N/A"}</span>
              </div>
            </div>
            <div>
              <Chip 
                value={student.status === 1 ? "Active" : "Inactive"} 
                color={student.status === 1 ? "green" : "red"} 
                className="w-max shadow-md border border-white/20" 
              />
            </div>
          </CardBody>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                <CurrencyRupeeIcon className="h-8 w-8" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500 uppercase tracking-wider text-[11px]">Total Fees</Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold">₹{student.totalFees}</Typography>
              </div>
            </CardBody>
          </Card>
          <Card className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl shadow-sm">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500 uppercase tracking-wider text-[11px]">Fees Paid</Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold">₹{student.feesPaid}</Typography>
              </div>
            </CardBody>
          </Card>
          <Card className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl shadow-sm">
                <ExclamationCircleIcon className="h-8 w-8" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500 uppercase tracking-wider text-[11px]">Fees Remaining</Typography>
                <Typography variant="h5" color={student.feesRemaining > 0 ? "red" : "blue-gray"} className="font-bold">₹{student.feesRemaining}</Typography>
              </div>
            </CardBody>
          </Card>
          <Card className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shadow-sm">
                <BookOpenIcon className="h-8 w-8" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500 uppercase tracking-wider text-[11px]">Enrolled Subjects</Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold">{student.enrolledSubjects?.length || 0}</Typography>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fees Progress Chart */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 pb-0">
              <Typography variant="h6" color="blue-gray">Fees Overview</Typography>
            </CardHeader>
            <CardBody className="flex flex-col items-center justify-center p-6 h-72">
              {student.totalFees > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `₹${value}`} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                  <CurrencyRupeeIcon className="w-12 h-12 mb-2 opacity-50" />
                  <Typography>No fee data available</Typography>
                </div>
              )}
              {student.totalFees > 0 && (
                <div className="flex gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm"></div>
                    <Typography variant="small" className="text-gray-600 font-medium">Paid</Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm"></div>
                    <Typography variant="small" className="text-gray-600 font-medium">Remaining</Typography>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Academic Performance Table */}
          <Card className="lg:col-span-2 border border-blue-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
            <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 pb-4 border-b border-blue-gray-50 flex justify-between items-center bg-gray-50/50">
              <Typography variant="h6" color="blue-gray">Recent Academic Performance</Typography>
              <Chip size="sm" variant="ghost" value="Recent Exams" color="blue" />
            </CardHeader>
            <CardBody className="p-0 overflow-y-auto flex-1">
              {student.recentMarks && student.recentMarks.length > 0 ? (
                <table className="w-full min-w-max table-auto text-left">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr>
                      <th className="border-b border-blue-gray-100 p-4">
                        <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Exam Session</Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-4">
                        <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Subject</Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-4 text-center">
                        <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Marks / Total</Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-4 text-center">
                        <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Status</Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.recentMarks.slice().map((mark, index) => {
                      const isLast = index === student.recentMarks.length - 1;
                      const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
                      const sessionName = mark.tbl_exam_sessions?.name || "Unknown";
                      const subjectName = mark.tbl_subjects?.name || "Unknown";
                      const isAbsent = mark.isAbsent === 1;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className={classes}>
                            <Typography variant="small" color="blue-gray" className="font-medium">{sessionName}</Typography>
                          </td>
                          <td className={classes}>
                            <Typography variant="small" color="blue-gray" className="font-semibold">{subjectName}</Typography>
                          </td>
                          <td className={`${classes} text-center`}>
                            {isAbsent ? (
                              <Typography variant="small" className="text-red-500 font-bold">AB</Typography>
                            ) : (
                              <Typography variant="small" color="blue-gray" className="font-bold">
                                <span className="text-blue-600">{mark.marksScored || 0}</span> / {mark.outOf || 100}
                              </Typography>
                            )}
                          </td>
                          <td className={`${classes} flex justify-center`}>
                            <Chip 
                              size="sm" 
                              variant="ghost" 
                              value={isAbsent ? "Absent" : "Present"} 
                              color={isAbsent ? "red" : "green"} 
                              className="rounded-full w-20 justify-center" 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 h-full p-12">
                  <AcademicCapIcon className="w-12 h-12 mb-2 opacity-50" />
                  <Typography>No recent exam data available</Typography>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Bottom Detailed Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Installments Table */}
          <Card className="border border-blue-gray-100 shadow-sm overflow-hidden">
            <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 pb-4 border-b border-blue-gray-50 bg-gray-50/50">
              <Typography variant="h6" color="blue-gray">Fee Installments Schedule</Typography>
            </CardHeader>
            <CardBody className="p-0 overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    <th className="border-b border-blue-gray-100 bg-white p-4">
                      <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Inst. No</Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-white p-4">
                      <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Due Date</Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-white p-4">
                      <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Amount</Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-white p-4 text-center">
                      <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] text-gray-500 tracking-wider">Status</Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(student.installments || []).map((inst, index) => {
                    const isLast = index === (student.installments?.length || 0) - 1;
                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
                    let statusColor = "amber";
                    let statusText = "Pending";
                    if (inst.paidStatus === 2) {
                      statusColor = "green";
                      statusText = "Paid";
                    } else if (inst.paidStatus === 3) {
                      statusColor = "red";
                      statusText = "Overdue";
                    }
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-medium">#{inst.installmentNo || index + 1}</Typography>
                        </td>
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-normal">{inst.dueDate || "--"}</Typography>
                        </td>
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-semibold text-gray-800">₹{inst.amount}</Typography>
                        </td>
                        <td className={`${classes} flex justify-center`}>
                          <Chip size="sm" variant="ghost" value={statusText} color={statusColor} className="rounded-full w-24 justify-center" />
                        </td>
                      </tr>
                    );
                  })}
                  {(!student.installments || student.installments.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <Typography variant="small" className="text-gray-400">No installments found for this student.</Typography>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Enrolled Subjects */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 pb-4 border-b border-blue-gray-50 bg-gray-50/50">
              <Typography variant="h6" color="blue-gray">Enrolled Subjects</Typography>
            </CardHeader>
            <CardBody className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(student.enrolledSubjects || []).map((sub, i) => (
                  <div key={i} className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-default">
                    <BookOpenIcon className="h-8 w-8 text-blue-500 mb-3" />
                    <Typography variant="small" color="blue-gray" className="font-bold line-clamp-2">
                      {sub.name}
                    </Typography>
                    {sub.code && (
                      <Typography variant="xs" className="text-blue-500 mt-1 text-[10px] uppercase font-bold tracking-widest bg-blue-100 px-2 py-0.5 rounded-full">
                        {sub.code}
                      </Typography>
                    )}
                  </div>
                ))}
                {(!student.enrolledSubjects || student.enrolledSubjects.length === 0) && (
                  <div className="col-span-full py-12 flex flex-col items-center text-center">
                    <BookOpenIcon className="w-12 h-12 text-gray-300 mb-3" />
                    <Typography variant="small" className="text-gray-400">No subjects enrolled</Typography>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 px-4 md:px-8 min-h-screen pb-10">
      <div className="mb-8">
        <Typography variant="h3" color="blue-gray" className="font-bold">Parent Portal</Typography>
        <Typography variant="small" color="gray" className="font-normal mt-1 max-w-2xl text-base">
          Welcome to the Gurukul dashboard. Here is a comprehensive overview of your children's academic performance and fee details.
        </Typography>
      </div>

      {students.length > 1 ? (
        <Card className="shadow-none border-0 bg-transparent mb-8">
          <CardBody className="p-0">
            <Tabs value={activeTab}>
              <TabsHeader 
                className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-full md:w-max mx-auto"
                indicatorProps={{
                  className: "bg-blue-600 rounded-lg shadow-md",
                }}
              >
                {students.map(({ id, firstName, surname, photoPath }) => (
                  <Tab 
                    key={String(id)} 
                    value={String(id)} 
                    onClick={() => setActiveTab(String(id))}
                    className={`px-8 py-2.5 transition-colors duration-300 ${activeTab === String(id) ? 'text-white z-20' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={photoPath ? `${import.meta.env.VITE_API_URL}/api/publicApi/downloadDocument?name=${photoPath}` : `https://ui-avatars.com/api/?name=${firstName}+${surname}&background=ffffff&color=1e3a8a`}
                        alt="profile"
                        className="w-6 h-6 border border-gray-200"
                      />
                      <span className="font-semibold">{firstName} {surname}</span>
                    </div>
                  </Tab>
                ))}
              </TabsHeader>
              <TabsBody 
                className="mt-8"
                animate={{
                  initial: { y: 20, opacity: 0 },
                  mount: { y: 0, opacity: 1 },
                  unmount: { y: 20, opacity: 0 },
                }}
              >
                {students.map((student) => (
                  <TabPanel key={String(student.id)} value={String(student.id)} className="p-0">
                    {renderStudentDashboard(student)}
                  </TabPanel>
                ))}
              </TabsBody>
            </Tabs>
          </CardBody>
        </Card>
      ) : (
        students.length === 1 && renderStudentDashboard(students[0])
      )}
    </div>
  );
}
