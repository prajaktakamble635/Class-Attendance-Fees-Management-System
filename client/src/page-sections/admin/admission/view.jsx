import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
} from "@material-tailwind/react";
import { CancelButton, SubmitButton } from "@/widgets/components/index.js";
import { toast } from "react-toastify";
import axios from "axios";
import dayjs from "dayjs";

export default function View(props) {

  const {
    open,
    handleClose,
    studentData,
    setStudentData
  } = props;

  const closeDialog = () => {
    setStudentData(null);
    handleClose()
  };

  const [subjectMap, setSubjectMap] = useState([]);
  const [setMap, setSetMap] = useState([]);

  useEffect(() => {
    setSubjectMap(studentData?.subjectsMap);
    setSetMap(studentData?.setMap)
  }, [studentData])

  return (
    <Dialog
      className="z-40"
      handler={closeDialog}
      open={open}
      size={"xxl"}
    >
      <DialogHeader className="justify-center bg-gray-100 text-center text-xl font-semibold">
        Student Details
      </DialogHeader>
      <DialogBody
        divider
        className="max-h-[75vh] overflow-y-auto px-6 bg-gray-50"
      >
        <div className="w-full">
          <div className="w-full p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="col-span-6 flex flex-col justify-center">
              <Typography className="text-md font-semibold mb-2">
                <span className="text-blue-600">STANDARD:</span>{" "}
                {studentData?.standardName || "-"}
              </Typography>
              <Typography className="text-md font-semibold mb-2">
                <span className="text-blue-600">BOARD:</span>{" "}
                {studentData?.boardName || "-"}
              </Typography>
              <Typography className="text-md font-semibold mb-2">
                <span className="text-blue-600">MEDIUM:</span>{" "}
                {studentData?.mediumName || "English Medium"}
              </Typography>
            </div>

            <div className="col-span-6 flex items-center justify-center">
              <img
                src={studentData?.photoPath ? `${import.meta.env.VITE_API_URL}/api/publicApi/downloadDocument?name=${studentData?.photoPath}` : "/img/profile.webp"}
                crossOrigin="anonymous"
                alt="profile-pic"
                className="rounded-full w-28 h-28 object-cover shadow-md border-2 border-gray-200"
              />
            </div>
          </div>

          <hr />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-white rounded-xl shadow-sm">
            {[
              { label: "First Name", value: studentData?.firstName || "--" },
              { label: "Mother's Name", value: studentData?.motherName || "--" },
              { label: "Father's Name", value: studentData?.fatherName || "--" },
              { label: "Surname", value: studentData?.surname || "--" },
              { label: "Birth Date (DD-MM-YYYY)", value: studentData?.dob ? dayjs(studentData?.dob).format("DD-MM-YYYY") : '--' },
              { label: "School Name", value: studentData?.schoolName || "--" },
              { label: "Gender", value: studentData?.gender === "M" ? "Male" : studentData?.gender === "F" ? "Female" : studentData?.gender === "O" ? "Other" : "--" },
              { label: "Email", value: studentData?.email || '--' }
            ].map((field, idx) => (
              <div key={idx}>
                <label className="block text-gray-600 font-semibold mb-1">
                  {field.label}
                </label>
                <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                  {field.value}
                </div>
              </div>
            ))}

            {/* Address */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-gray-600 font-semibold mb-1">
                Address
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium leading-relaxed">
                {studentData?.address || "--"}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Father's Occupation
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.fatherOccupation || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Mother's Occupation
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.motherOccupation || '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Students's Mobile Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.studentMobile || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Students's Whastapp Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.studentWhatsapp || '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Father's Mobile Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.fatherMobile || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Father's Whastapp Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.fatherWhatsapp || '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Mother's Mobile Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.motherMobile || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Mother's Whastapp Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {studentData?.motherWhatsapp || '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>
          </div>

          <hr className="my-4 border border-blue-600" />

          <Typography className="text-xl font-semibold text-blue-600 ms-4 mb-4">Admission Details</Typography>
          <Typography className="text-lg font-semibold ms-4">Subjects:</Typography>
          {subjectMap && subjectMap.length > 0 ? (
            <div className="my-2 w-full flex flex-wrap ms-4">
              {subjectMap.map((item) => (
                <div className="px-3 py-1 bg-gray-200 border border-gray-300 m-2 rounded-lg">
                  {item.subjectCode} - {item.subjectName}
                </div>
              ))}
            </div>
          ) : null}
          <Typography className="text-lg ms-4 mb-2"><span className="font-semibold me-2">SET(s): </span> {setMap?.map((item) => `${item?.set},  `)} </Typography>
          <hr className="my-4 border border-blue-600" />
          <Typography className="text-xl font-semibold text-blue-600 ms-4 mb-4">
            Fees Details
          </Typography>
          <div className="bg-gray-50 rounded-lg shadow-sm p-4 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <Typography className="text-gray-700 font-medium text-base">
                Total Fees:{" "}
                <span className="text-blue-700 font-semibold">
                  ₹{studentData?.totalFees || 0}
                </span>
              </Typography>
              <Typography className="text-gray-700 font-medium text-base">
                Status:{" "}
                <span className="text-blue-700 font-semibold">
                  ₹ {studentData?.feesPaidStatus == 1 ? 'Paid' : studentData?.feesPaidStatus == 2 ? 'Pending' : 'Unknown'}
                </span>
              </Typography>
              <Typography className="text-gray-700 font-medium text-base mt-2 md:mt-0">
                Payment Type:{" "}
                <span
                  className={`font-semibold ${studentData?.paymentType === 1
                      ? "text-green-600"
                      : "text-orange-600"
                    }`}
                >
                  {studentData?.paymentType === 1
                    ? "One-time Payment"
                    : "Installments"}
                </span>
              </Typography>
            </div>
            {studentData?.paymentType === 1 ? (
              <div className="flex flex-col md:flex-row gap-4 bg-gray-50 rounded-lg shadow-sm w-full max-w-md">
                <div className="flex-1 flex flex-col items-start bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <Typography className="text-gray-500 text-sm font-medium mb-1">
                    Paid Fees
                  </Typography>
                  <Typography className="text-green-600 font-semibold text-lg">
                    ₹{studentData?.feesPaid || 0}
                  </Typography>
                </div>
                <div className="flex-1 flex flex-col items-start bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <Typography className="text-gray-500 text-sm font-medium mb-1">
                    Remaining Fees
                  </Typography>
                  <Typography className="text-red-600 font-semibold text-lg">
                    ₹{studentData?.feesRemaining || 0}
                  </Typography>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg shadow-sm w-full overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">#</th>
                      <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Due Date</th>
                      <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentData?.studentFeesInstallments?.length > 0 ? (
                      studentData?.studentFeesInstallments?.map((instal, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">{instal.installmentNo}</td>
                          <td className="px-4 py-2">{instal.dueDate || "-"}</td>
                          <td className="px-4 py-2">₹{Number(instal.amount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-gray-500">
                          No installments added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow">
                  <Typography className="text-sm text-gray-600 font-medium">
                    Total Paid: <span className="text-green-600 font-semibold">₹{studentData?.feesPaid || 0}</span>
                  </Typography>
                  <Typography className="text-sm text-gray-600 font-medium mt-2 md:mt-0">
                    Remaining: <span className="text-red-600 font-semibold">₹{studentData?.feesRemaining || 0}</span>
                  </Typography>
                </div>
              </div>
            )}
          </div>

        </div>
      </DialogBody>
      <DialogFooter className="bg-gray-100 sticky bottom-0 z-10">
        <CancelButton onClick={closeDialog} />
      </DialogFooter>
    </Dialog>
  )

}