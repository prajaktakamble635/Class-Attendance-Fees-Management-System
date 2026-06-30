const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  userTbl,
  studentTbl,
  standardsTbl,
  boardsTbl,
  mediumsTbl,
  studentFeesTbl,
  boardSubjectConditionsTbl,
  subjectsTbl,
  setsTbl,
  examSessionsTbl,
  sequelize,
  examTimetableTbl,
  studentSetMapTbl,
  studentSubjectsTbl,
  studentMarksTbl,
  studentFeesInstallmentsTbl,
  marksConditionTbl,
  marksConditionRemarksTbl,
  deviceAttendanceLogsTbl
} = require("../sequelize.js");
const { handleSequelizeError } = require('../sequelizeErrorHandler')
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require("../lib/cryptoUtils.js");
const speakeasy = require("speakeasy");
const qrCode = require('qrcode');
const is = require('sharp/lib/is.js');
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { text } = require('body-parser');
const dayjs = require('dayjs');
const customParseFormat = require("dayjs/plugin/customParseFormat");
const { getNextRoll, generateRollForImport } = require("../lib/studentRollNo.utils.js")

dayjs.extend(customParseFormat);
const storageOptions = {
  destination: function (req, file, cb) {
    cb(null, PUBLIC_DOCUMENT_PATH);
  },
  filename: async function (req, file, cb) {
    try {
      const detailsObj = await websiteConfigTbl.findByPk(1);
      const srno = detailsObj.documentUploadCounter;
      await detailsObj.update({ documentUploadCounter: srno + 1 });
      const uniqueId = crypto.randomBytes(3).toString("hex");
      const filename = uniqueId + srno + path.extname(file.originalname);
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  },
};


function formatTime(timeStr) {
  if (!timeStr) return "";
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  } catch (e) {
    return timeStr; // fallback if unexpected format
  }
}
const fileFilter = function (req, file, cb) {
  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".pdf",
    ".webp",
    ".xlsx",
    ".xls",
    ".csv",
  ];
  const ext = path.extname(file.originalname);
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid files"));
  }
};

const limits = {
  fileSize: 1024 * 1024 * 15,
};

const documentUpload = multer({
  storage: multer.diskStorage(storageOptions),
  fileFilter,
  limits,
}).single("file");

const generateBcryptSalt = async () => {
  const saltRounds = 10 // Number of rounds for salt generation
  const salt = await bcrypt.genSalt(saltRounds)
  return salt
};

const superAdminController = {};


superAdminController.uploadDocument = async function (req, res) {
  try {
    documentUpload(req, res, async function (err) {
      if (err instanceof multer.MulterError || err) {
        if (err.code === "LIMIT_FILE_SIZE")
          return res
            .status(413)
            .json({ error: "File size is too large. Max limit is 15MB" });
        else handleSequelizeError(err, res, "publicController.uploadDocument");
      } else if (req.file && req.file.filename) {
        res.status(200).json({ fname: req.file.filename });
      } else
        handleSequelizeError(
          new Error("File not uploaded"),
          res,
          "publicController.uploadDocument"
        );
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.uploadDocument");
  }
};
superAdminController.getMyProfile = async function (req, res) {
  try {
    const userTblObj = await userTbl.findByPk(req.uid);
    if (!userTblObj) {
      return res.status(400).json({ message: "User not found" });
    };

    const decryptedTwoFactorSecret = decrypt(userTblObj?.twoFaSecret);

    return res.status(200).json({
      id: userTblObj?.id,
      name: userTblObj?.name,
      email: userTblObj?.email,
      mobile: userTblObj?.mobile,
      userRole: userTblObj?.userRole,
      lastLogin: userTblObj?.lastLogin,
      isTwoFactorEnabled: userTblObj.isTwoFactorEnabled,
      twoFASecret: decryptedTwoFactorSecret,
      qrDataUrl: userTblObj.qrDataUrl,
      isExistingSecret: userTblObj.isExistingSecret,
      isAuthenticated: userTblObj.isAuthenticated,
    })
  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "superAdminController.getMyProfile");
  }
};

superAdminController.updateMyPassword = async function (req, res) {
  try {
    const { password, newPassword } = req.body
    const salt = await generateBcryptSalt()
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await userTbl.isCorrectPassword(req.uid, password, (err, same) => {
      if (err) {
        res.status(500).json({ error: 'Existing password is incorrect.' })
      } else {
        if (same) {
          try {
            userTbl.update(
              {
                password: hashedPassword,
              },
              {
                where: {
                  id: req.uid
                }
              }
            )
            res.status(200).json({ message: 'Password updated successfully.' })
          } catch (err) {
            handleSequelizeError(err, res, 'superAdminController.updateMyPassword')
          }
        } else {
          res.status(500).json({ error: 'Existing password is incorrect.' })
        }
      }
    })
  } catch (err) {
    handleSequelizeError(err, res, 'superAdminController.updateMyPassword')
  }
};

superAdminController.enableTwoFactorVerification = async function (req, res) {
  try {
    const userTblObj = await userTbl.findOne({ where: { id: req.uid } });
    if (!userTblObj) {
      return res.status(400).json({ message: "User not found with entered staff code." })
    };

    if (userTblObj.twoFaSecret && userTblObj.isAuthenticated == 1) {
      await userTbl.update({ isTwoFactorEnabled: 1, isExistingSecret: 1 }, { where: { id: userTblObj.id } });
      return res.status(200).json({ message: "2-factor verification enabled.", type: 2 })
    }

    const secret = await speakeasy.generateSecret({
      name: `GURUKUL Academy (${userTblObj.mobile})`,
      length: 20
    });

    const qrDataUrl = await qrCode.toDataURL(secret.otpauth_url);
    const formattedBase32 = secret.base32.toString().trim()

    const encryptedSecret = encrypt(formattedBase32 || '');
    // return res.status(400).json({encryptedSecret, formattedBase32, qrDataUrl})
    await userTbl.update({ twoFaSecret: encryptedSecret, isExistingSecret: 2, qrDataUrl: qrDataUrl }, { where: { id: userTblObj.id } });

    return res.status(200).json({
      qr: qrDataUrl,
      secret: secret.base32,
      message: "Scan the QR code with your authenticator app."
    })
  } catch (err) {
    console.log("err", err);
    handleSequelizeError(err, res, "superAdminController.enableTwoFactorVerification")
  }
};

superAdminController.disableTwoFactorVerification = async function (req, res) {
  try {
    await userTbl.update({
      isTwoFactorEnabled: 2,
      isExistingSecret: 1
    }, { where: { id: req.uid } });

    return res.status(200).json({ message: "Successfully disabled 2-factor verification" })
  } catch (err) {
    console.log("Err", err);
    handleSequelizeError(err, res, "superAdminController.disableTwoFactorVerification")
  }
};

superAdminController.verify2FA = async function (req, res) {
  try {
    const { token } = req.body;
    const userTblObj = await userTbl.findOne({ where: { id: req.uid } });
    if (!userTblObj) {
      return res.status(400).json({ message: "User not found with entered staff code." })
    };
    if (!userTblObj.twoFaSecret) {
      return res.status(400).json({ message: "2FA is not enabled for this user." })
    };
    const decryptedSecret = decrypt(userTblObj.twoFaSecret);
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (verified) {
      await userTbl.update({ isExistingSecret: 1, isAuthenticated: 1, isTwoFactorEnabled: 1 }, { where: { id: userTblObj.id } });
      return res.status(200).json({ message: "2FA verification successful." })
    } else {
      return res.status(400).json({ message: "Invalid 2FA token." })
    }
  } catch (err) {
    console.log("Err", err);
    handleSequelizeError(err, res, "superAdminController.verify2FA")
  }
};

superAdminController.getAdmissionsTableData = async function (req, res) {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'DESC', searchValue = "" } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const result = await studentTbl.findAll({
      where: {
        status: { [Op.ne]: 3 }
      },
      include: [
        {
          model: standardsTbl,
          as: 'tbl_standards'
        },
        {
          model: boardsTbl,
          as: 'tbl_boards'
        },
        {
          model: mediumsTbl,
          as: 'tbl_mediums'
        },
        // {
        //   model: 
        // },
        {
          model: userTbl,
          as: 'tbl_user'
        }
      ]
    })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAdmissionsTableData")
  }
};



superAdminController.getAllBoardSubjectConditionData = async function (req, res) {
  try {
    const result = await boardSubjectConditionsTbl.findAll({
      where: {},
      include: [
        {
          model: boardsTbl,
          as: 'tbl_boards'
        },
        {
          model: standardsTbl,
          as: 'tbl_standards'
        },
        {
          model: mediumsTbl,
          as: 'tbl_mediums'
        }
      ],
      limit: 100
    });

    if (result.length === 0) return res.status(206).json({ mesage: "Data no found", conditionData: [] });

    const conditionData = result.map((item) => ({
      label: item.name,
      value: item.id,
      boardId: item.boardIdFk,
      standardId: item.standardIdFk,
      board: item.tbl_boards?.name,
      standard: item.tbl_standards?.name,
      medium: item.tbl_mediums?.name
    }));

    return res.status(200).json({ conditionData });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAllBoardSuubjectConditionData")
  }
};

superAdminController.getBoardSubjectConditionDataForSelect = async function (req, res) {
  try {
    const { word } = req.query;

    const result = await boardSubjectConditionsTbl.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${word}%` } }
        ]
      },
      include: [
        {
          model: boardsTbl,
          as: 'tbl_boards'
        },
        {
          model: standardsTbl,
          as: 'tbl_standards'
        },
        {
          model: mediumsTbl,
          as: 'tbl_mediums'
        }
      ],
      limit: 100
    });

    if (result.length === 0) return res.status(206).json({ mesage: "Data no found", conditionData: [] });

    const conditionData = result.map((item) => ({
      label: item.name,
      value: item.id,
      boardId: item.boardIdFk,
      standardId: item.standardIdFk,
      board: item.tbl_boards?.name,
      standard: item.tbl_standards?.name,
      medium: item.tbl_mediums?.name
    }));

    return res.status(200).json({ conditionData });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getBoardSubjectConditionDataForSelect")
  }
};

superAdminController.getAllSubjectBoardConditionWise = async function (req, res) {
  try {
    const { id } = req.query;

    const result = await subjectsTbl.findAll({
      where: {
        status: 1,
        boardSubjectConditionsId: id
      }
    });

    if (result.length === 0) return res.status(206).json({ message: "Data not found", subjectData: [] });

    const subjectData = result.map((item) => ({
      label: `${item.name} (${item.code})`,
      maxMarks: item.maxMarks,
      value: item.id
    }));

    return res.status(200).json({ subjectData })
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAllSubjectBoardConditionWise")
  }
};

superAdminController.getAllSetData = async function (req, res) {
  try {
    const result = await setsTbl.findAll({
      where: {
        status: 1
      }
    });

    if (result.length === 0) return res.status(206).json({ setData: [] });

    const setData = result.map((item) => ({
      label: item.name,
      value: item.id
    }));

    return res.status(200).json({ setData })
  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "superAdminController.getAllSetData")
  }
};


superAdminController.getSubjectsByExamSession = async (req, res) => {
  try {
    const { examSessionsTblId } = req.query;

    if (!examSessionsTblId) {
      return res
        .status(400)
        .json({ success: false, message: "examSessionsTblId is required" });
    }

    // 🔹 Step 1: Fetch all timetable entries for that exam session
    const timetableSubjects = await examTimetableTbl.findAll({
      where: { examSessionIdFk: examSessionsTblId, status: 1 },
      attributes: ["subjectIdFk"],
      raw: true,
    });

    if (!timetableSubjects || timetableSubjects.length === 0) {
      return res.json({ success: true, subjects: [] });
    }

    // 🔹 Step 2: Extract unique subject IDs
    const subjectIds = [
      ...new Set(timetableSubjects.map((t) => t.subjectIdFk)),
    ];

    // 🔹 Step 3: Fetch subjects based on IDs
    const subjects = await subjectsTbl.findAll({
      where: { id: subjectIds },
      attributes: ["id", "name"],
      raw: true,
    });

    // 🔹 Step 4: Format for dropdown (React Select)
    const formattedSubjects = subjects.map((s) => ({
      value: s.id,
      label: s.name,
    }));

    return res.json({ success: true, subjects: formattedSubjects });
  } catch (err) {
    console.error("Error fetching subjects by session:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

superAdminController.generateAttendanceSheet = async function (req, res) {
  try {
    const { boardSubjectConditionsTblId, examSessionsTblId, subjectId } = req.query;

    if (!boardSubjectConditionsTblId) {
      return res.status(400).json({ message: "boardSubjectConditionsTblId is required" });
    }
    if (!examSessionsTblId) {
      return res.status(400).json({ message: "examSessionsTblId is required" });
    }

    // 🔹 Fetch Exam Session
    const examSessionsTblObj = await examSessionsTbl.findByPk(examSessionsTblId);

    // 🔹 Fetch Board/Standard/Medium info
    const boardSubjectCondition = await boardSubjectConditionsTbl.findOne({
      where: { id: boardSubjectConditionsTblId },
      include: [
        { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name"] },
        { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
        { model: mediumsTbl, as: "tbl_mediums", attributes: ["id", "name"] },
      ],
    });

    if (!boardSubjectCondition) {
      return res.status(404).json({ message: "Board subject condition not found" });
    }

    // 🔹 Fetch all students of this condition
    const allStudents = await studentTbl.findAll({
      where: {
        boardSubjectConditionsId: boardSubjectConditionsTblId,
        status: 1,
      },
      order: [["rollNo", "ASC"]],
    });

    console.log(allStudents);

    const enrolledStudents = (
      await Promise.all(
        allStudents.map(async (student) => {

          const map = await studentSetMapTbl.findOne({
            where: {
              studentIdFk: student.id,
              setIdFk: examSessionsTblObj.setIdFk,
            },
          });

          return map ? student : null;
        })
      )
    ).filter(Boolean);
    console.log(enrolledStudents);
    // 🔹 Fetch exam timetable subjects (filtered by subjectId if given)
    const examTimetableCondition = { examSessionIdFk: examSessionsTblId, status: 1 };
    if (subjectId) examTimetableCondition.subjectIdFk = subjectId;

    const examTimetables = await examTimetableTbl.findAll({
      where: examTimetableCondition,
      order: [["examDate", "ASC"]],
      attributes: ["subjectIdFk", "examDate", "examStartTime", "examEndTime"],
    });

    if (!examTimetables.length) {
      return res.status(404).json({ message: "No exam timetable found for this session" });
    }

    // 🔹 Fetch subjects and attach timing/marks using await Promise.all
    const subjects = await Promise.all(
      examTimetables.map(async (t) => {
        const subj = await subjectsTbl.findOne({
          where: { id: t.subjectIdFk, boardSubjectConditionsId: boardSubjectConditionsTblId, status: 1 },
          attributes: ["id", "name", "maxMarks"],
        });
        if (!subj) return null;

        return {
          id: subj.id,
          name: subj.name,
          maxMarks: subj.maxMarks || 0,
          examDate: t.examDate,
          startTime: t.examStartTime,
          endTime: t.examEndTime,
          marks: t.marks || subj.maxMarks || 0,
        };
      })
    );

    // Remove nulls (in case missing subjects)
    const filteredSubjects = subjects.filter(Boolean);

    if (!filteredSubjects.length) {
      return res.status(404).json({ message: "No valid subjects found for this session" });
    }

    // 🔹 Fetch enrolled students for each subject
    let finalResultSet = [];
    const studentMap = new Map(enrolledStudents.map((s) => [s.id, s]));

    for (const subj of filteredSubjects) {
      const studentSubjectsTblResult = await studentSubjectsTbl.findAll({
        where: { subjectIdFk: subj.id, isActive: 1 },
      });

      //-----------------------old----------------------------

      // const studentIds = studentSubjectsTblResult.map((ss) => ss.studentIdFk);

      // const matchedStudents = studentIds
      //   .map((id) => studentMap.get(id))
      //   .filter(Boolean)
      //   .map((s) => s.get({ plain: true }));

      //-----------------------old----------------------------

      //-----------------New Modified By Harshad -------------------
      const subjectStudentIdSet = new Set(
        studentSubjectsTblResult.map(ss => ss.studentIdFk)
      );

      const matchedStudents = enrolledStudents
        .filter(student => subjectStudentIdSet.has(student.id))
        .map(student => student.get({ plain: true }));
      //-----------------New Modified By Harshad -------------------

      finalResultSet.push({
        subject: subj.name,
        examDate: subj.examDate,
        startTime: subj.startTime,
        endTime: subj.endTime,
        marks: subj.marks,
        studentList: matchedStudents,
      });
    }

    // 🔹 Generate PDF
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const logoPath = path.join(__dirname, "../views/images/logo.jpg");
    const logoImage = fs.readFileSync(logoPath).toString("base64");

    const logoPathback = path.join(__dirname, "../views/images/logo.jpg");
    const logoImageback = fs.readFileSync(logoPathback).toString("base64");
    const fonts = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };
    const printer = new PdfPrinter(fonts);

    // console.log(finalResultSet);
    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "portrait",
      pageMargins: [30, 30, 30, 40], // 🔹 Extra bottom margin for footer space

      // 🔹 Background (your logo + border)
      background: function (currentPage, pageSize) {
        return [
          {
            margin: [0, 10, 0, 0],
            image: `data:image/jpeg;base64,${logoImageback}`,
            width: 500,
            opacity: 0.15,
            absolutePosition: {
              x: (pageSize.width - 500) / 2,
              y: (pageSize.height - 400) / 2,
            },
          },
          {
            canvas: [
              {
                type: "rect",
                x: 15,
                y: 15,
                w: pageSize.width - 30,
                h: pageSize.height - 30,
                lineWidth: 1,
                strokeColor: "#000000",
              },
            ],
          },
        ];
      },

      footer: function (currentPage, pageCount) {
        return {
          stack: [

            // 🔹 Fixed footer for every page
            {
              text: `                                                                                                               Page ${currentPage} of ${pageCount}`,
              fontSize: 9,
              margin: [0, 5, 0, 0],
              alignment: "left",
            },
          ],
          margin: [30, 0, 30, 10], // bottom margin for footer
        };
      },

      content: [],
      defaultStyle: { font: "Roboto" },
    };


    // 🔹 Generate a page for each subject (Keep design same)
    finalResultSet.forEach((subject, subjectIndex) => {
      if (subjectIndex > 0) {
        docDefinition.content.push({ text: "", pageBreak: "before" });
      }

      // Header with logo
      docDefinition.content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: 350,
            stack: [
              {
                image: `data:image/jpeg;base64,${logoImage}`,
                fit: [320, 50],
                alignment: "center",
              },
              {
                text: "GURUKUL TEST SERIES",
                fontSize: 15,
                bold: true,
                alignment: "center",
                decoration: "underline", // 🔹 Underline added
                margin: [0, 5, 0, 0],
              },
              {
                text: "Flat No. 101, Sopan Vihar, Near Venkatesh Bilva Society & Balaji Paradise, Vijaynagar Chowk, Dhayari Gaon, Pune - 411041.",
                fontSize: 9,
                alignment: "center",
                color: "#333333",
                margin: [0, 2, 0, 5],
              },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 350, // same width as content
                    y2: 0,
                    lineWidth: 1,
                    lineColor: "#000000",
                  },
                ],
                margin: [0, 3, 0, 0], // space before line
              },
            ],
            alignment: "center",
          },
          { width: "*", text: "" },
        ],
        margin: [0, 0, 0, 10],
      });

      // 🔹 Row 1: Std | Time (use subject's start/end time)
      // 🔹 Row 1: Std | Time
      docDefinition.content.push({
        table: {
          widths: ["70%", "30%"],
          body: [
            [
              {
                text: `Std: ${boardSubjectCondition.tbl_standards?.name || ""} ${boardSubjectCondition.tbl_boards?.name || ""}  ${boardSubjectCondition.tbl_mediums?.name || ""}`,
                bold: true,
                fillColor: "#E0E0E0",
                margin: [4, 3, 0, 3],
              },
              {
                text: `Time: ${formatTime(subject.startTime)} - ${formatTime(subject.endTime)}`,
                bold: true,
                fillColor: "#E0E0E0",
                margin: [4, 3, 0, 3],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 0, 0, 0],
      });

      // 🔹 Row 2: Subject | Total Students | Date + Marks
      docDefinition.content.push({
        table: {
          widths: ["35%", "35%", "30%"],
          body: [
            [
              { text: `Subject: ${subject.subject}`, bold: true, fillColor: "#E0E0E0", margin: [4, 3, 0, 3] },
              { text: `Total Students: ${subject.studentList.length}`, bold: true, fillColor: "#E0E0E0", margin: [4, 3, 0, 3] },
              { text: `Date: ${subject.examDate ? new Date(subject.examDate).toLocaleDateString("en-GB") : ""}`, bold: true, fillColor: "#E0E0E0", margin: [4, 3, 0, 3] },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 0, 0, 10],
      });


      // 🔹 Student attendance table (same design)
      const tableBody = [
        [
          { text: "No.", bold: true, alignment: "center" },
          { text: "Name", bold: true, alignment: "center" },
          { text: "Roll No", bold: true, alignment: "center" },
          { text: "Sign", bold: true, alignment: "center" },
          { text: "Marks", bold: true, alignment: "center" },
        ],
      ];

      subject.studentList.forEach((student, i) => {
        tableBody.push([
          { text: (i + 1).toString(), fontSize: 8 },
          { text: `${student.firstName} ${student.motherName} ${student.fatherName} ${student.surname}`, fontSize: 10 },
          { text: student.rollNo || "", fontSize: 10 },
          { text: "", fontSize: 10 },

          { text: "", fontSize: 10 },
        ]);
      });

      docDefinition.content.push({
        table: { widths: [25, "*", 85, 80, 80], body: tableBody, heights: 20 },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
          fillColor: (i) => (i === 0 ? "#E0E0E0" : null),
        },
        margin: [0, 6, 0, 10],
      });


    });

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=attendance-sheet-${Date.now()}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.log("Error generating attendance sheet:", err);
    handleSequelizeError(err, res, "superAdminController.generateAttendanceSheet");
  }
};



superAdminController.addExamTimeTable = async function (req, res) {
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      boardId,
      standardId,
      setId,
      dateFrom,
      dateTo,
      examTimeTableData = [],
      conditionId
    } = req.body;

    const examSessionTblObj = await examSessionsTbl.create({
      name,
      boardIdFk: boardId,
      standardIdFk: standardId,
      setIdFk: setId,
      dateFrom,
      dateTo,
      boardSubjectConditionsId: conditionId,
      createdBy: req.uid
    }, { transaction });

    const formattedExamTimeTableData = examTimeTableData.map((item) => ({
      examSessionIdFk: examSessionTblObj?.id,
      examDate: item.date,
      examStartTime: item.examStartTime,
      examEndTime: item.examEndTime,
      subjectIdFk: item.subjectId,
      maxMarks: item.maxMarks
    }))

    await examTimetableTbl.bulkCreate(formattedExamTimeTableData, { transaction });

    await transaction.commit()

    return res.status(200).json({
      message: "Exam time table created successfully !"
    })

  } catch (err) {
    await transaction.rollback();
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.addExamTimeTable")
  }
};

// controllers/superAdminController.js
superAdminController.getStudentsForHallTicket = async (req, res) => {
  try {
    const {
      conditionId,
      examSessionId = null,
      page = 1,
      perPage = 50,
      orderBy = "rollNo",
      orderDirection = "ASC",
      search = "",
    } = req.query;

    if (!conditionId) {
      return res.status(400).json({
        success: false,
        message: "Missing conditionId parameter.",
      });
    }

    const { Op } = require("sequelize");
    const limit = parseInt(perPage);
    const offset = (parseInt(page) - 1) * limit;

    const validColumns = [
      "id",
      "rollNo",
      "firstName",
      "surname",
      "fatherName",
      "motherName",
      "dob",
      "gender",
      "createdAt",
    ];

    const orderField = validColumns.includes(orderBy) ? orderBy : "rollNo";
    const orderDir = orderDirection.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const whereClause = { boardSubjectConditionsId: conditionId, status: 1 };

    if (search.trim()) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { fatherName: { [Op.like]: `%${search}%` } },
        { surname: { [Op.like]: `%${search}%` } },
        { rollNo: { [Op.like]: `%${search}%` } },

        // ✅ FULL NAME Search (Aakash Vijay Salunke)
        sequelize.literal(`CONCAT(first_name, ' ', father_name, ' ', surname) LIKE '%${search}%'`)
      ];
    }


    const totalStudents = await studentTbl.count({ where: whereClause });

    const students = await studentTbl.findAll({
      where: whereClause,
      attributes: [
        "id",
        "firstName",
        "fatherName",
        "surname",
        "motherName",
        "dob",
        "gender",
        "rollNo",
        "standardIdFk",
        "boardIdFk",
        "mediumIdFk",
      ],
      include: [
        { model: standardsTbl, as: "tbl_standards", attributes: ["name"] },
        { model: boardsTbl, as: "tbl_boards", attributes: ["name"] },
        { model: mediumsTbl, as: "tbl_mediums", attributes: ["name"] },
      ],
      order: [[orderField, orderDir]],
      offset,
      limit,
    });

    if (!students.length) {
      return res.status(200).json({
        success: false,
        message: "No students found for the selected condition.",
      });
    }

    let filteredStudents = [];
    const studentIds = students.map((s) => s.id);

    if (examSessionId) {
      // ✅ Fetch set for selected exam session
      const examSession = await examSessionsTbl.findOne({
        where: { id: examSessionId },
        attributes: ["setIdFk"],
      });

      if (!examSession) {
        return res.status(404).json({
          success: false,
          message: "Exam session not found.",
        });
      }

      const studentSets = await studentSetMapTbl.findAll({
        where: {
          studentIdFk: studentIds,
          setIdFk: examSession.setIdFk,
        },
        include: [{ model: setsTbl, as: "tbl_sets", attributes: ["name"] }],
      });

      const setNameMap = {};
      studentSets.forEach((s) => {
        setNameMap[s.studentIdFk] = s.tbl_sets?.name || "";
      });

      filteredStudents = students.map((s) => ({
        ...s.get({ plain: true }),
        className: s.tbl_standards?.name || "",
        boardName: s.tbl_boards?.name || "",
        mediumName: s.tbl_mediums?.name || "",
        setName: setNameMap[s.id] || "",
      }));
    } else {
      // ✅ No examSession selected → fetch ALL sets assigned to each student
      const studentSets = await studentSetMapTbl.findAll({
        where: { studentIdFk: studentIds },
        include: [{ model: setsTbl, as: "tbl_sets", attributes: ["name"] }],
      });

      // Group multiple sets per student
      const setMap = {};
      studentSets.forEach((s) => {
        if (!setMap[s.studentIdFk]) setMap[s.studentIdFk] = [];
        if (s.tbl_sets?.name) setMap[s.studentIdFk].push(s.tbl_sets.name);
      });

      filteredStudents = students.map((s) => ({
        ...s.get({ plain: true }),
        className: s.tbl_standards?.name || "",
        boardName: s.tbl_boards?.name || "",
        mediumName: s.tbl_mediums?.name || "",
        setName: setMap[s.id]?.join(", ") || "", // show all sets comma-separated
      }));
    }

    const totalPages = Math.ceil(totalStudents / limit);
    const from = offset + 1;
    const to = Math.min(offset + filteredStudents.length, totalStudents);

    return res.status(200).json({
      success: true,
      totalRecords: totalStudents,
      totalPages,
      currentPage: parseInt(page),
      perPage: limit,
      from,
      to,
      students: filteredStudents,
    });
  } catch (err) {
    console.error("❌ Error in getStudentsForHallTicket:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: err.message,
    });
  }
};
superAdminController.getStudentsForReportCard = async (req, res) => {
  try {
    const {
      conditionId,
      examSessionId,
      page = 1,
      perPage = 10,
      orderBy = "rollNo",
      orderDirection = "ASC",
      search = "",
    } = req.query;

    if (!conditionId) {
      return res.status(400).json({
        success: false,
        message: "Missing conditionId parameter.",
      });
    }

    if (!examSessionId) {
      return res.status(400).json({
        success: false,
        message: "Exam session ID is required.",
      });
    }

    const { Op } = require("sequelize");
    const limit = parseInt(perPage);
    const offset = (parseInt(page) - 1) * limit;

    const validColumns = [
      "id",
      "rollNo",
      "firstName",
      "surname",
      "fatherName",
      "motherName",
      "dob",
      "gender",
      "createdAt",
    ];

    const orderField = validColumns.includes(orderBy) ? orderBy : "rollNo";
    const orderDir = orderDirection.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const whereClause = {
      boardSubjectConditionsId: conditionId,
      status: 1,
    };

    // ✅ Search filter
    if (search.trim()) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { fatherName: { [Op.like]: `%${search}%` } },
        { surname: { [Op.like]: `%${search}%` } },
        { rollNo: { [Op.like]: `%${search}%` } },
        sequelize.literal(`CONCAT(first_name, ' ', father_name, ' ', surname) LIKE '%${search}%'`),
      ];
    }

    // ✅ Fetch exam session
    const examSession = await examSessionsTbl.findOne({
      where: { id: examSessionId },
      attributes: ["setIdFk"],
    });

    if (!examSession) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found.",
      });
    }

    // ✅ Fetch all students matching condition first
    const allStudents = await studentTbl.findAll({
      where: whereClause,
      attributes: [
        "id",
        "firstName",
        "fatherName",
        "surname",
        "motherName",
        "dob",
        "gender",
        "rollNo",
        "standardIdFk",
        "boardIdFk",
        "mediumIdFk",
      ],
      include: [
        { model: standardsTbl, as: "tbl_standards", attributes: ["name"] },
        { model: boardsTbl, as: "tbl_boards", attributes: ["name"] },
        { model: mediumsTbl, as: "tbl_mediums", attributes: ["name"] },
      ],
    });

    if (!allStudents.length) {
      return res.status(200).json({
        success: false,
        message: "No students found for the selected condition.",
      });
    }

    const allStudentIds = allStudents.map((s) => s.id);

    // ✅ Get only those who belong to this exam session’s set
    const studentSets = await studentSetMapTbl.findAll({
      where: {
        studentIdFk: allStudentIds,
        setIdFk: examSession.setIdFk,
      },
      include: [{ model: setsTbl, as: "tbl_sets", attributes: ["name"] }],
    });

    const validStudentIds = studentSets.map((s) => s.studentIdFk);
    const setNameMap = {};
    studentSets.forEach((s) => {
      setNameMap[s.studentIdFk] = s.tbl_sets?.name || "";
    });

    // ✅ Filter students by valid set before pagination
    const filteredStudents = allStudents
      .filter((s) => validStudentIds.includes(s.id))
      .sort((a, b) =>
        orderDir === "ASC"
          ? a[orderField]?.localeCompare?.(b[orderField]) ?? 0
          : b[orderField]?.localeCompare?.(a[orderField]) ?? 0
      );

    const totalRecords = filteredStudents.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedStudents = filteredStudents.slice(offset, offset + limit);

    // ✅ Prepare final mapped data
    const finalStudents = paginatedStudents.map((s) => ({
      ...s.get({ plain: true }),
      className: s.tbl_standards?.name || "",
      boardName: s.tbl_boards?.name || "",
      mediumName: s.tbl_mediums?.name || "",
      setName: setNameMap[s.id] || "",
    }));

    console.log("✅ Filtered Students Count:", totalRecords);

    return res.status(200).json({
      success: true,
      totalRecords,
      totalPages,
      currentPage: parseInt(page),
      perPage: limit,
      from: offset + 1,
      to: offset + finalStudents.length,
      students: finalStudents,
    });
  } catch (err) {
    console.error("❌ Error in getStudentsForReportCard:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: err.message,
    });
  }
};


//2*2 Hallticket

// superAdminController.generateHallTicket = async function (req, res) {
//   try {
//     const { examSessionsTblId, studentIds, boardSubjectConditionsId } = req.body;

//     // ---- Fetch Exam Session ----
//     let exam;
//     if (examSessionsTblId != null) {
//       exam = await examSessionsTbl.findByPk(examSessionsTblId, {
//         include: [
//           { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name", "hall_ticket_color"] },
//           { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
//           { model: setsTbl, as: "tbl_sets", attributes: ["id", "name"] },
//         ],
//       });
//       if (!exam) return res.status(404).json({ message: "Exam session not found" });
//     }

//     // ---- Fetch Board Condition ----
//     const boardCondition = await boardSubjectConditionsTbl.findOne({
//       where: { id: boardSubjectConditionsId },
//       include: [
//         { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name", "hall_ticket_color"] },
//         { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
//         { model: mediumsTbl, as: "tbl_mediums", attributes: ["id", "name"] },
//       ],
//     });
//     if (!boardCondition)
//       return res.status(404).json({ message: "Board subject condition not found" });

//     const boardName = boardCondition.tbl_boards?.name?.toUpperCase() || "CBSE";

//     // ---- Get Student Set Maps ----
//     let studentSetMaps;
//     if (examSessionsTblId != null && exam) {
//       studentSetMaps = await studentSetMapTbl.findAll({
//         where: { setIdFk: exam.setIdFk },
//       });
//     } else {
//       if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
//         return res.status(400).json({ message: "studentIds are required when examSessionsTblId is null" });
//       }
//       studentSetMaps = await studentSetMapTbl.findAll({
//         where: { studentIdFk: { [Op.in]: studentIds } },
//       });
//     }

//     // ---- Map student → all their sets ----
//     const studentSetsMap = {};
//     studentSetMaps.forEach((m) => {
//       const sid = m.studentIdFk;
//       if (!studentSetsMap[sid]) studentSetsMap[sid] = [];
//       studentSetsMap[sid].push(m.setIdFk);
//     });
//     console.log("Student Sets Map:", studentSetsMap);

//     // ---- Get Students ----
//     const allStudentIds = [...new Set(studentSetMaps.map((s) => s.studentIdFk))];

//     if (!allStudentIds.length) return res.status(404).json({ message: "No students found" });

//     const students = await studentTbl.findAll({
//       where: {
//         id: { [Op.in]: allStudentIds },
//         boardSubjectConditionsId,
//       },
//       order: [["rollNo", "ASC"]],
//     });
//     // ---- Rest of your logic below remains unchanged ----


//     // ---- Rest of your logic below remains unchanged ----
//     // Example (if your code continues here)



//     // console.log(students)
//     // ---- Logo ----
//     const logoPath = path.join(__dirname, "../views/images/logo-main.png");
//     const logoImage = fs.existsSync(logoPath)
//       ? fs.readFileSync(logoPath).toString("base64")
//       : null;
//     // ---- Logos: load from /views/images/ (fallback if missing) ----
//     const logoLeftPath = path.join(__dirname, "../views/images/logo-new.png");
//     const logoRightPath = path.join(__dirname, "../views/images/logo-main.png");
//     const logoLeft = fs.existsSync(logoLeftPath) ? fs.readFileSync(logoLeftPath).toString("base64") : null;
//     const logoRight = fs.existsSync(logoRightPath) ? fs.readFileSync(logoRightPath).toString("base64") : null;

//     // ---- pdfmake setup (re-uses PdfPrinter imported at top of file) ----
//     const fonts = {
//       Roboto: {
//         normal: "Helvetica",
//         bold: "Helvetica-Bold",
//         italics: "Helvetica-Oblique",
//         bolditalics: "Helvetica-BoldOblique",
//       },
//     };
//     const printer = new PdfPrinter(fonts);

//     // ---- Back-side subjects set (as in your sample) ----
//     const backsideSubjects = {
//       SSC: [
//         "MAR", "ENG", "H 100\nS100", "H + S\nH + G",
//         "SCI 1", "SCI 2", "HIST ITHI", "GEOGBHUG", "ALG", "GEOM"
//       ],
//       CBSE: ["ENG", "MAT", "SCI", "SST", "LANG"],
//       ICSE: [
//         "PHY", "CHEM", "BIO", "MATH", "LIT", "LANG",
//         "HIST", "GEOG", "HIND", "COMP ECO"
//       ],
//       HSC: ["PHY", "CHEM", "BIO", "MATH", "ENG", "CS 1 IT", "CS 2 GEOG"],
//     };

//     const subjects = backsideSubjects[boardName];
//     const darkBlue = "#003399";     // text
//     const footerBlue = "#123a8a";   // bottom strip
//     const subjectGreen = "#8BC34A"; // attendance header
//     const setBlue = "#B3C7E6";
//     const setGreen = "#C8E6C9";
//     const setRed = "#F8BBD0";
//     const thinLine = "#e0e0e0";
//     // Helper: split into chunks
//     const chunkArray = (arr, size) => {
//       const out = [];
//       for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
//       return out;
//     };

//     // ---- makeFront: exact layout per ticket (left student info, right photo + sets) ----
//     const makeFront = (student) => {
//       return {
//         table: {
//           widths: ["100%", "100%"],
//           heights: [240],
//           body: [
//             [
//               {
//                 stack: [
//                   // header row: left + right logos
//                   {
//                     columns: [
//                       // Left side: logos + vertical line between them
//                       {
//                         columns: [
//                           // 🟦 Left (Bigger) Logo
//                           logoLeft
//                             ? {
//                               image: `data:image/png;base64,${logoLeft}`,
//                               fit: [130, 65], // increased size
//                               alignment: "left",
//                               margin: [0, 4, 4, 4],
//                             }
//                             : { text: "" },

//                           // Black vertical line between logos
//                           {
//                             canvas: [
//                               {
//                                 type: "line",
//                                 x1: 0,
//                                 y1: 0,
//                                 x2: 0,
//                                 y2: 55,
//                                 lineWidth: 1.5,
//                                 color: "#003399",
//                               },
//                             ],
//                             width: 1,
//                             margin: [4, 4, 4, 4],
//                           },

//                           // 🟨 Right (Smaller) Logo
//                           logoRight
//                             ? {
//                               image: `data:image/png;base64,${logoRight}`,
//                               fit: [90, 45], // smaller logo
//                               alignment: "left",
//                               margin: [4, 8, 0, 4],
//                             }
//                             : { text: "" },
//                         ],
//                         width: "70%",
//                         margin: [6, 6, 6, 6],
//                       },


//                       // Right side: student photo box
//                       {
//                         width: "30%", // fixed column width for photo section
//                         stack: [
//                           {
//                             table: {
//                               widths: ["*"],
//                               heights: [110], // fixed height for the photo box
//                               body: [
//                                 [
//                                   (student.photoPath && fs.existsSync(path.join(__dirname, "../public", student.photoPath)))
//                                     ? {
//                                       image: `data:image/jpeg;base64,${fs.readFileSync(
//                                         path.join(__dirname, "../public", student.photoPath)
//                                       ).toString("base64")}`,
//                                       fit: [90, 110], // ensures consistent photo fit
//                                       alignment: "center",
//                                       margin: [0, 5, 0, 5],
//                                     }
//                                     : {
//                                       text: "Student\nPhoto",
//                                       alignment: "center",
//                                       color: "#999",
//                                       fontSize: 10,
//                                       margin: [0, 40, 0, 40],
//                                     },
//                                 ],
//                               ],
//                             },
//                             layout: {
//                               hLineWidth: () => 1,
//                               vLineWidth: () => 1,
//                               hLineColor: () => "#686868",
//                               vLineColor: () => "#686868",
//                               paddingLeft: () => 2,
//                               paddingRight: () => 2,
//                               paddingTop: () => 2,
//                               paddingBottom: () => 2,
//                             },
//                             margin: [0, 10, 10, 10], // shifts slightly right to align under logo
//                           },
//                         ],
//                       },

//                     ],
//                   },

//                   // 🔹 Blue line + “EXAMINATION 2025 – 2026” title
//                   {
//                     margin: [15, 0, 0, 10],
//                     stack: [
//                       {
//                         canvas: [
//                           {
//                             type: "line",
//                             x1: 0,
//                             y1: 0,
//                             x2: 220,
//                             y2: 0,
//                             lineWidth: 1.5,
//                             color: "#003399", // dark blue divider
//                           },
//                         ],
//                         margin: [0, -65, 0, 4],
//                       },
//                       {
//                         text: "EXAMINATION 2025 – 2026",
//                         alignment: "left",
//                         color: "#003399",
//                         bold: true,
//                         fontSize: 12,
//                         margin: [30, 2, 0, 23],
//                       },
//                     ],
//                   },



//                   {
//                     columns: [
//                       // Left details
//                       {
//                         width: "100%",
//                         stack: [
//                           // Name Row
//                           {
//                             columns: [
//                               { text: "Name:", bold: true, color: darkBlue, width: "22%", fontSize: 10 },
//                               {
//                                 text: student.firstName
//                                   ? `${student.firstName} ${student.motherName || ""} ${student.fatherName || ""} ${student.surname || ""}`.trim()
//                                   : "",
//                                 width: "78%",
//                                 fontSize: 10,
//                               }
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 380, y2: 0, lineWidth: 0.5, color: thinLine }], margin: [0, 2, 0, 4] },

//                           // Std & Roll No
//                           {
//                             columns: [
//                               { text: "Std.:", bold: true, color: darkBlue, width: "22%", fontSize: 10 },
//                               {
//                                 text: [
//                                   boardCondition.tbl_standards?.name || "",
//                                   boardCondition.tbl_boards?.name || "",
//                                   boardCondition.tbl_mediums?.name || "",
//                                 ]
//                                   .filter(Boolean)
//                                   .join(" "),
//                                 width: "28%",
//                                 fontSize: 10,
//                               },
//                               { text: "Roll No:", bold: true, color: darkBlue, width: "22%", fontSize: 10 },
//                               { text: student.rollNo || "", width: "28%", fontSize: 10 },
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 380, y2: 0, lineWidth: 0.5, color: thinLine }], margin: [0, 2, 0, 4] },

