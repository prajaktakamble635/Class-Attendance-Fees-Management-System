import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import AddPreview from "@/page-sections/admin/admission/add-preview";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Input,
  Radio,
  Select,
  Option,
  Textarea,
  Typography,
  Chip,
  tab
} from "@material-tailwind/react";
import axios from "axios";
import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Cropper from 'react-easy-crop';
import getCroppedImg from "@/hooks/getCroppedImg";
import AsyncSelect from "react-select/async";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { checkDocumentMimeType, checkFileSize, maxSelectFile } from "@/hooks/fileValidationUtils";
import UpdatePreview from "@/page-sections/admin/admission/edit-preview";
import dayjs from "dayjs";

export default function EditAdmissionHolder() {

  const { id } = useParams();
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  // State management
  const [boardSubjectConditions, setBoardSubjectConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isLoadingConditions, setIsLoadingConditions] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [preview, setPreview] = useState("/img/profile.webp");
  const [file, setFile] = useState(null);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [obj, setObj] = useState(null);
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    firstName: '',
    motherName: '',
    fatherName: '',
    surname: '',
    address: '',
    schoolName: '',
    fatherOccupation: '',
    motherOccupation: '',
    studentMobile: '',
    studentWhatsapp: '',
    isStudWhatsappSameAsMobile: false,
    fatherMobile: '',
    isFatherWhatsappSameAsMobile: false,
    fatherWhatsapp: '',
    motherMobile: '',
    isMotherWhatappSameAsMobile: false,
    motherWhatsapp: '',
    email: '',
    isEmailValid: true,
    dob: '',
    admissionDate: "",
    gender: '',
    sets: [],
    totalFees: 0,
    paymentType: "",
    noOfInstaments: null,
    paidFees: 0,
    remainingFees: 0,
    photoPath: ''
  });
  const [testSetData, setTestSetData] = useState([]);
  const [selectedSets, setSelectedSets] = useState([]);
  const tabs = ["Board/Standard Selection", "Basic Information", "Guardian Information", "Fees Structure", "Subject Selection"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [installmentData, setInstallmentData] = useState([]);
  const [installmentErr, setInstallmentErr] = useState(false);
  const [instalErrMsg, setInstalErrMsg] = useState("");
  const [initialLoad, setInitialLoad] = useState(true)

  // Fetch board subject conditions on component mount
  useEffect(() => {
    fetchBoardSubjectConditions();
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSetData`)
    ]).then(([res]) => {
      setTestSetData(res.data.setData)
    })
  }, []);

  const calculateRemainingFees = (total, paid, installments) => {
    const unpaid = installments.filter(i => i.paidStatus !== 2);
    const paidInst = installments.filter(i => i.paidStatus === 2);

    const unpaidSum = unpaid.reduce((a, b) => a + Number(b.amount || 0), 0);
    const paidSum = paidInst.reduce((a, b) => a + Number(b.amount || 0), 0);

    const totalCalc = paid + unpaidSum + paidSum;

    return {
      unpaidSum,
      paidSum,
      totalCalc,
      isMore: totalCalc > total,
      isLess: totalCalc < total,
      diff: Math.abs(total - totalCalc),
    };
  };


  //-------installments--logic-------------------

  useEffect(() => {
    if (initialLoad) return;

    const { paymentType, totalFees, paidFees, noOfInstaments } = formData;

    const total = Number(totalFees);
    const paid = Number(paidFees);
    const count = Number(noOfInstaments);

    // Reset if total invalid
    if (isNaN(total)) {
      setInstallmentData([]);
      setFormData(prev => ({ ...prev, remainingFees: "" }));
      return;
    }

    // One time payment
    if (paymentType === 1) {
      setInstallmentData([]);
      setFormData(prev => ({
        ...prev,
        paidFees: total,
        remainingFees: 0,
      }));
      return;
    }

    // Installments: if paid = total
    if (paymentType === 2 && paid === total) {
      setInstallmentData([]);
      setFormData(prev => ({
        ...prev,
        remainingFees: 0,
        noOfInstaments: 0,
      }));
      return;
    }

    // Manual Installments
    if (paymentType === 2 && count > 0) {
      let existing = installmentData.filter(i => i.amount);
      let newCount = count - existing.length;

      if (newCount < 0) {
        existing = existing.slice(0, count); // trim extra rows
        newCount = 0;
      }

      const newRows = Array.from({ length: newCount }).map((_, i) => ({
        installmentNo: existing.length + i + 1,
        amount: "",
        dueDate: "",
        paidStatus: 1,
        paymentDate: null,
      }));

      setInstallmentData([...existing, ...newRows]);

      const remaining = total - paid;
      setFormData(prev => ({ ...prev, remainingFees: remaining >= 0 ? remaining : 0 }));
    }
  }, [
    formData.paymentType,
    formData.totalFees,
    formData.paidFees,
    formData.noOfInstaments,
  ]);

  // 🟣 VALIDATION EFFECT
  useEffect(() => {
    if (initialLoad) return;
    if (formData.paymentType !== 2) return;
    if (!installmentData.length) return;

    const total = Number(formData.totalFees);
    const paid = Number(formData.paidFees);

    if (isNaN(total) || isNaN(paid)) return;

    const result = calculateRemainingFees(total, paid, installmentData);

    // Update remaining (only from paid installments)
    setFormData(prev => ({
      ...prev,
      remainingFees: total - (paid + result.paidSum)
    }));

    if (result.isMore) {
      setInstallmentErr(true);
      setInstalErrMsg(
        `Installments + Paid exceed Total Fees by ₹${result.diff}`
      );
    } else if (result.isLess) {
      setInstallmentErr(true);
      setInstalErrMsg(
        `Installments + Paid are less than Total Fees by ₹${result.diff}`
      );
    } else {
      setInstallmentErr(false);
      setInstalErrMsg("");
    }
  }, [installmentData]);


  useEffect(() => {
    if (id) {
      getStudentDetails()
    }
  }, [id]);

  const fetchSubjects = async (id) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/commonApi/subjectsByCondition`,
        {
          params: {
            boardSubjectConditionsId: id
          }
        }
      );

      if (response.data.success) {
        setSubjects(response.data.data);

        // Auto-select compulsory and default subjects
        const autoSelected = response.data.data
          .filter(sub => sub.isCompulsory === 1 || sub.isDefaultSelected === 1)
          .map((sub) => ({ code: sub.code, id: sub.id }));
        setSelectedSubjects(autoSelected);
      }
    } catch (err) {
      toast.error("Failed to set subjects")
    }
  }

  const getStudentDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentDetailsById?id=${id}`);
      const studentData = res.data.studentData;
      setFormData({
        id: studentData.id,
        firstName: studentData?.firstName || '',
        motherName: studentData?.motherName || '',
        fatherName: studentData?.fatherName || '',
        surname: studentData?.surname || '',
        address: studentData?.address || '',
        schoolName: studentData?.schoolName || '',
        fatherOccupation: studentData?.fatherOccupation || '',
        motherOccupation: studentData?.motherOccupation || '',
        studentMobile: studentData?.studentMobile || '',
        studentWhatsapp: studentData?.studentWhatsapp || '',
        isStudWhatsappSameAsMobile: (studentData?.studentMobile && studentData?.studentMobile?.trim() === studentData?.studentWhatsapp?.trim()) ? true : false,
        fatherMobile: studentData?.fatherMobile,
        isFatherWhatsappSameAsMobile: (studentData?.fatherMobile && studentData?.fatherMobile?.trim() === studentData?.fatherWhatsapp?.trim()) ? true : false,
        fatherWhatsapp: studentData?.fatherWhatsapp,
        motherMobile: studentData?.motherMobile,
        isMotherWhatappSameAsMobile: (studentData?.motherMobile && studentData?.motherMobile?.trim() === studentData?.motherWhatsapp?.trim()) ? true : false,
        motherWhatsapp: studentData?.motherWhatsapp,
        email: studentData?.email || '',
        isEmailValid: true,
        dob: studentData?.dob || '',
        admissionDate: studentData?.admissionDate || '',
        gender: studentData?.gender,
        sets: studentData?.sets || [],
        totalFees: studentData?.totalFees || 0,
        paymentType: studentData?.paymentType || null,
        noOfInstaments: studentData?.noOfInstallment,
        paidFees: studentData?.registrationCharges || 0,
        remainingFees: studentData?.feesRemaining || 0,
        photoPath: studentData?.photoPath || ''
      });
      setSelectedCondition(studentData?.boardCondition);
      setSelectedSets(studentData?.setMap)
      setSelectedSets(studentData?.setMap)
      await fetchSubjects(studentData?.boardCondition?.id);
      setSelectedSubjects(studentData?.studentSubjectMap);
      setInstallmentData(studentData?.studentInstallments || [])
      setCroppedImage(studentData?.photoPath ? `${import.meta.env.VITE_API_URL}/api/publicApi/downloadDocument?name=${studentData?.photoPath}` : null);
      setInitialLoad(false)
    } catch (err) {
      const errMsg = err?.respone?.data?.message || "Internal Server Error";
      toast.error(errMsg)
    }
  }

  const fetchBoardSubjectConditions = async () => {
    try {
      setIsLoadingConditions(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/commonApi/boardSubjectConditions`
      );

      if (response.data.success) {
        setBoardSubjectConditions(response.data.data);
      }
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
    } finally {
      setIsLoadingConditions(false);
    }
  };

  // Fetch subjects when a board subject condition is selected
  const handleConditionSelect = async (condition) => {
    setSelectedCondition(condition);
    setSubjects([]);
    setSelectedSubjects([]);

    try {
      setIsLoadingSubjects(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/commonApi/subjectsByCondition`,
        {
          params: {
            boardSubjectConditionsId: condition.id
          }
        }
      );

      if (response.data.success) {
        setSubjects(response.data.data);

        // Auto-select compulsory and default subjects
        const autoSelected = response.data.data
          .filter(sub => sub.isCompulsory === 1 || sub.isDefaultSelected === 1)
          .map((sub) => ({ code: sub.code, id: sub.id }));
        setSelectedSubjects(autoSelected);
      }
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Handle subject checkbox change
  const handleSubjectToggle = (subject, isCompulsory) => {
    if (isCompulsory) {
      toast.warning("Compulsory subjects cannot be deselected", { theme });
      return;
    }

    setSelectedSubjects(prev => {
      if (prev.some(i => i.id === subject?.id)) {
        // remove the subject
        return prev.filter(s => s.id !== subject?.id); // note: !==
      } else {
        // add the subject
        return [...prev, { code: subject.code, id: subject.id }];
      }
    });
  };

  // Get compulsory and optional subjects
  const compulsorySubjects = useMemo(() =>
    subjects.filter(sub => sub.isCompulsory === 1),
    [subjects]
  );

  const optionalSubjects = useMemo(() =>
    subjects.filter(sub => sub.isCompulsory !== 1),
    [subjects]
  );

  // Check if subject is disabled based on current selection
  const isSubjectDisabled = useMemo(() => {
    if (!selectedCondition?.conditionMeta?.rules) return {};

    const disabled = {};
    const rules = selectedCondition.conditionMeta.rules;

    rules.forEach((rule) => {
      switch (rule.type) {
        case "mutually_exclusive_pair":
          rule.pairs?.forEach((pair) => {
            const [code1, code2] = pair;
            if (selectedSubjects.some(item => item.code === code1)) {
              disabled[code2] = true;
            }
            if (selectedSubjects.some((item) => item.code === code2)) {
              disabled[code1] = true;
            }
          });
          break;

        case "exclude_if_selected":
          Object.entries(rule.if_selected || {}).forEach(
            ([triggerCode, excludedCodes]) => {
              if (selectedSubjects.some(item => item.code === triggerCode)) {
                excludedCodes.forEach((code) => {
                  disabled[code] = true;
                });
              }
            }
          );
          break;

        case "conditional_exclude_when_selected_all":
          rule.cases?.forEach((caseItem) => {
            const { when_selected_all, exclude } = caseItem;

            // Check if ALL subjects in when_selected_all are currently selected
            const allSelected = when_selected_all?.every((code) =>
              selectedSubjects.some((item) => item.code === code)
            );

            // If all required subjects are selected, disable the excluded subjects
            if (allSelected && exclude?.length > 0) {
              exclude.forEach((code) => {
                disabled[code] = true;
              });
            }
          });
          break;
      }
    });

    return disabled;
  }, [selectedCondition, selectedSubjects]);

  // Validation function
  const validateSelection = () => {
    if (!selectedCondition) {
      toast.error("Please select a board subject condition first", { theme });
      return;
    }
    if (!formData.firstName) {
      return toast.warn("Please enter First Name")
    }
    if (!formData.motherName) {
      return toast.warn("Please enter Mother's Name")
    }
    if (!formData.fatherName) {
      return toast.warn("Please enter Father's Name")
    }
    if (!formData.surname) {
      return toast.warn("Please enter Surname Name")
    }
    // if(!formData.dob){
    //   return toast.warn("Please enter Birth Date")
    // }
    if (!formData.photoPath) {
      return toast.warn("Please upload Student Photo")
    }
    if (!formData.fatherMobile) {
      return toast.warn("Please enter father's mobile number.")
    }
    if (formData.studentMobile && formData.studentMobile?.toString()?.trim()?.length !== 10) {
      return toast.warn("Student mobile number is invalid.")
    }
    if (formData.studentWhatsapp && formData.studentWhatsapp?.toString()?.trim()?.length !== 10) {
      return toast.warn("Student whatsapp number is invalid.")
    }
    if (formData.fatherMobile?.toString()?.trim()?.length !== 10) {
      return toast.warn("Father mobile number is invalid.")
    }
    if (formData.fatherWhatsapp && formData.fatherWhatsapp?.toString()?.trim()?.length !== 10) {
      return toast.warn("Father whatsapp number is invalid.")
    }
    if (formData.motherMobile && formData.motherMobile?.toString()?.trim()?.length !== 10) {
      return toast.warn("Mother mobile number is invalid.")
    }
    if (formData.motherWhatsapp && formData.motherWhatsapp?.toString()?.trim()?.length !== 10) {
      return toast.warn("Mother whatsapp number is invalid.")
    }
    if (formData.email && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(formData.email)) {
      return toast.warn("Please enter valid email address")
    }

    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject", { theme });
      return;
    }

    const errors = [];
    const rules = selectedCondition.conditionMeta?.rules || [];

    // Check min/max subjects
    const minSubjects = selectedCondition.minSubjectsSelectable;
    const maxSubjects = selectedCondition.maxSubjectsSelectable;

    if (selectedSubjects.length < minSubjects) {
      errors.push(
        `You must select at least ${minSubjects} subjects. Currently selected: ${selectedSubjects.length}`
      );
    }

    if (selectedSubjects.length > maxSubjects) {
      errors.push(
        `You can select maximum ${maxSubjects} subjects. Currently selected: ${selectedSubjects.length}`
      );
    }

    // Check fixed selection type
    if (
      selectedCondition.selectionType === "fixed" &&
      selectedSubjects.length !== minSubjects
    ) {
      errors.push(
        `You must select exactly ${minSubjects} subjects. Currently selected: ${selectedSubjects.length}`
      );
    }

    // Validate rules
    rules.forEach((rule) => {
      switch (rule.type) {
        case "mutually_exclusive_pair":
          rule.pairs?.forEach((pair) => {
            const [code1, code2] = pair;
            if (
              selectedSubjects.some((item) => item.code === code1) &&
              selectedSubjects.some((item) => item.code === code2)
            ) {
              const sub1 = subjects.find((s) => s.code === code1);
              const sub2 = subjects.find((s) => s.code === code2);
              errors.push(
                `${sub1?.name || code1} and ${sub2?.name || code2
                } cannot be selected together`
              );
            }
          });
          break;

        case "exclude_if_selected":
          Object.entries(rule.if_selected || {}).forEach(
            ([triggerCode, excludedCodes]) => {
              if (selectedSubjects.some((item) => item.code === triggerCode)) {
                const violatedCodes = excludedCodes.filter((code) =>
                  selectedSubjects.some((item) => item.code === code)
                );
                if (violatedCodes.length > 0) {
                  const triggerSub = subjects.find(
                    (s) => s.code === triggerCode
                  );
                  const excludedSubs = violatedCodes
                    .map(
                      (code) =>
                        subjects.find((s) => s.code === code)?.name || code
                    )
                    .join(", ");
                  errors.push(
                    `${triggerSub?.name || triggerCode
                    } cannot be selected with: ${excludedSubs}`
                  );
                }
              }
            }
          );
          break;

        case "conditional_totals":
          rule.conditions?.forEach((condition) => {
            // Support both when_selected and when_selected_all
            let triggerSubs = [];
            let shouldCheckTotal = false;

            if (condition.when_selected_all && Array.isArray(condition.when_selected_all)) {
              triggerSubs = condition.when_selected_all;
              // For when_selected_all: ALL subjects must be selected
              shouldCheckTotal = triggerSubs.every((code) =>
                selectedSubjects.some((item) => item.code === code)
              );
            } else if (condition.when_selected && Array.isArray(condition.when_selected)) {
              triggerSubs = condition.when_selected;
              // For when_selected: ANY subject must be selected
              shouldCheckTotal = triggerSubs.some((code) =>
                selectedSubjects.some((item) => item.code === code)
              );
            }

            if (shouldCheckTotal && triggerSubs.length > 0) {
              const totalSelected = selectedSubjects.length;

              // Support both required_total (exact) and min_total/max_total (range)
              if (condition.required_total !== undefined) {
                if (totalSelected !== condition.required_total) {
                  const triggerSubNames = triggerSubs
                    .map(
                      (code) =>
                        subjects.find((s) => s.code === code)?.name || code
                    )
                    .join(", ");
                  errors.push(
                    `You have selected ${triggerSubNames}. You must select exactly ${condition.required_total} subjects total. Currently selected: ${totalSelected}`
                  );
                }
              } else {
                const minAllowed = condition.min_total || 0;
                const maxAllowed = condition.max_total || Infinity;

                if (totalSelected < minAllowed) {
                  errors.push(
                    `With current selection, you must select at least ${minAllowed} subjects total. Currently selected: ${totalSelected}`
                  );
                }
                if (totalSelected > maxAllowed) {
                  errors.push(
                    `With current selection, you can select maximum ${maxAllowed} subjects total. Currently selected: ${totalSelected}`
                  );
                }
              }
            }
          });
          break;

        case "required_any_of":
          rule.groups?.forEach((group) => {
            const hasAnyFromGroup = group.subject_codes?.some((code) =>
              selectedSubjects.some((item) => item.code === code)
            );
            if (!hasAnyFromGroup && group.note) {
              errors.push(group.note);
            }
          });
          break;

        case "conditional_exclude_when_selected_all":
          rule.cases?.forEach((caseItem) => {
            const { when_selected_all, exclude } = caseItem;

            // Check if ALL subjects in when_selected_all are selected
            const allSelected = when_selected_all?.every((code) =>
              selectedSubjects.some((item) => item.code === code)
            );

            // If all are selected, check if any excluded subjects are also selected
            if (allSelected && exclude?.length > 0) {
              const violatedCodes = exclude.filter((code) =>
                selectedSubjects.some((item) => item.code === code)
              );

              if (violatedCodes.length > 0) {
                const triggerSubNames = when_selected_all
                  .map(
                    (code) =>
                      subjects.find((s) => s.code === code)?.name || code
                  )
                  .join(", ");
                const excludedSubNames = violatedCodes
                  .map(
                    (code) =>
                      subjects.find((s) => s.code === code)?.name || code
                  )
                  .join(", ");
                errors.push(
                  `When ${triggerSubNames} are both selected, you cannot select: ${excludedSubNames}`
                );
              }
            }
          });
          break;
      }
    });

    // Show results
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast.error(error, { theme, autoClose: 5000 });
      });
    } else {
      setIsPreviewOpen(true)
      toast.success(
        "Subjects selected successfully.",
        {
          theme,
          autoClose: 3000,
        }
      );
    }
  };

  //image-----
  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setCropMode(true);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = useCallback(async () => {
    try {
      const croppedImg = await getCroppedImg(preview, croppedAreaPixels);
      setCroppedImage(croppedImg);
      setCropMode(false);
    } catch (e) {
      console.error(e);
    }
  }, [preview, croppedAreaPixels]);

  const handleUpload = async () => {
    try {
      if (!croppedImage) return toast.warn("Please crop the image first.");

      setIsUploading(true)
      // Convert cropped image (base64) to Blob for upload
      const blob = await (await fetch(croppedImage)).blob();
      const fileToUpload = new File([blob], "profile.jpg", { type: "image/jpeg" });

      // Validation (optional if you already validated original file)
      if (
        !maxSelectFile(fileToUpload) ||
        !checkDocumentMimeType(fileToUpload) ||
        !checkFileSize(fileToUpload)
      ) {
        setIsUploading(false)
        return toast.error("Invalid file selected.");
      }

      // Prepare form data
      const data = new FormData();
      data.append("file", fileToUpload);

      // Send file to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/publicApi/uploadDocument`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Update formData with uploaded file name/path
      setFormData((prev) => ({
        ...prev,
        photoPath: response.data.fname,
      }));

      // Automatically update the student's photo in the database
      if (id) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/superAdminApi/updateStudentPhoto`,
          { id, photoPath: response.data.fname }
        );
      }

      // Feedback + cleanup
      toast.success("Profile photo uploaded successfully!");
      setCropMode(false);
      setIsUploading(false)
    } catch (error) {
      console.error(error);
      handleError(error);

      if (error.response?.status === 401) {
        navigate("/auth/sign-in", { replace: true });
      } else if (error.response?.status === 403) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        toast.error("Failed to upload photo. Please try again.");
      }
      setIsUploading(false)
    } finally {
      setIsUploading(false)
    }
  };

  const handleTextChange = (field, value) => {
    // Capitalize only for specific name fields
    const nameFields = ["firstName", "motherName", "fatherName", "surname"];
    let formattedValue = value;

    if (nameFields.includes(field) && typeof value === "string") {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setFormData((prev) => {
      const updatedForm = { ...prev };

      switch (field) {
        case "studWhatsappSame":
          if (value) {
            updatedForm.isStudWhatsappSameAsMobile = true;
            updatedForm.studentWhatsapp = prev.studentMobile;
          } else {
            updatedForm.isStudWhatsappSameAsMobile = false;
            updatedForm.studentWhatsapp = "";
          }
          break;

        case "fatherWhatsappSame":
          if (value) {
            updatedForm.isFatherWhatsappSameAsMobile = true;
            updatedForm.fatherWhatsapp = prev.fatherMobile;
          } else {
            updatedForm.isFatherWhatsappSameAsMobile = false;
            updatedForm.fatherWhatsapp = "";
          }
          break;

        case "motherWhatsappSame":
          if (value) {
            updatedForm.isMotherWhatappSameAsMobile = true;
            updatedForm.motherWhatsapp = prev.motherMobile;
          } else {
            updatedForm.isMotherWhatappSameAsMobile = false;
            updatedForm.motherWhatsapp = "";
          }
          break;

        case "email":
          updatedForm.email = formattedValue;
          updatedForm.isEmailValid = emailRegex.test(formattedValue)
          break;

        default:
          updatedForm[field] = formattedValue;
          break;
      }

      return updatedForm;
    });
  };

  const handleSetChange = (set, checked) => {
    setSelectedSets((prev) =>
      checked ? [...prev, { setId: set?.value, label: set?.label }] : prev.filter((s) => s.setId !== set?.value)
    );
  };

  const validateTab1 = () => {
    // return setActiveTab(tabs[1])
    let isValid = true;
    if (!selectedCondition) {
      isValid = false;
      toast.warn("Please select Board/Standard condition before proceeding.", {
        theme: theme == "light" ? "dark" : "light",
      });
      return isValid;
    }
    setActiveTab(tabs[1]);
  };

  const validateTab2 = () => {
    let isValid = true;
    if (!formData.firstName) {
      isValid = false;
      toast.warn("Please enter first name", {
        theme: theme == "light" ? "dark" : "light",
      });
      return;
    } else if (!formData.motherName) {
      toast.warn("Please enter mother's name", {
        theme: theme == "light" ? "dark" : "light",
      });
      return (isValid = false);
    } else if (!formData.fatherName) {
      toast.warn("Please enter father's name", {
        theme: theme == "light" ? "dark" : "light",
      });
      return (isValid = false);
    } else if (!formData.surname) {
      toast.warn("Please enter surname", {
        theme: theme == "light" ? "dark" : "light",
      });
      return (isValid = false);
    }
    // else if (!formData.gender) {
    //   toast.warn("Please select gender", {
    //     theme: theme == "light" ? "dark" : "light",
    //   });
    //   return (isValid = false);
    // } else if (!formData.dob) {
    //   toast.warn("Please enter birth date", {
    //     theme: theme == "light" ? "dark" : "light",
    //   });
    //   return (isValid = false);
    // } 
    else if (!formData.admissionDate) {
      toast.warn("Please enter admission date", {
        theme: theme == "light" ? "dark" : "light",
      });
      return (isValid = false);
    }
    else if (!formData.photoPath) {
      toast.warn("Please upload Student photo", {
        theme: theme == "light" ? "dark" : "light",
      });
      return (isValid = false);
    }
    else if (!formData.isEmailValid && formData.email?.length > 0) {
      toast.warn("Please enter valid email address", {
        theme: theme == "light" ? "dark" : "light",
      });
      return (isValid = false);
    } else {
      setActiveTab(tabs[2]);
      return isValid;
    }
  };

  const validateTab3 = () => {
    let isValid = true;
    if (!formData.fatherMobile) {
      toast.warn("Please enter father's mobile number", {
        theme: theme == "light" ? "dark" : "light",
      });
      return (isValid = false);
    } else if (formData?.fatherMobile?.toString()?.trim()?.length !== 10) {
      toast.warn(
        "Father's mobile number invalid. Please enter valid 10 digit mobile number",
        { theme: theme == "light" ? "dark" : "light" }
      );
      return (isValid = false);
    } else if (
      formData?.fatherWhatsapp &&
      formData?.fatherWhatsapp?.toString()?.trim()?.length !== 10
    ) {
      toast.warn(
        "Father's whatsapp number invalid. Please enter valid 10 digit mobile number",
        { theme: theme == "light" ? "dark" : "light" }
      );
      return (isValid = false);
    } else if (
      formData?.studentMobile &&
      formData?.studentMobile?.toString()?.trim()?.length !== 10
    ) {
      toast.warn(
        "Student's mobile number invalid. Please enter valid 10 digit mobile number",
        { theme: theme == "light" ? "dark" : "light" }
      );
      return (isValid = false);
    } else if (
      formData?.studentWhatsapp &&
      formData?.studentWhatsapp?.toString()?.trim()?.length !== 10
    ) {
      toast.warn(
        "Student's whatsapp number invalid. Please enter valid 10 digit mobile number",
        { theme: theme == "light" ? "dark" : "light" }
      );
      return (isValid = false);
    } else if (
      formData?.motherMobile &&
      formData?.motherMobile?.toString()?.trim()?.length !== 10
    ) {
      toast.warn(
        "Mother's mobile number invalid. Please enter valid 10 digit mobile number",
        { theme: theme == "light" ? "dark" : "light" }
      );
      return (isValid = false);
    } else if (
      formData?.motherWhatsapp &&
      formData?.motherWhatsapp?.toString()?.trim()?.length !== 10
    ) {
      toast.warn(
        "Mother's whatsapp number invalid. Please enter valid 10 digit mobile number",
        { theme: theme == "light" ? "dark" : "light" }
      );
      return (isValid = false);
    } else {
      setActiveTab(tabs[3]);
      return isValid;
    }
  };

  const validateTab4 = () => {
    let isValid = true;

    if (!formData.totalFees) {
      toast.warn("Please enter Total Fees", {
        theme: theme === "light" ? "dark" : "light",
      });
      return (isValid = false);
    }

    if (!formData.paymentType) {
      toast.warn("Please select Payment Type", {
        theme: theme === "light" ? "dark" : "light",
      });
      return (isValid = false);
    }

    if (formData.paymentType === 2 && !formData.noOfInstaments) {
      toast.warn("Please enter No. of Installments", {
        theme: theme === "light" ? "dark" : "light",
      });
      return (isValid = false);
    }

    if (!formData.paidFees) {
      toast.warn('Booking amount cannot be empty or "0" ', {
        theme: theme === "light" ? "dark" : "light",
      })
      return (isValid = false);
    }

    if (installmentErr) {
      toast.warn(instalErrMsg || "Please check installment amount", {
        theme: theme === "light" ? "dark" : "light",
      });
      return (isValid = false);
    }

    // ✅ Installment due date validation
    if (formData.paymentType === 2) {
      const missingDates = installmentData.some(
        (item) => !item.dueDate || item.dueDate.trim() === ""
      );

      if (missingDates) {
        toast.warn("Please enter Due Date for all installments", {
          theme: theme === "light" ? "dark" : "light",
        });
        return (isValid = false);
      }
    }

    // ✅ Passed all validations
    setActiveTab(tabs[4]);
    return isValid;
  };

  const handleTabSelection = (selectedTab) => {
    const currentTab = activeTab;

    const warnCondition = () =>
      toast.warn("Please select Board/Standard condition before proceeding.", {
        theme: theme === "light" ? "dark" : "light",
      });

    const runValidations = (...fns) => fns.every((fn) => fn && fn());

    switch (selectedTab) {
      case 0:
        setActiveTab(tabs[0]);
        break;

      case 1:
        if (currentTab === "Board/Standard Selection") {
          validateTab1();
        } else {
          setActiveTab(tabs[1]);
        }
        break;

      case 2:
        if (currentTab === "Basic Information") {
          validateTab2();
        } else if (currentTab === "Board/Standard Selection") {
          if (!selectedCondition) return warnCondition();
          if (validateTab2()) setActiveTab(tabs[2]);
          else setActiveTab(tabs[1]);
        } else {
          setActiveTab(tabs[2]);
        }
        break;

      case 3:
        if (currentTab === "Guardian Information") {
          validateTab3();
        } else if (currentTab === "Board/Standard Selection") {
          if (!selectedCondition) return warnCondition();
          const valid2 = validateTab2();
          const valid3 = validateTab3();
          if (runValidations(valid2, valid3)) setActiveTab(tabs[3]);
          else if (valid2 && !valid3) setActiveTab(tabs[2]);
          else setActiveTab(tabs[1]);
        } else if (currentTab === "Basic Information") {
          const valid2 = validateTab2();
          const valid3 = validateTab3();
          if (runValidations(valid2, valid3)) setActiveTab(tabs[3]);
          else if (valid2 && !valid3) setActiveTab(tabs[2]);
          else setActiveTab(tabs[1]);
        } else {
          setActiveTab(tabs[3]);
        }
        break;

      case 4:
        if (currentTab === "Fees Structure") {
          validateTab4();
        } else if (currentTab === "Guardian Information") {
          let valid1 = validateTab3();
          let valid2 = validateTab4();
          if (runValidations(valid1, valid2)) setActiveTab(tabs[4]);
          else if (valid1 && !valid2) setActiveTab(tabs[3])
          else setActiveTab(tabs[2])
        } else if (currentTab === "Board/Standard Selection") {
          if (!selectedCondition) return warnCondition();
          const valid2 = validateTab2();
          const valid3 = validateTab3();
          const valid4 = validateTab4();
          if (runValidations(valid2, valid3, valid4)) setActiveTab(tabs[3]);
          else if (valid2 && !valid3) setActiveTab(tabs[2]);
          else if (valid2 && valid3 && !valid4) setActiveTab(tabs[3])
          else setActiveTab(tabs[1]);
        } else if (currentTab === "Basic Information") {
          const valid2 = validateTab2();
          const valid3 = validateTab3();
          if (runValidations(valid2, valid3)) setActiveTab(tabs[3]);
          else if (valid2 && !valid3) setActiveTab(tabs[2]);
          else setActiveTab(tabs[1]);
        } else {
          setActiveTab(tabs[4]);
        }
        break;

      default:
        break;
    }
  };

  const saveImageAndRefersh = () => {
    setFile(null);
    setCrop({ x: 0, y: 0 });
    setCropMode(false);
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedImage(null);
    setIsPreviewOpen(false);
    setPreview("/img/profile.webp")
  };

  const handleInstallmentChange = (index, field, value) => {
    setInstallmentData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteInstallment = (index) => {
    setFormData((prev) => ({
      ...prev,
      noOfInstaments: prev.noOfInstaments - 1,
    }));

    setInstallmentData((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((item, i) => ({
        ...item,
        installmentNo: i + 1, // reassign numbers
      }));
    });
  };

  return (
    <div className="animate-fade-in mb-8 mt-12">
      <Card className="shadow-2xl">
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="mb-8 p-2 md:p-6"
        >
          <div className="flex items-center justify-between">
            <Typography variant="h4" color="white" className="font-bold">
              <i className="fas fa-user-pen mr-3" />
              Update Student
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/hod/student-list")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-2 md:px-6">
          <div className="w-full mx-auto mb-4 overflow-auto">
            <div className="flex items-center justify-center border-b border-gray-300">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => handleTabSelection(index)}
                  className={`py-2 px-6 -mb-px text-sm font-medium transition-colors ${activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500 hover:text-blue-500"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="">
            {activeTab === tabs[0] && (
              <>
                {/* board-condition-selection starts------- */}
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <Typography variant="h6" className="mb-4 text-blue-gray-700">
                    <i className="fas fa-graduation-cap mr-2" />
                    Select Board, Standard, Medium
                  </Typography>
                  <Typography variant="small" className="mb-4 text-gray-600">
                    Choose the board, standard, and medium combination for the
                    admission
                  </Typography>

                  {isLoadingConditions ? (
                    <div className="flex items-center justify-center py-8">
                      <i className="fas fa-spinner fa-spin text-2xl text-blue-gray-500" />
                      <Typography className="ml-3 text-blue-gray-700">
                        Loading board subject conditions...
                      </Typography>
                    </div>
                  ) : boardSubjectConditions.length === 0 ? (
                    <div className="py-8 text-center">
                      <Typography className="text-blue-gray-700">
                        No board subject conditions available
                      </Typography>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AsyncSelect
                        isDisabled
                        cacheOptions
                        isClearable
                        placeholder="Select Board/Standard/Medium"
                        defaultOptions={boardSubjectConditions || []}
                        value={selectedCondition}
                        onChange={(newValue) => handleConditionSelect(newValue)}
                      />
                    </div>
                  )}
                </div>
                <hr />
                <div className="flex justify-center w-full mt-3">
                  <Button
                    onClick={validateTab1}
                  >Save and Proceed</Button>
                </div>
              </>
            )}
            {activeTab === tabs[1] && (
              <>
                {/* <Typography className="my-3 text-xl md:text-2xl font-bold text-blue-600">Basic Information</Typography> */}
                <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                  <div className="col-span-6 p-2 order-2 md:order-1">
                    <div className="w-full rounded-lg border border-gray-200 p-3">
                      <div className="mb-3">
                        <Input
                          required
                          label="First Name"
                          value={formData.firstName}
                          onChange={(e) => handleTextChange("firstName", e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <Input
                          required
                          label="Mother's Name"
                          value={formData.motherName}
                          onChange={(e) => handleTextChange("motherName", e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <Input
                          required
                          label="Father's Name"
                          value={formData.fatherName}
                          onChange={(e) => handleTextChange("fatherName", e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <Input
                          required
                          label="Surname"
                          value={formData.surname}
                          onChange={(e) => handleTextChange("surname", e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <Select
                          label={<>Select Gender</>}
                          value={formData.gender}
                          onChange={(value) => handleTextChange("gender", value)}
                        >
                          <Option value="">Select an option</Option>
                          <Option value="M" >Male</Option>
                          <Option value="F" >Female</Option>
                          <Option value="O" >Other</Option>
                        </Select>
                      </div>
                      <div className="mb-3">
                        <Textarea
                          label="Address"
                          value={formData.address}
                          onChange={(e) => handleTextChange("address", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-6 p-2 order-1 md:order-2">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-gray-200 p-3">
                      {!cropMode ? (
                        <>
                          <img
                            src={croppedImage ? croppedImage : preview ? preview : ""}
                            crossOrigin="anonymous"
                            alt="profile-pic"
                            className="mb-3 h-28 w-28 rounded-full object-cover md:h-44 md:w-44"
                          />

                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="upload-photo"
                          />

                          {!isUploading && (
                            <label
                              htmlFor="upload-photo"
                              className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                            >
                              Choose Photo
                            </label>
                          )}

                          {croppedImage && (
                            <button
                              disabled={isUploading}
                              onClick={handleUpload}
                              className="mt-3 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                            >
                              {isUploading ? 'Please Wait' : 'Save'}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="relative h-64 w-full bg-black">
                          <Cropper
                            image={preview}
                            crop={crop}
                            zoom={zoom}
                            aspect={1 / 1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            cropShape="square"
                            showGrid={false}
                          />
                          <div className="absolute bottom-[-50px] left-0 right-0 flex justify-center gap-3">
                            <button
                              onClick={() => setCropMode(false)}
                              className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleCropSave}
                              className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                            >
                              Crop & Preview
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full grid grid-cols-1 md:grid-cols-12 mt-2 gap-4 mb-4">
                  <div className="col-span-12 md:col-span-3 flex flex-col items-start justify-center">
                    <label htmlFor="dob" className="text-sm mb-0.5 ms-1 font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <DatePicker
                      label="Date of Birth"
                      selected={formData.dob}
                      onChange={(date) => {
                        handleTextChange("dob", date.toISOString().split("T")[0]);
                      }}
                      showMonthDropdown
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      minDate={dayjs("1950-01-01").toDate()}
                      popperPlacement="bottom-start"
                      dateFormat="dd-MM-yy"
                      placeholderText="dd-mm-yy"
                      className="w-full border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-9 flex items-end">
                    <Input
                      label="School Name"
                      value={formData.schoolName}
                      onChange={(e) =>
                        handleTextChange("schoolName", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3 flex flex-col items-start justify-center">
                    <label htmlFor="dob" className="text-sm mb-0.5 ms-1 font-medium text-gray-700">
                      Admission Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      label="Admission Date"
                      selected={formData.admissionDate}
                      onChange={(date) => {
                        handleTextChange("admissionDate", date.toISOString().split("T")[0]);
                      }}
                      showMonthDropdown
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      minDate={dayjs("1950-01-01").toDate()}
                      popperPlacement="bottom-start"
                      dateFormat="dd-MM-yy"
                      placeholderText="dd-mm-yy"
                      className="w-full border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6 flex flex-col items-start justify-end">
                    <Input
                      label="Email Address"
                      type="text"
                      value={formData.email}
                      onChange={(e) =>
                        handleTextChange("email", e.target.value)
                      }
                      error={
                        !formData.isEmailValid && formData.email?.length > 0
                      }
                    />
                    {!formData.isEmailValid && formData.email?.length > 0 && (
                      <p className="mt-1 text-sm text-red-500">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center w-full mt-3">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="flex items-center gap-3 me-2"
                    onClick={() => setActiveTab("Board/Standard Selection")}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button
                    onClick={validateTab2}
                  >Save and Proceed</Button>
                </div>
              </>
            )}
            {activeTab === tabs[2] && (
              <>
                {/* Guardian Information starts------- */}
                <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 mt-2 mb-4">

                  <div className="col-span-12 md:col-span-6 ">
                    <Input
                      label="Father's Occupation (Optional)"
                      value={formData.fatherOccupation}
                      onChange={(e) => handleTextChange("fatherOccupation", e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6 ">
                    <Input
                      label="Mother's Occupation (Optional)"
                      value={formData.motherOccupation}
                      onChange={(e) => handleTextChange("motherOccupation", e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4 ">
                    <Input
                      label="Student's Mobile Number"
                      type="number"
                      inputMode="number"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={formData.studentMobile}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value < 0) return;
                        handleTextChange("studentMobile", value)
                      }}
                      error={formData.studentMobile?.toString()?.trim()?.length > 10}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4 ">
                    <Input
                      label="Student's Whatapp Number"
                      type="number"
                      inputMode="number"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={formData.studentWhatsapp}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value < 0) return;
                        handleTextChange("studentWhatsapp", value)
                      }}
                      error={formData.studentWhatsapp?.toString()?.trim()?.length > 10}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Checkbox
                      disabled={!formData.studentMobile}
                      label="Same as mobile number"
                      checked={formData.isStudWhatsappSameAsMobile}
                      onChange={() =>
                        handleTextChange(
                          "studWhatsappSame",
                          !formData.isStudWhatsappSameAsMobile
                        )
                      }
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      required
                      label="Father's Mobile Number"
                      type="number"
                      inputMode="number"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={formData.fatherMobile}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value < 0) return;
                        handleTextChange("fatherMobile", value)
                      }}
                      error={formData.fatherMobile?.toString()?.trim()?.length > 10}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      label="Father's Whatsapp Number"
                      type="number"
                      inputMode="number"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={formData.fatherWhatsapp}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value < 0) return;
                        handleTextChange("fatherWhatsapp", value)
                      }}
                      error={formData.fatherWhatsapp?.toString()?.trim()?.length > 10}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Checkbox
                      disabled={!formData.fatherMobile}
                      label="Same as mobile number"
                      checked={formData.isFatherWhatsappSameAsMobile}
                      onChange={() =>
                        handleTextChange(
                          "fatherWhatsappSame",
                          !formData.isFatherWhatsappSameAsMobile
                        )
                      }
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      label="Mother's Mobile Number"
                      type="number"
                      inputMode="number"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={formData.motherMobile}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value < 0) return;
                        handleTextChange("motherMobile", value)
                      }}
                      error={formData.motherMobile?.toString()?.trim()?.length > 10}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      label="Mother's Whatsapp Number"
                      type="number"
                      inputMode="number"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={formData.motherWhatsapp}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value < 0) return;
                        handleTextChange("motherWhatsapp", value)
                      }}
                      error={formData.motherWhatsapp?.toString()?.trim()?.length > 10}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Checkbox
                      disabled={!formData.motherMobile}
                      label="Same as mobile number"
                      checked={formData.isMotherWhatappSameAsMobile}
                      onChange={() =>
                        handleTextChange(
                          "motherWhatsappSame",
                          !formData.isMotherWhatappSameAsMobile
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-center w-full mt-3">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="flex items-center gap-3 me-2"
                    onClick={() => setActiveTab("Basic Information")}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button
                    onClick={validateTab3}
                  >Save and Proceed</Button>
                </div>
              </>
            )}
            {activeTab === tabs[3] && (
              <>
                <Typography className="mb-4 font-semibold">Fees Details</Typography>
                <div className="mb-4 grid w-full grid-cols-1 gap-2 md:grid-cols-12">
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      label="Total Fees"
                      required
                      type="number"
                      value={formData.totalFees === 0 ? "" : formData.totalFees}
                      onChange={(e) => {
                        let value = e.target.value;

                        if (value === "") {
                          handleTextChange("totalFees", "");
                          return;
                        }

                        // Convert to number and block negatives
                        const numValue = Number(value);
                        if (numValue < 0) return;

                        handleTextChange("totalFees", numValue);
                      }}
                      onKeyDown={(e) => {
                        // Prevent typing 'e', 'E', '+', '-'
                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                      }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <Select
                      label={
                        <>
                          Select Payment Type <span className="text-red-500">*</span>
                        </>
                      }
                      value={formData.paymentType}
                      onChange={(value) => { setFormData((prev) => ({ ...prev, paidFees: 0 })), handleTextChange("paymentType", Number(value)) }}
                    >
                      <Option value={1}>One-time Payment</Option>
                      <Option value={2}>Installments</Option>
                    </Select>
                  </div>

                  {formData.paymentType === 2 && (
                    <div className="col-span-12 md:col-span-4">
                      <Input
                        label="No. of Installments"
                        required
                        type="number"
                        value={formData.noOfInstaments || ""}
                        onChange={(e) =>
                          handleTextChange("noOfInstaments", Number(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="mb-4 grid w-full grid-cols-1 gap-2 md:grid-cols-12">
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      type="number"
                      label="Booking Amount"
                      required
                      readOnly={formData.paymentType === 1}
                      value={formData.paidFees === 0 ? "" : formData.paidFees}
                      onChange={(e) => {
                        let value = e.target.value === "" ? "" : Number(e.target.value);

                        if (value === "") {
                          handleTextChange("paidFees", "");
                          return;
                        };

                        const numValue = Number(value);
                        if (numValue < 0) return;

                        if (value > Number(formData.totalFees)) {
                          toast.warning("Paid fees cannot exceed total fees");
                          value = Number(formData.totalFees);
                        } else if (value < 0) value = 0;

                        handleTextChange("paidFees", value);
                      }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      readOnly
                      label="Remaining Fees"
                      value={formData.remainingFees}
                    />
                  </div>
                </div>

                {installmentErr && (
                  <p className="text-start text-red-500">{instalErrMsg}</p>
                )}

                {formData.paymentType === 2 &&
                  formData.noOfInstaments > 0 &&
                  installmentData.length > 0 && (
                    <div className="w-full my-4 overflow-x-auto">
                      <table className="min-w-full border border-gray-200 rounded-lg shadow-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 border-b text-left">#</th>
                            <th className="px-4 py-2 border-b text-left">
                              Expected Amount (₹)
                            </th>
                            <th className="px-4 py-2 border-b text-left">Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {installmentData.map((item, index) => (
                            <tr key={index + 1} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border-b">
                                <div className="w-full flex items-center">
                                  {item.installmentNo}
                                  {item.paymentDate && (
                                    <i className="px-2 py-1 rounded-bg-green-100 flex items-center text-green-800 text-xs font-semibold ms-2">
                                      <i className="fas fa-check-circle me-1" /> Paid
                                    </i>
                                  )}
                                  <Typography
                                    as='button'
                                    onClick={() => handleDeleteInstallment(index)}
                                    className="ms-3 text-red-500 hover:text-red-700 flex items-center text-sm font-medium"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Typography>
                                </div>
                              </td>
                              <td className="px-4 py-2 border-b">
                                <input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) =>
                                    handleInstallmentChange(
                                      index,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  onWheel={(e) => e.target.blur()}
                                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </td>
                              <td className="px-4 py-2 border-b">
                                <DatePicker
                                  selected={item.dueDate ? dayjs(item.dueDate).toDate() : null}
                                  onChange={(date) => {
                                    if (!date) return;
                                    const localDate = dayjs(date).format("YYYY-MM-DD");  // no timezone shift
                                    handleInstallmentChange(index, "dueDate", localDate);
                                  }}
                                  showMonthDropdown
                                  showYearDropdown
                                  scrollableYearDropdown
                                  yearDropdownItemNumber={100}
                                  minDate={dayjs("1950-01-01").toDate()}
                                  popperPlacement="bottom-start"
                                  dateFormat="dd-MM-yy"
                                  placeholderText="dd-mm-yy"
                                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                <div className="mt-3 flex w-full justify-center">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="me-2 flex items-center gap-3"
                    onClick={() => setActiveTab("Guardian Information")}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button onClick={validateTab4}>Save and Proceed</Button>
                </div>
              </>
            )}
            {activeTab === tabs[4] && (
              <>
                <Typography className="my-3 text-xl font-bold text-blue-600 md:text-2xl">
                  Admission Details
                </Typography>
                <Typography className="mb-1 font-semibold">
                  Select Test Series Set(s)
                </Typography>
                <div className="my-2 flex w-full">
                  {testSetData && testSetData.length > 0 ? (
                    testSetData.map((item) => (
                      <Checkbox
                        key={`set-checkbox-${item.value}`}
                        id={`set-checkbox-${item.value}`}
                        label={item.label}
                        checked={selectedSets.some(
                          (s) => s.setId === item.value
                        )}
                        onChange={(e) =>
                          handleSetChange(item, e.target.checked)
                        }
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No sets available</p>
                  )}
                </div>

                <hr className="my-4" />

                {selectedCondition && (
                  <>
                    {/* Subject Count Display */}
                    <div className="mb-6 rounded-lg bg-purple-50 p-4">
                      <div className="flex items-center justify-between">
                        <Typography variant="h6" className="text-blue-gray-700">
                          Selected Subjects: {selectedSubjects.length}
                        </Typography>
                        <Typography
                          variant="small"
                          className="text-blue-gray-600"
                        >
                          Required: {selectedCondition.minSubjectsSelectable} of{" "}
                          {selectedCondition.maxSubjectsSelectable}
                        </Typography>
                      </div>
                      {selectedCondition.selectionType === "fixed" && (
                        <Typography
                          variant="small"
                          className="mt-2 text-blue-gray-600"
                        >
                          You must select exactly{" "}
                          {selectedCondition.minSubjectsSelectable} subjects.
                        </Typography>
                      )}
                    </div>

                    {isLoadingSubjects ? (
                      <div className="flex items-center justify-center py-8">
                        <i className="fas fa-spinner fa-spin text-2xl text-blue-gray-500" />
                        <Typography className="ml-3 text-blue-gray-700">
                          Loading subjects...
                        </Typography>
                      </div>
                    ) : subjects.length === 0 ? (
                      <div className="py-8 text-center">
                        <Typography className="text-blue-gray-700">
                          No subjects available for this condition
                        </Typography>
                      </div>
                    ) : (
                      <>
                        {/* Compulsory Subjects */}
                        {compulsorySubjects.length > 0 && (
                          <div className="mb-6 rounded-lg bg-green-50 p-1 sm:p-2 md:p-4">
                            <Typography
                              variant="h6"
                              className="mb-4 text-blue-gray-700"
                            >
                              <i className="fas fa-lock mr-2" />
                              Compulsory Subjects
                            </Typography>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {compulsorySubjects.map((subject) => (
                                <div
                                  key={subject.id}
                                  className="rounded-lg border-2 border-green-300 bg-white p-1 sm:p-2"
                                >
                                  <Checkbox
                                    checked={true}
                                    disabled={true}
                                    color="green"
                                    label={
                                      <div>
                                        <Typography className="font-semibold text-blue-gray-800">
                                          {subject.name}
                                        </Typography>
                                      </div>
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Optional Subjects */}
                        {optionalSubjects.length > 0 && (
                          <div className="mb-6 rounded-lg bg-blue-50 p-1 sm:p-2 md:p-4">
                            <Typography
                              variant="h6"
                              className="mb-4 text-blue-gray-700"
                            >
                              <i className="fas fa-book mr-2" />
                              Optional Subjects
                            </Typography>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {optionalSubjects.map((subject) => {
                                const isSelected = selectedSubjects.some(
                                  (item) => item.id === subject.id
                                );
                                const isDisabled =
                                  isSubjectDisabled[subject.code] || false;

                                return (
                                  <div
                                    key={`subject-checkbox-${subject.id}`}
                                    className={`cursor-pointer rounded-lg border-2 transition-all ${isSelected
                                      ? "border-blue-500 bg-blue-100"
                                      : isDisabled
                                        ? "border-gray-200 bg-gray-100 opacity-60"
                                        : "border-gray-300 bg-white hover:border-blue-300"
                                      }`}
                                    onClick={() => {
                                      if (!isDisabled) {
                                        handleSubjectToggle(
                                          subject,
                                          subject.isCompulsory === 1
                                        );
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      id={`subject-checkbox-${subject.id}`}
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onClick={(e) => e.stopPropagation()} // prevent triggering parent click
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (!isDisabled) {
                                          handleSubjectToggle(
                                            subject,
                                            subject.isCompulsory === 1
                                          );
                                        }
                                      }}
                                      color={sidenavColor}
                                      label={
                                        <div
                                          className="w-[265px]"
                                          onClick={() => {
                                            if (!isDisabled) {
                                              handleSubjectToggle(
                                                subject,
                                                subject.isCompulsory === 1
                                              );
                                            }
                                          }}
                                        >
                                          <Typography className="py-2 pe-36 font-semibold text-blue-gray-800">
                                            {subject.name}
                                          </Typography>
                                        </div>
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                <div className="mt-4 flex justify-center">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="me-2 flex items-center gap-3"
                    onClick={() => setActiveTab("Fees Structure")}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button
                    color={"green"}
                    size="sm"
                    className="flex items-center gap-3"
                    onClick={validateSelection}
                  >
                    <i className="fas fa-check-circle text-xl" />
                    Save
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>
      <Suspense>
        <UpdatePreview
          open={isPreviewOpen}
          handleClose={() => setIsPreviewOpen(false)}
          formData={formData}
          setFormData={setFormData}
          selectedCondition={selectedCondition}
          setSelectedCondition={setSelectedCondition}
          selectedSubjects={selectedSubjects || []}
          setSelectedSubjects={setSelectedSubjects}
          tabs={tabs}
          selectedSets={selectedSets}
          setSelectedSets={setSelectedSets}
          setTabs={setActiveTab}
          saveImageAndRefersh={saveImageAndRefersh}
          installmentData={installmentData}
          setInstallmentData={setInstallmentData}
        />
      </Suspense>
    </div>
  );
}
