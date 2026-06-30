import React, { useState } from "react";
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
import { useUser } from "@/context/user";

export default function AddPreview(props) {
  const {
    open,
    handleClose,
    formData,
    setFormData,
    selectedCondition,
    setSelectedCondition,
    selectedSubjects,
    setSelectedSubjects,
    tabs,
    setTabs,
    selectedSets,
    setSelectedSets,
    selectedAddons,
    setSelectedAddons,
    saveImageAndRefersh,
    installmentData,
    setInstallmentData
  } = props;

  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitData = async () => {
    setIsSubmitting(true)
    try {
      const data = {
        firstName: formData.firstName,
        motherName: formData.motherName,
        fatherName: formData.fatherName,
        surname: formData.surname,
        address: formData.address,
        schoolName: formData.schoolName,
        fatherOccupation: formData.fatherOccupation,
        motherOccupation: formData.motherOccupation,
        studentMobile: formData.studentMobile,
        studentWhatsapp: formData.studentWhatsapp,
        fatherMobile: formData.fatherMobile,
        fatherWhatsapp: formData.fatherWhatsapp,
        motherMobile: formData.motherMobile,
        motherWhatsapp: formData.motherWhatsapp,
        email: formData.email,
        dob: formData?.dob || null,
        gender: formData?.gender || null,
        standardId: selectedCondition?.standardIdFk,
        boardId: selectedCondition?.boardIdFk,
        mediumsId: selectedCondition?.mediumIdFk,
        photoPath: formData.photoPath || '',
        totalFees: formData.totalFees,
        discount: formData.discount || 0,
        paymentType: formData.paymentType,
        noOfInstaments: formData.noOfInstaments,
        installmentData,
        feesPaid: formData.paidFees || 0,
        feesRemaining: formData.remainingFees || 0,
        sets: selectedSets,
        addons: selectedAddons,
        subjects: selectedSubjects,
        boardSubjectConditionsId: selectedCondition?.id
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/addStudentAdmission`, data);
      closeDialog()
      toast.success("Student Admission Process Completed")
    } catch (err) {
      console.log(err);
      const errmsg =
        err?.response?.data?.error ||         // <-- correct key
        err?.response?.data?.message ||
        err?.message ||
        "Internal Server Error: Failed to admin student, please contact system administrator.";

      toast.error(errmsg);
    }
    finally {
      setIsSubmitting(false)
    }
  };

  const closeDialog = () => {
    setFormData({
      firstName: "",
      motherName: "",
      fatherName: "",
      surname: "",
      address: "",
      schoolName: "",
      fatherOccupation: "",
      motherOccupation: "",
      studentMobile: "",
      studentWhatsapp: "",
      isStudWhatsappSameAsMobile: false,
      fatherMobile: "",
      isFatherWhatsappSameAsMobile: false,
      fatherWhatsapp: "",
      motherMobile: "",
      isMotherWhatappSameAsMobile: false,
      motherWhatsapp: "",
      email: "",
      isEmailValid: true,
      dob: "",
      admissionDate: "",
      gender: "",
      sets: [],
      totalFees: 0,
      discount: 0,
      paymentType: "",
      noOfInstaments: null,
      paidFees: 0,
      remainingFees: 0,
      photoPath: "",
    });
    setSelectedCondition(null);
    setSelectedSubjects([]);
    setTabs(tabs[0]);
    setSelectedSets([]);
    setSelectedAddons([]);
    saveImageAndRefersh()
    setInstallmentData([])
    handleClose()
  }

  return (
    <Dialog
      className="z-40"
      handler={handleClose}
      open={open}
      size={"xxl"}
    >
      <DialogHeader className="justify-center bg-gray-100 text-center text-xl font-semibold">
        Student Admission Form Preview
      </DialogHeader>

      {/* Scrollable Body */}
      <DialogBody
        divider
        className="max-h-[75vh] overflow-y-auto px-6 bg-gray-50"
      >
        <div className="w-full">
          {/* Top Section: Standard, Board, Medium + Photo */}
          <div className="w-full p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="col-span-6 flex flex-col justify-center">
              <Typography className="text-md font-semibold mb-2">
                <span className="text-blue-600">STANDARD:</span>{" "}
                {selectedCondition?.standard || "-"}
              </Typography>
              <Typography className="text-md font-semibold mb-2">
                <span className="text-blue-600">BOARD:</span>{" "}
                {selectedCondition?.boardName || "-"}
              </Typography>
              <Typography className="text-md font-semibold mb-2">
                <span className="text-blue-600">MEDIUM:</span>{" "}
                {selectedCondition?.medium || "-"}
              </Typography>
            </div>

            <div className="col-span-6 flex items-center justify-center">
              <img
                src={formData?.photoPath ? `${import.meta.env.VITE_API_URL}/api/publicApi/downloadDocument?name=${formData?.photoPath}` : "/img/profile.webp"}
                crossOrigin="anonymous"
                alt="profile-pic"
                className="rounded-full w-28 h-28 object-cover shadow-md border-2 border-gray-200"
              />
            </div>
          </div>

          {/* Title Bar */}
          <div className="my-4 w-full bg-blue-600 py-2 rounded-lg shadow-sm">
            <Typography className="font-semibold text-white text-center">
              Gurukul TEST SERIES - ADMISSION FORM
            </Typography>
          </div>

          {/* Form-Like Structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-white rounded-xl shadow-sm">
            {[
              { label: "First Name", value: formData?.firstName || "--" },
              { label: "Mother's Name", value: formData?.motherName || "--" },
              { label: "Father's Name", value: formData?.fatherName || "--" },
              { label: "Surname", value: formData?.surname || "--" },
              { label: "Birth Date (DD-MM-YYYY)", value: formData?.dob ? dayjs(formData?.dob).format("DD-MM-YYYY") : '--' },
              { label: "School Name", value: formData?.schoolName || "" },
              { label: "Gender", value: formData?.gender === "M" ? "Male" : formData?.gender === "F" ? "Female" : formData?.gender === "O" ? "Other" : "--" },
              { label: "Email", value: formData?.email || '--' }
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
                {formData?.address || "--"}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Father's Occupation
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.fatherOccupation || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Mother's Occupation
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.motherOccupation || '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Students's Mobile Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.studentMobile || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Students's Whastapp Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.studentWhatsapp | '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Father's Mobile Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.fatherMobile || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Father's Whastapp Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.fatherWhatsapp || '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Mother's Mobile Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.motherMobile || '--'}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Mother's Whastapp Number
              </label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-800 font-medium">
                {formData?.motherWhatsapp || '--'}
              </div>
            </div>
            <div className="hidden md:block"></div>
          </div>
          <hr className="my-4 border border-blue-600" />
          <Typography className="text-xl font-semibold text-blue-600 ms-4 mb-4">Admission Details</Typography>
          <Typography className="text-lg font-semibold ms-4">Subjects:</Typography>
          {selectedSubjects && selectedSubjects.length > 0 ? (
            <div className="my-2 w-full flex flex-wrap ms-4">
              {selectedSubjects.map((item) => (
                <div className="px-3 py-1 bg-gray-200 border border-gray-300 m-2 rounded-lg">
                  {item.code}
                </div>
              ))}
            </div>
          ) : null}
          <Typography className="text-lg ms-4 mb-2"><span className="font-semibold me-2">SET(s): </span> {selectedSets?.map((item) => `${item?.label},  `)} </Typography>
          {selectedAddons && selectedAddons.length > 0 && (
            <Typography className="text-lg ms-4 mb-2"><span className="font-semibold me-2">Add-on(s): </span> {selectedAddons.join(", ")} </Typography>
          )}
          <Typography className="text-lg ms-4 mb-2"><span className="font-semibold me-2">Admission Date: </span> {formData?.admissionDate || '--'} </Typography>
          <hr className="my-4 border border-blue-600" />
          <Typography className="text-xl font-semibold text-blue-600 ms-4 mb-4">
            Fees Details
          </Typography>
          <div className="bg-gray-50 rounded-lg shadow-sm p-4 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <Typography className="text-gray-700 font-medium text-base">
                Total Fees:{" "}
                <span className="text-blue-700 font-semibold">
                  ₹{formData?.totalFees || 0}
                </span>
              </Typography>
              <Typography className="text-gray-700 font-medium text-base mt-2 md:mt-0">
                Discount:{" "}
                <span className="text-green-600 font-semibold">
                  ₹{formData?.discount || 0}
                </span>
              </Typography>
              <Typography className="text-gray-700 font-medium text-base mt-2 md:mt-0">
                Payment Type:{" "}
                <span
                  className={`font-semibold ${formData?.paymentType === 1
                    ? "text-green-600"
                    : "text-orange-600"
                    }`}
                >
                  {formData?.paymentType === 1
                    ? "One-time Payment"
                    : "Installments"}
                </span>
              </Typography>
            </div>
            {formData.paymentType === 1 ? (
              <div className="flex flex-col md:flex-row gap-4 bg-gray-50 rounded-lg shadow-sm w-full max-w-md">
                <div className="flex-1 flex flex-col items-start bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <Typography className="text-gray-500 text-sm font-medium mb-1">
                    Paid Fees
                  </Typography>
                  <Typography className="text-green-600 font-semibold text-lg">
                    ₹{formData?.paidFees || 0}
                  </Typography>
                </div>
                <div className="flex-1 flex flex-col items-start bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <Typography className="text-gray-500 text-sm font-medium mb-1">
                    Final Fees
                  </Typography>
                  <Typography className="text-red-600 font-semibold text-lg">
                    ₹{Math.max(0, Number(formData?.totalFees || 0) - Number(formData?.discount || 0))}
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
                    {installmentData?.length > 0 ? (
                      installmentData.map((instal, idx) => (
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
                    Total Paid: <span className="text-green-600 font-semibold">₹{formData?.paidFees || 0}</span>
                  </Typography>
                  <Typography className="text-sm text-gray-600 font-medium mt-2 md:mt-0">
                    Final Fees: <span className="text-red-600 font-semibold">₹{Math.max(0, Number(formData?.totalFees || 0) - Number(formData?.discount || 0))}</span>
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="bg-gray-100 sticky bottom-0 z-10">
        <CancelButton onClick={handleClose} />
        <SubmitButton disabled={isSubmitting} onClick={submitData} />
      </DialogFooter>
    </Dialog>
  );
}