//                           // Mother's & Father's Name
//                           {
//                             columns: [
//                               { text: "Mother's Name:", bold: true, color: darkBlue, width: "22%", fontSize: 10 },
//                               { text: student.motherName || "", width: "28%", fontSize: 10 },
//                               { text: "Father's Name:", bold: true, color: darkBlue, width: "22%", fontSize: 10 },
//                               { text: student.fatherName || "", width: "28%", fontSize: 10 },
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 380, y2: 0, lineWidth: 0.5, color: thinLine }], margin: [0, 2, 0, 4] },

//                           // Mobile & Center
//                           {
//                             columns: [
//                               { text: "Mobile No:", bold: true, color: darkBlue, width: "22%", fontSize: 10 },
//                               {
//                                 text: student.fatherMobile || "N/A",
//                                 width: "28%",
//                                 fontSize: 10
//                               },
//                               { text: "Center:", bold: true, color: darkBlue, width: "22%", fontSize: 10 },
//                               { text: student.centerNo || "N/A", width: "28%", fontSize: 10 },
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 380, y2: 0, lineWidth: 0.5, color: thinLine }], margin: [0, 2, 0, 4] },
//                         ],
//                         margin: [0, -5, 0, 0],
//                       },


//                     ],
//                     columnGap: 6,
//                     margin: [6, 0, 6, 6],
//                   },
//                   {
//                     columns: [



//                       {
//                         columns: [


//                           // 🧩 RIGHT SIDE (60%) — blank space
//                           {
//                             width: "60%",
//                             stack: [
//                               {
//                                 text: "", // intentionally blank
//                                 margin: [0, 0, 0, 0],
//                               },
//                             ],
//                           },

//                           // 🧩 SMALL GAP & SET BOXES (10%)
//                           {
//                             width: "40%",
//                             stack: [
//                               {
//                                 table: {
//                                   widths: [35, 35, 35],
//                                   body: [
//                                     // 🟦 Header Row (colored)
//                                    [
//   { text: "Set 1", alignment: "center", fontSize: 10, color: "white", fillColor: "#004AAD", bold: true },
//   { text: "Set 2", alignment: "center", fontSize: 10, color: "white", fillColor: "#004AAD", bold: true },
//   { text: "Set 3", alignment: "center", fontSize: 10, color: "white", fillColor: "#004AAD", bold: true },
// ],

//                                     // 🟩 Second Row (enrolled indicator)
//                                     [
//                                       {
//                                         text: (studentSetsMap[student.id] || []).includes(1) ? "Enrolled" : "",
//                                         alignment: "center",
//                                         fontSize: 9,
//                                         color: (studentSetsMap[student.id] || []).includes(1) ? "#004AAD" : "#555",
//                                       },
//                                       {
//                                         text: (studentSetsMap[student.id] || []).includes(2) ? "Enrolled" : "",
//                                         alignment: "center",
//                                         fontSize: 9,
//                                         color: (studentSetsMap[student.id] || []).includes(2) ? "#004AAD" : "#555",
//                                       },
//                                       {
//                                         text: (studentSetsMap[student.id] || []).includes(3) ? "Enrolled" : "",
//                                         alignment: "center",
//                                         fontSize: 9,
//                                         color: (studentSetsMap[student.id] || []).includes(3) ? "#004AAD" : "#555",
//                                       },
//                                     ],
//                                   ],
//                                 },

//                                 layout: {
//                                   hLineWidth: () => 0.7,
//                                   vLineWidth: () => 0.7,
//                                   hLineColor: () => "#686868",
//                                   vLineColor: () => "#686868",
//                                 },

//                                 margin: [0, 0, 0, 0],
//                               },
//                             ],
//                           }



//                         ],
//                       },

//                     ],
//                     columnGap: 6,
//                     margin: [6, 0, 6, 6],
//                   },
//                 ],
//                 margin: [0, 0, 0, 0],
//               },
//             ],
//           ],
//         },
//         layout: {
//           // small border around each card
//           hLineWidth: () => 0.7,
//           vLineWidth: () => 0.7,
//           hLineColor: () => "#999",
//           vLineColor: () => "#999",
//         },
//       };
//     };

//     const makeBack = (student) => {
//       // 🎨 Board-specific styling and subject mapping
//       const boardStyles = {
//         SSC: {
//           color: "#4CAF50",
//           subjects: [
//             "MAR",
//             "ENG",
//             "H-100\nS-100",
//             "H+G\nH+S",
//             "SCI-1",
//             "SCI-2",
//             "HIST\nITHI",
//             "GEOG\nBHUG",
//             "ALG",
//             "GEOM",
//           ],
//         },
//         CBSE: {
//           color: "#FFEB3B",
//           subjects: ["ENG", "MATH", "SCI", "SST", "LANG"],
//         },
//         ICSE: {
//           color: "#FF9800",
//           subjects: [
//             "PHY",
//             "CHEM",
//             "BIO",
//             "MATH",
//             "LIT",
//             "LANG",
//             "HIST",
//             "GEOG",
//             "HIND",
//             "COMP\nECO",
//           ],
//         },
//         HSC: {
//           color: "#6A1B9A",
//           subjects: ["PHY", "CHEM", "BIO", "MATH", "ENG", "CS1\nIT", "CS2\nGEOG"],
//         },
//       };

//       // 🧩 pick board style
//       const { color: boardColor, subjects: subjectList } =
//         boardStyles[boardName] || boardStyles.SSC;

//       // 💡 header text color logic — CBSE = navy blue, others = white
//       const headerTextColor = boardName === "CBSE" ? "#003366" : "white";

//       // Split subjects into groups of 5 per row
//       const chunkArray = (arr, size) => {
//         const out = [];
//         for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
//         return out;
//       };

//       const subjectChunks = chunkArray(subjectList, 5);

//       // Generate subject tables
//       const tables = subjectChunks.map((chunk, idx) => {
//         // Header row
//         const headerRow = [
//           {
//             text: idx === 0 ? boardName : "",
//             alignment: "center",
//             bold: true,
//             color: headerTextColor,
//             fillColor: boardColor,
//             fontSize: 10,
//           },
//           ...chunk.map((s) => ({
//             text: s,
//             alignment: "center",
//             bold: true,
//             color: headerTextColor,
//             fillColor: boardColor,
//             fontSize: 10,
//           })),
//         ];

//         // Set rows (3 sets)
//         const setRows = ["SET 1", "SET 2", "SET 3"].map((setName) => [
//           {
//             text: setName,
//             alignment: "center",
//             bold: true,
//             fillColor: "#F1F8E9",
//             color: "#000",
//             fontSize: 10,
//           },
//           ...chunk.map(() => ({
//             text: "",
//             alignment: "center",
//             fontSize: 10,
//           })),
//         ]);

//         return {
//           table: {
//             widths: [35, ...new Array(chunk.length).fill(60)], // wider columns
//             body: [headerRow, ...setRows],
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#cfd8dc",
//             vLineColor: () => "#cfd8dc",
//             paddingLeft: () => 3,
//             paddingRight: () => 3,
//             paddingTop: () => 2,
//             paddingBottom: () => 2,
//           },
//           margin: [6, idx === 0 ? 0 : 5, 6, 0],
//         };
//       });

//       // 🧾 Final stacked layout
//       return {
//         table: {
//           widths: ["100%", "100%"],

//           heights: [240],
//           body: [
//             [
//               {
//                 stack: [
//                   // ---- Logos ----
//                   {
//                     columns: [
//                       // Left side: logos + vertical line between them
//                       {
//                         columns: [
//                           // 🟦 Left (Bigger) Logo
//                           logoLeft
//                             ? {
//                               image: `data:image/png;base64,${logoLeft}`,
//                               fit: [130, 65], // increased size
//                               alignment: "left",
//                               margin: [0, 4, 4, 4],
//                             }
//                             : { text: "" },

//                           // Black vertical line between logos
//                           {
//                             canvas: [
//                               {
//                                 type: "line",
//                                 x1: 0,
//                                 y1: 0,
//                                 x2: 0,
//                                 y2: 55,
//                                 lineWidth: 1.5,
//                                 color: "#003399",
//                               },
//                             ],
//                             width: 1,
//                             margin: [4, 4, 4, 4],
//                           },

//                           // 🟨 Right (Smaller) Logo
//                           logoRight
//                             ? {
//                               image: `data:image/png;base64,${logoRight}`,
//                               fit: [90, 45], // smaller logo
//                               alignment: "left",
//                               margin: [4, 8, 0, 4],
//                             }
//                             : { text: "" },
//                         ],
//                         width: "70%",
//                         margin: [6, 6, 6, 6],
//                       },


//                       // Right side: student photo box
//                       {


//                       },

//                     ],
//                   },

//                   {
//                     margin: [15, 0, 0, 10],
//                     stack: [
//                       {
//                         canvas: [
//                           {
//                             type: "line",
//                             x1: 0,
//                             y1: 0,
//                             x2: 220,
//                             y2: 0,
//                             lineWidth: 1.5,
//                             color: "#003399", // dark blue divider
//                           },
//                         ],
//                         margin: [0, 0, 0, 4],
//                       },
//                       {
//                         text: "EXAMINATION 2025 – 2026",
//                         alignment: "left",
//                         color: "#003399",
//                         bold: true,
//                         fontSize: 12,
//                         margin: [30, 2, 0, 2],
//                       },
//                     ],
//                   },
//                   // ---- Title ----
//                   {
//                     text: "Attendance Report",
//                     alignment: "center",
//                     bold: true,
//                     fontSize: 12,
//                     color: "#123A8A",
//                     margin: [0, 2, 0, 0],
//                   },

//                   // ---- Subject Tables ----
//                   ...tables,
//                 ],
//               },
//             ],
//           ],
//         },
//         layout: {
//           hLineWidth: () => 0.7,
//           vLineWidth: () => 0.7,
//           hLineColor: () => "#999",
//           vLineColor: () => "#999",
//         },
//       };
//     };






//     // ---- grid 2x2 (4 tickets per A4 landscape page) ----
//     const grid2x2 = (cards) => {
//       const safeCard = (c) => (c ? { ...c, margin: [6, 6, 6, 6] } : { text: "" });
//       return {
//         table: {
//           widths: ["50%", "50%"],
//           heights: [270, 270], // 👈 fixed equal height for all cells
//           body: [
//             [safeCard(cards[0] || null), safeCard(cards[1] || null)],
//             [safeCard(cards[2] || null), safeCard(cards[3] || null)],
//           ],
//         },
//         layout: "noBorders",
//       };
//     };
//     // ---- Build content (for each group of 4 students: front page, page break, back page) ----
//     const content = [];
// for (let i = 0; i < students.length; i += 4) {
//   const chunk = students.slice(i, i + 4);

//   // 🩵 FRONT PAGE (1,2,3,4)
//   const frontCards = chunk.map((s) => makeFront(s));
//   content.push(grid2x2(frontCards));

//   // 🔄 PAGE BREAK before backside
//   content.push({ text: "", pageBreak: "before" });

//   // 🩶 BACK PAGE (3,4,1,2)
//   const backCards = chunk.map((s) => makeBack(s));

//   // reorder for correct duplex print alignment
//   let reorderedBack = backCards;

//     reorderedBack = [backCards[2], backCards[3], backCards[0], backCards[1]];


//   // if fewer than 4 students remain, pad blanks to keep grid alignment
//   while (reorderedBack.length < 4) reorderedBack.push(null);

//   content.push(grid2x2(reorderedBack));

//   // ensure each group starts on a fresh sheet
//   if (i + 4 < students.length) content.push({ text: "", pageBreak: "before" });
// }

//     // ---- Document definition & stream PDF ----
//     const docDefinition = {
//       pageSize: "A4",
//       pageOrientation: "landscape",
//       pageMargins: [0, 0, 0, 0], // 👈 no shifting margins
//       content,
//       footer: (currentPage, pageCount) => ({
//         columns: [
//           {
//             text: `Page ${currentPage} of ${pageCount}`,
//             alignment: "center",
//             fontSize: 7,
//             color: "#666",
//             margin: [0, 8, 0, 0],
//           },
//         ],
//       }),
//     };


//     const pdfDoc = printer.createPdfKitDocument(docDefinition);
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=hall-tickets-${examSessionsTblId}-${Date.now()}.pdf`);
//     pdfDoc.pipe(res);
//     pdfDoc.end();
//   } catch (err) {
//     console.error("Error generating hall ticket:", err);
//     handleSequelizeError(err, res, "superAdminController.generateHallTicket");
//   }
// };


//3*1 hallticket
// superAdminController.generateHallTicket = async function (req, res) {
//   try {
//     let { examSessionsTblId, studentIds, boardSubjectConditionsId } = req.body;

//     // ---- Fetch Exam Session ----
//     let exam;
//     if (examSessionsTblId != null) {
//       exam = await examSessionsTbl.findByPk(examSessionsTblId, {
//         include: [
//           { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name", "hall_ticket_color"] },
//           { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
//           { model: setsTbl, as: "tbl_sets", attributes: ["id", "name"] },
//         ],
//       });
//       if (!exam) return res.status(404).json({ message: "Exam session not found" });
//     }

//     // ⭐ FIX — When frontend sends "all"
//     if (studentIds === "all") {
//       const all = await studentTbl.findAll({
//         where: {
//           status: 1,
//           boardSubjectConditionsId
//         },
//         attributes: ["id"]
//       });
//       studentIds = all.map(s => s.id); // now studentIds contains real IDs
//     }

//     // ---- Fetch Board Condition ----
//     const boardCondition = await boardSubjectConditionsTbl.findOne({
//       where: { id: boardSubjectConditionsId },
//       include: [
//         { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name", "hall_ticket_color"] },
//         { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
//         { model: mediumsTbl, as: "tbl_mediums", attributes: ["id", "name"] },
//       ],
//     });
//     if (!boardCondition)
//       return res.status(404).json({ message: "Board subject condition not found" });

//     const boardName = boardCondition.tbl_boards?.name?.toUpperCase() || "CBSE";

//     // ---- Get Student Set Maps ----
//     let studentSetMaps;
//     if (examSessionsTblId != null && exam) {
//       studentSetMaps = await studentSetMapTbl.findAll({
//         where: { setIdFk: exam.setIdFk },
//       });
//     } else {
//       // ⭐ FIX — now uses updated studentIds (not original)
//       if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
//         return res.status(400).json({ message: "No students found" });
//       }
//       studentSetMaps = await studentSetMapTbl.findAll({
//         where: { studentIdFk: { [Op.in]: studentIds } },
//       });
//     }

//     // ---- Map student → all their sets ----
//     const studentSetsMap = {};
//     studentSetMaps.forEach((m) => {
//       const sid = m.studentIdFk;
//       if (!studentSetsMap[sid]) studentSetsMap[sid] = [];
//       studentSetsMap[sid].push(m.setIdFk);
//     });

//     // ---- Get Students ----
//     const allStudentIds = [...new Set(studentSetMaps.map((s) => s.studentIdFk))];
//     if (!allStudentIds.length) return res.status(404).json({ message: "No students found" });

//     const students = await studentTbl.findAll({
//       where: {
//         id: { [Op.in]: allStudentIds },
//         status: 1,
//         boardSubjectConditionsId,
//       },
//       order: [["rollNo", "ASC"]],
//     });

//    const studentSubjectRows = await studentSubjectsTbl.findAll({
//   where: {
//     studentIdFk: { [Op.in]: allStudentIds },
//     isActive: 1,
//   },
//   attributes: ["studentIdFk", "subjectIdFk"]
// });

// const allSubjectIds = [
//   ...new Set(studentSubjectRows.map((r) => r.subjectIdFk))
// ];


// const subjects = await subjectsTbl.findAll({
//   where: { id: { [Op.in]: allSubjectIds } },
//   attributes: ["id", "code", "name"]
// });

// const subjectMap = {};
// subjects.forEach(sub => {
//   subjectMap[sub.id] = {
//     code: sub.code || "",
//     name: sub.name || ""
//   };
// });
//     // Map: studentId → subject codes
//    const studentSubjectCodesMap = {};

// studentSubjectRows.forEach(row => {
//   const sid = row.studentIdFk;
//   if (!studentSubjectCodesMap[sid]) studentSubjectCodesMap[sid] = [];

//   const subjectInfo = subjectMap[row.subjectIdFk];
//   if (subjectInfo) {
//     studentSubjectCodesMap[sid].push(subjectInfo.code);
//   }
// });
//     // ---- Logos ----
//     const logoLeftPath = path.join(__dirname, "../views/images/logo-new.png");
//     const logoRightPath = path.join(__dirname, "../views/images/logo-main.png");
//     const logoLeft = fs.existsSync(logoLeftPath) ? fs.readFileSync(logoLeftPath).toString("base64") : null;
//     const logoRight = fs.existsSync(logoRightPath) ? fs.readFileSync(logoRightPath).toString("base64") : null;

//     // ---- pdfmake setup ----
//     const fonts = {
//       Roboto: {
//         normal: "Helvetica",
//         bold: "Helvetica-Bold",
//         italics: "Helvetica-Oblique",
//         bolditalics: "Helvetica-BoldOblique",
//       },
//     };
//     const printer = new PdfPrinter(fonts);

//     // ---- Helper: chunk array ----
//     const chunkArray = (arr, size) => {
//       const out = [];
//       for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
//       return out;
//     };

//     // ---- makeFront (full original layout) ----
//     const makeFront = (student) => {
//       return {
//         table: {
//           widths: ["100%", "100%"],
//           heights: [240],
//           body: [
//             [
//               {
//                 stack: [
//                   // Header: Logos + vertical line
//                   {
//                     columns: [
//                       {
//                         columns: [
//                           logoLeft
//                             ? { image: `data:image/png;base64,${logoLeft}`, fit: [130, 65], alignment: "left", margin: [0, 4, 4, 0] }
//                             : { text: "" },
//                           {
//                             canvas: [{ type: "line", x1: 0, y1: 0, x2: 0, y2: 55, lineWidth: 1.5, color: "#003399" }],
//                             width: 1,
//                             margin: [0, 4, 4, 0],
//                           },
//                           logoRight
//                             ? { image: `data:image/png;base64,${logoRight}`, fit: [90, 45], alignment: "left", margin: [4, 8, 0, 4] }
//                             : { text: "" },
//                         ],
//                         width: "35%",
//                         margin: [0, 6, 6, 6],
//                       },
//                       {
//                         width: "35%",
//                         text: "", // blank middle space
//                       },
//                       {
//                         width: "30%",
//                         stack: [
//                           {
//                             table: {
//                               widths: [90],
//                               heights: [110],
//                               body: [
//                                 [
//                                   (student.photoPath && fs.existsSync(path.join(__dirname, "../public", student.photoPath)))
//                                     ? {
//                                       image: `data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, "../public", student.photoPath)).toString("base64")}`,
//                                       fit: [90, 150],
//                                       alignment: "center",
//                                       margin: [0, 5, 0, 5],
//                                     }
//                                     : { text: "Student\nPhoto", alignment: "center", color: "#999", fontSize: 10, margin: [2, 40, 0, 40] },
//                                 ],
//                               ],
//                             },
//                             layout: {
//                               hLineWidth: () => 1,
//                               vLineWidth: () => 1,
//                               hLineColor: () => "#686868",
//                               vLineColor: () => "#686868",
//                               paddingLeft: () => 2,
//                               paddingRight: () => 2,
//                               paddingTop: () => 2,
//                               paddingBottom: () => 2,
//                             },
//                             margin: [50, 10, 10, 10],
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   // Blue line + Exam title
//                   {
//                     margin: [15, 0, 0, 12],
//                     stack: [
//                       { canvas: [{ type: "line", x1: -5, y1: 0, x2: 217, y2: 0, lineWidth: 1.5, color: "#003399" }], margin: [-3, -68, 0, 4] },
//                       { text: "EXAMINATION 2025 – 2026", alignment: "left", color: "#003399", bold: true, fontSize: 12, margin: [30, 2, 0, 23] },
//                     ],
//                   },
//                   // First Row: Student Info (80%) + Blank (20%)
//                   {
//                     columns: [
//                       {
//                         width: "80%",
//                         stack: [
//                           // Name Row
//                           {
//                             columns: [
//                               { text: "Name:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
//                               {
//                                 text: [
//                                   student.firstName || "",
//                                   student.motherName ? ` ${student.motherName}` : "",
//                                   student.fatherName ? ` ${student.fatherName}` : "",
//                                   student.surname ? ` ${student.surname}` : ""
//                                 ].join("").trim(),
//                                 width: "78%",
//                                 fontSize: 10,
//                               }
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

//                           // Std, Board, Medium, Roll No
//                           {
//                             columns: [
//                               { text: "Std.:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
//                               {
//                                 text: [
//                                   boardCondition.tbl_standards?.name || "",
//                                   boardCondition.tbl_boards?.name ? `  ${boardCondition.tbl_boards.name}` : "",
//                                   boardCondition.tbl_mediums?.name ? ` ${boardCondition.tbl_mediums.name}` : "",
//                                 ].join("").trim(),
//                                 width: "35%",
//                                 fontSize: 10,
//                               },
//                               { text: "Roll No:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
//                               { text: student.rollNo || "", width: "32%", fontSize: 10 }
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

//                           // Mother / Father Name
//                           {
//                             columns: [
//                               { text: "Mother's Name:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
//                               { text: student.motherName || "", width: "35%", fontSize: 10 },
//                               { text: "Father's Name:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
//                               { text: student.fatherName || "", width: "32%", fontSize: 10 },
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

//                           // Mobile & Center
//                           {
//                             columns: [
//                               { text: "Mobile No:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
//                               { text: student.fatherMobile || "N/A", width: "35%", fontSize: 10 },
//                               { text: "Center:", bold: true, color: "#003399", width: "10%", fontSize: 10 },
//                               { text: "" || "N/A", width: "32%", fontSize: 10 },
//                             ],
//                             margin: [6, 4, 6, 2],
//                           },
//                           { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

//                           { 
//                               columns: [
//                                 { text: "Subjects:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
//                                 { 
//                                  text:
//                               studentSubjectCodesMap[student.id]
//                                 ?.map(code => code.includes("-") ? code.split("-")[1] : code)
//                                 // ?.map(code => code)
//                                 .join(", ") || "N/A",
//                                   width: "80%",
//                                   fontSize: 10,
//                                 },
//                               ],
//                               margin: [6, 4, 6, 2],
//                             },
//                           { canvas: [{ type: "line", x1: 10, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },
//                           //

//                         ],
//                       },
//                       { width: "20%", text: "" } // blank
//                     ],
//                     columnGap: 6,
//                     margin: [6, -5, 6, 0],
//                   },

//                   // Second Row: Blank (70%) + Sets Table (30%)
//                   {
//                     columns: [
//                       { width: "73%", text: "" }, // blank
//                       {
//                         width: "27%",
//                         stack: [
//                           {
//                             table: {
//                               widths: [35, 35, 35],
//                               body: [
//                                 [
//                                   { text: "SET 1", alignment: "center", fontSize: 10, color: "white", fillColor: "#003399", bold: true },
//                                   { text: "SET 2", alignment: "center", fontSize: 10, color: "white", fillColor: "#003399", bold: true },
//                                   { text: "SET 3", alignment: "center", fontSize: 10, color: "white", fillColor: "#003399", bold: true },
//                                 ],
//                                 [
//                                   { text: (studentSetsMap[student.id] || []).includes(1) ? "Enrolled" : "", alignment: "center", fontSize: 9, color: (studentSetsMap[student.id] || []).includes(1) ? "#003399" : "#555" },
//                                   { text: (studentSetsMap[student.id] || []).includes(2) ? "Enrolled" : "", alignment: "center", fontSize: 9, color: (studentSetsMap[student.id] || []).includes(2) ? "#003399" : "#555" },
//                                   { text: (studentSetsMap[student.id] || []).includes(3) ? "Enrolled" : "", alignment: "center", fontSize: 9, color: (studentSetsMap[student.id] || []).includes(3) ? "#003399" : "#555" },
//                                 ],

//                               ],

//                             },
//                             margin: [9, -25, 0, 0],   // ← moves the SET table upward
//                             layout: {
//                               hLineWidth: () => 0.7,
//                               vLineWidth: () => 0.7,
//                               hLineColor: () => "#686868",
//                               vLineColor: () => "#686868",
//                             }
//                           },
//                         ],
//                       },

//                     ],
//                     columnGap: 6,
//                     margin: [6, 0, 6, 2],
//                   },
//                 ],
//                 margin: [0, 0, 0, 0],
//               },
//             ],
//           ],
//         },
//         layout: {
//           hLineWidth: (i, node) => (i === node.table.body.length ? 4.7 : 0.7),
//           hLineColor: (i, node) => (i === node.table.body.length ? "#003399" : "#999"),
//           vLineWidth: () => 0.7,
//           vLineColor: () => "#999",
//         }

//       };
//     };

//     // ---- makeBack (full original layout) ----
//     const makeBack = (student) => {
//       const boardStyles = {
//         SSC: {
//           color: "#8BC34A",
//           subjects: [
//             "MAR",
//             "ENG",
//             "H-100\nS-100",
//             "H+G\nH+S",
//             "SCI-1",
//             "SCI-2",
//             "HIST\nITHI",
//             "GEOG\nBHUG",
//             "ALG",
//             "GEOM",
//           ],
//         },
//         CBSE: {
//           color: "#FFEB3B",
//           subjects: ["ENG", "MATH", "SCI", "SST", "LANG"],
//         },
//         ICSE: {
//           color: "#FF9800",
//           subjects: [
//             "PHY",
//             "CHEM",
//             "BIO",
//             "MATH",
//             "LIT",
//             "LANG",
//             "HIST",
//             "GEOG",
//             "HIND",
//             "COMP\nECO",
//           ],
//         },
//         HSC: {
//           color: "#6A1B9A",
//           subjects: [
//             "PHY",
//             "CHEM",
//             "BIO",
//             "MATH",
//             "ENG",
//             "CS1\nIT",
//             "CS2\nGEOG",
//           ],
//         },
//       };

//       const { color: boardColor, subjects: subjectList } =
//         boardStyles[boardName] || boardStyles.SSC;
//       const headerTextColor = boardName === "CBSE" ? "#003399" : "white";

//       // ✅ Conditional column width logic for SSC only
//       const widths =
//         boardName === "SSC"
//           ? [35, ...Array(subjectList.length).fill(43)] // narrower columns
//           : ["auto", ...Array(subjectList.length).fill("*")]; // dynamic width for others

//       // ---- Table header + data ----
//       const headerRow = [
//         {
//           text: boardName,
//           alignment: "center",
//           bold: true,
//           color: headerTextColor,
//           fillColor: boardColor,
//           fontSize: 10,
//         },
//         ...subjectList.map((s) => ({
//           text: s,
//           alignment: "center",
//           bold: true,
//           color: headerTextColor,
//           fillColor: boardColor,
//           fontSize: 10,
//         })),
//       ];

//       const setRows = ["1", "2", "3"].map((setName) => [
//         {
//           text: `SET ${setName}`,
//           alignment: "center",
//           bold: true,
//           color: headerTextColor,
//           fillColor: boardColor,
//           fontSize: 10,
//         },
//         ...subjectList.map(() => ({
//           text: "",
//           alignment: "center",
//           fontSize: 10,
//         })),
//       ]);

//       const table = {
//         table: {
//           widths,
//           body: [headerRow, ...setRows],
//         },
//         layout: {
//           hLineWidth: () => 0.3,
//           vLineWidth: () => 0.3,
//           hLineColor: () => "#444444",
//           vLineColor: () => "#444444",
//           paddingLeft: () => 3,
//           paddingRight: () => 3,
//           paddingTop: () => 5,
//           paddingBottom: () => 5,
//         },
//         margin: [6, 5, 6, 0],
//       };

//       // ---- Full Back Layout ----
//       return {
//         table: {
//           widths: ["100%"],
//           heights: [247],
//           body: [
//             [
//               {
//                 stack: [
//                   {
//                     columns: [
//                       {
//                         columns: [
//                           logoLeft
//                             ? { image: `data:image/png;base64,${logoLeft}`, fit: [130, 65], alignment: "left", margin: [0, 4, 4, 0] }
//                             : { text: "" },
//                           {
//                             canvas: [{ type: "line", x1: 0, y1: 0, x2: 0, y2: 55, lineWidth: 1.5, color: "#003399" }],
//                             width: 1,
//                             margin: [0, 4, 4, 0],
//                           },
//                           logoRight
//                             ? { image: `data:image/png;base64,${logoRight}`, fit: [90, 45], alignment: "left", margin: [4, 8, 0, 4] }
//                             : { text: "" },
//                         ],
//                         width: "35%",
//                         margin: [0, 6, 6, 6],
//                       },
//                       {
//                         width: "30%",
//                         margin: [50, 10, 10, 10],
//                         stack: [
//                           {

//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     margin: [15, 0, 0, 12],
//                     stack: [
//                       {
//                         canvas: [
//                           {
//                             type: "line",
//                             x1: -4,
//                             y1: 0,
//                             x2: 217,
//                             y2: 0,
//                             lineWidth: 1.5,
//                             color: "#003399",
//                           },
//                         ],
//                         margin: [-3, -3, 0, 4],
//                       },
//                       {
//                         text: "EXAMINATION 2025 – 2026",
//                         alignment: "left",
//                         color: "#003399",
//                         bold: true,
//                         fontSize: 12,
//                         margin: [30, 2, 0, 23],
//                       },
//                       {
//                         text: "Attendance Report",
//                         alignment: "center",
//                         color: "black",
//                         bold: true,
//                         fontSize: 10,
//                         margin: [0, 5, 0, 4],
//                       },
//                     ],
//                   },
//                   table, // ✅ SSC now fits better (reduced column width)
//                 ],
//               },
//             ],
//           ],
//         },
//         layout: {
//           hLineWidth: (i, node) => (i === node.table.body.length ? 4.7 : 0.7),
//           hLineColor: (i, node) => (i === node.table.body.length ? "#003399" : "#999"),
//           vLineWidth: () => 0.7,
//           vLineColor: () => "#999",
//         }
//       };
//     };



//     // ---- Grid 3 per page (portrait) ----
//     const grid3x1 = (cards) => {
//       const safeCard = (c) => (c ? { ...c, margin: [6, 6, 6, 6] } : { text: "" });
//       return {
//         table: {
//           widths: ["100%"],
//           heights: [250, 250, 250],
//           body: [[safeCard(cards[0] || null)], [safeCard(cards[1] || null)], [safeCard(cards[2] || null)]],
//         },
//         layout: "noBorders",
//       };
//     };

//     // ---- Build content ----
//     const content = [];
//     for (let i = 0; i < students.length; i += 3) {
//       const chunk = students.slice(i, i + 3);
//       content.push(grid3x1(chunk.map((s) => makeFront(s))));
//       content.push({ text: "", pageBreak: "before" });
//       content.push(grid3x1(chunk.map((s) => makeBack(s))));
//       if (i + 3 < students.length) content.push({ text: "", pageBreak: "before" });
//     }

//     // ---- Document Definition ----
//     const docDefinition = {
//       pageSize: "A4",
//       pageOrientation: "portrait",
//       pageMargins: [10, 10, 10, 10],
//       content,
//       footer: (currentPage, pageCount) => ({
//         columns: [{ text: `Page ${currentPage} of ${pageCount}`, alignment: "center", fontSize: 7, color: "#666", margin: [0, 8, 0, 0] }],
//       }),
//     };

//     // ---- Generate PDF ----
//     const pdfDoc = printer.createPdfKitDocument(docDefinition);

//     let chunks = [];
//     pdfDoc.on("data", chunk => chunks.push(chunk));
//     pdfDoc.on("end", () => {
//       const pdfBuffer = Buffer.concat(chunks);
//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=hall-tickets-${examSessionsTblId}-${Date.now()}.pdf`
//       );
//       res.send(pdfBuffer);
//     });
//     pdfDoc.end();
//   } catch (err) {
//     console.error("Error generating hall ticket:", err);
//     handleSequelizeError(err, res, "superAdminController.generateHallTicket");
//   }
// };

