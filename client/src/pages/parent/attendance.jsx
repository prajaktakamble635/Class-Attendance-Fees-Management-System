import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Select,
  Option,
  Input,
  IconButton,
  Button
} from "@material-tailwind/react";
import { FingerPrintIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import axios from "axios";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { ShowDateTime } from "@/widgets/components";

export function ParentAttendance() {
  const [students, setStudents] = useState([]);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    // Fetch students list from the dashboard API first, to know which students this parent has
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parentApi/dashboard`, {
          withCredentials: true
        });
        if (res.data.students && res.data.students.length > 0) {
          setStudents(res.data.students);
          setActiveStudentId(String(res.data.students[0].id));
        } else {
          setLoading(false);
        }
      } catch (err) {
        toast.error("Failed to fetch students");
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!activeStudentId) return;

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parentApi/attendance/${activeStudentId}`, {
          withCredentials: true
        });
        setAttendanceRecords(res.data.attendance || []);
        setCurrentPage(1); // Reset page on student change
      } catch (err) {
        toast.error("Failed to load attendance records");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [activeStudentId]);

  const getStatusIcon = (status) => {
    if (status === 'Present') return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    if (status === 'Absent') return <XCircleIcon className="h-6 w-6 text-red-500" />;
    return <ClockIcon className="h-6 w-6 text-yellow-500" />;
  };

  const getStatusColor = (status) => {
    if (status === 'Present') return "bg-green-50 text-green-700 border-green-200";
    if (status === 'Absent') return "bg-red-50 text-red-700 border-red-200";
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "--:--";
    // Check if it's an ISO string or just HH:mm
    if (timeString.includes('T') || timeString.includes('Z')) {
      const date = new Date(timeString);
      const h = date.getHours();
      const m = date.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    }
    const [hour, minute] = timeString.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <Typography className="text-blue-gray-500 font-medium">Loading Attendance...</Typography>
        </div>
      </div>
    );
  }

  // Filter & Pagination Logic
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = record.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter ? record.date === dateFilter : true;
    return matchesSearch && matchesDate;
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="mt-8 mb-8 flex flex-col gap-8 md:px-6">
      <Card className="overflow-hidden border border-blue-gray-100 shadow-sm">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 flex flex-col md:flex-row items-center justify-between p-6 border-b border-blue-gray-50 bg-gradient-to-r from-blue-gray-50/50 to-transparent"
        >
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <FingerPrintIcon className="h-8 w-8" />
            </div>
            <div>
              <Typography variant="h5" color="blue-gray" className="font-bold">
                Biometric Daily Attendance
              </Typography>
              <Typography variant="small" color="gray" className="font-normal opacity-80">
                Track real-time biometric punch-ins and punch-outs.
              </Typography>
            </div>
          </div>

          {students.length > 1 && (
            <div className="w-full md:w-64">
              <Select
                label="Select Student"
                value={activeStudentId}
                onChange={(val) => {
                  setActiveStudentId(val);
                  setSearchQuery("");
                  setDateFilter("");
                }}
                className="bg-white"
              >
                {students.map((stu) => (
                  <Option key={stu.id} value={String(stu.id)}>
                    {stu.firstName} {stu.surname}
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </CardHeader>

        <div className="p-4 bg-white border-b border-blue-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-72">
            <Input
              label="Search Status (e.g., Present)"
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="w-full md:w-56 flex items-center gap-2">
            <div className="relative w-full">
              <Input
                type="date"
                label="Filter by Date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pr-10"
              />
            </div>
            {dateFilter && (
              <IconButton variant="text" color="red" onClick={() => { setDateFilter(""); setCurrentPage(1); }}>
                <XCircleIcon className="h-5 w-5" />
              </IconButton>
            )}
          </div>
        </div>

        <CardBody className="p-0">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-blue-gray-300">
              Fetching records...
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 h-16 w-16 text-blue-gray-200 bg-blue-gray-50 rounded-full flex items-center justify-center">
                <FingerPrintIcon className="h-8 w-8" />
              </div>
              <Typography variant="h6" color="blue-gray" className="mb-1">
                No Attendance Records Found
              </Typography>
              <Typography variant="small" className="text-gray-500 font-normal">
                Biometric data for this student will appear here once they punch in.
              </Typography>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto text-left">
                <thead>
                  <tr className="bg-blue-gray-50/50">
                    <th className="border-b border-blue-gray-100 px-6 py-4">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Date</Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 px-6 py-4">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Status</Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 px-6 py-4">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Punch In</Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 px-6 py-4">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Punch Out</Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-blue-gray-400">
                        No records match your search filters.
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((record, index) => {
                      const isLast = index === currentRecords.length - 1;
                      const classes = isLast ? "px-6 py-4" : "px-6 py-4 border-b border-blue-gray-50";

                      return (
                        <tr key={record.id} className="hover:bg-blue-gray-50/20 transition-colors">
                          <td className={classes}>
                            <Typography variant="small" color="blue-gray" className="font-semibold">
                              {formatDate(record.date)}
                            </Typography>
                          </td>
                          <td className={classes}>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              <span className="text-xs font-bold uppercase">{record.status}</span>
                            </div>
                          </td>
                          <td className={classes}>
                            <Typography variant="small" className="font-medium text-blue-gray-600">
                              {record.punchIn ? <ShowDateTime timestamp={dayjs(record.punchIn).subtract(5, 'hour').subtract(30, 'minute').toISOString()} /> : "--:--"}
                            </Typography>
                          </td>
                          <td className={classes}>
                            <Typography variant="small" className="font-medium text-blue-gray-600">
                              {record.punchOut ? <ShowDateTime timestamp={dayjs(record.punchOut).subtract(5, 'hour').subtract(30, 'minute').toISOString()} /> : "--:--"}
                            </Typography>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal">
                    Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeftIcon strokeWidth={2} className="h-4 w-4" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <IconButton
                          key={page}
                          variant={currentPage === page ? "filled" : "text"}
                          color={currentPage === page ? "blue" : "blue-gray"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </IconButton>
                      ))}
                    </div>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ParentAttendance;
