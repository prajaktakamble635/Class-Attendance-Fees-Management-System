import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import {
  checkDocumentMimeType,
  checkFileSize,
  maxSelectFile,
} from "@/hooks/fileValidationUtils";
import getCroppedImg from "@/hooks/getCroppedImg";
import AddPreview from "@/page-sections/admin/admission/add-preview";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Input,
  Option,
  Select,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import axios from "axios";
import dayjs from "dayjs";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cropper from "react-easy-crop";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";

export default function AddAdmissionHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const fileInputRef = useRef(null);
  const imageRef = useRef(null)

  // State management
  const [boardSubjectConditions, setBoardSubjectConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedMedium, setSelectedMedium] = useState("");
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
  const [uploadPhotoTag, setUploadPhotoTag] = useState(null);
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
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
  const [testSetData, setTestSetData] = useState([]);
  const [selectedSets, setSelectedSets] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const tabs = [
    "Board/Standard Selection",
    "Basic Information",
    "Guardian Information",
    "Subject Selection",
    "Fees Structure",
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [installmentData, setInstallmentData] = useState([]);
  const [installmentErr, setInstallmentErr] = useState(false);
  const [instalErrMsg, setInstalErrMsg] = useState("");

  // Fetch board subject conditions on component mount
  useEffect(() => {
    fetchBoardSubjectConditions();
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSetData`
      ),
    ]).then(([res]) => {
      setTestSetData(res.data.setData);
    });
  }, []);

  const boards = useMemo(() => {
    const unique = new Set();
    return boardSubjectConditions.filter(c => {
      if (!c.boardName) return false;
      if (unique.has(c.boardName)) return false;
      unique.add(c.boardName);
      return true;
    }).map(c => c.boardName);
  }, [boardSubjectConditions]);

  const standards = useMemo(() => {
    if (!selectedBoard) return [];
    const unique = new Set();
    const stds = boardSubjectConditions.filter(c => {
      if (c.boardName !== selectedBoard) return false;
      if (!c.standard) return false;
      if (unique.has(c.standard)) return false;
      unique.add(c.standard);
      return true;
    }).map(c => c.standard);
    
    // Sort standards (e.g., 7th, 8th, 9th, 10th) numerically
    return stds.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [boardSubjectConditions, selectedBoard]);

  const mediums = useMemo(() => {
    if (!selectedBoard || !selectedStandard) return [];
    const unique = new Set();
    return boardSubjectConditions.filter(c => {
      if (c.boardName !== selectedBoard || c.standard !== selectedStandard) return false;
      const med = c.medium || "None";
      if (unique.has(med)) return false;
      unique.add(med);
      return true;
    }).map(c => c.medium || "None");
  }, [boardSubjectConditions, selectedBoard, selectedStandard]);

  // Auto-select medium if there's only 1 option (e.g. for CBSE, ICSE)
  useEffect(() => {
    if (mediums.length === 1 && selectedMedium !== mediums[0]) {
      setSelectedMedium(mediums[0]);
    }
  }, [mediums, selectedMedium]);

  useEffect(() => {
    if (selectedBoard && selectedStandard && selectedMedium) {
      const match = boardSubjectConditions.find(c => 
        c.boardName === selectedBoard && 
        c.standard === selectedStandard && 
        (c.medium || "None") === selectedMedium
      );
      if (match && match.id !== selectedCondition?.id) {
        handleConditionSelect(match);
      }
    } else {
      setSelectedCondition(null);
      setSubjects([]);
      setSelectedSubjects([]);
    }
  }, [selectedBoard, selectedStandard, selectedMedium, boardSubjectConditions]);

  //-------installments--logic-------------------

  // useEffect(() => {
  //   const { paymentType, totalFees, paidFees, noOfInstaments } = formData;

  //   // Convert safely (empty string → NaN instead of 0)
  //   const total = totalFees === "" ? NaN : Number(totalFees);
  //   const paid = paidFees === "" ? NaN : Number(paidFees);
  //   const count = Number(noOfInstaments);

  //   // 🟢 If totalFees is empty, reset dependent states and exit early
  //   if (isNaN(total)) {
  //     setInstallmentData([]);
  //     setFormData((prev) => ({
  //       ...prev,
  //       remainingFees: "",
  //     }));
  //     return;
  //   }

  //   // 🟢 Case 1: Onetime payment
  //   if (paymentType === 1) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       paidFees: total || 0,
  //       remainingFees: 0,
  //     }));
  //     setInstallmentData([]);
  //     setInstallmentErr(false);
  //     setInstalErrMsg("");
  //     return;
  //   }

  //   // 🟢 Case 2: Full payment under installment mode
  //   if (paymentType === 2 && paid === total && !isNaN(paid)) {
  //     const fullInstallment = [
  //       {
  //         installmentNo: 1,
  //         dueDate: new Date().toISOString().split("T")[0],
  //         paymentDate: new Date().toISOString().split("T")[0],
  //         amount: total,
  //       },
  //     ];

  //     setFormData((prev) => ({
  //       ...prev,
  //       remainingFees: 0,
  //       noOfInstaments: 1,
  //     }));

  //     setInstallmentData(fullInstallment);
  //     setInstallmentErr(false);
  //     setInstalErrMsg("");
  //     return;
  //   }

  //   // 🟢 Case 3: Invalid or zero installments
  //   if (!count || count <= 0) {
  //     setInstallmentData([]);
  //     return;
  //   }

  //   // 🟢 Case 4: Partial payment in installment mode
  //   let newInstallments = Array.from({ length: count }).map((_, index) => ({
  //     installmentNo: index + 1,
  //     dueDate: "",
  //     amount: 0,
  //     paymentDate: "",
  //     paidStatus: 1,
  //   }));

  //   if (paymentType === 2 && !isNaN(total)) {
  //     const remaining = total - (isNaN(paid) ? 0 : paid);
  //     setFormData((prev) => ({ ...prev, remainingFees: remaining > 0 ? remaining : 0 }));

  //     if (remaining <= 0) {
  //       setInstallmentData(newInstallments);
  //       return;
  //     }

  //     if (!isNaN(paid) && paid > 0) {
  //       // First installment = paidFees
  //       const remainingAfterPaid = remaining - paid;
  //       const perInstallment = parseFloat((remainingAfterPaid / (count - 1)).toFixed(2));

  //       newInstallments = newInstallments.map((item, index) => {
  //         if (index === 0) {
  //           return {
  //             ...item,
  //             dueDate: new Date().toISOString().split("T")[0],
  //             paymentDate: new Date().toISOString().split("T")[0],
  //             amount: paid,
  //             paidStatus: 2,
  //           };
  //         }
  //         return {
  //           ...item,
  //           dueDate: null,
  //           paymentDate: null,
  //           amount: perInstallment,
  //           paidStatus: 1,
  //         };
  //       });
  //     } else {
  //       // No paidFees → evenly distribute remaining
  //       const perInstallment = parseFloat((remaining / count).toFixed(2));
  //       newInstallments = newInstallments.map((item) => ({
  //         ...item,
  //         amount: perInstallment,
  //       }));
  //     }

  //     setInstallmentData(newInstallments);
  //   }
  // }, [
  //   formData.paymentType,
  //   formData.totalFees,
  //   formData.paidFees,
  //   formData.noOfInstaments,
  // ]);

  // // 🟣 Validation effect
  // useEffect(() => {
  //   if (!installmentData.length || formData.paymentType !== 2) return;

  //   const total = formData.totalFees === "" ? NaN : Number(formData.totalFees);
  //   const paid = formData.paidFees === "" ? NaN : Number(formData.paidFees);

  //   // If total or paid is invalid, skip validation
  //   if (isNaN(total) || isNaN(paid)) {
  //     setInstallmentErr(false);
  //     setInstalErrMsg("");
  //     return;
  //   }

  //   // Skip validation if full payment already made
  //   if (paid === total) {
  //     setInstallmentErr(false);
  //     setInstalErrMsg("");
  //     return;
  //   }

  //   const remaining = total - paid;
  //   let totalInstalSum = installmentData.reduce(
  //     (acc, cur) => acc + Number(cur.amount),
  //     0
  //   );

  //   if (paid) {
  //     totalInstalSum -= paid;
  //   }

  //   if (totalInstalSum !== remaining) {
  //     setInstallmentErr(true);
  //     setInstalErrMsg(
  //       totalInstalSum > remaining
  //         ? "The total of all installments exceeds the remaining amount."
  //         : "The total of all installments is less than the remaining amount."
  //     );
  //   } else {
  //     setInstallmentErr(false);
  //     setInstalErrMsg("");
  //   }
  // }, [installmentData, formData.paymentType, formData.totalFees, formData.paidFees]);

  //-------installmenst-new-logic-----------------

  useEffect(() => {
    const { paymentType, totalFees, paidFees, noOfInstaments, discount } = formData;

    const total = totalFees === "" ? NaN : Number(totalFees);
    const paid = paidFees === "" ? NaN : Number(paidFees);
    const disc = discount === "" ? 0 : Number(discount);
    const finalTotal = isNaN(total) ? NaN : Math.max(0, total - disc);
    let count = Number(noOfInstaments);

    // 🟢 Reset when totalFees not entered
    if (isNaN(total)) {
      setInstallmentData([]);
      setFormData((prev) => ({ ...prev, remainingFees: "" }));
      return;
    }

    // 🟢 One-time payment mode
    if (paymentType === 1) {
      setFormData((prev) => ({
        ...prev,
        paidFees: finalTotal || 0,
        remainingFees: 0,
      }));
      setInstallmentData([]);
      setInstallmentErr(false);
      setInstalErrMsg("");
      return;
    }

    // 🟢 Installment mode but full payment already made
    if (paymentType === 2 && paid === finalTotal && !isNaN(paid)) {
      setFormData((prev) => ({
        ...prev,
        remainingFees: 0,
        noOfInstaments: 0,
      }));
      setInstallmentData([]);
      setInstallmentErr(false);
      setInstalErrMsg("");
      return;
    }

    // 🟢 Invalid or empty installment count
    if (!count || count <= 0) {
      if (!installmentData.some((i) => i.amount > 0)) {
        setInstallmentData([]);
      }
      return;
    }

    // 🟢 Installment mode – manual entry
    if (paymentType === 2 && !isNaN(total)) {
      const remaining = finalTotal - (isNaN(paid) ? 0 : paid);
      setFormData((prev) => ({ ...prev, remainingFees: remaining > 0 ? remaining : 0 }));

      // Create empty installment placeholders
      let newInstallments = []
      let prevInstallments = installmentData.filter((i) => i.amount > 0);
      const prevLength = prevInstallments.length;
      if (prevInstallments.length > 0) {
        let remainingCount = count - prevLength;

        if (count < prevLength) {
          prevInstallments = prevInstallments.slice(0, count);
          remainingCount = 0;
        }

        if (remainingCount > 0) {
          newInstallments = Array.from({ length: remainingCount }).map((_, index) => ({
            installmentNo: prevInstallments.length + index + 1, // continue numbering
            dueDate: "",
            amount: "",
            paymentDate: null,
            paidStatus: 1, // unpaid by default
          }));
        }
      } else {
        // First time setup
        newInstallments = Array.from({ length: count }).map((_, index) => ({
          installmentNo: index + 1,
          dueDate: "",
          amount: "",
          paymentDate: null,
          paidStatus: 1,
        }));
      }

      setInstallmentData([...prevInstallments, ...newInstallments]);
    }

    // if (paymentType === 2 && !isNaN(total)) {
    //   const remaining = total - (isNaN(paid) ? 0 : paid);
    //   setFormData((prev) => ({
    //     ...prev,
    //     remainingFees: remaining > 0 ? remaining : 0,
    //   }));

    //   setInstallmentData((prevInstallments) => {
    //     let updatedInstallments = [...prevInstallments];

    //     // if new count > existing length → add more
    //     if (count > prevInstallments.length) {
    //       const remainingCount = count - prevInstallments.length;
    //       const newInstallments = Array.from({ length: remainingCount }).map(
    //         (_, index) => ({
    //           installmentNo: prevInstallments.length + index + 1,
    //           dueDate: "",
    //           amount: 0,
    //           paymentDate: null,
    //           paidStatus: 1, // unpaid
    //         })
    //       );

    //       updatedInstallments = [...prevInstallments, ...newInstallments];
    //     }
    //     // if new count < existing length → remove extras
    //     else if (count < prevInstallments.length) {
    //       updatedInstallments = prevInstallments.slice(0, count);
    //     }

    //     return updatedInstallments;
    //   });
    // }


  }, [
    formData.paymentType,
    formData.totalFees,
    formData.paidFees,
    formData.noOfInstaments,
    formData.discount,
  ]);

  // 🟣 VALIDATION EFFECT
  useEffect(() => {
    if (!installmentData.length || formData.paymentType !== 2) return;

    const total = Number(formData.totalFees || 0);
    const disc = Number(formData.discount || 0);
    const finalTotal = Math.max(0, total - disc);
    const paid = Number(formData.paidFees || 0);

    // Skip validation if total or paid is invalid
    if (isNaN(total) || isNaN(paid)) {
      setInstallmentErr(false);
      setInstalErrMsg("");
      return;
    }

    const sumInstallments = installmentData.reduce(
      (acc, cur) => acc + (Number(cur.amount) || 0),
      0
    );

    const totalCalculated = paid + sumInstallments;

    if (totalCalculated !== finalTotal) {
      setInstallmentErr(true);
      setInstalErrMsg(
        totalCalculated > finalTotal
          ? `Installments exceed Final Total Fees (by ₹${(totalCalculated - finalTotal).toFixed(2)})`
          : `Installments are less than Final Total Fees (by ₹${(finalTotal - totalCalculated).toFixed(2)})`
      );
    } else {
      setInstallmentErr(false);
      setInstalErrMsg("");
    }
  }, [installmentData, formData.paymentType, formData.totalFees, formData.paidFees, formData.discount]);


  // loadConditions no longer needed as we use 3 distinct selects

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
            boardSubjectConditionsId: condition.id,
          },
        }
      );

      if (response.data.success) {
        setSubjects(response.data.data);

        // Auto-select compulsory and default subjects
        const autoSelected = response.data.data
          .filter(
            (sub) => sub.isCompulsory === 1 || sub.isDefaultSelected === 1
          )
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

    setSelectedSubjects((prev) => {
      if (prev.some((i) => i.id === subject?.id)) {
        // remove the subject
        return prev.filter((s) => s.id !== subject?.id); // note: !==
      } else {
        // add the subject
        return [...prev, { code: subject.code, id: subject.id }];
      }
    });
  };

  // Get compulsory and optional subjects
  const compulsorySubjects = useMemo(
    () => subjects.filter((sub) => sub.isCompulsory === 1),
    [subjects]
  );

  const optionalSubjects = useMemo(
    () => subjects.filter((sub) => sub.isCompulsory !== 1),
    [subjects]
  );

  const availableAddons = useMemo(() => {
    if (!selectedBoard || !selectedStandard) return [];
    const board = selectedBoard.toLowerCase();
    const std = selectedStandard.replace(/\D/g, ''); 
    const medium = selectedMedium?.toLowerCase() || "";
    const conditionName = selectedCondition?.name?.toLowerCase() || "";

    const addons = [];
    if (board.includes("ssc") || board.includes("state") || board.includes("cbse") || board.includes("icse")) {
      addons.push("Foundation Batch (NEET/JEE)");
    } else if (board.includes("hsc") && (medium.includes("science") || conditionName.includes("science"))) {
      addons.push("CET");
      if (std === '12') {
        addons.push("CET Crash Course");
      }
    }
    return addons;
  }, [selectedBoard, selectedStandard, selectedMedium, selectedCondition]);

  // Auto-calculate total fees based on combination
  const calculateTotalFee = useCallback(() => {
    if (!selectedBoard || !selectedStandard) return 0;
    
    const board = selectedBoard.toLowerCase();
    const std = selectedStandard.replace(/\D/g, ''); 
    const medium = selectedMedium?.toLowerCase() || "";
    const conditionName = selectedCondition?.name?.toLowerCase() || "";
    const subjectCount = selectedSubjects.length;

    let fee = 0;

    // Check for Crash Course
    const isCrashCourse = conditionName.includes("crash") || selectedSets.some(s => s.label?.toLowerCase().includes("crash")) || selectedAddons.includes("CET Crash Course");

    if (isCrashCourse) {
      if (subjectCount >= 4) fee = 60000;
      else fee = 50000;
      return fee;
    }

    if (board.includes("hsc")) {
      if (medium.includes("commerce") || conditionName.includes("commerce")) {
        if (std === '11') {
          if (subjectCount >= 4) fee = 18000;
          else if (subjectCount === 3) fee = 15000;
          else fee = 10000;
        } else if (std === '12') {
          if (subjectCount >= 4) fee = 25000;
          else if (subjectCount === 3) fee = 18000;
          else fee = 12000;
        }
      } else if (medium.includes("science") || conditionName.includes("science")) {
        const hasMath = selectedSubjects.some(s => s.code?.toLowerCase().includes('mat'));
        const hasBio = selectedSubjects.some(s => s.code?.toLowerCase().includes('bio'));
        const isPCMB = hasMath && hasBio;
        const isCET = selectedSets.length > 0 || conditionName.includes("cet") || selectedAddons.includes("CET");

        if (std === '11') {
          if (isPCMB && isCET) fee = 45000;
          else if (isPCMB && !isCET) fee = 42000;
          else if (!isPCMB && isCET) fee = 38000;
          else if (!isPCMB && !isCET) fee = 32000;
        } else if (std === '12') {
          if (isPCMB && isCET) fee = 60000;
          else if (isPCMB && !isCET) fee = 48000;
          else if (!isPCMB && isCET) fee = 48000;
          else if (!isPCMB && !isCET) fee = 38000;
        }
      }
    } else if (board.includes("ssc") || board.includes("state") || board.includes("cbse") || board.includes("icse")) {
      let baseFee = 0;
      
      if (board.includes("cbse") || board.includes("icse")) {
        const fees = { '7': 18000, '8': 20000, '9': 25000, '10': 28000 };
        baseFee = fees[std] || 0;
      } else {
        if (medium.includes("marathi")) {
          const fees = { '7': 15000, '8': 17000, '9': 20000, '10': 23000 };
          baseFee = fees[std] || 0;
        } else if (medium.includes("semi")) {
          const fees = { '7': 16000, '8': 18000, '9': 22000, '10': 24000 };
          baseFee = fees[std] || 0;
        } else {
          // English is default
          const fees = { '7': 17000, '8': 18000, '9': 23000, '10': 25000 };
          baseFee = fees[std] || 0;
        }
      }

      // Check Foundation Batch
      const isFoundation = conditionName.includes("foundation") || medium.includes("foundation") || selectedSets.some(s => s.label?.toLowerCase().includes("foundation")) || selectedAddons.includes("Foundation Batch (NEET/JEE)");
      let foundationFee = 0;
      if (isFoundation) {
        const fFees = { '7': 4000, '8': 4000, '9': 5000, '10': 6000 };
        foundationFee = fFees[std] || 0;
      }

      fee = baseFee + foundationFee;
    }
    
    return fee;
  }, [selectedBoard, selectedStandard, selectedMedium, selectedCondition, selectedSubjects, selectedSets, selectedAddons]);

  useEffect(() => {
    const fee = calculateTotalFee();
    if (fee > 0) {
      setFormData(prev => ({
        ...prev,
        totalFees: fee
      }));
    }
  }, [calculateTotalFee]);


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
            if (selectedSubjects.some((item) => item.code === code1)) {
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
              if (selectedSubjects.some((item) => item.code === triggerCode)) {
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
      return toast.warn("Please enter First Name");
    }
    if (!formData.motherName) {
      return toast.warn("Please enter Mother's Name");
    }
    if (!formData.fatherName) {
      return toast.warn("Please enter Father's Name");
    }
    if (!formData.surname) {
      return toast.warn("Please enter Surname Name");
    }
    // if (!formData.dob) {
    //   return toast.warn("Please enter Birth Date");
    // }
    if (!formData.fatherMobile) {
      return toast.warn("Please enter father's mobile number.");
    }
    if (
      formData.studentMobile &&
      formData.studentMobile?.toString()?.trim()?.length !== 10
    ) {
      return toast.warn("Student mobile number is invalid.");
    }
    if (
      formData.studentWhatsapp &&
      formData.studentWhatsapp?.toString()?.trim()?.length !== 10
    ) {
      return toast.warn("Student whatsapp number is invalid.");
    }
    if (formData.fatherMobile?.toString()?.trim()?.length !== 10) {
      return toast.warn("Father mobile number is invalid.");
    }
    if (
      formData.fatherWhatsapp &&
      formData.fatherWhatsapp?.toString()?.trim()?.length !== 10
    ) {
      return toast.warn("Father whatsapp number is invalid.");
    }
    if (
      formData.motherMobile &&
      formData.motherMobile?.toString()?.trim()?.length !== 10
    ) {
      return toast.warn("Mother mobile number is invalid.");
    }
    if (
      formData.motherWhatsapp &&
      formData.motherWhatsapp?.toString()?.trim()?.length !== 10
    ) {
      return toast.warn("Mother whatsapp number is invalid.");
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return toast.warn("Please enter valid email address");
    }

    if (selectedSets.length === 0) {
      return toast.warn("Please select atleast one SET out of 3")
    }

    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject", { theme });
      return;
    }

    if (!formData.paymentType) {
      toast.error("Please select a Payment Type", { theme });
      return;
    }

    if (formData.paymentType === 2) {
      if (!formData.noOfInstaments) {
        toast.warn("Please enter the number of installments");
        return;
      }
      if (installmentData.length === 0) {
        toast.warn("Please add installment details");
        return;
      }
      if (installmentErr) {
        toast.warn(instalErrMsg);
        return;
      }
      const invalidInstallment = installmentData.some(inst => !inst.dueDate || !inst.amount || Number(inst.amount) <= 0);
      if (invalidInstallment) {
        toast.warn("Please fill in due date and a valid amount for all installments");
        return;
      }
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

            if (
              condition.when_selected_all &&
              Array.isArray(condition.when_selected_all)
            ) {
              triggerSubs = condition.when_selected_all;
              // For when_selected_all: ALL subjects must be selected
              shouldCheckTotal = triggerSubs.every((code) =>
                selectedSubjects.some((item) => item.code === code)
              );
            } else if (
              condition.when_selected &&
              Array.isArray(condition.when_selected)
            ) {
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
      setIsPreviewOpen(true);
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
      const fileToUpload = new File([blob], "profile.jpg", {
        type: "image/jpeg",
      });

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

      // Feedback + cleanup
      toast.success("Profile photo uploaded successfully!");
      setCropMode(false);
      let tag = document.getElementById("upload-photo");
      setUploadPhotoTag(tag)
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
          updatedForm.isEmailValid = emailRegex.test(formattedValue);
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
      checked
        ? [...prev, { setId: set?.value, label: set?.label }]
        : prev.filter((s) => s.setId !== set?.value)
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
    };


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

    const runValidations = (...items) => items.every((item) => {
      if (typeof item === 'function') return item();
      return !!item;
    });

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

      case 3: // Subject Selection
        if (currentTab === "Guardian Information") {
          if (validateTab3()) setActiveTab(tabs[3]);
        } else if (currentTab === "Fees Structure") {
          setActiveTab(tabs[3]);
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

      case 4: // Fees Structure
        const validateTabSubjects = () => {
          if (selectedSubjects.length === 0) {
            toast.warn("Please select at least one subject", { theme: theme === "light" ? "dark" : "light" });
            return false;
          }
          return true;
        };

        if (currentTab === "Subject Selection") {
          if (validateTabSubjects()) setActiveTab(tabs[4]);
        } else if (currentTab === "Guardian Information") {
          let valid1 = validateTab3();
          let valid2 = validateTabSubjects();
          if (runValidations(valid1, valid2)) setActiveTab(tabs[4]);
          else if (valid1 && !valid2) setActiveTab(tabs[3]);
          else setActiveTab(tabs[2]);
        } else if (currentTab === "Board/Standard Selection") {
          if (!selectedCondition) return warnCondition();
          const valid2 = validateTab2();
          const valid3 = validateTab3();
          const valid4 = validateTabSubjects();
          if (runValidations(valid2, valid3, valid4)) setActiveTab(tabs[4]);
          else if (valid2 && !valid3) setActiveTab(tabs[2]);
          else if (valid2 && valid3 && !valid4) setActiveTab(tabs[3]);
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

  const resetFileRef = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  };

  const handleInstallmentChange = (index, field, value) => {
    setInstallmentData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
              <i className="fas fa-user-plus mr-3" />
              Add New Admission
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/superAdmin/student-list")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-table-list" />
              View Student List
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-2 md:px-6">
          <div className="mx-auto mb-4 w-full overflow-auto">
            <div className="flex items-center justify-center border-b border-gray-300">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => handleTabSelection(index)}
                  // onClick={()=>setActiveTab(tab)}
                  className={`-mb-px px-6 py-2 text-sm font-medium transition-colors ${activeTab === tab
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
                <div className="mb-6 rounded-lg bg-blue-gray-50 p-6">
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-blue-gray-500 mb-1 block">Select Board</label>
                          <ReactSelect
                            placeholder="Select Board"
                            value={selectedBoard ? { value: selectedBoard, label: selectedBoard } : null}
                            options={boards.map(b => ({ value: b, label: b }))}
                            onChange={(option) => {
                              setSelectedBoard(option ? option.value : "");
                              setSelectedStandard("");
                              setSelectedMedium("");
                            }}
                            isClearable
                            className="text-sm"
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '40px',
                                borderRadius: '0.375rem',
                              })
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-blue-gray-500 mb-1 block">Select Standard</label>
                          <ReactSelect
                            placeholder="Select Standard"
                            value={selectedStandard ? { value: selectedStandard, label: selectedStandard } : null}
                            options={standards.map(s => ({ value: s, label: s }))}
                            isDisabled={!selectedBoard}
                            onChange={(option) => {
                              setSelectedStandard(option ? option.value : "");
                              setSelectedMedium("");
                            }}
                            isClearable
                            className="text-sm"
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '40px',
                                borderRadius: '0.375rem',
                              })
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-blue-gray-500 mb-1 block">
                            {selectedBoard === "HSC" ? "Select Stream" : "Select Medium"}
                          </label>
                          <ReactSelect
                            placeholder={selectedBoard === "HSC" ? "Select Stream" : "Select Medium"}
                            value={selectedMedium ? { value: selectedMedium, label: selectedMedium === "None" ? "Not Applicable" : selectedMedium } : null}
                            options={mediums.map(m => ({ value: m, label: m === "None" ? "Not Applicable" : m }))}
                            isDisabled={!selectedStandard}
                            onChange={(option) => setSelectedMedium(option ? option.value : "")}
                            isClearable
                            className="text-sm"
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '40px',
                                borderRadius: '0.375rem',
                              })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <hr />
                <div className="mt-3 flex w-full justify-center">
                  <Button onClick={validateTab1}>Save and Proceed</Button>
                </div>
                {/* board-condition-selection ends------- */}
              </>
            )}
            {activeTab === tabs[1] && (
              <>
                {/* <Typography className="my-3 text-xl md:text-2xl font-bold text-blue-600">Basic Information</Typography> */}
                <div className="mt-2 grid w-full grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="order-2 col-span-6 p-2 md:order-1">
                    <div className="w-full rounded-lg border border-gray-200 p-3">
                      <div className="mb-3">
                        <Input
                          required
                          label="First Name"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleTextChange("firstName", e.target.value)
                          }
                          className="caret-black text-black bg-white"
                        />
                      </div>
                      <div className="mb-3">
                        <Input
                          required
                          label="Mother's Name"
                          value={formData.motherName}
                          onChange={(e) =>
                            handleTextChange("motherName", e.target.value)
                          }
                          className="caret-black text-black bg-white"
                        />
                      </div>
                      <div className="mb-3">
                        <Input
                          required
                          label="Father's Name"
                          value={formData.fatherName}
                          onChange={(e) =>
                            handleTextChange("fatherName", e.target.value)
                          }
                          className="caret-black text-black bg-white"
                        />
                      </div>
                      <div className="mb-3">
                        <Input
                          required
                          label="Surname"
                          value={formData.surname}
                          onChange={(e) =>
                            handleTextChange("surname", e.target.value)
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <Select
                          label={
                            <>
                              Select Gender
                              {/* <span className="ms-1 text-red-500">*</span> */}
                            </>
                          }
                          value={formData.gender}
                          onChange={(value) =>
                            handleTextChange("gender", value)
                          }
                        >
                          <Option value="">Select an option</Option>
                          <Option value="M">Male</Option>
                          <Option value="F">Female</Option>
                          <Option value="O">Other</Option>
                        </Select>
                      </div>
                      <div className="mb-3">
                        <Textarea
                          label="Address"
                          value={formData.address}
                          onChange={(e) =>
                            handleTextChange("address", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="order-1 col-span-6 p-2 md:order-2">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-gray-200 p-3">
                      {!cropMode ? (
                        <>
                          <img
                            ref={imageRef}
                            src={croppedImage ? croppedImage : preview ? preview : ""}
                            alt="profile-pic"
                            className="mb-3 h-28 w-28 rounded-full object-cover md:h-44 md:w-44"
                          />

                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="upload-photo"
                          />

                          {!isUploading && (
                            <>
                              <label
                                htmlFor="upload-photo"
                                className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                              >
                                Choose Photo
                              </label>
                              {/* <span className="text-red-600 text-sm mt-1">(Required)</span> */}
                            </>
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
                            aspect={1 / 1} // square crop for profile photo
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
                <div className="mb-4 mt-2 ms-0 md:ms-2 grid w-full grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="col-span-12 md:col-span-3 flex flex-col items-start justify-center">
                    <label htmlFor="dob" className="text-sm mb-0.5 ms-1 font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <DatePicker
                      label="Date of Birth"
                      selected={formData.dob}
                      onChange={(date) => {
                        if (!date) return;
                        const localDate = date.toLocaleDateString('en-CA');
                        handleTextChange("dob", localDate);
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
                      label="Date of Birth"
                      selected={formData.admissionDate}
                      onChange={(date) => {
                        if (!date) return;
                        const localDate = date.toLocaleDateString('en-CA');
                        handleTextChange("admissionDate", localDate);
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
                <div className="mt-3 flex w-full justify-center">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="me-2 flex items-center gap-3"
                    onClick={() => setActiveTab("Board/Standard Selection")}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button
                    onClick={validateTab2}
                  // onClick={saveImageAndRefersh}
                  >Save and Proceed</Button>
                </div>
              </>
            )}
            {activeTab === tabs[2] && (
              <>
                {/* Guardian Information starts------- */}
                <div className="mb-4 mt-2 grid w-full grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="col-span-12 md:col-span-6 ">
                    <Input
                      label="Father's Occupation (Optional)"
                      value={formData.fatherOccupation}
                      onChange={(e) =>
                        handleTextChange("fatherOccupation", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6 ">
                    <Input
                      label="Mother's Occupation (Optional)"
                      value={formData.motherOccupation}
                      onChange={(e) =>
                        handleTextChange("motherOccupation", e.target.value)
                      }
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
                        handleTextChange("studentMobile", value);
                      }}
                      error={
                        formData.studentMobile?.toString()?.trim()?.length > 10
                      }
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
                        handleTextChange("studentWhatsapp", value);
                      }}
                      error={
                        formData.studentWhatsapp?.toString()?.trim()?.length >
                        10
                      }
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
                        handleTextChange("fatherMobile", value);
                      }}
                      error={
                        formData.fatherMobile?.toString()?.trim()?.length > 10
                      }
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
                        handleTextChange("fatherWhatsapp", value);
                      }}
                      error={
                        formData.fatherWhatsapp?.toString()?.trim()?.length > 10
                      }
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
                        handleTextChange("motherMobile", value);
                      }}
                      error={
                        formData.motherMobile?.toString()?.trim()?.length > 10
                      }
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
                        handleTextChange("motherWhatsapp", value);
                      }}
                      error={
                        formData.motherWhatsapp?.toString()?.trim()?.length > 10
                      }
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
                <div className="mt-3 flex w-full justify-center">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="me-2 flex items-center gap-3"
                    onClick={() => setActiveTab("Basic Information")}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button onClick={validateTab3}>Save and Proceed</Button>
                </div>
              </>
            )}
            {activeTab === tabs[4] && (
              <>
                <Typography className="mb-4 font-semibold">Fees Details</Typography>
                
                <div className="mb-4 rounded-lg bg-blue-50 p-4">
                  <Typography variant="h6" className="text-blue-gray-700 mb-2">
                    Selected Subjects ({selectedSubjects.length})
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((s, i) => (
                      <span key={i} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                        {s.label || s.name || s.code}
                      </span>
                    ))}
                  </div>
                </div>

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
                    <Input
                      label="Discount"
                      type="number"
                      value={formData.discount === 0 ? "" : formData.discount}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value === "") return handleTextChange("discount", "");
                        const numValue = Number(value);
                        if (numValue < 0) return;
                        if (numValue > Number(formData.totalFees)) {
                          toast.warning("Discount cannot exceed total fees");
                          return handleTextChange("discount", Number(formData.totalFees));
                        }
                        handleTextChange("discount", numValue);
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
                        onWheel={(e) => e.target.blur()}
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
                      readOnly
                      label="Final Fees"
                      value={Math.max(0, Number(formData.totalFees || 0) - Number(formData.discount || 0))}
                    />
                  </div>
                </div>

                {(installmentErr && formData.totalFees > 0) && (
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
                            <tr key={index} className="hover:bg-gray-50">
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
                                  onChange={(e) => {
                                    let value = e.target.value;

                                    // Remove leading zeros, but allow "0" itself
                                    if (value.length > 1 && value.startsWith("0")) {
                                      value = value.replace(/^0+/, "");
                                    }

                                    handleInstallmentChange(index, "amount", value);
                                  }
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
                    onClick={() => setActiveTab(tabs[3])}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button
                    color={"green"}
                    className="flex items-center gap-3"
                    onClick={validateSelection}
                  >
                    <i className="fas fa-check-circle text-xl" />
                    Submit
                  </Button>
                </div>
              </>
            )}
            {activeTab === tabs[3] && (
              <>
                <Typography className="my-3 text-xl font-bold text-blue-600 md:text-2xl">
                  Admission Details
                </Typography>
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
                      <div className="mb-6 w-full">
                        <label className="text-sm font-semibold text-blue-gray-700 mb-2 block">
                          Select Subjects
                        </label>
                        <ReactSelect
                          isMulti
                          placeholder="Select Subjects..."
                          value={selectedSubjects.map((s) => ({
                            value: s.id,
                            label: subjects.find((sub) => sub.id === s.id)?.name || s.code,
                            isFixed: subjects.find((sub) => sub.id === s.id)?.isCompulsory === 1,
                            item: subjects.find((sub) => sub.id === s.id) || s
                          }))}
                          options={[
                            { value: "all", label: "Select All", isFixed: false },
                            ...subjects.map((s) => ({
                              value: s.id,
                              label: s.name,
                              isFixed: s.isCompulsory === 1,
                              isDisabled: isSubjectDisabled[s.code] && !selectedSubjects.some((sel) => sel.id === s.id),
                              item: s
                            }))
                          ]}
                          onChange={(selectedOptions, { action, removedValue }) => {
                            if (removedValue && removedValue.isFixed) return;

                            if (action === "select-option" && selectedOptions.some(opt => opt.value === "all")) {
                               const allSelection = subjects
                                 .filter(s => !(isSubjectDisabled[s.code] && !selectedSubjects.some(sel => sel.id === s.id)))
                                 .map(s => ({
                                   code: s.code,
                                   id: s.id,
                                   isCompulsory: s.isCompulsory
                                 }));
                               setSelectedSubjects(allSelection);
                               return;
                            }

                            const validOptions = (selectedOptions || []).filter(opt => opt.value !== "all");

                            const newSelection = validOptions.map((opt) => ({
                              code: opt.item.code,
                              id: opt.item.id,
                              isCompulsory: opt.item.isCompulsory
                            }));
                            setSelectedSubjects(newSelection);
                          }}
                          className="text-sm"
                          styles={{
                            multiValueRemove: (base, state) => {
                              return state.data.isFixed ? { ...base, display: "none" } : base;
                            },
                          }}
                        />
                      </div>
                    )}
                  </>
                )}

                <hr className="my-4" />
                
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

                {availableAddons.length > 0 && (
                  <>
                    <hr className="my-4" />
                    <Typography className="mb-1 font-semibold">
                      Select Add-on(s)
                    </Typography>
                    <div className="my-2 flex w-full flex-wrap gap-4">
                      {availableAddons.map((addon) => (
                        <Checkbox
                          key={`addon-${addon}`}
                          id={`addon-${addon}`}
                          label={addon}
                          checked={selectedAddons.includes(addon)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddons((prev) => [...prev, addon]);
                            } else {
                              setSelectedAddons((prev) =>
                                prev.filter((a) => a !== addon)
                              );
                            }
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="mt-4 flex justify-center">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="me-2 flex items-center gap-3"
                    onClick={() => setActiveTab("Guardian Information")}
                  >
                    <i className="fas fa-arrow-left text-xl" />
                    Previous
                  </Button>
                  <Button
                    color={"green"}
                    size="sm"
                    className="flex items-center gap-3"
                    onClick={() => {
                      if (selectedSubjects.length === 0) {
                        toast.warn("Please select at least one subject", { theme: theme === "light" ? "dark" : "light" });
                        return;
                      }
                      setActiveTab(tabs[4]);
                    }}
                  >
                    <i className="fas fa-check-circle text-xl" />
                    Save and Proceed
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>
      <Suspense>
        <AddPreview
          open={isPreviewOpen}
          handleClose={() => setIsPreviewOpen(false)}
          formData={formData}
          setFormData={setFormData}
          selectedCondition={selectedCondition}
          setSelectedCondition={setSelectedCondition}
          selectedSubjects={selectedSubjects || []}
          setSelectedSubjects={setSelectedSubjects}
          tabs={tabs}
          setTabs={setActiveTab}
          selectedSets={selectedSets}
          setSelectedSets={setSelectedSets}
          selectedAddons={selectedAddons}
          setSelectedAddons={setSelectedAddons}
          saveImageAndRefersh={saveImageAndRefersh}
          installmentData={installmentData}
          setInstallmentData={setInstallmentData}
        />
      </Suspense>
    </div>
  );
}