superAdminController.generateHallTicket = async function (req, res) {
  try {
    let { examSessionsTblId, studentIds, boardSubjectConditionsId } = req.body;

    // ---- Fetch Exam Session ----
    let exam;
    if (examSessionsTblId != null) {
      exam = await examSessionsTbl.findByPk(examSessionsTblId, {
        include: [
          { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name", "hall_ticket_color"] },
          { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
          { model: setsTbl, as: "tbl_sets", attributes: ["id", "name"] },
        ],
      });
      if (!exam) return res.status(404).json({ message: "Exam session not found" });
    }

    // ⭐ FIX — When frontend sends "all"
    if (studentIds === "all") {
      const all = await studentTbl.findAll({
        where: {
          status: 1,
          boardSubjectConditionsId
        },
        attributes: ["id"]
      });
      studentIds = all.map(s => s.id); // now studentIds contains real IDs
    }

    // ---- Fetch Board Condition ----
    const boardCondition = await boardSubjectConditionsTbl.findOne({
      where: { id: boardSubjectConditionsId },
      include: [
        { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name", "hall_ticket_color"] },
        { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
        { model: mediumsTbl, as: "tbl_mediums", attributes: ["id", "name"] },
      ],
    });
    if (!boardCondition)
      return res.status(404).json({ message: "Board subject condition not found" });

    const boardName = boardCondition.tbl_boards?.name?.toUpperCase() || "CBSE";

    // ---- Get Student Set Maps ----
    let studentSetMaps;
    if (examSessionsTblId != null && exam) {
      studentSetMaps = await studentSetMapTbl.findAll({
        where: { setIdFk: exam.setIdFk },
      });
    } else {
      // ⭐ FIX — now uses updated studentIds (not original)
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "No students found" });
      }
      studentSetMaps = await studentSetMapTbl.findAll({
        where: { studentIdFk: { [Op.in]: studentIds } },
      });
    }

    // ---- Map student → all their sets ----
    const studentSetsMap = {};
    studentSetMaps.forEach((m) => {
      const sid = m.studentIdFk;
      if (!studentSetsMap[sid]) studentSetsMap[sid] = [];
      studentSetsMap[sid].push(m.setIdFk);
    });

    // ---- Get Students ----
    const allStudentIds = [...new Set(studentSetMaps.map((s) => s.studentIdFk))];
    if (!allStudentIds.length) return res.status(404).json({ message: "No students found" });

    const students = await studentTbl.findAll({
      where: {
        id: { [Op.in]: allStudentIds },
        status: 1,
        boardSubjectConditionsId,
      },
      order: [["rollNo", "ASC"]],
    });

    const studentSubjectRows = await studentSubjectsTbl.findAll({
      where: {
        studentIdFk: { [Op.in]: allStudentIds },
        isActive: 1,
      },
      attributes: ["studentIdFk", "subjectIdFk"]
    });

    const allSubjectIds = [
      ...new Set(studentSubjectRows.map((r) => r.subjectIdFk))
    ];


    const subjects = await subjectsTbl.findAll({
      where: { id: { [Op.in]: allSubjectIds } },
      attributes: ["id", "code", "name"]
    });

    const subjectMap = {};
    subjects.forEach(sub => {
      subjectMap[sub.id] = {
        code: sub.code || "",
        name: sub.name || ""
      };
    });
    // Map: studentId → subject codes
    const studentSubjectCodesMap = {};

    studentSubjectRows.forEach(row => {
      const sid = row.studentIdFk;
      if (!studentSubjectCodesMap[sid]) studentSubjectCodesMap[sid] = [];

      const subjectInfo = subjectMap[row.subjectIdFk];
      if (subjectInfo) {
        studentSubjectCodesMap[sid].push(subjectInfo.code);
      }
    });
    // ---- Logos ----
    const logoPath = path.join(__dirname, "../views/images/logo.jpg");
    const logo = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString("base64") : null;

    // ---- pdfmake setup ----
    const fonts = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };
    const printer = new PdfPrinter(fonts);

    // ---- Helper: chunk array ----
    const chunkArray = (arr, size) => {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    // ---- makeFront (full original layout) ----
    const makeFront = (student) => {
      return {
        table: {
          widths: ["100%", "100%"],
          heights: [240],
          body: [
            [
              {
                stack: [
                  // Header: Logos + vertical line
                  {
                    columns: [
                      {
                        width: 222,
                        stack: [
                          logo
                            ? { image: `data:image/jpeg;base64,${logo}`, fit: [150, 65], alignment: "center", margin: [0, 0, 0, 0] }
                            : { text: "" },
                        ],
                        margin: [0, 0, 0, 6],
                      },
                      {
                        width: "*",
                        text: "",
                      },
                      {
                        width: 95,
                        stack: [
                          {
                            table: {
                              widths: [90],
                              heights: [110],
                              body: [
                                [
                                  (student.photoPath && fs.existsSync(path.join(__dirname, "../public", student.photoPath)))
                                    ? {
                                      image: `data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, "../public", student.photoPath)).toString("base64")}`,
                                      fit: [90, 150],
                                      alignment: "center",
                                      margin: [0, 5, 0, 5],
                                    }
                                    : { text: "Student\nPhoto", alignment: "center", color: "#999", fontSize: 10, margin: [2, 40, 0, 40] },
                                ],
                              ],
                            },
                            layout: {
                              hLineWidth: () => 1,
                              vLineWidth: () => 1,
                              hLineColor: () => "#686868",
                              vLineColor: () => "#686868",
                              paddingLeft: () => 2,
                              paddingRight: () => 2,
                              paddingTop: () => 2,
                              paddingBottom: () => 2,
                            },
                            margin: [0, 10, 0, 10],
                          },
                        ],
                      },
                    ],
                  },
                  // Blue line + Exam title
                  {
                    margin: [15, 0, 0, 12],
                    stack: [
                      { canvas: [{ type: "line", x1: -5, y1: 0, x2: 217, y2: 0, lineWidth: 1.5, color: "#003399" }], margin: [-3, -55, 0, 4] },
                      { text: "EXAMINATION 2025 – 2026", alignment: "left", color: "#003399", bold: true, fontSize: 12, margin: [30, 2, 0, 23] },
                    ],
                  },
                  // First Row: Student Info (80%) + Blank (20%)
                  {
                    columns: [
                      {
                        width: "80%",
                        stack: [
                          // Name Row
                          {
                            columns: [
                              { text: "Name:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
                              {
                                text: [
                                  student.firstName || "",
                                  student.motherName ? ` ${student.motherName}` : "",
                                  student.fatherName ? ` ${student.fatherName}` : "",
                                  student.surname ? ` ${student.surname}` : ""
                                ].join("").trim(),
                                width: "78%",
                                fontSize: 10,
                              }
                            ],
                            margin: [6, 4, 6, 2],
                          },
                          { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

                          // Std, Board, Medium, Roll No
                          {
                            columns: [
                              { text: "Std.:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
                              {
                                text: [
                                  boardCondition.tbl_standards?.name || "",
                                  boardCondition.tbl_boards?.name ? `  ${boardCondition.tbl_boards.name}` : "",
                                  boardCondition.tbl_mediums?.name ? ` ${boardCondition.tbl_mediums.name}` : "",
                                ].join("").trim(),
                                width: "35%",
                                fontSize: boardCondition.tbl_mediums?.name === 'Semi English Medium' ? 8 : 10,
                              },
                              { text: "Roll No:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
                              { text: student.rollNo || "", width: "32%", fontSize: 10 }
                            ],
                            margin: [6, 4, 6, 2],
                          },
                          { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

                          // Mother / Father Name
                          {
                            columns: [
                              { text: "Mother's Name:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
                              { text: student.motherName || "", width: "35%", fontSize: 10 },
                              { text: "Father's Name:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
                              { text: student.fatherName || "", width: "32%", fontSize: 10 },
                            ],
                            margin: [6, 4, 6, 2],
                          },
                          { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

                          // Mobile & Center
                          {
                            columns: [
                              { text: "Mobile No:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
                              { text: student.fatherMobile || "N/A", width: "35%", fontSize: 10 },
                              { text: "Center:", bold: true, color: "#003399", width: "10%", fontSize: 10 },
                              { text: "" || "N/A", width: "32%", fontSize: 10 },
                            ],
                            margin: [6, 4, 6, 2],
                          },
                          { canvas: [{ type: "line", x1: 6, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },

                          {
                            columns: [
                              { text: "Subjects:", bold: true, color: "#003399", width: "19%", fontSize: 10 },
                              {
                                text:
                                  studentSubjectCodesMap[student.id]
                                    ?.map(code => code.includes("-") ? code.split("-")[1] : code)
                                    .join(", ") || "N/A",
                                width: "80%",
                                fontSize: 10
                              },
                            ],
                            margin: [6, 4, 6, 2],
                          },
                          { canvas: [{ type: "line", x1: 10, y1: 0, x2: 390, y2: 0, lineWidth: 0.5, color: "#e0e0e0" }], margin: [0, 2, 0, 4] },
                          //

                        ],
                      },
                      { width: "20%", text: "" } // blank
                    ],
                    columnGap: 6,
                    margin: [6, -5, 6, 0],
                  },

                  // Second Row: Blank (70%) + Sets Table (30%)
                  {
                    columns: [
                      { width: "73%", text: "" }, // blank
                      {
                        width: "27%",
                        stack: [
                          {
                            table: {
                              widths: [35, 35, 35],
                              body: [
                                [
                                  { text: "SET 1", alignment: "center", fontSize: 10, color: "white", fillColor: "#003399", bold: true },
                                  { text: "SET 2", alignment: "center", fontSize: 10, color: "white", fillColor: "#003399", bold: true },
                                  { text: "SET 3", alignment: "center", fontSize: 10, color: "white", fillColor: "#003399", bold: true },
                                ],
                                [
                                  { text: (studentSetsMap[student.id] || []).includes(1) ? "Enrolled" : "", alignment: "center", fontSize: 9, color: (studentSetsMap[student.id] || []).includes(1) ? "#003399" : "#555" },
                                  { text: (studentSetsMap[student.id] || []).includes(2) ? "Enrolled" : "", alignment: "center", fontSize: 9, color: (studentSetsMap[student.id] || []).includes(2) ? "#003399" : "#555" },
                                  { text: (studentSetsMap[student.id] || []).includes(3) ? "Enrolled" : "", alignment: "center", fontSize: 9, color: (studentSetsMap[student.id] || []).includes(3) ? "#003399" : "#555" },
                                ],

                              ],

                            },
                            margin: [7, -13, 0, 0],   // ← moves the SET table upward
                            layout: {
                              hLineWidth: () => 0.7,
                              vLineWidth: () => 0.7,
                              hLineColor: () => "#686868",
                              vLineColor: () => "#686868",
                            }
                          },
                        ],
                      },

                    ],
                    columnGap: 6,
                    margin: [6, 0, 6, 2],
                  },
                ],
                margin: [0, 0, 0, 0],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 4.7 : 0.7),
          hLineColor: (i, node) => (i === node.table.body.length ? "#003399" : "#999"),
          vLineWidth: () => 0.7,
          vLineColor: () => "#999",
        }

      };
    };

    // ---- makeBack (full original layout) ----
    const makeBack = (student) => {
      const boardStyles = {
        SSC: {
          color: "#8BC34A",
          subjects: [
            "MAR",
            "ENG",
            "H-100\nS-100",
            "H+G\nH+S",
            "SCI-1",
            "SCI-2",
            "HIST\nITHI",
            "GEOG\nBHUG",
            "ALG",
            "GEOM",
          ],
        },
        CBSE: {
          color: "#FFEB3B",
          subjects: ["ENG", "MATH", "SCI", "SST", "LANG"],
        },
        ICSE: {
          color: "#FF9800",
          subjects: [
            "PHY",
            "CHEM",
            "BIO",
            "MATH",
            "LIT",
            "LANG",
            "HIST",
            "GEOG",
            "HIND",
            "COMP\nECO",
          ],
        },
        HSC: {
          color: "#6A1B9A",
          subjects: [
            "PHY",
            "CHEM",
            "BIO",
            "MATH",
            "ENG",
            "CS1\nIT",
            "CS2\nGEOG",
          ],
        },
      };

      const { color: boardColor, subjects: subjectList } =
        boardStyles[boardName] || boardStyles.SSC;
      const headerTextColor = boardName === "CBSE" ? "#003399" : "white";

      // ✅ Conditional column width logic for SSC only
      const widths =
        boardName === "SSC"
          ? [35, ...Array(subjectList.length).fill(43)] // narrower columns
          : ["auto", ...Array(subjectList.length).fill("*")]; // dynamic width for others

      // ---- Table header + data ----
      const headerRow = [
        {
          text: boardName,
          alignment: "center",
          bold: true,
          color: headerTextColor,
          fillColor: boardColor,
          fontSize: 10,
        },
        ...subjectList.map((s) => ({
          text: s,
          alignment: "center",
          bold: true,
          color: headerTextColor,
          fillColor: boardColor,
          fontSize: 10,
        })),
      ];

      const setRows = ["1", "2", "3"].map((setName) => [
        {
          text: `SET ${setName}`,
          alignment: "center",
          bold: true,
          color: headerTextColor,
          fillColor: boardColor,
          fontSize: 10,
        },
        ...subjectList.map(() => ({
          text: "",
          alignment: "center",
          fontSize: 10,
        })),
      ]);

      const table = {
        table: {
          widths,
          body: [headerRow, ...setRows],
        },
        layout: {
          hLineWidth: () => 0.3,
          vLineWidth: () => 0.3,
          hLineColor: () => "#444444",
          vLineColor: () => "#444444",
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        margin: [6, 5, 6, 0],
      };

      // ---- Full Back Layout ----
      return {
        table: {
          widths: ["100%"],
          heights: [247],
          body: [
            [
              {
                stack: [
                  {
                    columns: [
                      {
                        width: 222,
                        stack: [
                          logo
                            ? { image: `data:image/jpeg;base64,${logo}`, fit: [150, 65], alignment: "center", margin: [0, 0, 0, 0] }
                            : { text: "" },
                        ],
                        margin: [0, 0, 0, 6],
                      },
                      {
                        width: "*",
                        text: "",
                      },
                      {
                        width: 95,
                        margin: [0, 10, 0, 10],
                        stack: [
                          {

                          },
                        ],
                      },
                    ],
                  },
                  {
                    margin: [15, 0, 0, 12],
                    stack: [
                      {
                        canvas: [
                          {
                            type: "line",
                            x1: -4,
                            y1: 0,
                            x2: 217,
                            y2: 0,
                            lineWidth: 1.5,
                            color: "#003399",
                          },
                        ],
                        margin: [-3, -3, 0, 4],
                      },
                      {
                        text: "EXAMINATION 2025 – 2026",
                        alignment: "left",
                        color: "#003399",
                        bold: true,
                        fontSize: 12,
                        margin: [30, 2, 0, 23],
                      },
                      {
                        text: "Attendance Report",
                        alignment: "center",
                        color: "black",
                        bold: true,
                        fontSize: 10,
                        margin: [0, 5, 0, 4],
                      },
                    ],
                  },
                  table, // ✅ SSC now fits better (reduced column width)
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 4.7 : 0.7),
          hLineColor: (i, node) => (i === node.table.body.length ? "#003399" : "#999"),
          vLineWidth: () => 0.7,
          vLineColor: () => "#999",
        }
      };
    };



    // ---- Grid 3 per page (portrait) ----
    const grid3x1 = (cards) => {
      const safeCard = (c) => (c ? { ...c, margin: [6, 6, 6, 6] } : { text: "" });
      return {
        table: {
          widths: ["100%"],
          heights: [250, 250, 250],
          body: [[safeCard(cards[0] || null)], [safeCard(cards[1] || null)], [safeCard(cards[2] || null)]],
        },
        layout: "noBorders",
      };
    };

    // ---- Build content ----
    const content = [];
    for (let i = 0; i < students.length; i += 3) {
      const chunk = students.slice(i, i + 3);
      content.push(grid3x1(chunk.map((s) => makeFront(s))));
      content.push({ text: "", pageBreak: "before" });
      content.push(grid3x1(chunk.map((s) => makeBack(s))));
      if (i + 3 < students.length) content.push({ text: "", pageBreak: "before" });
    }

    // ---- Document Definition ----
    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "portrait",
      pageMargins: [10, 10, 10, 10],
      content,
      footer: (currentPage, pageCount) => ({
        columns: [{ text: `Page ${currentPage} of ${pageCount}`, alignment: "center", fontSize: 7, color: "#666", margin: [0, 8, 0, 0] }],
      }),
    };

    // ---- Generate PDF ----
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    let chunks = [];
    pdfDoc.on("data", chunk => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=hall-tickets-${examSessionsTblId}-${Date.now()}.pdf`
      );
      res.send(pdfBuffer);
    });
    pdfDoc.end();
  } catch (err) {
    console.error("Error generating hall ticket:", err);
    handleSequelizeError(err, res, "superAdminController.generateHallTicket");
  }
};


superAdminController.updateExamTimeTable = async function (req, res) {
  const transaction = await sequelize.transaction();
  try {
    const examId = req.params.id;
    const {
      name,
      boardId,
      standardId,
      setId,
      dateFrom,
      dateTo,
      conditionId,
      examTimeTableData = []
    } = req.body;


    const existingExam = await examSessionsTbl.findOne({
      where: { id: examId }
    });

    if (!existingExam) {
      await transaction.rollback();
      return res.status(404).json({ message: "Exam session not found" });
    }


    await examSessionsTbl.update(
      {
        name,
        boardIdFk: boardId,
        standardIdFk: standardId,
        setIdFk: setId,
        dateFrom,
        dateTo,
        boardSubjectConditionsId: conditionId,
        updatedBy: req.uid
      },
      { where: { id: examId }, transaction }
    );


    await examTimetableTbl.destroy({
      where: { examSessionIdFk: examId },
      transaction
    });


    const formattedExamTimeTableData = examTimeTableData.map(item => ({
      examSessionIdFk: examId,
      examDate: item.date,
      examStartTime: item.examStartTime,
      examEndTime: item.examEndTime,
      subjectIdFk: item.subjectId,
      maxMarks: item.maxMarks
    }));

    if (formattedExamTimeTableData.length > 0) {
      await examTimetableTbl.bulkCreate(formattedExamTimeTableData, { transaction });
    }


    await transaction.commit();

    return res.status(200).json({
      message: "Exam timetable updated successfully!"
    });

  } catch (err) {
    await transaction.rollback();
    console.log("Error:", err);
    handleSequelizeError(err, res, "superAdminController.updateExamTimeTable");
  }
};







superAdminController.deleteExamTimeTable = async function (req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const existingExam = await examSessionsTbl.findOne({ where: { id } });
    if (!existingExam) {
      await transaction.rollback();
      return res.status(404).json({ message: "Exam not found" });
    }


    // await examTimetableTbl.destroy({
    //   where: { examSessionIdFk: id },
    //   transaction
    // });

    await examTimetableTbl.update({
      status: 3
    }, { where: { examSessionIdFk: id }, transaction })


    // await examSessionsTbl.destroy({
    //   where: { id },
    //   transaction
    // });

    await examSessionsTbl.update({
      status: 3
    }, { where: { id }, transaction })

    await transaction.commit();

    return res.status(200).json({
      message: "Exam deleted successfully!"
    });

  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting exam:", err);
    handleSequelizeError(err, res, "superAdminController.deleteExamTimeTable");
  }
};

// 📁 controllers/superAdminController.js
superAdminController.getExamSessionsByCondition = async (req, res) => {
  try {
    const { conditionId } = req.query;

    // 🔹 Verify the condition exists
    const condition = await boardSubjectConditionsTbl.findOne({
      where: { id: conditionId },
      attributes: ["boardIdFk", "standardIdFk"],
    });

    if (!condition)
      return res.status(404).json({ message: "Condition not found" });

    // 🔹 Fetch Exam Sessions + Include Set Name
    const sessions = await examSessionsTbl.findAll({
      where: { boardSubjectConditionsId: conditionId, status: 1 },
      include: [
        {
          model: setsTbl,
          as: "tbl_sets",
          attributes: ["id", "name"],
        },
      ],
      attributes: ["id", "name", "dateFrom", "dateTo", "setIdFk"],
      order: [["id", "DESC"]],
    });

    // 🔹 Map session data with Set Name
    const sessionData = sessions.map((s) => ({
      label: s.tbl_sets?.name,
      value: s.id,
      setIdFk: s.setIdFk,
      setName: s.tbl_sets?.name || "N/A",
      examDateRange: s.dateFrom + " - " + s.dateTo,
    }));

    return res.json({ sessionData });
  } catch (err) {
    console.error("Error fetching exam sessions:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// superAdminController.getTableExams = async function (req, res) {
//   try {
//     const {
//       currentPage = 1,
//       perPage = 50,
//       orderBy = 'id',
//       orderDirection = 'DESC',
//       searchValue = ''
//     } = req.body;

//     const page = parseInt(currentPage, 10);
//     const limit = parseInt(perPage, 10);
//     const offset = (page - 1) * limit;

//     const whereConditions = { status: { [Op.ne]: 3 } }
//     if (searchValue) {
//       whereConditions.name = { [Op.like]: `%${searchValue}%` }
//     }

//     const exams = await examSessionsTbl.findAll({
//       where: whereConditions,
//       order: [[orderBy, orderDirection]],
//       limit,
//       offset
//     });

//     if (!exams || exams.length === 0)
//       return res.status(200).json({ tableData: [], tableRecords: 0 });


//     const boardIds = [...new Set(exams.map(e => e.boardIdFk))];
//     const standardIds = [...new Set(exams.map(e => e.standardIdFk))];
//     const setIds = [...new Set(exams.map(e => e.setIdFk))];


//     const boards = await boardsTbl.findAll({ where: { id: boardIds }, attributes: ['id', 'name'] });
//     const standards = await standardsTbl.findAll({ where: { id: standardIds }, attributes: ['id', 'name'] });
//     const sets = await setsTbl.findAll({ where: { id: setIds }, attributes: ['id', 'name'] });


//     const boardMap = Object.fromEntries(boards.map(b => [b.id, b.name]));
//     const standardMap = Object.fromEntries(standards.map(s => [s.id, s.name]));
//     const set1Map = Object.fromEntries(sets.map(ss => [ss.id, ss.name]));


//     const tableData = await Promise.all(
//       exams.map(async (exam) => {
//         // Fetch exam timetable
//         const examTimetableData = await examTimetableTbl.findAll({
//           where: { examSessionIdFk: exam.id },
//           attributes: ['id', 'examDate', 'subjectIdFk', 'maxMarks', 'examStartTime', 'examEndTime']
//         });

//         const formattedExamTimeTableData = examTimetableData.map((i) => {

//           let formattedExamTime = (t) => {
//             return dayjs(t).format("HH:MM:ss")
//           }

//           return {
//             ...i,
//             examStartTime: formattedExamTime(i.examStartTime),
//             examEndTime: formattedExamTime(i.examEndTime)
//           }

//         })

//         const studentsBySet = await studentSetMapTbl.findAll({
//           where: {
//             setIdFk: exam.setIdFk
//           }
//         });
//         const studentIds = studentsBySet.map((s) => s.studentIdFk);
//         const studentCount = await studentTbl.count({
//           where: {
//             id: { [Op.in]: studentIds },
//             boardSubjectConditionsId: exam.boardSubjectConditionsId
//           }
//         })

//         const boardSubjectConditionTblObj = await boardSubjectConditionsTbl.findOne({
//           where: {
//             id: exam.boardSubjectConditionsId
//           }
//         })


//         return {
//           id: exam.id,
//           name: exam.name,
//           board: boardMap[exam.boardIdFk] || null,
//           standard: standardMap[exam.standardIdFk] || null,
//           set: set1Map[exam.setIdFk] || null,
//           dateFrom: exam.dateFrom,
//           dateTo: exam.dateTo,
//           examTimetableData: formattedExamTimeTableData,
//           studentCount,
//           boardCondition: boardSubjectConditionTblObj?.name,
//           createdAt: exam.createdAt,
//           updatedAt: exam.updatedAt
//         };
//       })
//     );

//     const tableRecords = await examSessionsTbl.count({ where: whereConditions });

//     return res.status(200).json({ tableData, tableRecords });

//   } catch (err) {
//     console.error("Error in getTableExams:", err);
//     return res.status(500).json({ message: "Error fetching exams." });
//   }
// };



// superAdminController.getStudentsWithPendingFees = async function (req, res) {
//   try {
//     const {
//       conditionId,
//       page = 1,
//       perPage = 50,
//       orderBy = "rollNo",
//       orderDirection = "ASC",
//     } = req.query;

//     const offset = (page - 1) * perPage;
//     const limit = parseInt(perPage);


//     const today = new Date();
//     const lastWeek = new Date();
//     lastWeek.setDate(today.getDate() - 7);


//     const whereClause = {
//       status: { [Op.ne]: 3 }, // not deleted
//       feesRemaining: { [Op.gt]: 0 },
//     };


//     if (conditionId) {
//       const condition = await boardSubjectConditionsTbl.findByPk(conditionId, {
//         attributes: ["boardIdFk", "standardIdFk", "mediumIdFk"],
//       });

//       if (condition) {
//         whereClause.boardIdFk = condition.boardIdFk;
//         whereClause.standardIdFk = condition.standardIdFk;
//         if (condition.mediumIdFk) whereClause.mediumIdFk = condition.mediumIdFk;
//       }
//     }

//     const students = await studentTbl.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: studentFeesInstallmentsTbl,
//           as: "installments1",
//           required: false,
//           where: {
//             paidStatus: 1, // Pending installments
//             dueDate: {
//               [Op.between]: [lastWeek, today],
//             },
//           },
//         },
//       ],
//       order: [[orderBy, orderDirection]],
//       limit,
//       offset,
//       distinct: true,
//     });


//     const standardIds = [...new Set(students.rows.map((s) => s.standardIdFk))];
//     const boardIds = [...new Set(students.rows.map((s) => s.boardIdFk))];
//     const mediumIds = [...new Set(students.rows.map((s) => s.mediumIdFk))];

//     const [standards, boards, mediums] = await Promise.all([
//       standardsTbl.findAll({ where: { id: standardIds }, attributes: ["id", "name"] }),
//       boardsTbl.findAll({ where: { id: boardIds }, attributes: ["id", "name"] }),
//       mediumsTbl.findAll({ where: { id: mediumIds }, attributes: ["id", "name"] }),
//     ]);

//     const standardMap = Object.fromEntries(standards.map((s) => [s.id, s.name]));
//     const boardMap = Object.fromEntries(boards.map((b) => [b.id, b.name]));
//     const mediumMap = Object.fromEntries(mediums.map((m) => [m.id, m.name]));


//     const formattedStudents = students.rows.map((s) => ({
//       id: s.id,
//       rollNo: s.rollNo,
//       name: `${s.firstName} ${s.surname || ""}`.trim(),
//       fatherName: s.fatherName,
//       gender: s.gender === "F" ? "Female" : s.gender === "M" ? "Male" : "Other",
//       dob: s.dob,
//       feesPaid: Number(s.feesPaid || 0),
//       feesRemaining: Number(s.feesRemaining || 0),
//       standard: standardMap[s.standardIdFk] || "",
//       board: boardMap[s.boardIdFk] || "",
//       medium: mediumMap[s.mediumIdFk] || "",
//       pendingInstallments: (s.installments1 || []).filter(
//         (i) => i.paidStatus === 1
//       ),
//     }));

//     const totalRecords = students.count;
//     const totalPages = Math.ceil(totalRecords / limit);

//     return res.status(200).json({
//       success: true,
//       students: formattedStudents,
//       totalRecords,
//       totalPages,
//       filterRange: {
//         from: lastWeek.toISOString().split("T")[0],
//         to: today.toISOString().split("T")[0],
//       },
//     });
//   } catch (err) {
//     console.error("Error in getStudentsWithPendingFees:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Error fetching students." });
//   }
// };

superAdminController.getTableExams = async function (req, res) {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      orderBy = "id",
      orderDirection = "DESC",
      searchValue = "",
      board = [],
      set = []
    } = req.body;

    const page = Number(currentPage);
    const limit = Number(perPage);
    const offset = (page - 1) * limit;

    // Basic where conditions
    const whereConditions = { status: { [Op.ne]: 3 } };

    if (searchValue) {
      whereConditions.name = { [Op.like]: `%${searchValue}%` };
    }

    if (board.length > 0) {
      whereConditions.boardSubjectConditionsId = { [Op.in]: board }
    }

    if (set.length > 0) {
      whereConditions.setIdFk = {
        [Op.in]: set
      }
    }

    // Fetch exams
    const exams = await examSessionsTbl.findAll({
      where: whereConditions,
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (exams.length === 0) {
      return res.status(200).json({ tableData: [], tableRecords: 0 });
    }

    // Extract unique FK IDs
    const boardIds = [...new Set(exams.map(e => e.boardIdFk))];
    const standardIds = [...new Set(exams.map(e => e.standardIdFk))];
    const setIds = [...new Set(exams.map(e => e.setIdFk))];

    // Fetch related FK table data
    const [boards, standards, sets] = await Promise.all([
      boardsTbl.findAll({ where: { id: boardIds }, attributes: ["id", "name"], raw: true }),
      standardsTbl.findAll({ where: { id: standardIds }, attributes: ["id", "name"], raw: true }),
      setsTbl.findAll({ where: { id: setIds }, attributes: ["id", "name"], raw: true })
    ]);

    // Convert FK tables into maps for fast lookup
    const boardMap = Object.fromEntries(boards.map(b => [b.id, b.name]));
    const standardMap = Object.fromEntries(standards.map(s => [s.id, s.name]));
    const setMap = Object.fromEntries(sets.map(s => [s.id, s.name]));

    // Format time function (CRITICAL FIX)
    const formatTime = (t) => (t ? dayjs(t, "HH:mm:ss").format("hh:mm a") : null);

    // Build table rows
    const tableData = await Promise.all(
      exams.map(async (exam) => {
        const examId = exam.id;

        // 1. Exam timetable
        const examTimetable = await examTimetableTbl.findAll({
          where: { examSessionIdFk: examId },
          attributes: [
            "id",
            "examDate",
            "subjectIdFk",
            "maxMarks",
            "examStartTime",
            "examEndTime"
          ],
          raw: true
        });

        const formattedTimetable = examTimetable.map((t) => ({
          ...t,
          examStartTime: formatTime(t.examStartTime),
          examEndTime: formatTime(t.examEndTime)
        }));

        // 2. Student count based on set
        const studentSet = await studentSetMapTbl.findAll({
          where: { setIdFk: exam.setIdFk },
          attributes: ["studentIdFk"],
          raw: true
        });

        const studentIds = studentSet.map((s) => s.studentIdFk);

        const studentCount = await studentTbl.count({
          where: {
            id: { [Op.in]: studentIds },
            status: { [Op.ne]: 3 },
            boardSubjectConditionsId: exam.boardSubjectConditionsId
          }
        });

        // 3. Board Subject Condition
        const boardCond = await boardSubjectConditionsTbl.findOne({
          where: { id: exam.boardSubjectConditionsId },
          attributes: ["name"],
          raw: true
        });

        return {
          id: examId,
          name: exam.name,
          board: boardMap[exam.boardIdFk] || null,
          standard: standardMap[exam.standardIdFk] || null,
          set: setMap[exam.setIdFk] || null,
          dateFrom: exam.dateFrom,
          dateTo: exam.dateTo,
          examTimetableData: formattedTimetable,
          studentCount,
          boardCondition: boardCond?.name || null,
          createdAt: exam.createdAt,
          updatedAt: exam.updatedAt
        };
      })
    );

    const tableRecords = await examSessionsTbl.count({ where: whereConditions });

    return res.status(200).json({ tableData, tableRecords });
  } catch (err) {
    console.error("Error in getTableExams:", err);
    return res.status(500).json({ message: "Error fetching exams." });
  }
};



superAdminController.getStudentsWithPendingFees = async (req, res) => {
  try {
    const {
      conditionIds,
      page = 1,
      perPage = 50,
      orderBy = "rollNo",
      orderDirection = "ASC",
      search = "",
      startDate,
      endDate,
      dateFilter = "all",
    } = req.query;

    const offset = (page - 1) * perPage;
    const limit = parseInt(perPage);

    // Date filters
    let fromDate = null,
      toDate = null;
    const today = new Date();
    const startOfDay = (d) => new Date(d.setHours(0, 0, 0, 0));
    const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999));

    switch (dateFilter) {
      case "today":
        fromDate = startOfDay(new Date());
        toDate = endOfDay(new Date());
        break;
      case "yesterday":
        const y = new Date();
        y.setDate(today.getDate() - 1);
        fromDate = startOfDay(y);
        toDate = endOfDay(y);
        break;
      case "last_week":
        const lw = new Date();
        lw.setDate(today.getDate() - 7);
        fromDate = startOfDay(lw);
        toDate = endOfDay(today);
        break;
      case "last_month":
        const fm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lm = new Date(today.getFullYear(), today.getMonth(), 0);
        fromDate = startOfDay(fm);
        toDate = endOfDay(lm);
        break;
      case "custom":
        if (startDate && endDate) {
          fromDate = startOfDay(new Date(startDate));
          toDate = endOfDay(new Date(endDate));
        }
        break;
    }

    // Base where clause
    const whereClause = { status: { [Op.ne]: 3 } };
    const andConditions = [];

    if (search.trim()) {
      andConditions.push({
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { fatherName: { [Op.like]: `%${search}%` } },
          { surname: { [Op.like]: `%${search}%` } },
          { rollNo: { [Op.like]: `%${search}%` } },
          sequelize.literal(`CONCAT(first_name, ' ', father_name, ' ', surname) LIKE '%${search}%'`)
        ]
      });
    }

    // Condition filter
    if (conditionIds) {
      const idsArray = conditionIds.split(",").map(Number);
      whereClause.boardSubjectConditionsId = { [Op.in]: idsArray };
    }

    // Installment include
    const installmentInclude =
      dateFilter === "all"
        ? { model: studentFeesInstallmentsTbl, as: "installments1", required: false }
        : {
          model: studentFeesInstallmentsTbl,
          as: "installments1",
          required: false,
          where: {
            paidStatus: 1,
            ...(fromDate && toDate ? { dueDate: { [Op.between]: [fromDate, toDate] } } : {}),
          },
        };

    // Payment type filter (for DB-level filtering)
    if (dateFilter !== "all") {
      andConditions.push({
        [Op.or]: [
          { paymentType: 1, feesRemaining: { [Op.gt]: 0 } },
          { paymentType: 2 },
        ]
      });
    }

    if (andConditions.length > 0) {
      whereClause[Op.and] = andConditions;
    }

    // Fetch all matching records without limit/offset to get accurate totals & handle post-filter
    const allStudents = await studentTbl.findAll({
      where: whereClause,
      include: [installmentInclude],
      order: [[orderBy, orderDirection]],
    });

    // Post-filter paymentType 2 if needed
    const globalFilteredStudents = allStudents.filter((s) => {
      if (dateFilter === "all") return true;
      if (s.paymentType === 1) return Number(s.feesRemaining) > 0;
      if (s.paymentType === 2) return (s.installments1 || []).some((i) => i.paidStatus === 1);
      return false;
    });

    if (!globalFilteredStudents.length) {
      return res.json({
        success: false,
        message: "No students found for the selected condition.",
        students: [],
        totalPages: 0,
        totalRecords: 0,
        globalTotals: { totalFees: 0, totalPaid: 0, totalRemaining: 0 }
      });
    }

    // Calculate Global Totals
    const globalTotalPaid = globalFilteredStudents.reduce((sum, s) => sum + (Number(s.feesPaid) || 0), 0);
    const globalTotalFees = globalFilteredStudents.reduce((sum, s) => sum + Math.max(0, (Number(s.totalFees) || 0) - (Number(s.discount) || 0)), 0);
    const globalTotalRemaining = Math.max(0, globalTotalFees - globalTotalPaid);

    // Local Pagination
    const totalRecords = globalFilteredStudents.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedStudents = globalFilteredStudents.slice(offset, offset + limit);

    // Fetch standards, boards, mediums for paginated students
    const standardIds = [...new Set(paginatedStudents.map((s) => s.standardIdFk))];
    const boardIds = [...new Set(paginatedStudents.map((s) => s.boardIdFk))];
    const mediumIds = [...new Set(paginatedStudents.map((s) => s.mediumIdFk))];

    const [standards, boards, mediums] = await Promise.all([
      standardsTbl.findAll({ where: { id: standardIds }, attributes: ["id", "name"] }),
      boardsTbl.findAll({ where: { id: boardIds }, attributes: ["id", "name"] }),
      mediumsTbl.findAll({ where: { id: mediumIds }, attributes: ["id", "name"] }),
    ]);

    const students = paginatedStudents.map((s) => {
      const studentData = s.get();
      return {
        ...studentData,
        feesRemaining: Math.max(0, (Number(studentData.totalFees) || 0) - (Number(studentData.discount) || 0) - (Number(studentData.feesPaid) || 0)),
        standard: standards.find((st) => st.id === s.standardIdFk)?.name || "",
        board: boards.find((b) => b.id === s.boardIdFk)?.name || "",
        medium: mediums.find((m) => m.id === s.mediumIdFk)?.name || "",
      };
    });

    res.json({
      success: true,
      students,
      totalPages,
      totalRecords,
      globalTotals: {
        totalFees: globalTotalFees,
        totalPaid: globalTotalPaid,
        totalRemaining: globalTotalRemaining
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};




superAdminController.getStudentInstallments = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.status(400).json({ success: false, message: "studentId required" });

    const student = await studentTbl.findOne({
      where: { id: studentId, status: 1 },
      include: [
        {
          model: studentFeesInstallmentsTbl,
          as: "installments1",
          attributes: ["id", "amount", "dueDate", "paymentDate", "paidStatus", "paidAmount"],
          order: [["dueDate", "ASC"]],
        },
      ],
    });

    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    return res.json({
      success: true,
      student: {
        id: student.id,
        name: student.firstName + " " + student.fatherName + " " + student.surname,
        rollNo: student.rollNo,
        standard: student.standard,
        board: student.board,
        medium: student.medium,
        paymentType: student.paymentType,
        fatherMobile: student.fatherMobile,
        studentMobile: student.studentMobile,
        motherMobile: student.motherMobile,
        installments: student.installments1,
        totalFees: student.totalFees,
        discount: student.discount,
        paidFees: student.feesPaid,
        remainingFees: Math.max(0, (Number(student.totalFees) || 0) - (Number(student.discount) || 0) - (Number(student.feesPaid) || 0)),
        bookingAmount: student.registrationCharges,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// superAdminController.updateStudentInstallments = async (req, res) => {
//   try {
//     const { studentId, installments, paid, remaining, total } = req.body;

//     if (!studentId || !Array.isArray(installments)) {
//       return res.status(400).json({
//         success: false,
//         message: "studentId and installments array are required.",
//       });
//     }

//     const student = await studentTbl.findByPk(studentId);
//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found.",
//       });
//     }

//     // Sort installments by due date ascending
//     const sortedInstallments = [...installments].sort(
//       (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
//     );

//     // ✅ Loop through installments and update one by one
//     for (let i = 0; i < sortedInstallments.length; i++) {
//       const inst = sortedInstallments[i];
//       const dbInst = await studentFeesInstallmentsTbl.findOne({
//         where: { id: inst.id, studentIdFk: studentId },
//       });
//       if (!dbInst) continue;

//       const paidAmt = Number(inst.paidAmount) || 0;
//       const dueAmt = Number(dbInst.amount);

//       // Skip fully paid installments
//       if (dbInst.paidStatus === 2) continue;

//       if (paidAmt <= 0) {
//         // 🟡 Not paid
//         await dbInst.update({
//           paidAmount: 0,
//           paidStatus: 1, // Pending
//           paymentDate: null,
//         });
//         continue;
//       }

//       if (paidAmt < dueAmt) {
//         // 🟠 Partial payment
//         const remain = dueAmt - paidAmt;

//         await dbInst.update({
//           amount: paidAmt,
//           paidAmount: paidAmt,
//           paidStatus: 3, // Partially Paid
//           paymentDate: new Date(),
//         });

//         // Carry shortage to next unpaid installment
//         const next = sortedInstallments.find(
//           (x, idx) => idx > i && x.paidStatus !== 2
//         );

//         if (next) {
//           const nextDb = await studentFeesInstallmentsTbl.findOne({
//             where: { id: next.id, studentIdFk: studentId },
//           });
//           if (nextDb) {
//             await nextDb.update({
//               amount: Number(nextDb.amount) + remain,
//             });
//           }
//         }
//       } else {
//         // 🟢 Fully paid
//         await dbInst.update({
//           paidAmount: dueAmt,
//           paidStatus: 2, // Paid
//           paymentDate: new Date(),
//         });
//       }
//     }

//     // ✅ Update student summary
//   // ✅ Recalculate student summary from actual installments
// const studentFees = await studentTbl.findByPk(studentId);
// if (!studentFees) {
//   return res.status(404).json({
//     success: false,
//     message: "Student not found.",
//   });
// }

// // Convert to numbers safely
// const paidNow = Number(paid) || 0;
// const currentPaid = Number(studentFees.feesPaid) || 0;
// const currentRemaining = Number(studentFees.feesRemaining) || 0;

// // ✅ Update totals
// const newPaid = currentPaid + paidNow;
// const newRemaining = Math.max(currentRemaining - paidNow, 0);

// // ✅ Save changes
// await student.update({
//   feesPaid: newPaid,
//   feesRemaining: newRemaining,
// });


//     // ✅ Fetch all updated installments again to return fresh data
//     const updatedInstallments = await studentFeesInstallmentsTbl.findAll({
//       where: { studentIdFk: studentId },
//       order: [["dueDate", "ASC"]],
//       raw: true,
//     });

//     // ✅ Add readable status text
//     const installmentsWithStatus = updatedInstallments.map((inst) => {
//       let status = "Pending";
//       if (inst.paidStatus === 2) status = "Paid";
//       else if (inst.paidStatus === 3) status = "Partially Paid";
//       return { ...inst, status };
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Student installments updated successfully.",
//       updatedStudent: {
//         id: student.id,
//         totalFees: student.totalFees,
//         feesPaid: totalPaidAmount,
//         feesRemaining: totalRemainingAmount,
//       },
//       updatedInstallments: installmentsWithStatus,
//     });
//   } catch (err) {
//     console.error("Error in updateStudentInstallments:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Error updating student installments.",
//       error: err.message,
//     });
//   }
// };


superAdminController.updateStudentInstallments = async (req, res) => {
  try {
    const { studentId, installments } = req.body;

    if (!studentId || !Array.isArray(installments)) {
      return res.status(400).json({
        success: false,
        message: "studentId and installments array are required.",
      });
    }

    const student = await studentTbl.findByPk(studentId);
    if (!student)
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });

    // ✅ Fetch all existing installments for the student
    const existingInstallments = await studentFeesInstallmentsTbl.findAll({
      where: { studentIdFk: studentId },
      raw: true,
    });

    const existingIds = existingInstallments.map((i) => i.id);
    const submittedIds = installments.map((i) => i.id).filter(Boolean);

    // ✅ 1. Delete installments that exist in DB but not in submitted data
    const toDeleteIds = existingIds.filter((id) => !submittedIds.includes(id));
    if (toDeleteIds.length > 0) {
      await studentFeesInstallmentsTbl.destroy({ where: { id: toDeleteIds } });
    }

    let totalPaid = 0;

    // ✅ 2. Loop through submitted installments
    for (const inst of installments) {
      const amount = Number(inst.amount || 0);
      const paidAmount = Number(inst.paidAmount || 0);
      const dueDate = inst.dueDate;

      // ⚠️ Skip or delete installments with 0 amount
      if (amount === 0) {
        if (inst.id && existingIds.includes(inst.id)) {
          await studentFeesInstallmentsTbl.destroy({
            where: { id: inst.id, studentIdFk: studentId },
          });
        }
        continue; // skip creating new zero-amount entries
      }

      // 🔹 Validation checks
      if (!dueDate) {
        return res.status(400).json({
          success: false,
          message: `Due date is required for all installments.`,
        });
      }

      if (paidAmount > 0 && paidAmount !== amount) {
        return res.status(400).json({
          success: false,
          message: `Paid amount must equal installment amount.`,
        });
      }

      // 🔹 Update or create installment
      if (inst.id && existingIds.includes(inst.id)) {
        // ✅ Update existing
        await studentFeesInstallmentsTbl.update(
          {
            amount,
            paidAmount,
            dueDate,
            paidStatus: paidAmount === amount ? 2 : 1,
            paymentDate: paidAmount === amount ? new Date() : null,
          },
          { where: { id: inst.id, studentIdFk: studentId } }
        );
      } else {
        // ✅ Create new
        const newInst = await studentFeesInstallmentsTbl.create({
          studentIdFk: studentId,
          amount,
          paidAmount,
          dueDate,
          paidStatus: paidAmount === amount ? 2 : 1,
          paymentDate: paidAmount === amount ? new Date() : null,
        });
        inst.id = newInst.id;
      }

      totalPaid += paidAmount;
    }

    // ✅ 3. Update student totals
    const registration = Number(student.registrationCharges || 0);
    const totalFees = Number(student.totalFees || 0);
    const discount = Number(student.discount || 0);

    const newFeesPaid = registration + totalPaid;
    const newFeesRemaining = Math.max(totalFees - discount - newFeesPaid, 0);

    await student.update({
      feesPaid: newFeesPaid,
      feesRemaining: newFeesRemaining,
    });

    // ✅ 4. Fetch updated installments
    const updatedInstallments = await studentFeesInstallmentsTbl.findAll({
      where: { studentIdFk: studentId },
      order: [["id", "ASC"]],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: "Student installments synced successfully.",
      updatedStudent: {
        id: student.id,
        feesPaid: newFeesPaid,
        feesRemaining: newFeesRemaining,
      },
      updatedInstallments: updatedInstallments.map((i) => ({
        ...i,
        status: i.paidStatus === 2 ? "Paid" : "Pending",
      })),
    });
  } catch (err) {
    console.error("Error in updateStudentInstallments:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating installments.",
      error: err.message,
    });
  }
};



superAdminController.getStudentFeesDetails = async (req, res) => {
  try {
    const studentId = req.params.id;


    const students = await studentTbl.findAll({
      where: {
        status: { [Op.ne]: 3 },

        id: studentId,
      },
      attributes: [

        'feesPaid', 'feesRemaining', 'firstName', 'fatherName', 'surname', 'rollNo',
      ],
    });




    const feesHistory = await studentFeesTbl.findAll({
      where: { studentIdFk: studentId, status: 1 },
      attributes: ['id', 'amountPaid', 'paymentDate', 'paymentMethod', 'transactionReference'],
      order: [['paymentDate', 'ASC']]
    });

    // 3️⃣ Format response


    return res.status(200).json({ success: true, feesHistory, students });

  } catch (err) {
    console.error("Error in getStudentFeesDetails:", err);
    return res.status(500).json({ success: false, message: "Error fetching student fee details." });
  }
};

superAdminController.addStudentFee = async (req, res) => {
  try {
    const { studentId, amountPaid, paymentDate, transactionReference, paymentMethod } = req.body;

    // Validation
    if (!studentId || !amountPaid || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "studentId, amountPaid and paymentMethod are required."
      });
    }

    // Fetch student
    const student = await studentTbl.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // Create fee record
    const fee = await studentFeesTbl.create({
      studentIdFk: studentId,
      amountPaid: parseFloat(amountPaid),
      paymentDate: paymentDate || new Date(),
      transactionReference: transactionReference || null,
      paymentMethod,
    });

    // Update student instance
    student.feesPaid = parseFloat(student.feesPaid) + parseFloat(amountPaid);
    student.feesRemaining = parseFloat(student.feesRemaining) - parseFloat(amountPaid);

    await student.save();

    return res.status(201).json({
      success: true,
      message: "Payment added successfully",
      fee,
      student: {
        id: student.id,
        name: student.name,
        feesPaid: student.feesPaid,
        feesRemaining: student.feesRemaining
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


// superAdminController.getStudentsAllData = async function (req, res) {
//   try {

//     const {
//       currentPage = 1,
//       perPage = 50,
//       orderBy = "id",
//       orderDirection = "DESC",
//       searchValue = "",
//     } = req.query;

//     const page = Number(currentPage);
//     const limit = Number(perPage);
//     const offset = (page - 1) * limit;


//     const whereClause = searchValue
//       ? {
//         [Op.or]: [
//           { firstName: { [Op.like]: `%${searchValue}%` } },
//           { surname: { [Op.like]: `%${searchValue}%` } },
//           { rollNo: { [Op.like]: `%${searchValue}%` } },
//         ],
//       }
//       : {};


//     const { rows: students, count: totalRecords } = await studentTbl.findAndCountAll({
//       where: whereClause,
//       order: [[orderBy, orderDirection]],
//       limit,
//       offset,
//       attributes: [
//         "id",
//         "firstName",
//         "surname",
//         "fatherName",
//         "motherName",
//         "address",
//         "schoolName",
//         "fatherOccupation",
//         "motherOccupation",
//         "studentMobile",
//         "studentWhatsapp",
//         "fatherMobile",
//         "fatherWhatsapp",
//         "motherMobile",
//         "motherWhatsapp",
//         "email",
//         "dob",
//         "gender",
//         "rollNo",
//         "feesPaid",
//         "feesRemaining",

//         "standardIdFk",
//         "boardIdFk",
//         "mediumIdFk",
//         "createdAt",
//       ],
//     });


//     const standardIds = [...new Set(students.map((s) => s.standardIdFk).filter(Boolean))];
//     const boardIds = [...new Set(students.map((s) => s.boardIdFk).filter(Boolean))];
//     const mediumIds = [...new Set(students.map((s) => s.mediumIdFk).filter(Boolean))];


//     const [standards, boards, mediums] = await Promise.all([
//       standardsTbl.findAll({ where: { id: standardIds }, attributes: ["id", "name"] }),
//       boardsTbl.findAll({ where: { id: boardIds }, attributes: ["id", "name"] }),
//       mediumsTbl.findAll({ where: { id: mediumIds }, attributes: ["id", "name"] }),
//     ]);


//     const standardMap = Object.fromEntries(standards.map((s) => [s.id, s.name]));
//     const boardMap = Object.fromEntries(boards.map((b) => [b.id, b.name]));
//     const mediumMap = Object.fromEntries(mediums.map((m) => [m.id, m.name]));


//     const tableData = students.map((s) => ({
//       id: s.id,
//       studentName: `${s.firstName} ${s.surname || ""}`.trim(),
//       rollNo: s.rollNo,
//       totalFee: (s.feesPaid || 0) - (s.feesRemaining || 0),
//       feesPaid: s.feesPaid || 0,
//       feesRemaining: s.feesRemaining || 0,
//       standard: standardMap[s.standardIdFk] || "--",
//       board: boardMap[s.boardIdFk] || "--",
//       medium: mediumMap[s.mediumIdFk] || "--",
//       createdAt: s.createdAt,
//     }));


//     return res.status(200).json({
//       success: true,
//       totalRecords,
//       tableData,
//     });
//   } catch (err) {
//     console.error("Error in getStudentsAllData:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching student data.",
//     });
//   }
// };


superAdminController.getStudentsAllData = async function (req, res) {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      orderBy = "id",
      orderDirection = "DESC",
      searchValue = "",
    } = req.query;

    const page = Number(currentPage);
    const limit = Number(perPage);
    const offset = (page - 1) * limit;

    // 🔹 Get all student IDs that have payment entries
    const paidStudentIds = await studentFeesTbl.findAll({
      attributes: ["studentIdFk"],
      group: ["studentIdFk"],
    });

    const studentIds = paidStudentIds.map((p) => p.studentIdFk);
    if (studentIds.length === 0) {
      return res.status(200).json({
        success: true,
        totalRecords: 0,
        tableData: [],
      });
    }

    // 🔍 Apply search condition and limit only to those who have fees entries
    const whereClause = {
      id: studentIds,
      status: 1,
      ...(searchValue
        ? {
          [Op.or]: [
            { firstName: { [Op.like]: `%${searchValue}%` } },
            { surname: { [Op.like]: `%${searchValue}%` } },
            { rollNo: { [Op.like]: `%${searchValue}%` } },
          ],
        }
        : {}),
    };

    // 🧠 Fetch only those students with fees
    const { rows: students, count: totalRecords } = await studentTbl.findAndCountAll({
      where: whereClause,
      order: [[orderBy, orderDirection]],
      limit,
      offset,
      attributes: [
        "id",
        "firstName",
        "surname",
        "fatherName",
        "motherName",
        "address",
        "schoolName",
        "fatherOccupation",
        "motherOccupation",
        "studentMobile",
        "studentWhatsapp",
        "fatherMobile",
        "fatherWhatsapp",
        "motherMobile",
        "motherWhatsapp",
        "email",
        "dob",
        "gender",
        "rollNo",
        "feesPaid",
        "feesRemaining",
        "standardIdFk",
        "boardIdFk",
        "mediumIdFk",
        "createdAt",
      ],
    });

    // 🧾 Get related IDs
    const standardIds = [...new Set(students.map((s) => s.standardIdFk).filter(Boolean))];
    const boardIds = [...new Set(students.map((s) => s.boardIdFk).filter(Boolean))];
    const mediumIds = [...new Set(students.map((s) => s.mediumIdFk).filter(Boolean))];

    // 📦 Fetch related info in parallel
    const [standards, boards, mediums, payments] = await Promise.all([
      standardsTbl.findAll({ where: { id: standardIds }, attributes: ["id", "name"] }),
      boardsTbl.findAll({ where: { id: boardIds }, attributes: ["id", "name"] }),
      mediumsTbl.findAll({ where: { id: mediumIds }, attributes: ["id", "name"] }),
      studentFeesTbl.findAll({
        where: { studentIdFk: studentIds },
        attributes: ["id", "studentIdFk", "amountPaid", "paymentDate", "paymentMethod", "transactionReference"],
        order: [["paymentDate", "DESC"]],
      }),
    ]);

    // 🗺️ Maps
    const standardMap = Object.fromEntries(standards.map((s) => [s.id, s.name]));
    const boardMap = Object.fromEntries(boards.map((b) => [b.id, b.name]));
    const mediumMap = Object.fromEntries(mediums.map((m) => [m.id, m.name]));

    // 🧮 Group payments by student
    const paymentMap = payments.reduce((acc, p) => {
      if (!acc[p.studentIdFk]) acc[p.studentIdFk] = [];
      acc[p.studentIdFk].push(p);
      return acc;
    }, {});

    // 🧑‍🎓 Prepare final output
    const tableData = students.map((s) => ({
      id: s.id,
      studentName: `${s.firstName} ${s.surname || ""}`.trim(),
      rollNo: s.rollNo,
      totalFee: (parseFloat(s.feesPaid) || 0) + (parseFloat(s.feesRemaining) || 0),
      feesPaid: s.feesPaid || 0,
      feesRemaining: s.feesRemaining || 0,
      standard: standardMap[s.standardIdFk] || "--",
      board: boardMap[s.boardIdFk] || "--",
      medium: mediumMap[s.mediumIdFk] || "--",
      payments: paymentMap[s.id] || [], // 🔹 Include fee entries
      createdAt: s.createdAt,
    }));

    return res.status(200).json({
      success: true,
      totalRecords,
      tableData,
    });
  } catch (err) {
    console.error("Error in getStudentsAllData:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching student data.",
    });
  }
};

superAdminController.getStudentFeeById = async (req, res) => {
  try {
    const feeId = req.params.feeId;
    const students = await studentTbl.findAll({

      where: { id: feeId, status: 1 },


      attributes: [
        'id', 'firstName', 'surname', 'fatherName', 'motherName',
        'address', 'schoolName', 'fatherOccupation', 'motherOccupation',
        'studentMobile', 'studentWhatsapp', 'fatherMobile', 'fatherWhatsapp',
        'motherMobile', 'motherWhatsapp', 'email', 'dob', 'gender',
        'rollNo', 'feesPaid', 'feesRemaining', 'standardIdFk', 'boardIdFk', 'mediumIdFk'
      ]
    });


    const standardIds = [...new Set(students.map(s => s.standardIdFk))];
    const boardIds = [...new Set(students.map(s => s.boardIdFk))];
    const mediumIds = [...new Set(students.map(s => s.mediumIdFk))];


    const standards = await standardsTbl.findAll({ where: { id: standardIds }, attributes: ['id', 'name'] });
    const boards = await boardsTbl.findAll({ where: { id: boardIds }, attributes: ['id', 'name'] });
    const mediums = await mediumsTbl.findAll({ where: { id: mediumIds }, attributes: ['id', 'name'] });


    const standardMap = Object.fromEntries(standards.map(s => [s.id, s.name]));
    const boardMap = Object.fromEntries(boards.map(b => [b.id, b.name]));
    const mediumMap = Object.fromEntries(mediums.map(m => [m.id, m.name]));


    const formattedStudents = students.map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.surname || ''}`.trim(),
      rollNo: s.rollNo,
      feesPaid: s.feesPaid,
      feesRemaining: s.feesRemaining,
      fatherName: s.fatherName,
      motherName: s.motherName,
      address: s.address,
      schoolName: s.schoolName,
      fatherOccupation: s.fatherOccupation,
      motherOccupation: s.motherOccupation,
      studentMobile: s.studentMobile,
      studentWhatsapp: s.studentWhatsapp,
      fatherMobile: s.fatherMobile,
      fatherWhatsapp: s.fatherWhatsapp,
      motherMobile: s.motherMobile,
      motherWhatsapp: s.motherWhatsapp,
      email: s.email,
      dob: s.dob,
      gender: s.gender === 'F' ? 'Female' : s.gender === 'M' ? 'Male' : 'Other',
      standard: standardMap[s.standardIdFk] || null,
      board: boardMap[s.boardIdFk] || null,
      medium: mediumMap[s.mediumIdFk] || null,
    }));

    return res.status(200).json({ success: true, data: formattedStudents });

  } catch (err) {
    console.error("Error in getStudentFeeById:", err);
    return res.status(500).json({ success: false, message: "Error fetching fee record." });
  }
};

// --- Update fee record
superAdminController.updateStudentFee = async (req, res) => {
  try {
    const feeId = req.params.feeId;
    const { studentId, amountPaid, paymentDate, transactionReference, paymentMethod } = req.body;

    // Find the fee record
    const fee = await studentFeesTbl.findOne({ where: { id: feeId } });
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });

    // Update the fee record
    await fee.update({
      studentIdFk: studentId,
      amountPaid,
      paymentDate: paymentDate || null,
      transactionReference: transactionReference || null,
      paymentMethod,
    });

    // Optionally, update student feesPaid / feesRemaining
    const student = await studentTbl.findOne({ where: { id: studentId } });
    if (student) {
      // Recalculate total fees paid and remaining
      const totalPaid = await studentFeesTbl.sum("amountPaid", {
        where: { studentIdFk: studentId, status: 1 },
      });
      await student.update({
        feesPaid: totalPaid,
        feesRemaining: Math.max((student.feesPaid + student.feesRemaining) - totalPaid, 0),
      });
    }

    return res.status(200).json({ success: true, message: "Fee updated successfully." });
  } catch (err) {
    console.error("Error in updateStudentFee:", err);
    return res.status(500).json({ success: false, message: "Error updating fee record." });
  }
};


superAdminController.searchSubjectsByCondition = async (req, res) => {
  const { id, word } = req.query;
  const subjects = await subjectsTbl.findAll({
    where: {
      boardSubjectConditionsId: id,
      name: { [Op.like]: `%${word}%` },
    },
  });

  if (!subjects.length === 0) return res.status(206).json({ subjectData: [] })

  const subjectData = subjects.map((item) => ({
    label: `${item.name} (${item.code})`,
    maxMarks: item.maxMarks,
    value: item.id
  }))

  res.json({ subjectData: subjectData });
};

superAdminController.getExamDetailsById = async function (req, res) {
  try {
    const { examId } = req.params;

    if (!examId)
      return res.status(400).json({ success: false, message: "Exam ID is required." });

    // Fetch exam session
    const exam = await examSessionsTbl.findOne({ where: { id: examId, status: 1 } });
    if (!exam)
      return res.status(404).json({ success: false, message: "Exam not found." });

    const formatTime = (t) =>
      t ? dayjs(t, "HH:mm:ss").format("hh:mm a") : null;

    // Fetch related board, standard, set
    const [board, standard, setObj] = await Promise.all([
      boardsTbl.findOne({ where: { id: exam.boardIdFk }, attributes: ['name'] }),
      standardsTbl.findOne({ where: { id: exam.standardIdFk }, attributes: ['name'] }),
      setsTbl.findOne({ where: { id: exam.setIdFk }, attributes: ['name'] }),
    ]);

    // Fetch exam timetable
    const timetableData = await examTimetableTbl.findAll({
      where: { examSessionIdFk: exam.id },
      attributes: ['id', 'examDate', 'maxMarks', 'subjectIdFk', 'examStartTime', 'examEndTime'],
    });

    // Map subject names
    const subjectIds = [...new Set(timetableData.map(t => t.subjectIdFk))];

    const subjects = await subjectsTbl.findAll({
      where: { id: subjectIds },
      attributes: ['id', 'name', 'code']
    });

    // Create map with "subjectName (subjectCode)"
    const subjectMap = Object.fromEntries(
      subjects.map(s => [s.id, `${s.name} (${s.code})`])
    );

    // Build timetable with subject names + codes
    const timetable = timetableData.map(t => ({
      id: t.id,
      examDate: t.examDate,
      maxMarks: t.maxMarks,
      examStartTime: formatTime(t.examStartTime),
      examEndTime: formatTime(t.examEndTime),
      subjectIdFk: t.subjectIdFk,
      subjectName: subjectMap[t.subjectIdFk] || '--'
    }));


    const conditionObj = await boardSubjectConditionsTbl.findOne({
      where: { id: exam?.boardSubjectConditionsId }
    })

    // Respond
    return res.status(200).json({
      success: true,
      exam: {
        id: exam.id,
        name: exam.name,
        board: board?.name || '--',
        standard: standard?.name || '--',
        set: setObj?.name || '--',
        dateFrom: exam.dateFrom,
        dateTo: exam.dateTo,
        conditionName: conditionObj?.name,
        boardSubjectConditionsId: exam?.boardSubjectConditionsId
      },
      timetable
    });

  } catch (err) {
    console.error("Error in getExamDetailsById:", err);
    return res.status(500).json({ success: false, message: "Error fetching exam details." });
  }
};



// ---------------------------------------------------------------------------------- 




//student-admission------------------------------------------
superAdminController.addStudentAdmission = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { firstName, motherName, fatherName, surname, address, schoolName,
      fatherOccupation, motherOccupation, studentMobile, studentWhatsapp, fatherMobile, fatherWhatsapp,
      motherMobile, motherWhatsapp, email, dob, gender, standardId, boardId, mediumsId, photoPath, totalFees,
      paymentType, noOfInstaments, feesPaid, feesRemaining, sets, subjects, boardSubjectConditionsId, installmentData, admissionDate, addons, discount
    } = req.body;

    let todayDate = new Date().toISOString().split("T")[0];
    if (!admissionDate) {
      admissionDate = todayDate;
    }

    let isCombination = 0;
    if (sets.length > 1) {
      isCombination = 1;
    };

    const boardTblObj = await boardsTbl.findOne({
      where: {
        id: boardId
      }
    });


    const lastStudent = await studentTbl.findOne({
      where: {
        boardIdFk: boardId,
        rollNo: { [Op.ne]: null }
      },
      order: [['rollNo', "DESC"]]
    })

    // const rollNo = await generateStudentRollNo(standardId, boardId, mediumsId)
    const rollNo = await getNextRoll(boardTblObj?.code, lastStudent?.rollNo || null)

    let feesPaidStatus = 2;
    let oneTimePaymentDate = null;
    if (paymentType === 1 && (feesPaid === totalFees)) {
      feesPaidStatus = 1,
        oneTimePaymentDate = new Date().toISOString().split("T")[0];
    };

    const studentTblObj = await studentTbl.create({
      firstName,
      motherName,
      fatherName,
      surname,
      email,
      address,
      photoPath,
      dob,
      schoolName,
      gender,
      fatherOccupation,
      motherOccupation,
      studentMobile,
      studentWhatsapp,
      fatherMobile,
      fatherWhatsapp,
      motherMobile,
      motherWhatsapp,
      standardIdFk: standardId,
      boardIdFk: boardId,
      mediumIdFk: mediumsId,
      isCombination,
      rollNo,
      paymentType,
      totalFees,
      discount,
      feesPaid,
      feesRemaining,
      noOfInstallment: noOfInstaments,
      feesPaidStatus,
      oneTimePaymentDate,
      admissionDate,
      createdBy: req.uid,
      addons: addons && addons.length ? addons.join(",") : null,
      boardSubjectConditionsId: boardSubjectConditionsId,
      registrationCharges: feesPaid,
    }, { transaction });

    const formattedSets = sets.map((item) => ({ studentIdFk: studentTblObj?.id, setIdFk: item.setId }));
    const formattedSubjects = subjects.map((item) => ({ studentIdFk: studentTblObj?.id, subjectIdFk: item.id, assignedAt: new Date(), assignedBy: req.uid }));

    await studentSetMapTbl.bulkCreate(formattedSets, { transaction });
    await studentSubjectsTbl.bulkCreate(formattedSubjects, { transaction });

    if (paymentType == 2) {
      const formattedFees = installmentData.map((item) => ({ installmentNo: item.installmentNo, amount: item.amount, dueDate: item.dueDate, totalFees: totalFees, paidStatus: item.paidStatus, studentIdFk: studentTblObj?.id }))
      await studentFeesInstallmentsTbl.bulkCreate(formattedFees, { transaction })
    }

    // Auto-create Parent User
    const parentMobile = fatherMobile || motherMobile || studentMobile;
    if (parentMobile) {
      const existingUser = await userTbl.findOne({
        where: { mobile: parentMobile, userRole: 5 },
        transaction
      });
      if (!existingUser) {
        const parentName = (fatherName || motherName) ? `${fatherName || motherName} ${surname || ""}`.trim() : "Parent";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("gurukul", salt);
        await userTbl.create({
          name: parentName,
          mobile: parentMobile,
          password: hashedPassword,
          userRole: 5,
          status: 1
        }, { transaction });
      }
    }

    await transaction.commit();

    return res.status(201).json({ message: "Student Admission Completed" })

  } catch (err) {
    await transaction.rollback()
    console.log('Error', err);
    handleSequelizeError(err, res, "superAdminController.addStudentAdmission")
  }
};

superAdminController.getTableStudents = async (req, res) => {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'DESC', searchValue = '', board = [], standard = [], fromDate = null, toDate = null, dateFilter = null, sets = [], subjects = [] } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const stundentWhereConditions = {
      [Op.and]: [
        { status: { [Op.ne]: 3 } }
      ],
      [Op.or]: [
        { firstName: { [Op.like]: `%${searchValue}%` } },
        { motherName: { [Op.like]: `%${searchValue}%` } },
        { fatherName: { [Op.like]: `%${searchValue}%` } },
        { studentMobile: { [Op.like]: `%${searchValue}%` } },
        { surname: { [Op.like]: `%${searchValue}%` } },
        { rollNo: { [Op.like]: `%${searchValue}%` } },
      ]
    };

    if (board.length > 0) {
      stundentWhereConditions[Op.and].push({ boardSubjectConditionsId: { [Op.in]: board } });
    }

    if (standard.length > 0) {
      stundentWhereConditions[Op.and].push({ standardIdFk: { [Op.in]: standard } });
    };

    if ((fromDate && toDate) && dateFilter === 'custom') {
      stundentWhereConditions[Op.and].push({ admissionDate: { [Op.between]: [fromDate, toDate] } })
    } else if ((fromDate && !toDate) && dateFilter === 'custom') {
      stundentWhereConditions[Op.and].push({ admissionDate: { [Op.gte]: fromDate } })
    } else if ((!fromDate && toDate) && dateFilter === 'custom') {
      stundentWhereConditions[Op.and].push({ admissionDate: { [Op.lte]: toDate } })
    };

    const formatDate = (date) => date.toISOString().split("T")[0];

    if (dateFilter === 'today') {
      const today = formatDate(new Date());
      stundentWhereConditions[Op.and].push({ admissionDate: today });
    }

    if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = formatDate(yesterday);
      stundentWhereConditions[Op.and].push({ admissionDate: yestStr });
    }


    if (dateFilter === 'lastWeek') {
      const today = new Date();
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - 7);
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - 1);

      const startStr = formatDate(startOfLastWeek);
      const endStr = formatDate(endOfLastWeek);

      stundentWhereConditions[Op.and].push({
        admissionDate: { [Op.between]: [startStr, endStr] },
      });
    }


    if (dateFilter === 'lastMonth') {
      const today = new Date();
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // 0 = last day of previous month

      const startStr = formatDate(startOfLastMonth);
      const endStr = formatDate(endOfLastMonth);

      stundentWhereConditions[Op.and].push({
        admissionDate: { [Op.between]: [startStr, endStr] },
      });
    }

    let setStudentIds = [];
    let subjectStudentIds = [];

    // 1. Students from sets
    if (sets.length > 0) {
      const setRows = await studentSetMapTbl.findAll({
        where: { setIdFk: { [Op.in]: sets } },
        attributes: ['studentIdFk']
      });

      setStudentIds = setRows.map(r => r.studentIdFk);
    }

    // 2. Students from subjects
    if (subjects.length > 0) {
      const subjectRows = await studentSubjectsTbl.findAll({
        where: { subjectIdFk: { [Op.in]: subjects } },
        attributes: ['studentIdFk']
      });

      subjectStudentIds = subjectRows.map(r => r.studentIdFk);
    }

    if (subjects.length > 0 && subjectStudentIds.length === 0) {
      stundentWhereConditions[Op.and].push({
        id: { [Op.in]: [] }
      });
    }

    let finalStudentIds = [];


    // ----------------------------
    // RULE 1 + RULE 3: sets.length > 0
    // ----------------------------
    if (sets.length > 0) {

      // Subjects filter exists -> student must satisfy BOTH
      if (subjects.length > 0) {
        // intersection (AND condition)
        finalStudentIds = setStudentIds.filter(id => subjectStudentIds.includes(id));
      }
      // No subjects filter → only set filter applies
      else {
        finalStudentIds = setStudentIds;  // ✔ Rule 3
      }
    }


    // ----------------------------
    // RULE 2: sets.length == 0
    // ----------------------------
    else if (sets.length === 0) {
      if (subjects.length > 0) {
        finalStudentIds = subjectStudentIds; // ✔ include subject-only students
      }
    }

    if (finalStudentIds.length > 0) {
      stundentWhereConditions[Op.and].push({
        id: { [Op.in]: [...new Set(finalStudentIds)] }
      });
    };

    const result = await studentTbl.findAll({
      where: stundentWhereConditions,
      include: [
        {
          model: standardsTbl,
          as: 'tbl_standards'
        },
        {
          model: boardsTbl,
          as: 'tbl_boards'
        },
        {
          model: mediumsTbl,
          as: 'tbl_mediums'
        },
        {
          model: userTbl,
          as: 'tbl_user'
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0 });

    const tableData = await Promise.all(result.map(async (obj) => {

      let boardName = obj?.tbl_boards?.name || '';
      let standardName = obj?.tbl_standards?.name || '';
      let mediumName = obj?.tbl_mediums?.name || '';

      let createdByName = `${obj?.tbl_user?.name} (${obj?.tbl_user?.userRole == 1 ? 'Super Admin' : 'Admin'})`

      const studentSubjectsTblObj = await studentSubjectsTbl.findAll({
        where: {
          studentIdFk: obj.id
        },
        include: [
          {
            model: subjectsTbl,
            as: 'tbl_subjects'
          }
        ]
      });

      const studentSetMapTblObj = await studentSetMapTbl.findAll({
        where: {
          studentIdFk: obj.id
        },
        include: [
          {
            model: setsTbl,
            as: 'tbl_sets'
          }
        ]
      });

      const studentFeesInstallments = await studentFeesInstallmentsTbl.findAll({
        where: {
          studentIdFk: obj.id
        }
      });

      const boardConditionTblObj = await boardSubjectConditionsTbl.findOne({
        where: {
          id: obj.boardSubjectConditionsId
        }
      })

      const subjectsMap = studentSubjectsTblObj.map((item) => ({ subjectName: item?.tbl_subjects.name, subjectCode: item?.tbl_subjects.code, subjectId: item?.tbl_subjects.id }))
      const setMap = studentSetMapTblObj.map((item) => ({ set: item?.tbl_sets?.name }))

      return {
        id: obj.get("id"),
        firstName: obj.get("firstName"),
        motherName: obj.get("motherName"),
        fatherName: obj.get("fatherName"),
        surname: obj.get("surname"),
        fullName: obj.get("firstName") + " " + obj.get("fatherName") + " " + obj.get("surname"),
        address: obj.get("address"),
        schoolName: obj.get("schoolName"),
        fatherOccupation: obj.get("fatherOccupation"),
        motherOccupation: obj.get("motherOccupation"),
        studentMobile: obj.get("studentMobile"),
        studentWhatsapp: obj.get("studentWhatsapp"),
        fatherMobile: obj.get("fatherMobile"),
        fatherWhatsapp: obj.get("fatherWhatsapp"),
        motherMobile: obj.get("motherMobile"),
        motherWhatsapp: obj.get("motherWhatsapp"),
        email: obj.get("email"),
        dob: obj.get("dob"),
        admissionDate: obj.get("admissionDate"),
        gender: obj.get("gender"),
        standardName,
        boardName,
        mediumName,
        conditionName: boardConditionTblObj?.name,
        photoPath: obj.get("photoPath"),
        rollNo: obj.get("rollNo"),
        admissionConfirmed: obj.get("admissionConfirmed"),
        isCombination: obj.get("isCombination"),
        feesPaid: obj.get("feesPaid"),
        feesRemaining: obj.get("feesRemaining"),
        createdBy: obj.get("createdBy"),
        createdByName: createdByName,
        totalFees: obj.get("totalFees"),
        paymentType: obj.get("paymentType"),
        noOfInstallment: obj.get("noOfInstallment"),
        studentFeesInstallments: studentFeesInstallments || [],
        feesPaidStatus: obj.get("feesPaidStatus"),
        status: obj.get("status"),
        subjectsMap,
        setMap,
        createdAt: obj.get("createdAt"),
        updatedAt: obj.get("updatedAt")
      }
    }));

    const tableRecords = await studentTbl.count({
      where: stundentWhereConditions
    });

    return res.status(200).json({ tableData, tableRecords, stundentWhereConditions })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getTableStudents")
  }
};

superAdminController.changeStudentStatus = async function (req, res) {
  try {
    const { id, statusValue } = req.body;

    await studentTbl.update({
      status: statusValue
    }, { where: { id } });

    return res.status(201).json({ message: "Student Status Changed" })
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.changeStudentStatus")
  }
};

superAdminController.updateStudentPhoto = async function (req, res) {
  try {
    const { id, photoPath } = req.body;
    await studentTbl.update({ photoPath }, { where: { id } });
    return res.status(200).json({ message: "Student Photo Updated" });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.updateStudentPhoto");
  }
};

superAdminController.getStudentDetailsById = async function (req, res) {
  try {
    const { id } = req.query;

    const result = await studentTbl.findOne({
      where: {
        id: id
      },
      include: [
        {
          model: standardsTbl,
          as: 'tbl_standards'
        },
        {
          model: boardsTbl,
          as: 'tbl_boards'
        },
        {
          model: mediumsTbl,
          as: 'tbl_mediums'
        },
        {
          model: userTbl,
          as: 'tbl_user'
        }
      ]
    });

    if (!result) return res.status(400).json({ message: "Failed to fetch student details", studentData: null });

    const plainObj = result.get({ plain: true });

    let boardConditionTblObj = await boardSubjectConditionsTbl.findOne({
      where: {
        id: plainObj?.boardSubjectConditionsId
      },
      include: [
        {
          model: standardsTbl,
          as: 'tbl_standards'
        },
        {
          model: boardsTbl,
          as: 'tbl_boards'
        },
        {
          model: mediumsTbl,
          as: 'tbl_mediums'
        }
      ],
    });

    let plainBoardCondition = boardConditionTblObj.get({ plain: true })

    let boardCondition = plainBoardCondition ? {
      ...plainBoardCondition,
      boardName: plainBoardCondition.tbl_boards?.name || null,
      standard: plainBoardCondition.tbl_standards?.name || null,
      medium: plainBoardCondition.tbl_mediums?.name || null,
      label: plainBoardCondition.name,
      value: plainBoardCondition.id
    } : null

    let setTblObj = await studentSetMapTbl.findAll({
      where: {
        studentIdFk: id
      },
      include: [
        {
          model: setsTbl,
          as: 'tbl_sets'
        }
      ]
    });
    let setMap = setTblObj.map((set) => ({ setId: set?.tbl_sets?.id, label: set?.tbl_sets?.name }));

    let studentSubjectTblObj = await studentSubjectsTbl.findAll({
      where: {
        studentIdFk: id
      },
      include: [
        {
          model: subjectsTbl,
          as: 'tbl_subjects'
        }
      ]
    });
    let studentFeesInstallmentsTblObj = await studentFeesInstallmentsTbl.findAll({
      where: {
        studentIdFk: id
      }
    })
    let plainStudentSubjectsObj = studentSubjectTblObj.map(u => u.get({ plain: true }))
    let studentSubjectMap = plainStudentSubjectsObj.map((sub) => ({ code: sub?.tbl_subjects?.code, id: sub?.tbl_subjects?.id }))
    let studentInstallments = studentFeesInstallmentsTblObj.map(u => u.get({ plain: true }))

    const studentData = plainObj ? {
      ...plainObj,
      setMap,
      boardCondition,
      studentSubjectMap,
      studentInstallments
    } : null;

    return res.status(200).json({ studentData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentDetailsById")
  }
};

// superAdminController.updateStudentAdmission = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     let { firstName, motherName, fatherName, surname, address, schoolName,
//       fatherOccupation, motherOccupation, studentMobile, studentWhatsapp, fatherMobile, fatherWhatsapp,
//       motherMobile, motherWhatsapp, email, dob, gender, standardId, boardId, mediumsId, photoPath, totalFees,
//       paymentType, noOfInstaments, feesPaid, feesRemaining, sets, subjects, boardSubjectConditionsId, id, installmentData, admissionDate
//     } = req.body;

//     const existingStudent = await studentTbl.findOne({ where: { id }, transaction });

//     if (!existingStudent) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "Student not found" });
//     }

//     let todayDate = new Date().toISOString().split("T")[0];
//     if (!admissionDate) {
//       admissionDate = todayDate;
//     }

//     let rollNo = existingStudent?.rollNo;
//     let isBoardSame = boardId === existingStudent.boardIdFk ? true : false;
//     let isStandardSame = standardId === existingStudent?.standardIdFk ? true : false;
//     let isMediumSame = mediumsId === existingStudent?.mediumIdFk ? true : false;

//     let feesPaidStatus = 2;
//     let oneTimePaymentDate = null;
//     if (paymentType === 1 && (feesPaid === totalFees)) {
//       feesPaidStatus = 1,
//         oneTimePaymentDate = new Date().toISOString().split("T")[0];
//     };

//     if (paymentType === 2 && (feesPaid === totalFees)) {
//       feesPaidStatus = 1
//     }

//     if (!(isBoardSame && isStandardSame && isMediumSame)) {
//       rollNo = await generateStudentRollNo(standardId, boardId, mediumsId)
//     }

//     const isCombination = sets.length > 1 ? 1 : 0;

//     await studentTbl.update(
//       {
//         firstName,
//         motherName,
//         fatherName,
//         surname,
//         email,
//         address,
//         photoPath,
//         dob,
//         schoolName,
//         gender,
//         fatherOccupation,
//         motherOccupation,
//         studentMobile,
//         studentWhatsapp,
//         fatherMobile,
//         fatherWhatsapp,
//         motherMobile,
//         motherWhatsapp,
//         standardIdFk: standardId,
//         boardIdFk: boardId,
//         mediumIdFk: mediumsId,
//         feesPaid,
//         feesRemaining,
//         isCombination,
//         rollNo,
//         totalFees,
//         paymentType,
//         noOfInstallment: noOfInstaments,
//         feesPaidStatus,
//         oneTimePaymentDate,
//         admissionDate,
//         boardSubjectConditionsId
//       },
//       { where: { id }, transaction }
//     );

//     const formattedSets = sets.map(item => ({
//       studentIdFk: id,
//       setIdFk: item.setId
//     }));

//     const formattedSubjects = subjects.map(item => ({
//       studentIdFk: id,
//       subjectIdFk: item.id,
//       assignedAt: new Date(),
//       assignedBy: req.uid
//     }));

//     await studentSetMapTbl.destroy({ where: { studentIdFk: id }, transaction });
//     await studentSubjectsTbl.destroy({ where: { studentIdFk: id }, transaction });

//     if (formattedSets.length) {
//       await studentSetMapTbl.bulkCreate(formattedSets, { transaction });
//     }
//     if (formattedSubjects.length) {
//       await studentSubjectsTbl.bulkCreate(formattedSubjects, { transaction });
//     }

//     if (paymentType == 2) {

//       await studentFeesInstallmentsTbl.destroy({ where: { studentIdFk: id }, transaction })

//       const formattedFees = installmentData.map((item) => ({ installmentNo: item.installmentNo, amount: item.amount, paymentDate: item.paymentDate, dueDate: item.dueDate, paymentDate: item.paymentDate, totalFees: totalFees, paidStatus: item.paidStatus, studentIdFk: id }))
//       await studentFeesInstallmentsTbl.bulkCreate(formattedFees, { transaction })
//     }

//     await transaction.commit();

//     return res.status(201).json({ message: "Student Details Updated" })

//   } catch (err) {
//     await transaction.rollback()
//     console.log('Error', err);
//     handleSequelizeError(err, res, "superAdminController.addStudentAdmission")
//   }
// };

superAdminController.updateStudentAdmission = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { firstName, motherName, fatherName, surname, address, schoolName,
      fatherOccupation, motherOccupation, studentMobile, studentWhatsapp, fatherMobile, fatherWhatsapp,
      motherMobile, motherWhatsapp, email, dob, gender, standardId, boardId, mediumsId, photoPath, totalFees,
      paymentType, noOfInstaments, feesPaid, feesRemaining, sets, subjects, boardSubjectConditionsId, id, installmentData, admissionDate, addons, discount
    } = req.body;

    const existingStudent = await studentTbl.findOne({ where: { id }, transaction });

    if (!existingStudent) {
      await transaction.rollback();
      return res.status(404).json({ message: "Student not found" });
    }

    let todayDate = new Date().toISOString().split("T")[0];
    if (!admissionDate) {
      admissionDate = todayDate;
    }

    let rollNo = existingStudent?.rollNo;
    let isBoardSame = boardId === existingStudent.boardIdFk ? true : false;
    let isStandardSame = standardId === existingStudent?.standardIdFk ? true : false;
    let isMediumSame = mediumsId === existingStudent?.mediumIdFk ? true : false;

    let feesPaidStatus = 2;
    let oneTimePaymentDate = null;
    if (paymentType === 1 && (feesPaid === totalFees)) {
      feesPaidStatus = 1,
        oneTimePaymentDate = new Date().toISOString().split("T")[0];
    };

    if (paymentType === 2 && (feesPaid === totalFees)) {
      feesPaidStatus = 1
    }

    if (!(isBoardSame && isStandardSame && isMediumSame)) {
      const boardTblObj = await boardsTbl.findOne({ where: { id: boardId }, transaction });
      const lastStudent = await studentTbl.findOne({
        where: { 
          boardIdFk: boardId,
          rollNo: { [Op.ne]: null }
        },
        order: [['id', "DESC"]],
        transaction
      });
      rollNo = await getNextRoll(boardTblObj?.code, lastStudent?.rollNo || null);
    }
    const isCombination = sets.length > 1 ? 1 : 0;

    await studentTbl.update(
      {
        firstName,
        motherName,
        fatherName,
        surname,
        email,
        address,
        photoPath,
        dob,
        schoolName,
        gender,
        fatherOccupation,
        motherOccupation,
        studentMobile,
        studentWhatsapp,
        fatherMobile,
        fatherWhatsapp,
        motherMobile,
        motherWhatsapp,
        standardIdFk: standardId,
        boardIdFk: boardId,
        mediumIdFk: mediumsId,
        feesPaid,
        registrationCharges: feesPaid,
        feesRemaining,
        isCombination,
        rollNo,
        totalFees,
        discount,
        paymentType,
        noOfInstallment: noOfInstaments,
        feesPaidStatus,
        oneTimePaymentDate,
        admissionDate,
        addons: addons && addons.length ? addons.join(",") : null,
        boardSubjectConditionsId
      },
      { where: { id }, transaction }
    );

    const formattedSets = sets.map(item => ({
      studentIdFk: id,
      setIdFk: item.setId
    }));

    const formattedSubjects = subjects.map(item => ({
      studentIdFk: id,
      subjectIdFk: item.id,
      assignedAt: new Date(),
      assignedBy: req.uid
    }));

    await studentSetMapTbl.destroy({ where: { studentIdFk: id }, transaction });
    await studentSubjectsTbl.destroy({ where: { studentIdFk: id }, transaction });

    if (formattedSets.length) {
      await studentSetMapTbl.bulkCreate(formattedSets, { transaction });
    }
    if (formattedSubjects.length) {
      await studentSubjectsTbl.bulkCreate(formattedSubjects, { transaction });
    }

    if (paymentType == 2) {

      await studentFeesInstallmentsTbl.destroy({ where: { studentIdFk: id }, transaction })

      const formattedFees = installmentData.map((item) => ({ installmentNo: item.installmentNo, amount: item.amount, paymentDate: item.paymentDate, dueDate: item.dueDate, totalFees: totalFees, paidStatus: item.paidStatus, paidAmount: item.paidAmount, studentIdFk: id }))
      await studentFeesInstallmentsTbl.bulkCreate(formattedFees, { transaction })
    }

    // Auto-update Parent User
    const oldParentMobile = existingStudent.fatherMobile || existingStudent.motherMobile || existingStudent.studentMobile;
    const newParentMobile = fatherMobile || motherMobile || studentMobile;

    if (newParentMobile) {
      const parentName = (fatherName || motherName) ? `${fatherName || motherName} ${surname || ""}`.trim() : "Parent";

      let userToUpdate = null;
      if (oldParentMobile) {
        userToUpdate = await userTbl.findOne({
          where: { mobile: oldParentMobile, userRole: 5 },
          transaction
        });
      }

      if (!userToUpdate && oldParentMobile !== newParentMobile) {
        userToUpdate = await userTbl.findOne({
          where: { mobile: newParentMobile, userRole: 5 },
          transaction
        });
      }

      if (userToUpdate) {
        if (oldParentMobile !== newParentMobile) {
            const mobileTaken = await userTbl.findOne({ where: { mobile: newParentMobile }, transaction });
            if (!mobileTaken) {
                await userTbl.update({ name: parentName, mobile: newParentMobile }, { where: { id: userToUpdate.id }, transaction });
            } else {
                await userTbl.update({ name: parentName }, { where: { id: userToUpdate.id }, transaction });
            }
        } else {
            await userTbl.update({ name: parentName }, { where: { id: userToUpdate.id }, transaction });
        }
      } else {
         const mobileTaken = await userTbl.findOne({ where: { mobile: newParentMobile }, transaction });
         if (!mobileTaken) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("gurukul", salt);
            await userTbl.create({
              name: parentName,
              mobile: newParentMobile,
              password: hashedPassword,
              userRole: 5,
              status: 1
            }, { transaction });
         }
      }
    }

    await transaction.commit();

    return res.status(201).json({ message: "Student Details Updated" })

  } catch (err) {
    await transaction.rollback()
    console.log('Error', err);
    handleSequelizeError(err, res, "superAdminController.addStudentAdmission")
  }
};

superAdminController.getAllBoardData = async (req, res) => {
  try {
    const result = await boardsTbl.findAll({
      where: {
        status: 1
      }
    });

    if (result.length === 0) return res.status(206).json({ boardData: [] });

    const boardData = result.map((item) => ({
      label: item.name,
      value: item.id
    }))

    return res.status(200).json({ boardData });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAllBoardData")
  }
};

superAdminController.getAllStandards = async (req, res) => {
  try {
    const result = await standardsTbl.findAll({
      where: {
        status: 1
      }
    });

    if (result.length === 0) return res.status(206).json({ standardData: [] });

    const standardData = result.map((item) => ({
      label: item.name,
      value: item.id
    }))

    return res.status(200).json({ standardData });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAllStandards")
  }
};

superAdminController.getAllSetData = async (req, res) => {
  try {
    const result = await setsTbl.findAll({
      where: {
        status: 1
      }
    });

    if (result.length === 0) return res.status(206).json({ setData: [] });
    const setData = result.map((item) => ({
      label: item.name,
      value: item.id
    }))

    return res.status(200).json({ setData });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAllSetData")
  }
};

// superAdminController.getStudentDataForExport = async (req, res) => {
//   try {
//     const { condition = [], fromDate = null, toDate = null, dateFilter = null, sets = [], subjects=[] } = req.body;

//     const studentWhereConditions = { status: { [Op.ne]: 3 } };

//     if (condition.length > 0) {
//       studentWhereConditions.boardSubjectConditionsId = { [Op.in]: condition }
//     }

//     if ((fromDate && toDate) && dateFilter === 'custom') {
//       studentWhereConditions.admissionDate = { [Op.between]: [fromDate, toDate] };
//     } else if ((fromDate && !toDate) && dateFilter === 'custom') {
//       studentWhereConditions.admissionDate = { [Op.gte]: fromDate };
//     } else if ((!fromDate && toDate) && dateFilter === 'custom') {
//       studentWhereConditions.admissionDate = { [Op.lte]: toDate };
//     };

//     const formatDate = (date) => date.toISOString().split("T")[0];

//     if (dateFilter === 'today') {
//       const today = formatDate(new Date());
//       studentWhereConditions.admissionDate = today;
//     }

//     if (dateFilter === 'yesterday') {
//       const yesterday = new Date();
//       yesterday.setDate(yesterday.getDate() - 1);
//       const yestStr = formatDate(yesterday);
//       studentWhereConditions.admissionDate = yestStr;
//     }


//     if (dateFilter === 'lastWeek') {
//       const today = new Date();
//       const startOfLastWeek = new Date(today);
//       startOfLastWeek.setDate(today.getDate() - 7);
//       const endOfLastWeek = new Date(today);
//       endOfLastWeek.setDate(today.getDate() - 1);

//       const startStr = formatDate(startOfLastWeek);
//       const endStr = formatDate(endOfLastWeek);

//       studentWhereConditions.admissionDate = { [Op.between]: [startStr, endStr] }
//     }


//     if (dateFilter === 'lastMonth') {
//       const today = new Date();
//       const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//       const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // 0 = last day of previous month

//       const startStr = formatDate(startOfLastMonth);
//       const endStr = formatDate(endOfLastMonth);

//       studentWhereConditions[Op.and].push({
//         admissionDate: { [Op.between]: [startStr, endStr] },
//       });
//     }

//     let setStudentIds = [];
//     let subjectStudentIds = [];

//     // 1. Students from sets
//     if (sets.length > 0) {
//       const setRows = await studentSetMapTbl.findAll({
//         where: { setIdFk: { [Op.in]: sets } },
//         attributes: ['studentIdFk']
//       });

//       setStudentIds = setRows.map(r => r.studentIdFk);
//     }

//     // 2. Students from subjects
//     if (subjects.length > 0) {
//       const subjectRows = await studentSubjectsTbl.findAll({
//         where: { subjectIdFk: { [Op.in]: subjects } },
//         attributes: ['studentIdFk']
//       });

//       subjectStudentIds = subjectRows.map(r => r.studentIdFk);
//     }

//     let finalStudentIds = [];


//     // ----------------------------
//     // RULE 1 + RULE 3: sets.length > 0
//     // ----------------------------
//     if (sets.length > 0) {

//       // Subjects filter exists -> student must satisfy BOTH
//       if (subjects.length > 0) {
//         // intersection (AND condition)
//         finalStudentIds = setStudentIds.filter(id => subjectStudentIds.includes(id));
//       } 
//       // No subjects filter → only set filter applies
//       else {
//         finalStudentIds = setStudentIds;  // ✔ Rule 3
//       }
//     }


//     // ----------------------------
//     // RULE 2: sets.length == 0
//     // ----------------------------
//     else if (sets.length === 0) {
//       if (subjects.length > 0) {
//         finalStudentIds = subjectStudentIds; // ✔ include subject-only students
//       }
//     }

//     if (finalStudentIds.length > 0) {
//       studentWhereConditions[Op.and].push({
//         id: { [Op.in]: [...new Set(finalStudentIds)] }
//       });
//     }


//     const result = await studentTbl.findAll({
//       where: studentWhereConditions
//     });

//     if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0 });

//     const tableData = await Promise.all(result.map(async (obj, index) => {

//       const boardConditionTblObj = await boardSubjectConditionsTbl.findOne({ where: { id: obj.boardSubjectConditionsId } })

//       return {
//         rollNo: obj?.rollNo || '--',
//         name: `${obj?.firstName} ${obj?.fatherName} ${obj?.surname}`,
//         board: boardConditionTblObj?.name || '--',
//         studentMobile: obj?.studentMobile,
//         studentWhatsapp: obj?.studentWhatsapp,
//         fatherMobile: obj?.fatherMobile,
//         fatherWhatsapp: obj?.fatherWhatsapp,
//         motherMobile: obj?.motherMobile,
//         motherWhatsapp: obj?.motherWhatsapp,
//         admissionDate: obj?.admissionDate,
//         status: obj?.status == 1 ? "Active" : obj?.status == 2 ? "Inactive" : 'Unknown'
//       }

//     }));

//     return res.status(200).json({ tableData })

//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.getStudentDataForExport")
//   }
// };

superAdminController.getStudentDataForExport = async (req, res) => {
  try {
    const {
      condition = [],
      fromDate = null,
      toDate = null,
      dateFilter = null,
      sets = [],
      subjects = []
    } = req.body;

    // Important fix: Initialize Op.and
    const studentWhereConditions = {
      status: { [Op.ne]: 3 },
      [Op.and]: []
    };

    // ---------------- DATE FILTERS ----------------

    if (condition.length > 0) {
      studentWhereConditions.boardSubjectConditionsId = { [Op.in]: condition };
    }

    if ((fromDate && toDate) && dateFilter === "custom") {
      studentWhereConditions.admissionDate = { [Op.between]: [fromDate, toDate] };
    } else if ((fromDate && !toDate) && dateFilter === "custom") {
      studentWhereConditions.admissionDate = { [Op.gte]: fromDate };
    } else if ((!fromDate && toDate) && dateFilter === "custom") {
      studentWhereConditions.admissionDate = { [Op.lte]: toDate };
    }

    const formatDate = (d) => d.toISOString().split("T")[0];

    if (dateFilter === "today") {
      studentWhereConditions.admissionDate = formatDate(new Date());
    }

    if (dateFilter === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      studentWhereConditions.admissionDate = formatDate(d);
    }

    if (dateFilter === "lastWeek") {
      const today = new Date();

      const start = new Date(today);
      start.setDate(today.getDate() - 7);

      const end = new Date(today);
      end.setDate(today.getDate() - 1);

      studentWhereConditions.admissionDate = {
        [Op.between]: [formatDate(start), formatDate(end)]
      };
    }

    if (dateFilter === "lastMonth") {
      const today = new Date();

      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);

      studentWhereConditions[Op.and].push({
        admissionDate: { [Op.between]: [formatDate(start), formatDate(end)] }
      });
    }

    // ---------------- SETS & SUBJECT FILTERS ----------------

    let setStudentIds = [];
    let subjectStudentIds = [];

    if (sets.length > 0) {
      const rows = await studentSetMapTbl.findAll({
        where: { setIdFk: { [Op.in]: sets } },
        attributes: ["studentIdFk"]
      });
      setStudentIds = rows.map(r => r.studentIdFk);
    }

    if (subjects.length > 0) {
      const rows = await studentSubjectsTbl.findAll({
        where: { subjectIdFk: { [Op.in]: subjects } },
        attributes: ["studentIdFk"]
      });
      subjectStudentIds = rows.map(r => r.studentIdFk);
    }

    let finalStudentIds = [];

    // --- RULE 1 + RULE 3 ---
    if (sets.length > 0) {
      if (subjects.length > 0) {
        // Must satisfy BOTH
        finalStudentIds = setStudentIds.filter(id => subjectStudentIds.includes(id));
      } else {
        // Only sets are applied
        finalStudentIds = setStudentIds;
      }
    }

    // --- RULE 2 ---
    else if (sets.length === 0) {
      if (subjects.length > 0) {
        finalStudentIds = subjectStudentIds;
      }
    }

    if (finalStudentIds.length > 0) {
      studentWhereConditions[Op.and].push({
        id: { [Op.in]: [...new Set(finalStudentIds)] }
      });
    }

    // ---------------- FETCH STUDENTS ----------------

    const result = await studentTbl.findAll({
      where: studentWhereConditions
    });

    if (result.length === 0)
      return res.status(206).json({ tableData: [], tableRecords: 0 });

    const tableData = await Promise.all(
      result.map(async (obj) => {
        const boardObj = await boardSubjectConditionsTbl.findOne({
          where: { id: obj.boardSubjectConditionsId }
        });

        return {
          rollNo: obj.rollNo ?? "--",
          name: `${obj.firstName} ${obj.fatherName} ${obj.surname}`,
          board: boardObj?.name || "--",
          studentMobile: obj.studentMobile,
          studentWhatsapp: obj.studentWhatsapp,
          fatherMobile: obj.fatherMobile,
          fatherWhatsapp: obj.fatherWhatsapp,
          motherMobile: obj.motherMobile,
          motherWhatsapp: obj.motherWhatsapp,
          admissionDate: obj.admissionDate,
          status: obj.status === 1 ? "Active" : obj.status === 2 ? "Inactive" : "Unknown"
        };
      })
    );

    return res.status(200).json({ tableData });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentDataForExport");
  }
};


superAdminController.exportSelectedStudents = async (req, res) => {
  try {
    const { students } = req.body;

    const result = await studentTbl.findAll({
      where: {
        id: { [Op.in]: students }
      }
    });

    if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0 });

    const tableData = await Promise.all(result.map(async (obj, index) => {

      const boardConditionTblObj = await boardSubjectConditionsTbl.findOne({ where: { id: obj.boardSubjectConditionsId } })

      return {
        rollNo: obj?.rollNo || '--',
        name: `${obj?.firstName} ${obj?.fatherName} ${obj?.surname}`,
        board: boardConditionTblObj?.name || '--',
        studentMobile: obj?.studentMobile,
        fatherMobile: obj?.fatherMobile,
        motherMobile: obj?.motherMobile,
      }

    }));

    return res.status(200).json({ tableData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminControler.exportSelectedStudents")
  }
}

superAdminController.deleteStudentsInBulk = async (req, res) => {
  try {
    const { ids } = req.body;

    await studentTbl.update({
      status: 3
    }, { where: { id: { [Op.in]: ids } } });

    return res.status(201).json({ message: "Students Deleted" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.deleteStudentsInBulk")
  }
}


// ---------- helpers ----------
async function boardConditionsMap(option) {
  if (!option && option !== 0) return null;
  const opt = String(option).toUpperCase();
  const conditionsTblObj = await boardSubjectConditionsTbl.findAll({ raw: true });
  let condition = null;

  // map letter -> id (if this mapping is fixed)
  const map = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  const idToFind = map[opt];

  if (idToFind) {
    condition = conditionsTblObj.find(item => Number(item.id) === Number(idToFind)) || null;
  }

  return condition;
}

async function setMap(sets = {}) {
  const setTblObj = await setsTbl.findAll({ where: { status: 1 }, raw: true });
  const setData = [];

  const pushIfFound = (expectedId) => {
    const setObj = setTblObj.find(item => Number(item.id) === Number(expectedId));
    if (setObj) setData.push({ setId: setObj.id }); // consistent property name 'setId'
  };

  if (Number(sets.set1) === 1) pushIfFound(1);
  if (Number(sets.set2) === 1) pushIfFound(2);
  if (Number(sets.set3) === 1) pushIfFound(3);

  return setData; // array of { setId: <id> }
}


function subjectMap(selectedCodes = [], subjectCodeToId = {}) {
  const codesNormalized = (selectedCodes || []).map(c => String(c).trim());
  const availableCodes = new Set(Object.keys(subjectCodeToId).map(c => String(c)));

  const invalidCodes = codesNormalized.filter(code => !availableCodes.has(code));
  if (invalidCodes.length > 0) {
    return { success: false, data: invalidCodes };
  }
  const subjectIds = codesNormalized.map(code => subjectCodeToId[code]);

  return { success: true, data: subjectIds }; // return ids, not codes
};



superAdminController.getStudentReportCards = async (req, res) => {
  try {
    const {
      conditionId,
      examSessionId,
      page = 1,
      perPage = 50,
      orderBy = "rollNo",
      orderDirection = "ASC",
    } = req.query;

    if (!conditionId || !examSessionId) {
      return res.status(400).json({
        success: false,
        message: "Missing conditionId or examSessionId",
      });
    }

    // ✅ Verify exam session
    const examSession = await examSessionsTbl.findOne({
      where: { id: examSessionId },
      attributes: ["setIdFk"],
    });

    if (!examSession) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }
    //console.log('Fetching report cards for examSessionId:', examSession, 'and conditionId:', conditionId);
    const limit = parseInt(perPage);
    const offset = (parseInt(page) - 1) * limit;

    const validColumns = [
      "rollNo",
      "firstName",
      "surname",
      "marks_scored",
      "subjectName",
      "createdAt",
    ];
    const orderField = validColumns.includes(orderBy) ? orderBy : "rollNo";
    const orderDir = orderDirection.toUpperCase() === "DESC" ? "DESC" : "ASC";


    const marksList = await studentMarksTbl.findAll({
      where: { examSessionIdFk: examSessionId },

      offset,
      limit,
      order: [["student_marks_id_pk", "ASC"]],
    });
    console.log('Marks List Count:', marksList.length);
    if (!marksList.length) {
      return res.status(404).json({
        success: false,
        message: "No report card data found for this exam session",
      });
    }


    const studentIds = [...new Set(marksList.map((m) => m.studentIdFk))];
    const subjectIds = [...new Set(marksList.map((m) => m.subjectIdFk))];
    console.log('Unique Student IDs:', studentIds);
    console.log('Unique Subject IDs:', subjectIds);
    const students = await studentTbl.findAll({
      where: {
        id: studentIds,
        status: { [Op.ne]: 3 },
        boardSubjectConditionsId: conditionId,
      },
      attributes: [
        "id",
        "rollNo",
        "firstName",
        "surname",
        "fatherName",
        "motherName",
        "dob",
        "gender",
        "standardIdFk",
      ],
    });
    console.log('Filtered Students Count:', students);

    const standardIds = [...new Set(students.map((s) => s.standardIdFk))];
    const standards = await standardsTbl.findAll({
      where: { id: standardIds },
      attributes: ["id", "name"],
    });

    const subjects = await subjectsTbl.findAll({
      where: { id: subjectIds },
      attributes: ["id", "name"],
    });

    // Convert to lookup maps for performance
    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));
    const standardMap = Object.fromEntries(standards.map((s) => [s.id, s.name]));
    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

    console.log('Student Map Size:', studentMap);
    console.log('Standard Map Size:', standardMap);
    console.log('Subject Map Size:', subjectMap);
    const formattedData = marksList.map((r) => {
      const student = studentMap[r.studentIdFk];
      // if (!student) return null; // skip if student not found or mismatched conditionId
      console.log('Processing record for student ID:', student);
      co
      return {
        id: r.id,
        rollNo: student.rollNo || "--",
        studentName: `${student.firstName || ""} ${student.surname || ""}`.trim(),
        fatherName: student.fatherName || "--",
        motherName: student.motherName || "--",
        subjectName: subjectMap[r.subjectIdFk] || "--",
        marksScored: r.marksScored || 0,
        outOf: r.outOf || 0,
        highestMarks: r.highestMarks || 0,
        remarks: r.remarks || "",
        className: standardMap[student.standardIdFk] || "--",
        gender:
          student.gender === "M"
            ? "Male"
            : student.gender === "F"
              ? "Female"
              : student.gender || "--",
      };
    }).filter(Boolean); // remove nulls

    // ✅ Sort manually if required
    formattedData.sort((a, b) => {
      const valA = a[orderField] || "";
      const valB = b[orderField] || "";
      if (orderDir === "DESC") return valA < valB ? 1 : -1;
      return valA > valB ? 1 : -1;
    });

    const totalRecords = await studentMarksTbl.count({
      where: { examSessionIdFk: examSessionId },
    });

    const totalPages = Math.ceil(totalRecords / limit);
    const from = offset + 1;
    const to = offset + formattedData.length;

    return res.status(200).json({
      success: true,
      count: formattedData.length,
      totalRecords,
      totalPages,
      currentPage: parseInt(page),
      perPage: limit,
      from,
      to,
      reportData: formattedData,
    });
  } catch (err) {
    console.error("Error in getStudentReportCards:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

superAdminController.importAdmissions = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { admissions = [] } = req.body;
    const errors = [];
    let recordCreated = 0;
    const finalRecords = [];
    const invalidRecords = [];
    let existingRecords = [];
    const mobileNumberRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!Array.isArray(admissions) || admissions.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "No admissions available.", type: 1 });
    }

    const subjects = await subjectsTbl.findAll({
      attributes: ['id', 'code'],
      raw: true
    });

    const subjectCodeToId = {};
    subjects.forEach(s => { subjectCodeToId[String(s.code).trim()] = s.id; });

    const resolvedConditions = [];

    for (const item of admissions) {
      const condition = await boardConditionsMap(item.conditionOption); // MUST AWAIT

      resolvedConditions.push({
        ...item,
        condition
      });
    }

    // ------------------------------------------------------
    //  STEP 2: PRELOAD LAST STUDENTS FOR ROLL NO GENERATOR
    // ------------------------------------------------------
    const uniqueConditions = [];

    resolvedConditions.forEach(r => {
      if (
        r.condition &&
        r.condition.standardIdFk &&
        r.condition.boardIdFk
      ) {
        uniqueConditions.push({
          standardIdFk: r.condition.standardIdFk,
          boardIdFk: r.condition.boardIdFk,
          mediumIdFk: r.condition.mediumIdFk
        });
      }
    });

    const allLastStudents = await studentTbl.findAll({
      where: {
        [Op.or]: uniqueConditions
      },
      order: [["id", "DESC"]],
      raw: true
    });

    const rollNoTracker = {};

    allLastStudents.forEach(stu => {
      // Extract board prefix from roll number (A/B/C/D)
      const match = stu.rollNo.match(/^([A-Z])-/);
      if (!match) return;

      const prefix = match[1];

      // Tracker key by prefix (i.e., board)
      const key = `BOARD-${prefix}`;

      // Update tracker only if this rollNo is greater than current tracked
      if (!rollNoTracker[key]) {
        rollNoTracker[key] = stu.rollNo;
      } else {
        // Compare numeric parts to ensure we store the latest
        const currParts = rollNoTracker[key].match(/-(\d+)-(\d+)/);
        const newParts = stu.rollNo.match(/-(\d+)-(\d+)/);

        if (currParts && newParts) {
          const currFloor = parseInt(currParts[1], 10);
          const currNumber = parseInt(currParts[2], 10);
          const newFloor = parseInt(newParts[1], 10);
          const newNumber = parseInt(newParts[2], 10);

          // Pick the maximum rollNo
          if (newFloor > currFloor || (newFloor === currFloor && newNumber > currNumber)) {
            rollNoTracker[key] = stu.rollNo;
          }
        }
      }
    });

    // return res.status(200).json({rollNoTracker})


    for (let i = 0; i < admissions.length; i++) {
      const item = admissions[i];
      const rowErrors = [];

      const existingStudent = await studentTbl.findOne({
        where: {
          [Op.and]: [
            { firstName: { [Op.like]: `%${item.firstName}` } },
            { motherName: { [Op.like]: `%${item.motherName}` } },
            { fatherName: { [Op.like]: `%${item.fatherName}` } },
            { surname: { [Op.like]: `%${item.surname}` } },
            { dob: item.dob },
            { status: { [Op.ne]: 3 } }
          ]
        }
      });

      if (existingStudent) {
        existingRecords.push(item);
        continue;
      }

      // Validate condition
      const condition = await boardConditionsMap(item.conditionOption);
      if (!condition) {
        rowErrors.push("Board/Standard/Medium Condition not matched.");
      }

      // Validate DOB
      if (!item.firstName) {
        rowErrors.push("First Name is required");
      }
      if (!item.motherName) {
        rowErrors.push("Mother Name is required");
      }
      if (!item.fatherName) {
        rowErrors.push("Father Name is required");
      }
      if (!item.surname) {
        rowErrors.push("Surname is required");
      }
      if (!item.gender) {
        rowErrors.push("Gender is required");
      }
      if (!item.dob) {
        rowErrors.push("Student date of birth is required");
      }

      // Validate mobile numbers
      if (item.studenMobile && !mobileNumberRegex.test(item.studenMobile)) {
        rowErrors.push("Invalid Student Mobile Number");
      }
      if (item.studentWhatsapp && !mobileNumberRegex.test(item.studentWhatsapp)) {
        rowErrors.push("Invalid Student Whatsapp Number");
      }
      if (item.motherMobile && !mobileNumberRegex.test(item.motherMobile)) {
        rowErrors.push("Invalid Mother's Mobile Number");
      }
      if (item.motherWhatsapp && !mobileNumberRegex.test(item.motherWhatsapp)) {
        rowErrors.push("Invalid Mother's Whatsapp Number");
      }
      if (!item.fatherMobile) {
        rowErrors.push("Father's Mobile Number is required");
      } else if (!mobileNumberRegex.test(item.fatherMobile)) {
        rowErrors.push("Invalid Father's Mobile Number");
      }
      if (item.fatherWhatsapp && !mobileNumberRegex.test(item.fatherWhatsapp)) {
        rowErrors.push("Invalid Father's Whatsapp Number");
      }
      if (item.email && !emailRegex.test(item.email)) {
        rowErrors.push("Invalid Email Address")
      }

      // Sets mapping
      const setData = await setMap(item.sets || {});
      const isCombination = setData.length > 1 ? 1 : 0;

      // Subject validation
      const subjectMapResult = subjectMap(item.selectedCodes || [], subjectCodeToId);
      if (!subjectMapResult.success) {
        rowErrors.push(`Invalid Subject Codes: ${subjectMapResult.data.join(", ")}`);
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: i + 1,
          studentName: `${item?.firstName || ''} ${item.fatherName || ''} ${item.surname || ''}`,
          messages: rowErrors,
          invalidCodes: subjectMapResult.data || []
        });
        invalidRecords.push(item);
        continue;
      }

      // const rollNo = await generateStudentRollNoForImport(
      //   condition.standardIdFk,
      //   condition.boardIdFk,
      //   condition.mediumIdFk,
      //   rollNoTracker
      // );

      const rollNo = await generateRollForImport(condition.boardIdFk, rollNoTracker)

      const newAdmission = await studentTbl.create({
        firstName: item.firstName,
        motherName: item.motherName,
        fatherName: item.fatherName,
        surname: item.surname,
        address: item.address,
        dob: item.dob,
        admissionDate: item.admissionDate,
        gender: item.gender,
        rollNo,
        email: item.email,
        schoolName: item.schoolName,
        fatherOccupation: item.fatherOccupation,
        motherOccupation: item.motherOccupation,
        studentMobile: item.studenMobile,
        studentWhatsapp: item.studentWhatsapp,
        fatherMobile: item.fatherMobile,
        fatherWhatsapp: item.fatherWhatsapp,
        motherMobile: item.motherMobile,
        motherWhatsapp: item.motherWhatsapp,
        standardIdFk: condition.standardIdFk,
        boardIdFk: condition.boardIdFk,
        mediumIdFk: condition.mediumIdFk,
        admissionConfirmed: 1,
        isCombination,
        // feesPaid: item.feesPaid,
        // feesRemaining: item.feesRemaining,
        createdBy: req.uid,
        boardSubjectConditionsId: condition.id
      }, { transaction: t });

      const formattedSubjectTblData = subjectMapResult.data.map(subId => ({
        studentIdFk: newAdmission.id,
        subjectIdFk: subId,
        assignedAt: new Date()
      }));
      await studentSubjectsTbl.bulkCreate(formattedSubjectTblData, { transaction: t });

      const formattedSetTblData = setData.map(s => ({
        studentIdFk: newAdmission.id,
        setIdFk: s.setId
      }));
      await studentSetMapTbl.bulkCreate(formattedSetTblData, { transaction: t });

      finalRecords.push(newAdmission);
      recordCreated++;
    }

    await t.commit();
    if (errors.length === admissions.length) {
      return res.status(206).json({
        message: "Admissions not imported. Check for Errors",
        totalRecords: admissions.length,
        recordCreated,
        errors,
        finalRecords,
        invalidRecords,
        existingRecords,
        existingRecordsCount: existingRecords.length
      });
    } else if (errors.length > 0) {
      return res.status(200).json({
        message: "Admissions imported partially. Check for Errors and Invalid Records",
        totalRecords: admissions.length,
        recordCreated,
        errors,
        finalRecords,
        invalidRecords,
        existingRecords,
        existingRecordsCount: existingRecords.length
      });
    } else {
      return res.status(200).json({
        message: "Admissions Imported Successfully!",
        totalRecords: admissions.length,
        recordCreated,
        errors,
        finalRecords,
        invalidRecords,
        existingRecords,
        existingRecordsCount: existingRecords.length
      });
    }

  } catch (err) {
    // rollback and send proper response
    try { await t.rollback(); } catch (e) { /* ignore */ }
    console.error("Error while importing admissions", err);
    handleSequelizeError(err, res, "superAdminController.importAdmissions")
  }
};

superAdminController.getSubjectCodesByCondition = async function (req, res) {
  try {
    const subjects = await subjectsTbl.findAll({ attributes: ['code', 'boardSubjectConditionsId'] });

    const tenthSCC = subjects.filter((item) => item.boardSubjectConditionsId === 1);
    const tenthSSCSemi = subjects.filter((item) => item.boardSubjectConditionsId === 2);
    const tenthCBSE = subjects.filter((item) => item.boardSubjectConditionsId === 3);
    const tenthICSE = subjects.filter((item) => item.boardSubjectConditionsId === 4);
    const twelthHSC = subjects.filter((item) => item.boardSubjectConditionsId === 5);

    const conditionWiseSubjectCodes = {
      tenthSCC,
      tenthSSCSemi,
      tenthICSE,
      tenthCBSE,
      twelthHSC
    };

    return res.status(200).json({ conditionWiseSubjectCodes })


  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getSubjectCodesByCondition")
  }
};

// ----------------------- Marks Entry -----------------------------------------
// superAdminController.getStudentsForMarksEntry = async function (req, res) {
//   try {
//     const { currentPage = 1, perPage = 50, setId, conditionId, studentIdData = [], subjectIdData = [] } = req.body;

//     const page = parseInt(currentPage, 10);
//     const limit = parseInt(perPage, 10);
//     const offset = (page - 1) * limit;

//     const studentSetTblObj = await studentSetMapTbl.findAll({
//       where: {
//         setIdFk: setId
//       }
//     });
//     const studentIds = studentSetTblObj.map((item) => item.studentIdFk);

//     const formattedStudentIds = studentIdData.length > 0 ? studentIdData : studentIds;

//     const result = await studentTbl.findAll({
//       where: {
//         [Op.and]: [
//           { boardSubjectConditionsId: conditionId },
//           { id: { [Op.in]: formattedStudentIds } },
//           { status: { [Op.ne]: 3 } }
//         ]
//       },
//       order: [["id", "ASC"]],
//       limit,
//       offset
//     });

//     let subjectWhereConditions = {};

//     if (subjectIdData.length > 0) {
//       const subjectIds = subjectIdData;
//       subjectWhereConditions.id = { [Op.in]: subjectIds };
//     } else {
//       subjectWhereConditions.boardSubjectConditionsId = conditionId;
//     }
//     const subjectsData = await subjectsTbl.findAll({
//       where: subjectWhereConditions
//     });
//     const subjectMap = subjectsData.map((item) => ({ label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`, value: item.id }));

//     if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0, subjectMap });

//     const tableData = await Promise.all(result.map(async (obj, index) => {

//       const studentSubjects = await studentSubjectsTbl.findAll({
//         where: { studentIdFk: obj.id }
//       });

//       const subjectIds = studentSubjects.map(item => item.subjectIdFk);

//       const studentSubjectData = subjectsData
//         .filter(item => subjectIds.includes(item.id))
//         .map(item => ({
//           label: `${item.name} (${item.code.replace("-", "_")})`,
//           value: item.id
//         }));

//       const subjectValues = {};
//       subjectMap.forEach(sub => {
//         const hasSubject = studentSubjectData.find(s => s.value === sub.value);
//         subjectValues[sub.label] = hasSubject ? { marks: null, isAbsent: false } : "NA";
//       });

//       return {
//         rollNo: obj?.rollNo,
//         fullName: `${obj?.firstName} ${obj?.fatherName} ${obj?.surname}`,
//         ...subjectValues
//       };
//     }));

//     const tableRecords = await studentTbl.count({
//       where: {
//         [Op.and]: [
//           { boardSubjectConditionsId: conditionId },
//           { id: { [Op.in]: studentIds } },
//           { status: { [Op.ne]: 3 } }
//         ]
//       }
//     });

//     return res.status(200).json({ tableData, tableRecords, subjectMap })

//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.getStudentsForMarksEntry")
//   }
// };

superAdminController.getStudentsForMarksEntry = async function (req, res) {
  try {
    const { currentPage = 1, perPage = 50, setId, examSessionId, conditionId, studentIdData = [], subjectIdData = [] } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const studentSetTblObj = await studentSetMapTbl.findAll({
      where: {
        setIdFk: setId
      }
    });
    const studentIds = studentSetTblObj.map((item) => item.studentIdFk);

    const formattedStudentIds = studentIdData.length > 0 ? studentIdData : studentIds;

    const result = await studentTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: formattedStudentIds } },
          { status: { [Op.ne]: 3 } }
        ]
      },
      order: [["id", "ASC"]],
      limit,
      offset
    });

    const examTimeTableTblObj = await examTimetableTbl.findAll({ where: { examSessionIdFk: examSessionId } });
    const subjectIdsByExam = examTimeTableTblObj.map((ex) => ex.subjectIdFk);

    let subjectWhereConditions = { id: { [Op.in]: subjectIdsByExam } };

    if (subjectIdData.length > 0) {
      const subjectIds = subjectIdData;
      subjectWhereConditions.id = { [Op.in]: subjectIds };
    } else {
      subjectWhereConditions.boardSubjectConditionsId = conditionId;
    }
    const subjectsData = await subjectsTbl.findAll({
      where: subjectWhereConditions
    });
    let formattedSubjectData = subjectsData.filter((i) => subjectIdsByExam.includes(i.id))
    const subjectMap = formattedSubjectData.map((item) => ({ label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`, value: item.id }));

    if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0, subjectMap });

    const tableData = await Promise.all(result.map(async (obj, index) => {

      // const examTimeTableTblObj = await examTimetableTbl.findAll({where:{examSessionIdFk: examSessionId}});
      // const subjectIds = examTimeTableTblObj.map((ex) => ex.subjectIdFk);

      const studentSubjects = await studentSubjectsTbl.findAll({
        where: { studentIdFk: obj.id }
      });

      const subjectIds = studentSubjects.map(item => item.subjectIdFk);

      const studentSubjectData = subjectsData
        .filter(item => subjectIds.includes(item.id))
        .map(item => ({
          label: `${item.name} (${item.code.replace("-", "_")})`,
          value: item.id
        }));

      const studentMarksTblObj = await studentMarksTbl.findAll({
        where: {
          studentIdFk: obj.id,
          examSessionIdFk: examSessionId
        }
      })

      const subjectValues = {};
      subjectMap.forEach(sub => {
        const hasSubject = studentSubjectData.find(s => s.value === sub.value);
        const hasMarks = studentMarksTblObj.find(s => s.subjectIdFk === sub.value);

        if (hasSubject) {
          const isAbsent = hasMarks?.isAbsent == 1;

          // subjectValues[sub.label] = {
          //   marks: isAbsent ? "A" : (hasMarks?.marksScored ?? null),
          //   isPresent: !isAbsent
          // };

          const rawMarks = hasMarks?.marksScored;

          subjectValues[sub.label] = {
            marks: isAbsent
              ? "A"
              : rawMarks !== null && rawMarks !== undefined
                ? Number.isInteger(Number(rawMarks))
                  ? Number(rawMarks)          // 25.0 → 25
                  : Number(rawMarks)          // 12.5 → 12.5
                : null,
            isPresent: !isAbsent
          };

        } else {
          subjectValues[sub.label] = "NA";
        }
      });


      return {
        rollNo: obj?.rollNo,
        fullName: `${obj?.firstName} ${obj?.fatherName} ${obj?.surname}`,
        ...subjectValues
      };
    }));

    const tableRecords = await studentTbl.count({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } }
        ]
      }
    });

    return res.status(200).json({ tableData, tableRecords, subjectMap })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentsForMarksEntry")
  }
};

// superAdminController.getSubjectsByCondition = async function (req, res) {
//   try {
//     const conditionId = req.query.conditionId;
//     if (!conditionId) return res.status(400).json({ message: "conditionId required" });
//     const subjects = await subjectsTbl.findAll({
//       where: { boardSubjectConditionsId: conditionId },
//       attributes: ["id", "name", "code", "maxMarks"]
//     });

//     // Build label "Name (CODE)" and derive outOfMarks if available
//     const result = subjects.map(s => {
//       const label = `${s.name.replace(" ", "_")}_(${s.code.replace("-", "_")})`;
//       const outOfMarks = s.maxMarks ?? null;
//       return { id: s.id, label, outOfMarks };
//     });

//     const subjectData = subjects.map(s => {
//       const label = `${s.name.replace(" ", "_")}_(${s.code.replace("-", "_")})`;
//       const outOfMarks = s.maxMarks ?? null;
//       return { value: s.id, label, outOfMarks };
//     });
//     return res.json({ result, subjectData });
//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.getSubjectsbyCondition")
//   }
// };

superAdminController.getSubjectsByCondition = async function (req, res) {
  try {
    const examSessionId = req.query.examSessionId;
    if (!examSessionId) return res.status(400).json({ message: "conditionId required" });

    const examTimeTableTblObj = await examTimetableTbl.findAll({ where: { examSessionIdFk: examSessionId } })
    const subjectIds = examTimeTableTblObj.map((ex) => ex.subjectIdFk);
    const subjects = await subjectsTbl.findAll({
      where: { id: { [Op.in]: subjectIds } },
      attributes: ["id", "name", "code", "maxMarks"]
    });

    // Build label "Name (CODE)" and derive outOfMarks if available
    const result = subjects.map(s => {
      const label = `${s.name.replace(" ", "_")}_(${s.code.replace("-", "_")})`;
      const outOfMarks = s.maxMarks ?? null;
      return { id: s.id, label, outOfMarks };
    });

    const subjectData = subjects.map(s => {
      const label = `${s.name.replace(" ", "_")}_(${s.code.replace("-", "_")})`;
      const outOfMarks = s.maxMarks ?? null;
      return { value: s.id, label, outOfMarks };
    });
    return res.json({ result, subjectData });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getSubjectsbyCondition")
  }
};

superAdminController.getStudentsByCondition = async function (req, res) {
  try {
    const { conditionId, setId } = req.query;
    if (!conditionId) return res.status(400).json({ message: "conditionId required" });

    const studentSetTblObj = await studentSetMapTbl.findAll({
      where: {
        setIdFk: setId
      }
    });
    const studentIds = studentSetTblObj.map((item) => item.studentIdFk);

    // Fetch only id and rollNo for the condition
    const students = await studentTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } }
        ]
      },
      attributes: ["id", "rollNo", "firstName", "fatherName", "surname"]
    });

    const result = students.map(s => ({ id: s.id, rollNo: s.rollNo }));
    const studentData = students.map(s => ({ value: s.id, label: `${s.rollNo} - ${s.firstName} ${s.fatherName} ${s.surname}` }));
    return res.json({ result, studentData });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentsByCondition")
  }
};

superAdminController.getStudentsByConditionForSelect = async function (req, res) {
  try {
    const { conditionId, setId, word } = req.query;
    if (!conditionId) return res.status(400).json({ message: "conditionId required" });

    const studentSetTblObj = await studentSetMapTbl.findAll({
      where: {
        setIdFk: setId
      }
    });
    const studentIds = studentSetTblObj.map((item) => item.studentIdFk);

    // Fetch only id and rollNo for the condition
    const students = await studentTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } },
          {
            [Op.or]: [
              { firstName: { [Op.like]: `%${word}%` } },
              { motherName: { [Op.like]: `%${word}%` } },
              { fatherName: { [Op.like]: `%${word}%` } },
              { surname: { [Op.like]: `%${word}%` } },
              { rollNo: { [Op.like]: `%${word}%` } },
            ]
          }
        ]
      },
      attributes: ["id", "rollNo", "firstName", "motherName", "fatherName", "surname"],
      limit: 20
    });

    const result = students.map(s => ({ id: s.id, rollNo: s.rollNo }));
    const studentData = students.map(s => ({ value: s.id, label: `${s.rollNo} - ${s.firstName} ${s.fatherName} ${s.surname}` }));
    return res.json({ result, studentData });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentsByCondition")
  }
};

superAdminController.getStudentSubjectsByCondition = async function (req, res) {
  try {
    const { conditionId, setId } = req.query;
    const studentSetTblObj = await studentSetMapTbl.findAll({
      where: {
        setIdFk: setId
      }
    });
    const studentIds = studentSetTblObj.map((item) => item.studentIdFk);

    // Fetch only id and rollNo for the condition
    const studentTblObj = await studentTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } }
        ]
      },
      attributes: ["id", "rollNo"],
    });
    const students = studentTblObj.map((item) => item.id);
    if (studentIds.length === 0) {
      return res.json([]);
    };

    const maps = await studentSubjectsTbl.findAll({
      where: { studentIdFk: { [Op.in]: studentIds } },
      attributes: ["studentIdFk", "subjectIdFk"]
    });

    // build mapping rollNo -> [subjectId, ...]
    const studentMap = {};
    const idToRoll = {};
    studentTblObj.forEach(s => { idToRoll[s.id] = s.rollNo; studentMap[s.rollNo] = []; });

    maps.forEach(m => {
      const roll = idToRoll[m.studentIdFk];
      if (roll) studentMap[roll].push(m.subjectIdFk);
    });

    // return as array of { rollNo, subjectIds }
    const result = Object.keys(studentMap).map(roll => ({ rollNo: roll, subjectIds: studentMap[roll] }));

    return res.json(result);
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentSubjectsByCondition")
  }
}

// superAdminController.importStudentMarksThroughExcel = async function (req, res) {
//   const t = await sequelize.transaction();
//   try {
//     const { conditionId, overwrite = true, rows, examSessionId } = req.body;
//     if (!conditionId) return res.status(400).json({ message: "conditionId required" });
//     if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "rows required" });

//     // rows expected to be: [{ studentId, rollNo, subjects: [{subjectId, marks, outOfMarks}, ...] }, ...]
//     let inserted = 0, updated = 0, skipped = 0;
//     const errorLog = [];

//     for (const r of rows) {
//       const studentId = r.studentId;
//       if (!studentId) {
//         errorLog.push({ row: r, reason: "Missing studentId" });
//         skipped++;
//         continue;
//       }
//       const subjList = r.subjects || [];
//       let hasInserted = false;
//       let hasUpdated = false;
//       let hasValid = false;
//       for (const s of subjList) {
//         const { subjectId, marks, outOfMarks } = s;
//         if (subjectId === undefined || subjectId === null) {
//           errorLog.push({ rollNo: r.rollNo, reason: "Missing subjectId" });
//           // skipped++;
//           continue;
//         }
//         if (marks === undefined || marks === null || Number.isNaN(Number(marks))) {
//           errorLog.push({ rollNo: r.rollNo, subjectId, reason: "Invalid marks" });
//           // skipped++;
//           continue;
//         }

//         // upsert behavior
//         const existing = await studentMarksTbl.findOne({
//           where: { studentIdFk: studentId, subjectIdFk: subjectId }
//         });

//         if (existing) {
//           if (overwrite) {
//             await existing.update({ marksScored: marks, outOf: outOfMarks, enteredByFk: req.uid, enteredAt: new Date(), examSessionIdFk: examSessionId }, { transaction: t });
//             hasUpdated = true;
//           }
//           // else {
//           //   skipped++;
//           // }
//         } else {
//           await studentMarksTbl.create({ studentIdFk: studentId, subjectIdFk: subjectId, marksScored: marks, outOf: outOfMarks, enteredByFk: req.uid, enteredAt: new Date(), examSessionIdFk: examSessionId }, { transaction: t });
//           hasInserted = true;
//         }
//       }
//       if (!hasValid) {
//         skipped++;
//       } else if (hasInserted && !hasUpdated) {
//         inserted++;
//       } else if (hasUpdated && !hasInserted) {
//         updated++;
//       } else if (hasInserted && hasUpdated) {
//         updated++; // count as updated if both happened
//       }
//     }

//     await t.commit();
//     return res.json({ message: "Import completed", summary: { inserted, updated, skipped, errors: errorLog.slice(0, 200) } });
//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.importStudentMarksThroughExcel")
//   }
// };

// superAdminController.importStudentMarksThroughExcel = async function (req, res) {
//   const t = await sequelize.transaction();
//   try {
//     const { conditionId, overwrite = true, rows, examSessionId } = req.body;
//     if (!conditionId) return res.status(400).json({ message: "conditionId required" });
//     if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "rows required" });

//     // rows expected to be: [{ studentId, rollNo, subjects: [{subjectId, marks, outOfMarks}, ...] }, ...]
//     let inserted = 0, updated = 0, skipped = 0;
//     const errorLog = [];

//     for (const r of rows) {
//       const studentId = r.studentId;
//       if (!studentId) {
//         errorLog.push({ row: r, reason: "Missing studentId" });
//         skipped++;
//         continue;
//       }

//       const subjList = r.subjects || [];
//       let hasInserted = false;
//       let hasUpdated = false;
//       let hasValid = false;

//       for (const s of subjList) {
//         const { subjectId, marks, outOfMarks } = s;
//         if (subjectId === undefined || subjectId === null) {
//           errorLog.push({ rollNo: r.rollNo, reason: "Missing subjectId" });
//           continue;
//         }
//         if (marks === undefined || marks === null || Number.isNaN(Number(marks))) {
//           errorLog.push({ rollNo: r.rollNo, subjectId, reason: "Invalid marks" });
//           continue;
//         }

//         hasValid = true;
//         const existing = await studentMarksTbl.findOne({
//           where: { studentIdFk: studentId, subjectIdFk: subjectId }
//         });

//         if (existing) {
//           if (overwrite) {
//             await existing.update(
//               {
//                 marksScored: marks,
//                 outOf: outOfMarks,
//                 enteredByFk: req.uid,
//                 enteredAt: new Date(),
//                 examSessionIdFk: examSessionId,
//               },
//               { transaction: t }
//             );
//             hasUpdated = true;
//           }
//         } else {
//           await studentMarksTbl.create(
//             {
//               studentIdFk: studentId,
//               subjectIdFk: subjectId,
//               marksScored: marks,
//               outOf: outOfMarks,
//               enteredByFk: req.uid,
//               enteredAt: new Date(),
//               examSessionIdFk: examSessionId,
//             },
//             { transaction: t }
//           );
//           hasInserted = true;
//         }
//       }

//       // Student-level counters
//       if (!hasValid) {
//         skipped++;
//       } else if (hasInserted && !hasUpdated) {
//         inserted++;
//       } else if (hasUpdated && !hasInserted) {
//         updated++;
//       } else if (hasInserted && hasUpdated) {
//         updated++; // count as updated if both happened
//       }
//     }

//     await t.commit();
//     return res.json({
//       message: "Import completed",
//       summary: {
//         inserted,
//         updated,
//         skipped,
//         errors: errorLog.slice(0, 200),
//       },
//     });
//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.importStudentMarksThroughExcel");
//   }
// };

superAdminController.importStudentMarksThroughExcel = async function (req, res) {
  const t = await sequelize.transaction();
  try {
    const { conditionId, overwrite = true, rows, examSessionId } = req.body;
    if (!conditionId) return res.status(400).json({ message: "conditionId required" });
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "rows required" });

    let inserted = 0, updated = 0, skipped = 0;
    const errorLog = [];

    for (const r of rows) {
      const { studentId, rollNo } = r;
      if (!studentId) {
        errorLog.push({ row: r, reason: "Missing studentId" });
        skipped++;
        continue;
      }

      const subjList = r.subjects || [];
      if (subjList.length === 0) {
        skipped++;
        continue;
      }

      let hasInserted = false;
      let hasUpdated = false;

      for (const s of subjList) {
        const { subjectId, isPresent, marks, outOfMarks } = s;
        if (!subjectId) {
          errorLog.push({ rollNo, reason: "Missing subjectId" });
          continue;
        }

        if (isPresent && (marks === undefined || marks === null || Number.isNaN(Number(marks)))) {
          errorLog.push({ rollNo, subjectId, reason: "Invalid marks" });
          continue;
        }

        // check if mark record exists for that student + subject + session
        const existing = await studentMarksTbl.findOne({
          where: {
            studentIdFk: studentId,
            subjectIdFk: subjectId,
            examSessionIdFk: examSessionId,
          },
          transaction: t,
        });

        if (existing) {
          if (overwrite) {
            await existing.update(
              {
                isAbsent: isPresent ? 2 : 1,
                marksScored: marks,
                outOf: outOfMarks,
                enteredByFk: req.uid,
                enteredAt: new Date(),
              },
              { transaction: t }
            );
            hasUpdated = true;
          }
        } else {
          await studentMarksTbl.create(
            {
              studentIdFk: studentId,
              subjectIdFk: subjectId,
              isAbsent: isPresent ? 2 : 1,
              marksScored: marks,
              outOf: outOfMarks,
              enteredByFk: req.uid,
              enteredAt: new Date(),
              examSessionIdFk: examSessionId,
            },
            { transaction: t }
          );
          hasInserted = true;
        }
      }

      if (hasInserted && !hasUpdated) inserted++;
      else if (hasUpdated && !hasInserted) updated++;
      else if (hasInserted && hasUpdated) updated++;
      else skipped++;
    }

    await t.commit();
    return res.json({
      message: "Import completed",
      summary: { inserted, updated, skipped, errors: errorLog.slice(0, 200) },
    });
  } catch (err) {
    console.log("Error", err);
    await t.rollback();
    handleSequelizeError(err, res, "superAdminController.importStudentMarksThroughExcel");
  }
};

// superAdminController.importStudentMarksThroughTable = async function (req, res) {
//   const t = await sequelize.transaction();
//   try {
//     const { conditionId, overwrite = true, rows, examSessionId } = req.body;
//     if (!conditionId) return res.status(400).json({ message: "conditionId required" });
//     if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "rows required" });

//     let inserted = 0, updated = 0, skipped = 0;
//     const errorLog = [];

//     for (const r of rows) {
//       const { studentId, rollNo } = r;
//       if (!studentId) {
//         errorLog.push({ row: r, reason: "Missing studentId" });
//         skipped++;
//         continue;
//       }

//       const subjList = r.subjects || [];
//       if (subjList.length === 0) {
//         skipped++;
//         continue;
//       }

//       let hasInserted = false;
//       let hasUpdated = false;

//       for (const s of subjList) {
//         const { subjectId, isAbsent, marks, outOfMarks } = s;
//         if (isAbsent) continue;
//         if (!subjectId) {
//           errorLog.push({ rollNo, reason: "Missing subjectId" });
//           continue;
//         }

//         if (marks === undefined || marks === null || Number.isNaN(Number(marks))) {
//           errorLog.push({ rollNo, subjectId, reason: "Invalid marks" });
//           continue;
//         }

//         // check if mark record exists for that student + subject + session
//         const existing = await studentMarksTbl.findOne({
//           where: {
//             studentIdFk: studentId,
//             subjectIdFk: subjectId,
//             examSessionIdFk: examSessionId,
//           },
//           transaction: t,
//         });

//         if (existing) {
//           if (overwrite) {
//             await existing.update(
//               {
//                 marksScored: marks,
//                 outOf: outOfMarks,
//                 enteredByFk: req.uid,
//                 enteredAt: new Date(),
//               },
//               { transaction: t }
//             );
//             hasUpdated = true;
//           }
//         } else {
//           await studentMarksTbl.create(
//             {
//               studentIdFk: studentId,
//               subjectIdFk: subjectId,
//               marksScored: marks,
//               outOf: outOfMarks,
//               enteredByFk: req.uid,
//               enteredAt: new Date(),
//               examSessionIdFk: examSessionId,
//             },
//             { transaction: t }
//           );
//           hasInserted = true;
//         }
//       }

//       if (hasInserted && !hasUpdated) inserted++;
//       else if (hasUpdated && !hasInserted) updated++;
//       else if (hasInserted && hasUpdated) updated++;
//       else skipped++;
//     }

//     await t.commit();
//     return res.json({
//       message: "Import completed",
//       summary: { inserted, updated, skipped, errors: errorLog.slice(0, 200) },
//     });
//   } catch (err) {
//     console.log("Error", err);
//     await t.rollback();
//     handleSequelizeError(err, res, "superAdminController.importStudentMarksThroughTable");
//   }
// };

superAdminController.importStudentMarksThroughTable = async function (req, res) {
  const t = await sequelize.transaction();
  try {
    const { conditionId, overwrite = true, rows, examSessionId } = req.body;
    if (!conditionId) return res.status(400).json({ message: "conditionId required" });
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "rows required" });

    let inserted = 0, updated = 0, skipped = 0;
    const errorLog = [];

    for (const r of rows) {
      const { studentId, rollNo } = r;
      if (!studentId) {
        errorLog.push({ row: r, reason: "Missing studentId" });
        skipped++;
        continue;
      }

      const subjList = r.subjects || [];
      if (subjList.length === 0) {
        skipped++;
        continue;
      }

      let hasInserted = false;
      let hasUpdated = false;

      for (const s of subjList) {
        const { subjectId, isPresent, marks, outOfMarks } = s;
        if (!subjectId) {
          errorLog.push({ rollNo, reason: "Missing subjectId" });
          continue;
        }

        if (isPresent && (marks === undefined || marks === null || Number.isNaN(Number(marks)))) {
          errorLog.push({ rollNo, subjectId, reason: "Invalid marks" });
          continue;
        }

        // check if mark record exists for that student + subject + session
        const existing = await studentMarksTbl.findOne({
          where: {
            studentIdFk: studentId,
            subjectIdFk: subjectId,
            examSessionIdFk: examSessionId,
          },
          transaction: t,
        });

        if (existing) {
          if (overwrite) {
            await existing.update(
              {
                isAbsent: isPresent ? 2 : 1,
                marksScored: marks,
                outOf: outOfMarks,
                enteredByFk: req.uid,
                enteredAt: new Date(),
              },
              { transaction: t }
            );
            hasUpdated = true;
          }
        } else {
          await studentMarksTbl.create(
            {
              studentIdFk: studentId,
              subjectIdFk: subjectId,
              isAbsent: isPresent ? 2 : 1,
              marksScored: marks,
              outOf: outOfMarks,
              enteredByFk: req.uid,
              enteredAt: new Date(),
              examSessionIdFk: examSessionId,
            },
            { transaction: t }
          );
          hasInserted = true;
        }
      }

      if (hasInserted && !hasUpdated) inserted++;
      else if (hasUpdated && !hasInserted) updated++;
      else if (hasInserted && hasUpdated) updated++;
      else skipped++;
    }

    await t.commit();
    return res.json({
      message: "Import completed",
      summary: { inserted, updated, skipped, errors: errorLog.slice(0, 200) },
    });
  } catch (err) {
    console.log("Error", err);
    await t.rollback();
    handleSequelizeError(err, res, "superAdminController.importStudentMarksThroughTable");
  }
};

superAdminController.getMaxMarksSubjectWise = async function (req, res) {
  try {
    const { conditionId } = req.query;

    const subjectTblObj = await subjectsTbl.findAll({
      where: {
        boardSubjectConditionsId: conditionId
      }
    });

    const subectMaxMarks = subjectTblObj.map((item) => ({
      label: `${item.name} (${item.code})`,
      maxMarks: item.maxMarks
    }));

    return res.status(200).json({ subectMaxMarks })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getMarksSubjectWise")
  }
}
superAdminController.generateReportCard = async function (req, res) {
  try {
    const { examSessionsTblId, studentIds: selectedStudentIds = [] } = req.body;

    if (!examSessionsTblId) {
      return res.status(400).json({ message: "examSessionsTblId is required" });
    }

    // Fetch exam session details
    const examSessionsTblObj = await examSessionsTbl.findByPk(
      examSessionsTblId,
      {
        include: [
          { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name"] },
          { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
          { model: setsTbl, as: "tbl_sets", attributes: ["id", "name"] },
        ],
      }
    );

    if (!examSessionsTblObj) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    const setIdFk = examSessionsTblObj.setIdFk;
    const boardSubjectConditionsId = examSessionsTblObj.boardSubjectConditionsId;

    if (!setIdFk) {
      return res.status(400).json({ message: "Exam session does not have a set assigned" });
    }

    // Fetch board subject condition
    const boardSubjectCondition = await boardSubjectConditionsTbl.findOne({
      where: { id: boardSubjectConditionsId },
      include: [
        { model: boardsTbl, as: "tbl_boards", attributes: ["id", "name"] },
        { model: standardsTbl, as: "tbl_standards", attributes: ["id", "name"] },
        { model: mediumsTbl, as: "tbl_mediums", attributes: ["id", "name"] },
      ],
    });

    if (!boardSubjectCondition) {
      return res.status(404).json({ message: "Board subject condition not found" });
    }

    // Get all students in this set
    const studentSetMaps = await studentSetMapTbl.findAll({ where: { setIdFk } });
    const studentIds = studentSetMaps.map((ssm) => ssm.studentIdFk);

    if (studentIds.length === 0) {
      return res.status(404).json({ message: "No students found for this set" });
    }

    // Fetch all students for ranking
    const allStudents = await studentTbl.findAll({
      where: { id: { [Op.in]: studentIds }, boardSubjectConditionsId, status: 1 },
      order: [["rollNo", "ASC"]],
    });

    if (!allStudents || allStudents.length === 0) {
      return res.status(404).json({ message: "No students found for this exam and set" });
    }

    // Filter selected students for PDF generation
    let students = allStudents;
    if (selectedStudentIds.length > 0) {
      students = allStudents.filter((s) => selectedStudentIds.includes(s.id));
    }

    // Fetch exam timetable
    const examTimetable = await examTimetableTbl.findAll({
      where: { examSessionIdFk: examSessionsTblId },
      order: [["examDate", "ASC"]],
    });

    const subjectIds = examTimetable.map((tt) => tt.subjectIdFk);
    const subjects = await subjectsTbl.findAll({
      where: { id: { [Op.in]: subjectIds }, status: 1 },
      order: [["sortOrder", "ASC"]],
    });

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const allStudentSubjects = await studentSubjectsTbl.findAll({
      where: {
        studentIdFk: { [Op.in]: studentIds },
        subjectIdFk: { [Op.in]: subjectIds },
        isActive: 1,
      },
    });

    const studentSubjectMap = new Map();
    allStudentSubjects.forEach((ss) => {
      studentSubjectMap.set(`${ss.studentIdFk}-${ss.subjectIdFk}`, true);
    });

    const marksConditions = await marksConditionTbl.findAll({ order: [["from", "DESC"]] });

    const allMarks = await studentMarksTbl.findAll({
      where: { examSessionIdFk: examSessionsTblId, studentIdFk: { [Op.in]: studentIds } },
    });

    const marksMap = new Map();
    allMarks.forEach((mark) => {
      marksMap.set(`${mark.studentIdFk}-${mark.subjectIdFk}`, mark);
    });

    const highestMarksMap = new Map();
    examTimetable.forEach((tt) => {
      const subjectMarks = allMarks
        .filter((m) => m.subjectIdFk === tt.subjectIdFk)
        .map((m) => m.marksScored || 0);
      highestMarksMap.set(tt.subjectIdFk, subjectMarks.length ? Math.max(...subjectMarks) : 0);
    });

    const getGradeInfo = (percentage) => {
      return marksConditions.find((condition) => percentage >= condition.from && percentage <= condition.to) || null;
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDate();
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const month = monthNames[date.getMonth()];
      let suffix = "th";
      if ([1, 21, 31].includes(day)) suffix = "st";
      else if ([2, 22].includes(day)) suffix = "nd";
      else if ([3, 23].includes(day)) suffix = "rd";
      return `${day}${suffix} ${month}`;
    };

    const dateFrom = new Date(examSessionsTblObj.dateFrom);
    const yearRange = `${dateFrom.getFullYear()}-${dateFrom.getFullYear() + 1}`;

    const logoPath = path.join(__dirname, "../views/images/logo.jpg");
    const logoImage = fs.readFileSync(logoPath).toString("base64");
    const logoPathback = path.join(__dirname, "../views/images/logo.jpg");
    const logoImageback = fs.readFileSync(logoPathback).toString("base64");

    const fonts = { Roboto: { normal: "Helvetica", bold: "Helvetica-Bold", italics: "Helvetica-Oblique", bolditalics: "Helvetica-BoldOblique" } };
    const printer = new PdfPrinter(fonts);

    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "portrait",
      pageMargins: [30, 30, 30, 40],
      background: (currentPage, pageSize) => [
        { margin: [0, 10, 0, 0], image: `data:image/jpeg;base64,${logoImageback}`, width: 500, opacity: 0.10, absolutePosition: { x: (pageSize.width - 500) / 2, y: (pageSize.height - 450) / 2 } },
        { canvas: [{ type: "rect", x: 15, y: 15, w: pageSize.width - 30, h: pageSize.height - 30, lineWidth: 1, strokeColor: "#000000" }] }
      ],
      footer: () => ({
        stack: [
          { text: "GURUKUL HO…!", fontSize: 11, bold: true, alignment: "center", margin: [0, 10, 0, -33] },
          { text: "ALL THE BEST", fontSize: 11, bold: true, alignment: "center", margin: [0, 0, 0, 0] },
          { text: "                                                                                                              ", fontSize: 9, margin: [0, 10, 0, 0], alignment: "left" }
        ],
        margin: [30, 0, 30, 0],
      }),
      content: [],
      defaultStyle: { font: "Roboto" },
    };

    // Compute all student percentages for ranking
    const allStudentPercentages = allStudents.map((s) => {
      let stuTotalObtained = 0, stuTotalMax = 0;
      // examTimetable.forEach((tt) => {
      //   const enrollmentKey = `${s.id}-${tt.subjectIdFk}`;
      //   if (!studentSubjectMap.has(enrollmentKey)) return;
      //   const markEntry = marksMap.get(enrollmentKey);
      //   const numericObtained = markEntry ? (markEntry.isAbsent === 1 ? 0 : (markEntry.marksScored != null ? Number(markEntry.marksScored) : 0)) : 0;
      //   stuTotalObtained += numericObtained;
      //   stuTotalMax += tt.maxMarks || 80;
      // });
      examTimetable.forEach((tt) => {
        const enrollmentKey = `${s.id}-${tt.subjectIdFk}`;
        if (!studentSubjectMap.has(enrollmentKey)) return;

        const markEntry = marksMap.get(enrollmentKey);

        const numericObtained =
          markEntry && markEntry.isAbsent !== 1 && markEntry.marksScored != null
            ? Number(markEntry.marksScored)   // 25.0 → 25, 12.5 → 12.5
            : 0;

        stuTotalObtained += numericObtained;
        stuTotalMax += tt.maxMarks ?? 80;
      });
      const rawPercentage = stuTotalMax ? (stuTotalObtained / stuTotalMax) * 100 : 0;
      const roundedPercentage = Number(rawPercentage.toFixed(2));
      return { studentId: s.id, rawPercentage, displayPercentage: roundedPercentage };
    });

    allStudentPercentages.sort((a, b) => b.rawPercentage !== a.rawPercentage ? b.rawPercentage - a.rawPercentage : 0);

    // Function to create single report card (unchanged)
    const createReportCard = async (student) => {
      let studentSubjects = [], totalObtained = 0, totalMax = 0;

      // examTimetable.forEach((tt) => {
      //   const subject = subjectMap.get(tt.subjectIdFk);
      //   if (!subject) return;
      //   const enrollmentKey = `${student.id}-${tt.subjectIdFk}`;
      //   if (!studentSubjectMap.has(enrollmentKey)) return;

      //   const markEntry = marksMap.get(enrollmentKey);
      //   let obtainedMarks;
      //   if (markEntry) {
      //     obtainedMarks = markEntry.isAbsent === 1 ? "Absent" : (markEntry.marksScored != null ? markEntry.marksScored : 0);
      //   } else obtainedMarks = 0;

      //   const maxMarks = tt.maxMarks || 80;
      //   const highestMarks = highestMarksMap.get(tt.subjectIdFk) || 0;

      //   totalObtained += obtainedMarks === "Absent" ? 0 : Number(obtainedMarks || 0);
      //   totalMax += maxMarks;

      //   studentSubjects.push({ name: subject.name, date: formatDate(tt.examDate), obtained: obtainedMarks, total: maxMarks, highest: highestMarks });
      // });

      //new-decimal-validated
      examTimetable.forEach((tt) => {
        const subject = subjectMap.get(tt.subjectIdFk);
        if (!subject) return;

        const enrollmentKey = `${student.id}-${tt.subjectIdFk}`;
        if (!studentSubjectMap.has(enrollmentKey)) return;

        const markEntry = marksMap.get(enrollmentKey);

        // Normalize obtained marks
        const obtainedMarks =
          markEntry?.isAbsent === 1
            ? "Absent"
            : markEntry?.marksScored != null
              ? Number(markEntry.marksScored)   // 25.0 → 25, 12.5 → 12.5
              : 0;

        const maxMarks = tt.maxMarks ?? 80;
        const highestMarks = highestMarksMap.get(tt.subjectIdFk) ?? 0;

        // Totals should only work with numbers
        totalObtained += obtainedMarks === "Absent" ? 0 : obtainedMarks;
        totalMax += maxMarks;

        studentSubjects.push({
          name: subject.name,
          date: formatDate(tt.examDate),
          obtained: obtainedMarks,
          total: maxMarks,
          highest: highestMarks
        });
      });

      const percentage = totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;
      const gradeInfo = getGradeInfo(percentage);

      const rank = allStudentPercentages.findIndex(sp => sp.studentId === student.id) + 1;
      const studentEntry = allStudentPercentages.find(p => p.studentId === student.id);
      const percentageDisplay = studentEntry ? studentEntry.displayPercentage : 0;

      const remarks = gradeInfo ? await marksConditionRemarksTbl.findAll({ where: { marksConditionIdFk: gradeInfo.id }, order: [["srno", "ASC"]], limit: 4 }) : [];
      const displayGrade = gradeInfo?.name?.includes("Grade") ? gradeInfo.name.split(" ").reverse().join(" ") : gradeInfo?.name || "N/A";


      // Create the report card page
      const reportCardContent = [
        // Header with logo
        {
          columns: [
            { width: "*", text: "" },
            {
              width: 120,
              image: `data:image/jpeg;base64,${logoImage}`,
              fit: [160, 70],
              alignment: "center",
            },
            { width: "*", text: "" },
          ],
          margin: [0, 0, 0, 3],
        },

        // Title
        {
          text: "GURUKUL TEST SERIES",
          fontSize: 18,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 2],
          decoration: "underline"
        },

        // Year
        {
          text: yearRange,
          fontSize: 12,
          alignment: "center",
          bold: true,
          margin: [0, 0, 0, 2],
        },

        // Address
        {
          text: "Flat No. 101, Sopan Vihar, Near Venkatesh Bilva Society & Balaji Paradise, Vijaynagar Chowk, Dhayari Gaon, Pune - 411041.",
          fontSize: 8,
          alignment: "center",
          margin: [0, 0, 0, 6],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 350, // same width as content
              y2: 0,
              lineWidth: 1,
              lineColor: "#000000",

            },
          ],
          margin: [0, 3, 0, 10], // space before line
          alignment: "center",
        },
        // Student Info Table
        {
          table: {
            widths: ["79%", "21%"],     // << More space between details & photo
            body: [
              [
                // ============================
                //   LEFT SIDE – STUDENT DETAILS (WITH BORDER)
                // ============================
                {
                  table: {
                    widths: ["100%"],
                    body: [
                      [
                        {
                          stack: [
                            {
                              text: [
                                { text: "NAME: ", bold: true },
                                {
                                  text: `${student.firstName?.toUpperCase() || ""} ${student.motherName?.toUpperCase() || ""} ${student.fatherName?.toUpperCase() || ""} ${student.surname?.toUpperCase() || ""}`
                                }
                              ],
                              fontSize: 10,
                              margin: [5, 5, 5, 3],
                            },
                            {
                              text: [
                                { text: "STD & BOARD: ", bold: true },
                                {
                                  text: `${boardSubjectCondition.tbl_standards?.name || ""} ${boardSubjectCondition.tbl_boards?.name || ""} ${boardSubjectCondition.tbl_mediums?.name || ""}`
                                }
                              ],
                              fontSize: 10,
                              margin: [5, 5, 5, 3],
                            },
                            {
                              text: [
                                { text: "ROLL NO: ", bold: true },
                                { text: `${student.rollNo || ""}` }
                              ],
                              fontSize: 10,
                              margin: [5, 5, 5, 3],
                            }
                          ]
                        }
                      ]
                    ]
                  },
                  // BORDER ONLY FOR LEFT TABLE
                  layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => "#000",
                    vLineColor: () => "#000",
                  },
                },

                // ============================
                //   RIGHT SIDE – PHOTO (NO BORDER)
                // ============================
                {
                  alignment: "center",
                  margin: [10, 0, 0, 0],   // << EXTRA SPACE BETWEEN DETAILS & PHOTO

                  table: {
                    widths: [90],
                    heights: [110],
                    body: [
                      [
                        student.photoPath &&
                          fs.existsSync(
                            path.join(__dirname, "../public", student.photoPath)
                          )
                          ? {
                            image: `data:image/jpeg;base64,${fs
                              .readFileSync(
                                path.join(__dirname, "../public", student.photoPath)
                              )
                              .toString("base64")}`,

                            fit: [80, 100],   // << Keeps image inside box
                            alignment: "center",
                            margin: [0, 5, 0, 5],
                          }
                          : {
                            text: "Student\nPhoto",
                            alignment: "center",
                            color: "#999",
                            fontSize: 10,
                            margin: [2, 40, 0, 0],
                          }
                      ]
                    ]
                  },

                  layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => "#000",
                    vLineColor: () => "#000",
                    paddingLeft: () => 2,
                    paddingRight: () => 2,
                    paddingTop: () => 2,
                    paddingBottom: () => 2,
                  },
                }
              ]
            ]
          },

          margin: [0, 0, 0, 0],
          layout: "noBorders",
        },



        // Result Grade Box
        {
          table: {
            widths: [120],
            body: [
              [
                {
                  text: `RESULT: ${displayGrade}`,
                  bold: true,
                  fontSize: 11,
                  alignment: "left",
                  margin: [6, 4, 4, 4],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1.2,
            vLineWidth: () => 1.2,
            hLineColor: () => "#000000",
            vLineColor: () => "#000000",
          },
          alignment: "left",
          margin: [0, -52, 0, 0],
        },



        // Set Name Box
        {
          columns: [
            { width: '*', text: '' }, // left flexible spacer
            {
              width: 100,
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      text: `${examSessionsTblObj.tbl_sets?.name || "SET"}`,
                      bold: true,
                      fontSize: 11,
                      alignment: 'center',
                      margin: [4, 4, 4, 4],
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#000000',
                vLineColor: () => '#000000',
              },
            },
            { width: '*', text: '' } // right flexible spacer
          ],
          margin: [0, 20, 0, 2],
        },


        // Marks Table
        // --- Subjects Table ---
        {
          table: {
            widths: [30, "*", 70, 70, 50, 55],
            body: [
              // HEADER ROW (gray background)
              [
                {
                  text: "Sr. No.",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 15, 2, 3],
                  fillColor: "#f0f0f0", // light gray
                },
                {
                  text: "Subject",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 15, 2, 3],
                  fillColor: "#f0f0f0",
                },
                {
                  text: "Date",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 15, 2, 3],
                  fillColor: "#f0f0f0",
                },
                {
                  text: "Obtained Marks",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 15, 2, 3],
                  fillColor: "#f0f0f0",
                },
                {
                  text: "Total Marks",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 15, 2, 3],
                  fillColor: "#f0f0f0",
                },
                {
                  text: "Highest Marks",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 15, 2, 3],
                  fillColor: "#f0f0f0",
                },
              ],

              // DATA ROWS
              ...studentSubjects.map((subj, idx) => [
                {
                  text: (idx + 1).toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 10, 2, 3],
                  fillColor: "#f0f0f0"
                },
                {
                  text: subj.name,
                  fontSize: 9,
                  margin: [2, 10, 2, 3],
                },
                {
                  text: subj.date,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 10, 2, 3],
                },
                {
                  text: subj.obtained.toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 10, 2, 3],
                },
                {
                  text: subj.total.toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 10, 2, 3],
                },
                {
                  text: subj.highest.toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 10, 2, 3],
                },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#000000",
            vLineColor: () => "#000000",
          },
          margin: [0, 5, 0, 0],
        },

        // --- Percentage & Rank Table ---
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  text: `PERCENTAGE: ${percentageDisplay}%`,
                  bold: true,
                  fontSize: 10,
                  alignment: "center",
                  margin: [4, 8, 4, 8],
                  fillColor: "#f0f0f0", // gray background
                  height: 5
                },
              ],
              [
                {
                  text: `RANK: ${rank}`,
                  bold: true,
                  fontSize: 10,
                  alignment: "center",
                  margin: [4, 8, 4, 5],
                  fillColor: "#f0f0f0",
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#000000",
            vLineColor: () => "#000000",
          },
          margin: [0, 0, 0, 0],
        },


        {
          table: {
            widths: ['30%'],
            body: [
              [
                {
                  text: 'STUDENT REMARKS:',
                  bold: true,
                  fontSize: 10,
                  alignment: 'left',
                  margin: [5, 6, 5, 2],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000',
            vLineColor: () => '#000',
          },
          margin: [0, 8, 0, 0],
        },


        // Student Remarks as lines
        ...remarks.map((remark, idx) => ({
          text: `${idx + 1}) ${remark.remark || ""}`,
          fontSize: 10,
          margin: [0, 8, 0, 2],
        })),

        // Add empty remark lines if less than 4 remarks
        ...(remarks.length < 4
          ? Array(4 - remarks.length)
            .fill(null)
            .map((_, idx) => ({
              text: `${remarks.length + idx + 1})`,
              fontSize: 10,
              margin: [0, 8, 0, 2],
            }))
          : []),

        // Footer Message
        // {
        //   text: "ALL THE BEST",
        //   fontSize: 11,
        //   bold: true,
        //   alignment: "center",
        //   margin: [0, 10, 0, 3],
        // },
        // {
        //   text: "GURUKUL HO…!",
        //   fontSize: 11,
        //   bold: true,
        //   alignment: "center",
        //   margin: [0, 10, 0, 3],
        // },


      ];

      return reportCardContent;
    };

    // Generate report cards for all students
    for (let i = 0; i < students.length; i++) {
      if (i > 0) {
        docDefinition.content.push({ text: "", pageBreak: "before" });
      }
      const studentReportCard = await createReportCard(students[i]);
      docDefinition.content.push(...studentReportCard);
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-cards-${examSessionsTblId}-${Date.now()}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.log("Error generating report card:", err);
    handleSequelizeError(err, res, "publicController.generateReportCard");
  }
};

superAdminController.getAllStudentIdsForReportCard = async (req, res) => {
  try {
    const { conditionId, examSessionId } = req.query;

    if (!conditionId || !examSessionId)
      return res.status(400).json({ success: false, message: "Missing parameters." });

    const examSession = await examSessionsTbl.findOne({
      where: { id: examSessionId },
      attributes: ["setIdFk"],
    });

    if (!examSession)
      return res.status(404).json({ success: false, message: "Exam session not found." });

    const allStudents = await studentTbl.findAll({
      where: { boardSubjectConditionsId: conditionId, status: 1 },
      attributes: ["id"],
    });

    const allStudentIds = allStudents.map((s) => s.id);

    const validSets = await studentSetMapTbl.findAll({
      where: {
        studentIdFk: allStudentIds,
        setIdFk: examSession.setIdFk,
      },
      attributes: ["studentIdFk"],
    });

    const validIds = validSets.map((s) => s.studentIdFk);

    return res.status(200).json({ success: true, ids: validIds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// superAdminController.getAllStudentsData = async function (req, res) {
//   try {
//     const result = await studentTbl.findAll({
//       where: { status: 1 },
//       limit: 10
//     });

//     if (result.length === 0) {
//       return res.status(206).json({ message: "No active students found", studentData: [] });
//     };

//     const studentData = result.map((s) => ({
//       value: s.id,
//       label: s.rollNo,
//       conditionId: s.boardSubjectConditionsId
//     }));

//     return res.status(200).json({ studentData });

//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.getAllStudentsData")
//   }
// };

superAdminController.getAllStudentsData = async function (req, res) {
  try {
    const result = await studentTbl.findAll({
      where: { status: 1 },
      limit: 10
    });

    if (result.length === 0) {
      return res.status(206).json({ message: "No active students found", studentData: [] });
    };

    const studentData = result.map((s) => ({
      value: s.id,
      label: `${s.rollNo} - ${s.firstName} ${s.fatherName} ${s.surname}`,
      conditionId: s.boardSubjectConditionsId
    }));

    return res.status(200).json({ studentData });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAllStudentsData")
  }
};

superAdminController.getStudentForSelect = async function (req, res) {
  try {
    const { query } = req.query;
    const result = await studentTbl.findAll({
      where: {
        [Op.and]: [
          { status: 1 },
          {
            [Op.or]: [
              { rollNo: { [Op.like]: `%${query}%` } },
              { firstName: { [Op.like]: `%${query}%` } },
              { motherName: { [Op.like]: `%${query}%` } },
              { surname: { [Op.like]: `%${query}%` } },
              { fatherName: { [Op.like]: `%${query}%` } }
            ]
          }
        ]
      },
      limit: 10
    });

    if (result.length === 0) {
      return res.status(206).json({ message: "No matching students found", studentData: [] });
    }

    const studentData = result.map((s) => ({
      value: s.id,
      label: `${s.rollNo} - ${s.firstName} ${s.surname}`,
      conditionId: s.boardSubjectConditionsId
    }));

    return res.status(200).json({ studentData });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentForSelect")
  }
};

superAdminController.getExamSessionsForStudent = async function (req, res) {
  try {
    const { conditionId, studentId } = req.query;

    const studentSetTblObj = await studentSetMapTbl.findAll({
      where: {
        studentIdFk: { [Op.eq]: studentId }
      }
    });

    const setIds = studentSetTblObj.map((sst) => sst.setIdFk);

    const result = await examSessionsTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { setIdFk: { [Op.in]: setIds } },
          { status: 1 }
        ]
      },
      include: [
        {
          model: setsTbl,
          as: "tbl_sets",
          attributes: ["id", "name"]
        }
      ],
      order: [['dateFrom', 'DESC']]
    });

    if (result.length === 0) {
      return res.status(206).json({ message: "No exam sessions found", examSessions: [] });
    }

    const examSessions = result.map((es) => ({
      value: es.id,
      label: `${es.tbl_sets.name}`,
    }));

    return res.status(200).json({ examSessions });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getExamSessionsForStudent")
  }
};

superAdminController.getExamSessionForStudentForSelect = async function (req, res) {
  try {
    const { conditionId, setId, word } = req.query;

    const result = await examSessionsTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { setIdFk: setId },
          { status: 1 },
          {
            name: { [Op.like]: `%${word}%` }
          }
        ]
      },
      order: [['dateFrom', 'DESC']]
    });

    if (result.length === 0) {
      return res.status(206).json({ message: "No matching exam sessions found", examSessions: [] });
    }

    const examSessions = result.map((es) => ({
      value: es.id,
      label: `${es.name} (${es.dateFrom.toISOString().split('T')[0]} to ${es.dateTo.toISOString().split('T')[0]})`,
    }));

    return res.status(200).json({ examSessions });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getExamSessionForStudentForSelect")
  }
};

// superAdminController.getSubjectsForStudent = async function (req, res) {

//   try {
//     const { studentId } = req.query;

//     const studentSubjects = await studentSubjectsTbl.findAll({
//       where: {
//         studentIdFk: studentId,
//         isActive: 1
//       },
//       include: [
//         {
//           model: subjectsTbl,
//           as: "tbl_subjects",
//           attributes: ["id", "name", "code", "maxMarks"]
//         }
//       ]
//     });

//     if (studentSubjects.length === 0) {
//       return res.status(206).json({ message: "No subjects found for this student", subjects: [] });
//     }

//     const subjects = studentSubjects.map((ss) => ({
//       value: ss.tbl_subjects.id,
//       label: `${ss.tbl_subjects.name} (${ss.tbl_subjects.code})`,
//       maxMarks: ss.tbl_subjects.maxMarks
//     }));

//     return res.status(200).json({ subjects });

//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.getSubjectsForStudent")
//   }

// };

superAdminController.getSubjectsForStudent = async function (req, res) {

  try {
    const { studentId, examSessionId } = req.body;

    const examTimeTableTblObj = await examTimetableTbl.findAll({
      where: {
        examSessionIdFk: examSessionId
      }
    });
    const subjectIds = examTimeTableTblObj.map((s) => s.subjectIdFk);

    const studentSubjects = await studentSubjectsTbl.findAll({
      where: {
        studentIdFk: studentId,
        subjectIdFk: { [Op.in]: subjectIds },
        isActive: 1
      },
      include: [
        {
          model: subjectsTbl,
          as: "tbl_subjects",
          attributes: ["id", "name", "code", "maxMarks"]
        }
      ]
    });

    if (studentSubjects.length === 0) {
      return res.status(206).json({ message: "No subjects found for this student", subjects: [] });
    }

    const studentMarks = await studentMarksTbl.findAll({
      where: {
        studentIdFk: studentId,
        examSessionIdFk: examSessionId
      }
    })

    const subjects = studentSubjects.map((ss) => {
      const hasMarks = studentMarks.find(s => s.subjectIdFk === ss.tbl_subjects.id);

      return {
        value: ss.tbl_subjects.id,
        label: `${ss.tbl_subjects.name} (${ss.tbl_subjects.code})`,
        maxMarks: ss.tbl_subjects.maxMarks,
        marks: hasMarks
          ? hasMarks.isAbsent === 1
            ? "A"
            : hasMarks.marksScored != null
              ? Number(hasMarks.marksScored)   // 25.0 → 25, 12.5 → 12.5
              : ""
          : ""
      };
    });

    return res.status(200).json({ subjects });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getSubjectsForStudent")
  }
};

superAdminController.manuallyAddStudentMark = async function (req, res) {
  const t = await sequelize.transaction();
  try {
    const { studentId, examSessionId, subjectData, overwrite = true } = req.body;

    if (!studentId || !examSessionId || !subjectData || !Array.isArray(subjectData) || subjectData.length === 0) {
      return res.status(400).json({ message: "studentId, examSessionId, and subjectData are required" });
    }

    let inserted = 0;
    let updated = 0;
    const errors = [];

    for (const s of subjectData) {
      const { subjectId, marks, outOfMarks, isAbsent } = s;

      if (!subjectId) {
        errors.push({ subjectData: s, reason: "Missing subjectId" });
        continue;
      }

      if ((marks === undefined || marks === null || Number.isNaN(Number(marks))) && !isAbsent) {
        errors.push({ subjectId, reason: "Invalid marks" });
        continue;
      }

      const existing = await studentMarksTbl.findOne({
        where: {
          studentIdFk: studentId,
          subjectIdFk: subjectId,
          examSessionIdFk: examSessionId,
        },
        transaction: t,
      });

      if (existing) {
        if (overwrite) {
          await existing.update(
            {
              isAbsent: isAbsent ? 1 : 2,
              marksScored: isAbsent == 1 ? 0 : marks,
              outOf: outOfMarks,
              enteredByFk: req.uid,
              enteredAt: new Date(),
            },
            { transaction: t }
          );
          updated++;
        }
      } else {
        await studentMarksTbl.create(
          {
            studentIdFk: studentId,
            subjectIdFk: subjectId,
            isAbsent: isAbsent ? 1 : 2,
            marksScored: isAbsent ? 0 : marks,
            outOf: outOfMarks,
            enteredByFk: req.uid,
            enteredAt: new Date(),
            examSessionIdFk: examSessionId,
          },
          { transaction: t }
        );
        inserted++;
      }
    }

    await t.commit();

    return res.json({
      message: "Marks added successfully",
      summary: {
        inserted,
        updated,
        errors: errors.length ? errors.slice(0, 50) : [],
      },
    });
  } catch (err) {
    console.log("Error", err);
    await t.rollback();
    handleSequelizeError(err, res, "superAdminController.manuallyAddStudentMark");
  }
};




//---------------------------------- Reports ----------------------------------
// superAdminController.getStudentMarksReport = async function (req, res) {
//   try {
//     const { conditionId, setId, subjectIdData = [], student = [], currentPage = 1, perPage = 10, orderBy = 'id', orderDirection = 'DESC' } = req.body;

//     const page = parseInt(currentPage, 10);
//     const limit = parseInt(perPage, 10);
//     const offset = (page - 1) * limit;

//     const studentSetMapTblObj = await studentSetMapTbl.findAll({
//       where: {
//         setIdFk: setId
//       }
//     });

//     let studentIds = studentSetMapTblObj.map((ssm) => ssm.studentIdFk);
//     if (student.length > 0) {
//       studentIds = student;
//     }

//     const result = await studentTbl.findAll({
//       where: {
//         [Op.and]: [
//           { boardSubjectConditionsId: conditionId },
//           { id: { [Op.in]: studentIds } },
//           { status: { [Op.ne]: 3 } }
//         ],
//       },
//       order: [["rollNo", "ASC"]],
//       limit,
//       offset
//     });

//     const subjectWhereConditions = {};
//     if (subjectIdData.length > 0) {
//       const subjectIds = subjectIdData;
//       subjectWhereConditions.id = { [Op.in]: subjectIds };
//     } else {
//       subjectWhereConditions.boardSubjectConditionsId = conditionId;
//     }
//     const subjectsData = await subjectsTbl.findAll({
//       where: subjectWhereConditions
//     });
//     const subjectMap = subjectsData.map((item) => ({ label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`, value: item.id, maxMarks: item?.maxMarks }));

