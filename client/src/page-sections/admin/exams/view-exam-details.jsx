import { Card, CardBody, CardHeader, Typography, Button, Avatar, Tooltip } from "@material-tailwind/react";
import { useMaterialTailwindController } from "@/context";
import { TableCell } from "@/widgets/components";
import axios from "axios";
import { useEffect, useState } from "react";
import { handleError } from "@/hooks/errorHandling";
import dayjs from "dayjs";

export default function ViewExamDetails({ open, handleClose, examId }) {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [exam, setExam] = useState(null);
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    if (open && examId) fetchExamDetails();
  }, [open, examId]);

  const fetchExamDetails = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getExamsDetailsById/${examId}`
      );
      if (data.success) {
        setExam(data.exam);
        setTimetable(data.timetable || []);
      }
    } catch (error) {
      handleError(error, theme);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-5xl rounded-2xl shadow-2xl dark:bg-gradient-to-br from-blue-gray-800 to-blue-gray-900">
        {/* Header */}
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="p-4 flex justify-between items-center rounded-t-2xl"
        >
          <Typography variant="h5" color="white" className="font-bold">
            {exam ? exam.name : "Loading..."}
          </Typography>
          <Button
            size="sm"
            color="white"
            variant="outlined"
            onClick={handleClose}
            className="flex items-center gap-1"
          >
            <i className="fas fa-times" />
            Close
          </Button>
        </CardHeader>

        {/* Exam Info */}
        {exam && (
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-blue-gray-200 dark:border-blue-gray-600">
            <div className="flex flex-col gap-2">
              <Typography className="text-lg font-semibold text-blue-gray-700 dark:text-white">
                <i className="fas fa-chalkboard text-blue-500 mr-2" />
                Board: <span className="font-bold">{exam.board || "--"}</span>
              </Typography>
              <Typography className="text-lg font-semibold text-blue-gray-700 dark:text-white">
                <i className="fas fa-school text-green-500 mr-2" />
                Standard: <span className="font-bold">{exam.standard || "--"}</span>
              </Typography>
              <Typography className="text-lg font-semibold text-blue-gray-700 dark:text-white">
                <i className="fas fa-layer-group text-purple-500 mr-2" />
                Set: <span className="font-bold">{exam.set || "--"}</span>
              </Typography>
            </div>
            <div className="flex flex-col gap-2">
              <Typography className="text-lg font-semibold text-blue-gray-700 dark:text-white">
                <i className="fas fa-calendar-alt text-orange-500 mr-2" />
                Start Date: <span className="font-bold">{exam.dateFrom || "--"}</span>
              </Typography>
              <Typography className="text-lg font-semibold text-blue-gray-700 dark:text-white">
                <i className="fas fa-calendar-check text-red-500 mr-2" />
                End Date: <span className="font-bold">{exam.dateTo || "--"}</span>
              </Typography>
            </div>
          </CardBody>
        )}

        {/* Exam Timetable Table */}
        {timetable.length > 0 ? (
          <CardBody className="overflow-x-auto p-6">
            <table className="w-full min-w-[640px] table-auto border-collapse border border-blue-gray-200 dark:border-blue-gray-600">
              <thead>
                <tr className="bg-blue-gray-100 dark:bg-blue-gray-700 text-left">
                  <th className="p-3 font-semibold text-sm">#</th>
                  <th className="p-3 font-semibold text-sm">Subject</th>
                  <th className="p-3 font-semibold text-sm">Exam Date</th>
                  <th className="p-3 font-semibold text-sm">Exam Time</th>
                  <th className="p-3 font-semibold text-sm">Max Marks</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((item, index) => {
                  let examStartTime = item.examStartTime ?  dayjs(item.examStartTime, "HH:mm:ss").format("hh:mm A") : '';
                  let examEndTime = item.examEndTime ?  dayjs(item.examEndTime, "HH:mm:ss").format("hh:mm A") : '';
                  let examTime = `${item.examStartTime} - ${item.examEndTime}`
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-gray-50 dark:hover:bg-blue-gray-800 transition-colors"
                    >
                      <TableCell text={index + 1} />
                      <TableCell text={item.subjectName || "--"} />
                      <TableCell text={item.examDate || "--"} />
                      <TableCell text={examTime || "--"} />
                      <TableCell text={item.maxMarks || "--"} />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardBody>
        ) : (
          exam && (
            <CardBody className="p-6 text-center text-red-500 font-semibold">
              No timetable found for this exam
            </CardBody>
          )
        )}
      </Card>
    </div>
  );
}