//     if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0, subjectMap });

//     const tableData = await Promise.all(result.map(async (obj, index) => {

//       const studentMarks = await studentMarksTbl.findAll({
//         where: {
//           studentIdFk: obj.id
//         },
//         include: [
//           {
//             model: subjectsTbl,
//             as: 'tbl_subjects'
//           }
//         ]
//       });

//       const studentSubjectMap = await studentSubjectsTbl.findAll({
//         where: {
//           studentIdFk: obj.id
//         }
//       });

//       const subjectValues = {};
//       let totalMarks = 0;
//       let totalMaxMarks = 0;
//       subjectMap.forEach((sub) => {
//         const hasSubject = studentSubjectMap.find((s) => s.subjectIdFk === sub.value);
//         const hasMarks = studentMarks.find((sm) => sm.subjectIdFk === sub.value);

//         let displayValue = "NA";

//         if (hasSubject && hasMarks) {
//           // ✅ Student appeared and has marks
//           displayValue = hasMarks.marksScored;
//           totalMarks += Number(hasMarks.marksScored || 0);
//           totalMaxMarks += Number(hasMarks.outOf || 0);
//         } else if (hasSubject && !hasMarks) {
//           displayValue = "ABSENT";
//           totalMaxMarks += Number(sub?.maxMarks)
//         } else if (!hasSubject) {
//           displayValue = "NA";
//         }

//         subjectValues[`${sub.label}`] = displayValue;
//       });

//       const totalPercentage =
//         totalMaxMarks > 0
//           ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
//           : "NA";

//       return {
//         rollNo: obj?.rollNo,
//         fullName: `${obj?.firstName} ${obj?.fatherName} ${obj?.surname}`,
//         ...subjectValues,
//         totalPercentage
//       };

//     }))

//     const tableRecords = await studentTbl.count({
//       where: {
//         [Op.and]: [
//           { boardSubjectConditionsId: conditionId },
//           { id: { [Op.in]: studentIds } },
//           { status: { [Op.ne]: 3 } }
//         ]
//       }
//     });

//     return res.status(200).json({ tableData, tableRecords, subjectMap })

//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.getStudentMarksReport")
//   }
// }

// superAdminController.getStudentMarksReport = async function (req, res) {
//   try {
//     const { conditionId, setId, examSessionId, subjectIdData = [], student = [], currentPage = 1, perPage = 10, orderBy = 'id', orderDirection = 'DESC' } = req.body;

//     const page = parseInt(currentPage, 10);
//     const limit = parseInt(perPage, 10);
//     const offset = (page - 1) * limit;

//     const studentSetMapTblObj = await studentSetMapTbl.findAll({
//       where: {
//         setIdFk: setId
//       }
//     });

//     let studentIds = studentSetMapTblObj.map((ssm) => ssm.studentIdFk);
//     if (student.length > 0) {
//       studentIds = student;
//     }

//     const result = await studentTbl.findAll({
//       where: {
//         [Op.and]: [
//           { boardSubjectConditionsId: conditionId },
//           { id: { [Op.in]: studentIds } },
//           { status: { [Op.ne]: 3 } }
//         ],
//       },
//       order: [["rollNo", "ASC"]],
//       limit,
//       offset
//     });

//     const examTimeTableTblObj = await examTimetableTbl.findAll({ where: { examSessionIdFk: examSessionId } });
//     const subjectIdsByExam = examTimeTableTblObj.map((ex) => ex.subjectIdFk);

//     const subjectWhereConditions = { id: { [Op.in]: subjectIdsByExam } };
//     if (subjectIdData.length > 0) {
//       const subjectIds = subjectIdData;
//       subjectWhereConditions.id = { [Op.in]: subjectIds };
//     } else {
//       subjectWhereConditions.boardSubjectConditionsId = conditionId;
//     }
//     const subjectsData = await subjectsTbl.findAll({
//       where: subjectWhereConditions
//     });
//     const examSubjectData = await subjectsTbl.findAll({
//       where:{id: { [Op.in]: subjectIdsByExam }}
//     })
//     let formattedSubjectData = subjectsData.filter((i) => subjectIdsByExam.includes(i.id))
//     const subjectMap = subjectsData.map((item) => ({ label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`, value: item.id, maxMarks: item?.maxMarks }));
//     const examSubjectMap = examSubjectData.map((item) => ({ label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`, value: item.id, maxMarks: item?.maxMarks }))

//     if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0, subjectMap });

//     const tableData = await Promise.all(result.map(async (obj, index) => {

//       const studentMarks = await studentMarksTbl.findAll({
//         where: {
//           studentIdFk: obj.id,
//           examSessionIdFk: examSessionId
//         },
//         include: [
//           {
//             model: subjectsTbl,
//             as: 'tbl_subjects'
//           }
//         ]
//       });

//       const studentSubjectMap = await studentSubjectsTbl.findAll({
//         where: {
//           studentIdFk: obj.id
//         }
//       });

//       const subjectValues = {};
//       let totalMarks = 0;
//       let totalMaxMarks = 0;
//       subjectMap.forEach((sub) => {
//         const hasSubject = studentSubjectMap.find((s) => s.subjectIdFk === sub.value);
//         const hasMarks = studentMarks.find((sm) => sm.subjectIdFk === sub.value);

//         let displayValue = "NA";

//         if (hasSubject && hasMarks?.isAbsent == 2) {
//           displayValue = hasMarks.marksScored;
//           totalMarks += Number(hasMarks.marksScored || 0);
//           totalMaxMarks += Number(hasMarks.outOf || 0);
//         } else if (hasSubject && hasMarks?.isAbsent == 1) {
//           displayValue = "ABSENT";
//           totalMaxMarks += Number(sub?.maxMarks)
//         } else if (!hasSubject) {
//           displayValue = "NA";
//         }

//         subjectValues[`${sub.label}`] = displayValue;
//       });

//       const totalPercentage =
//         totalMaxMarks > 0
//           ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
//           : "NA";

//       return {
//         rollNo: obj?.rollNo,
//         fullName: `${obj?.firstName} ${obj?.fatherName} ${obj?.surname}`,
//         ...subjectValues,
//         totalPercentage
//       };

//     }))

//     const tableRecords = await studentTbl.count({
//       where: {
//         [Op.and]: [
//           { boardSubjectConditionsId: conditionId },
//           { id: { [Op.in]: studentIds } },
//           { status: { [Op.ne]: 3 } }
//         ]
//       }
//     });

//     return res.status(200).json({ tableData, tableRecords, subjectMap })

//   } catch (err) {
//     console.log("Error", err);
//     handleSequelizeError(err, res, "superAdminController.getStudentMarksReport")
//   }
// }

superAdminController.getStudentMarksReport = async function (req, res) {
  try {
    const {
      conditionId,
      setId,
      examSessionId,
      subjectIdData = [],
      student = [],
      currentPage = 1,
      perPage = 10
    } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    // ---------------------------------------------------------
    // 1. Get students mapped to the set
    // ---------------------------------------------------------
    const studentSetMapTblObj = await studentSetMapTbl.findAll({
      where: { setIdFk: setId }
    });

    let studentIds = studentSetMapTblObj.map((ssm) => ssm.studentIdFk);
    if (student.length > 0) studentIds = student;

    // ---------------------------------------------------------
    // 2. Fetch student list
    // ---------------------------------------------------------
    const result = await studentTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } }
        ]
      },
      order: [["rollNo", "ASC"]],
      limit,
      offset
    });

    // ---------------------------------------------------------
    // 3. Get exam subjects (full list)
    // ---------------------------------------------------------
    const examTimeTableTblObj = await examTimetableTbl.findAll({
      where: { examSessionIdFk: examSessionId }
    });

    const subjectIdsByExam = examTimeTableTblObj.map((ex) => ex.subjectIdFk);

    // Filtering for UI requested subjects (controls only display)
    const subjectWhereConditions =
      subjectIdData.length > 0
        ? { id: { [Op.in]: subjectIdData } }
        : { id: { [Op.in]: subjectIdsByExam }, boardSubjectConditionsId: conditionId };

    // These subjects control visible columns
    const subjectsData = await subjectsTbl.findAll({ where: subjectWhereConditions });

    // These subjects control percentage (full list)
    const examSubjectData = await subjectsTbl.findAll({
      where: { id: { [Op.in]: subjectIdsByExam } }
    });

    const subjectMap = subjectsData.map((item) => ({
      label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`,
      value: item.id,
      maxMarks: item.maxMarks
    }));

    const examSubjectMap = examSubjectData.map((item) => ({
      label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`,
      value: item.id,
      maxMarks: item.maxMarks
    }));

    if (result.length === 0)
      return res.status(206).json({ tableData: [], tableRecords: 0, subjectMap });

    // ---------------------------------------------------------
    // 4. Build table rows for each student
    // ---------------------------------------------------------
    const tableData = await Promise.all(
      result.map(async (obj) => {
        const studentMarks = await studentMarksTbl.findAll({
          where: {
            studentIdFk: obj.id,
            examSessionIdFk: examSessionId
          },
          include: [{ model: subjectsTbl, as: "tbl_subjects" }]
        });

        const studentSubjectMap = await studentSubjectsTbl.findAll({
          where: { studentIdFk: obj.id }
        });

        const studentSubjectIds = studentSubjectMap.map((s) => s.subjectIdFk);

        let subjectValues = {};
        let totalMarks = 0;
        let totalMaxMarks = 0;

        // ---------------------------------------------------------
        // A. Total max marks MUST always come from examSubjectMap
        // ---------------------------------------------------------
        examSubjectMap.forEach((sub) => {
          if (studentSubjectIds.includes(sub.value)) {
            totalMaxMarks += Number(sub.maxMarks || 0);
          }
        });

        // ---------------------------------------------------------
        // B. Total marks scored MUST also come from examSubjectMap
        // ---------------------------------------------------------
        examSubjectMap.forEach((sub) => {
          const hasMarks = studentMarks.find((m) => m.subjectIdFk === sub.value);
          const hasSubject = studentSubjectIds.includes(sub.value);

          if (hasSubject && hasMarks?.isAbsent == 2) {
            totalMarks += Number(hasMarks.marksScored || 0);
          }
        });

        // ---------------------------------------------------------
        // C. Fill display columns ONLY from subjectMap (filtered)
        // ---------------------------------------------------------
        // subjectMap.forEach((sub) => {
        //   const hasSubject = studentSubjectIds.includes(sub.value);
        //   const hasMarks = studentMarks.find((m) => m.subjectIdFk === sub.value);

        //   let displayValue = "NA";

        //   if (hasSubject && hasMarks?.isAbsent == 2) {
        //     displayValue = hasMarks.marksScored;
        //   } else if (hasSubject && hasMarks?.isAbsent == 1) {
        //     displayValue = "ABSENT";
        //   } else if (hasSubject && !hasMarks) {
        //     displayValue = '--';
        //   }

        //   subjectValues[sub.label] = displayValue;
        // });

        //new-decimal-validated--------
        subjectMap.forEach((sub) => {
          const hasSubject = studentSubjectIds.includes(sub.value);
          const hasMarks = studentMarks.find(
            (m) => m.subjectIdFk === sub.value
          );

          let displayValue = "NA";

          if (hasSubject && hasMarks?.isAbsent === 2) {
            // Normalize marks: 25.0 → 25, 12.5 → 12.5
            displayValue =
              hasMarks.marksScored != null
                ? Number(hasMarks.marksScored)
                : "--";
          }
          else if (hasSubject && hasMarks?.isAbsent === 1) {
            displayValue = "ABSENT";
          }
          else if (hasSubject && !hasMarks) {
            displayValue = "--";
          }

          subjectValues[sub.label] = displayValue;
        });


        // ---------------------------------------------------------
        // D. Final percentage
        // ---------------------------------------------------------
        const totalPercentage =
          totalMaxMarks > 0
            ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
            : "--";

        return {
          rollNo: obj.rollNo,
          fullName: `${obj.firstName} ${obj.fatherName} ${obj.surname}`,
          ...subjectValues,
          totalPercentage
        };
      })
    );

    // ---------------------------------------------------------
    // 5. Count for pagination
    // ---------------------------------------------------------
    const tableRecords = await studentTbl.count({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } }
        ]
      }
    });

    return res.status(200).json({ tableData, tableRecords, subjectMap });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentMarksReport");
  }
};



superAdminController.getStudentOverallPerformance = async function (req, res) {
  try {
    const {
      conditionId,
      setId,
      subjectIdData = [],
      currentPage = 1,
      perPage = 10,
      orderBy = "id",
      orderDirection = "DESC",
    } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const studentSetMapTblObj = await studentSetMapTbl.findAll({
      where: {
        setIdFk: setId,
      },
    });

    const studentIds = studentSetMapTblObj.map((ssm) => ssm.studentIdFk);

    const result = await studentTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } }
        ],
      },
      order: [[orderBy, orderDirection]],
    });

    const subjectsData = await subjectsTbl.findAll({
      where: {
        boardSubjectConditionsId: conditionId,
      },
    });

    const subjectMap = subjectsData.map((item, i) => ({
      label: `${item.name.replace(" ", "_")}_(${item.code.replace("-", "_")})`,
      value: item.id,
      labelTbl: `Subject_${i + 1}`,
    }));

    if (result.length === 0)
      return res
        .status(206)
        .json({ tableData: [], tableRecords: 0, subjectMap });

    const tableData = await Promise.all(
      result.map(async (obj) => {
        const studentMarks = await studentMarksTbl.findAll({
          where: {
            studentIdFk: obj.id,
          },
          include: [
            {
              model: subjectsTbl,
              as: "tbl_subjects",
            },
          ],
        });

        const subjectValues = {};
        let totalMarks = 0;
        let totalMaxMarks = 0;

        subjectMap.forEach((sub) => {
          const subjectRecord = studentMarks.find(
            (sm) => sm.subjectIdFk === sub.value
          );

          if (subjectRecord) {
            subjectValues[sub.label] = subjectRecord.marksScored;
            totalMarks += Number(subjectRecord.marksScored || 0);
            totalMaxMarks += Number(subjectRecord.outOf || 0);
          } else {
            subjectValues[sub.label] = "NA";
          }
        });

        const totalPercentage =
          totalMaxMarks > 0
            ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
            : "NA";

        return {
          rollNo: obj?.rollNo,
          fullName: `${obj?.firstName} ${obj?.fatherName} ${obj?.surname}`,
          ...subjectValues,
          totalPercentage: totalPercentage === "NA" ? 0 : parseFloat(totalPercentage),
        };
      })
    );

    // ✅ Sort by highest percentage
    const sortedData = tableData.sort(
      (a, b) => b.totalPercentage - a.totalPercentage
    );

    // Apply pagination AFTER sorting
    const paginatedData = sortedData.slice(offset, offset + limit);

    const tableRecords = await studentTbl.count({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: conditionId },
          { id: { [Op.in]: studentIds } },
          { status: { [Op.ne]: 3 } }
        ],
      },
    });

    return res
      .status(200)
      .json({ tableData: paginatedData, tableRecords, subjectMap });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentOverallPerformance");
  }
};

superAdminController.getStudentDataForReports = async function (req, res) {
  try {
    const { conditionId, setId } = req.query;

    const studentSetMapTblObj = await studentSetMapTbl.findAll({
      where: { setIdFk: setId },
    });
    const studentIds = studentSetMapTblObj.map((s) => s.studentIdFk);

    console.log("studentIds", studentIds)

    const result = await studentTbl.findAll({
      where: {
        boardSubjectConditionsId: conditionId,
        id: { [Op.in]: studentIds },
        status: { [Op.ne]: 3 }
      },
      limit: 20
    });

    const studentData = result.map((item) => ({
      label: `${item.rollNo} - ${item.firstName} ${item.fatherName} ${item.surname}`,
      value: item.id
    }));

    return res.status(200).json({ studentData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentDataForReports")
  }
}

superAdminController.getStudentDataReportsForSelect = async function (req, res) {
  try {
    const { conditionId, setId, word } = req.query;

    const studentSetMapTblObj = await studentSetMapTbl.findAll({
      where: { setIdFk: setId },
    });
    const studentIds = studentSetMapTblObj.map((s) => s.studentIdFk);

    const result = await studentTbl.findAll({
      where: {
        boardSubjectConditionsId: conditionId,
        id: { [Op.in]: studentIds },
        status: { [Op.ne]: 3 },
        [Op.or]: [
          { firstName: { [Op.like]: `%${word}%` } },
          { fatherName: { [Op.like]: `%${word}%` } },
          { motherName: { [Op.like]: `%${word}%` } },
          { surname: { [Op.like]: `%${word}%` } },
          { rollNo: { [Op.like]: `%${word}%` } },
        ]
      },
      limit: 20
    });

    const studentData = result.map((item) => ({
      label: `${item.rollNo} - ${item.firstName} ${item.fatherName} ${item.surname}`,
      value: item.id
    }));

    return res.status(200).json({ studentData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getStudentDataReportsForSelect")
  }
};

superAdminController.deleteStudent = async function (req, res) {
  try {
    const { id } = req.query;

    await studentTbl.update({
      status: 3
    }, { where: { id } });

    return res.status(201).json({ message: "Student delete successfully" })
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.deleteStudent")
  }
}


//--------------------------- Employee Api---------------------
superAdminController.getTableEmployee = async function (req, res) {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'DESC', searchValue = '' } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const result = await userTbl.findAll({
      where: {
        status: { [Op.ne]: 3 },
        userRole: { [Op.ne]: 5 },
        [Op.or]: [
          { name: { [Op.like]: `%${searchValue}%` } },
          { email: { [Op.like]: `%${searchValue}%` } },
          { mobile: { [Op.like]: `%${searchValue}%` } }
        ]
      },
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0 });

    const tableData = await Promise.all(result.map((obj, index) => {

      return {
        id: obj.get("id"),
        name: obj.get("name"),
        email: obj.get("email"),
        mobile: obj.get("mobile"),
        userRole: obj.get("userRole"),
        lastLogin: obj.get("lastLogin"),
        status: obj.get("status"),
        createdAt: obj.get("createdAt")
      }

    }));

    const tableRecords = await userTbl.count({
      where: {
        status: { [Op.ne]: 3 },
        userRole: { [Op.ne]: 5 },
        [Op.or]: [
          { name: { [Op.like]: `%${searchValue}%` } },
          { email: { [Op.like]: `%${searchValue}%` } },
          { mobile: { [Op.like]: `%${searchValue}%` } }
        ]
      }
    });

    return res.status(200).json({ tableData, tableRecords })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, 'superAdminController.getTableEmployee')
  }
};

superAdminController.createEmployee = async function (req, res) {
  try {
    const { name, email, mobile, password, userRole } = req.body;

    const existinMobile = await userTbl.findOne({
      where: {
        mobile: mobile,
        status: { [Op.ne]: 3 }
      }
    });

    if (existinMobile) {
      return res.status(400).json({ message: "Mobile number already exists" })
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userTbl.create({
      name, email, mobile, password: hashedPassword, userRole
    });

    return res.status(201).json({ message: "New employee created successfully" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.createdEmployee")
  }
};

superAdminController.updateEmployee = async function (req, res) {
  try {
    const { id, name, mobile, email, userRole } = req.body;

    const existinMobile = await userTbl.findOne({
      where: {
        mobile: mobile,
        id: { [Op.ne]: id },
        status: { [Op.ne]: 3 }
      }
    });

    if (existinMobile) {
      return res.status(400).json({ message: "Mobile number already exists" })
    }

    await userTbl.update({
      name,
      email,
      mobile,
      userRole
    }, { where: { id } });

    return res.status(201).json({ message: "Employee details updated" });

  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "superAdminController.updateEmployee")
  }
};

superAdminController.updateEmployeePassword = async function (req, res) {
  try {
    const { id, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userTbl.update({
      password: hashedPassword
    }, { where: { id } });

    return res.status(201).json({ message: "Employee password updated" });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.updateEmployeePassword")
  }
};

superAdminController.changeEmployeeStatus = async function (req, res) {
  try {
    const { id, statusValue } = req.body;

    await userTbl.update({
      status: statusValue
    }, { where: { id } });

    return res.status(201).json({ message: "employee status changed" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.changeEmployeeStatus")
  }
};

superAdminController.deleteEmployee = async function (req, res) {
  try {
    const { id } = req.query;

    await userTbl.update({
      status: 3
    }, { where: { id } });

    return res.status(201).json({ message: 'employee deleted' })
  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "superAdminController.deleteEmployee")
  }
};

superAdminController.getAllSubjectsForCondition = async function (req, res) {
  try {
    const { conditionId = [] } = req.body;

    const result = await subjectsTbl.findAll({
      where: {
        boardSubjectConditionsId: { [Op.in]: conditionId }
      },
      limit: 20
    });

    if (result.length === 0) return res.status(206).json({ subjectData: [] });

    const subjectData = result.map((item) => {
      const formattedLabel = item.code.toString()?.replace("-", '_')
      return {
        label: `${formattedLabel} ${item.name}`,
        value: item.id
      }
    });

    return res.status(200).json({ subjectData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.getAllSubjectsForCondition")
  }
};

superAdminController.getSubjectForConditionBySearch = async function (req, res) {
  try {
    const { word, conditionId = [] } = req.body;

    const result = await subjectsTbl.findAll({
      where: {
        [Op.and]: [
          { boardSubjectConditionsId: { [Op.in]: conditionId } },
          {
            [Op.or]: [
              { name: { [Op.like]: `%${word}%` } },
              { code: { [Op.like]: `%${word}%` } }
            ]
          }
        ]
      },
      limit: 20
    });

    if (result.length === 0) return res.status(206).json({ subjectData: [] });

    const subjectData = result.map((item) => {
      const formattedLabel = item.code.toString()?.replace("-", '_')
      return {
        label: `${formattedLabel} ${item.name}`,
        value: item.id
      }
    });

    return res.status(200).json({ subjectData })

  } catch (err) {
    handleSequelizeError(err, res, "superAdminController.getSubjectForConditionBySearch")
  }
}


superAdminController.updateMyPassword = async function (req, res) {
  try {
    const { password, newPassword } = req.body
    const salt = await generateBcryptSalt()
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await userTbl.isCorrectPassword(req.uid, password, (err, same) => {
      if (err) {
        res.status(500).json({ error: 'Existing password is incorrect.' })
      } else {
        if (same) {
          try {
            userTbl.update(
              {
                password: hashedPassword,
              },
              {
                where: {
                  id: req.uid
                }
              }
            )
            res.status(200).json({ message: 'Password updated successfully.' })
          } catch (err) {
            handleSequelizeError(err, res, 'superAdminController.updateMyPassword')
          }
        } else {
          res.status(500).json({ error: 'Existing password is incorrect.' })
        }
      }
    })
  } catch (err) {
    handleSequelizeError(err, res, 'superAdminController.updateMyPassword')
  }
}

superAdminController.updateParentPassword = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters long" });
    }

    const student = await studentTbl.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const parentMobile = student.fatherMobile || student.motherMobile || student.studentMobile;
    if (!parentMobile) {
      return res.status(400).json({ message: "No parent mobile number associated with this student." });
    }

    const user = await userTbl.findOne({ where: { mobile: parentMobile, userRole: 5 } });
    if (!user) {
      return res.status(404).json({ message: "Parent user account does not exist. Please ensure admission is confirmed or mobile number is set." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    return res.status(200).json({ message: "Parent password updated successfully." });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "superAdminController.updateParentPassword");
  }
};

superAdminController.getDailyAttendance = async function (req, res) {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'punchDatetime', orderDirection = 'DESC', searchValue = '', filterDate } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (searchValue) {
      whereClause[Op.or] = [
        { employeeId: { [Op.like]: `%${searchValue}%` } },
        { deviceSN: { [Op.like]: `%${searchValue}%` } },
        { '$tbl_student.first_name$': { [Op.like]: `%${searchValue}%` } },
        { '$tbl_student.father_name$': { [Op.like]: `%${searchValue}%` } },
        { '$tbl_student.surname$': { [Op.like]: `%${searchValue}%` } }
      ];
    }
    
    if (filterDate) {
      whereClause.punchDatetime = {
        [Op.gte]: new Date(`${filterDate}T00:00:00`),
        [Op.lte]: new Date(`${filterDate}T23:59:59`)
      };
    }

    const result = await deviceAttendanceLogsTbl.findAll({
      where: whereClause,
      include: [
        {
          model: studentTbl,
          as: 'tbl_student',
          attributes: ['id', 'firstName', 'fatherName', 'surname'],
          include: [
            { model: standardsTbl, as: 'tbl_standards', attributes: ['name'] },
            { model: boardsTbl, as: 'tbl_boards', attributes: ['name'] },
            { model: mediumsTbl, as: 'tbl_mediums', attributes: ['name'] }
          ]
        }
      ],
      order: [['punchDatetime', 'ASC']],
    });

    if (result.length === 0) return res.status(206).json({ tableData: [], tableRecords: 0 });

    const groupedData = {};
    for (const obj of result) {
      if (!groupedData[obj.employeeId]) {
        groupedData[obj.employeeId] = {
          id: obj.id,
          employeeId: obj.employeeId,
          studentName: obj.tbl_student ? `${obj.tbl_student.firstName} ${obj.tbl_student.fatherName} ${obj.tbl_student.surname}` : '--',
          studentClass: obj.tbl_student ? `${obj.tbl_student.tbl_standards?.name || ''} ${obj.tbl_student.tbl_boards?.name || ''} ${obj.tbl_student.tbl_mediums?.name || ''}`.trim() : '--',
          punches: []
        };
      }
      groupedData[obj.employeeId].punches.push(obj.punchDatetime);
    }

    const processedData = Object.values(groupedData).map((group) => {
      const punchIn = group.punches[0];
      let punchOut = null;
      for (let i = 1; i < group.punches.length; i++) {
        const diffMins = (new Date(group.punches[i]) - new Date(punchIn)) / 60000;
        if (diffMins >= 10) {
          punchOut = group.punches[i];
          break; // First punch after 10 mins
        }
      }
      return {
        id: group.id,
        employeeId: group.employeeId,
        studentName: group.studentName,
        studentClass: group.studentClass,
        punchIn: punchIn,
        punchOut: punchOut,
        status: punchOut ? 'Present' : 'Missed Out-Punch'
      };
    });

    if (orderBy) {
      processedData.sort((a, b) => {
        let valA = a[orderBy] || '';
        let valB = b[orderBy] || '';
        
        // Map punchDatetime to punchIn for sorting
        if (orderBy === 'punchDatetime' || orderBy === 'punchIn') {
           valA = a.punchIn ? new Date(a.punchIn).getTime() : 0;
           valB = b.punchIn ? new Date(b.punchIn).getTime() : 0;
        }

        if (valA < valB) return orderDirection === 'ASC' ? -1 : 1;
        if (valA > valB) return orderDirection === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    const tableRecords = processedData.length;
    const tableData = processedData.slice(offset, offset + limit);

    return res.status(200).json({ tableData, tableRecords })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, 'superAdminController.getDailyAttendance')
  }
};

module.exports = superAdminController;


//--modified