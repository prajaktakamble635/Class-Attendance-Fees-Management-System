const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {
  userTbl,
  websiteConfigTbl,
  boardSubjectConditionsTbl,
  boardsTbl,
  standardsTbl,
  mediumsTbl,
  subjectsTbl,
  examSessionsTbl,
  studentTbl,
  studentSubjectsTbl,
  studentSetMapTbl,
  setsTbl,
  examTimetableTbl,
  studentMarksTbl,
  marksConditionTbl,
  marksConditionRemarksTbl,
} = require("../sequelize");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const wlogger = require("../logger");
const { handleSequelizeError } = require("../sequelizeErrorHandler");
const {
  SECRET_KEY_ADMIN,
  NODE_ENV,
  COOKIE_DOMAIN_API,
  SECRET_KEY_USER,
  PUBLIC_DOCUMENT_PATH,
} = require("../config");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { encrypt, decrypt } = require("../lib/cryptoUtils.js");
const PdfPrinter = require("pdfmake");
const fs = require("fs");

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
  const saltRounds = 10; // Number of rounds for salt generation
  const salt = await bcrypt.genSalt(saltRounds);
  return salt;
};

const publicController = {};

publicController.downloadDocument = async function (req, res) {
  try {
    const options = {
      root: path.join(__dirname, "../public"),
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true,
      },
    };
    const fileName = req.query.name;
    res.sendFile(fileName, options, function (err) {
      if (err)
        handleSequelizeError(err, res, "publicController.downloadDocument");
    });
  } catch (err) {
    handleSequelizeError(err, res, "publicController.downloadDocument");
  }
};

publicController.uploadDocument = async function (req, res) {
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

publicController.verifyUsername = async function (req, res) {
  const { mobile } = req.body;
  try {
    const userTblObj = await userTbl.findOne({
      where: {
        mobile: mobile,
        status: 1,
      },
    });
    if (userTblObj) {
      return res.json({
        code: 200,
        message: "Username is valid, please enter password.",
        id: userTblObj?.id,
      });
    } else {
      return res.status(400).json({ message: "Invalid Username" });
    }
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.verifyUsername");
  }
};

publicController.verifyPassword = async function (req, res) {
  const { mobile, password } = req.body;
  try {
    const userTblObj = await userTbl.findOne({
      where: {
        mobile: mobile,
        status: 1,
      },
    });
    if (userTblObj) {
      await userTbl.isCorrectPassword(
        userTblObj?.id,
        password,
        async (err, same) => {
          if (err) {
            return res.status(500).json({ error: "Incorrect Password" });
          } else {
            if (same) {
              if (
                userTblObj.isTwoFactorEnabled == 1 &&
                userTblObj.isAuthenticated == 1
              ) {
                return res.status(200).json({
                  success: true,
                  message:
                    "2-Factor Authentication is enabled. Please verify authentication code to proceed.",
                  mobile: userTblObj?.mobile,
                  isTwoFactorEnabled: 1,
                  id: userTblObj.id,
                  userRole: userTblObj?.userRole,
                  isAuthenticated: userTblObj?.isAuthenticated,
                });
              }
              const payload = {
                uid: userTblObj.id,
                uType: 1,
                userRole: userTblObj?.userRole,
              };
              const date = new Date();
              await userTbl.update(
                {
                  lastLogin: date,
                },
                { where: { id: userTblObj?.id } }
              );
              if (NODE_ENV === "development") {
                const token = jwt.sign(payload, SECRET_KEY_ADMIN, {
                  expiresIn: "8760h",
                });
                const cookieOptions = {
                  maxAge: 31536000000,
                  httpOnly: true,
                };
                return res
                  .cookie("user_auth_token", token, cookieOptions)
                  .status(200)
                  .json({
                    success: true,
                    message: "Login successful",
                    mobile: userTblObj?.mobile,
                    userRole: userTblObj?.userRole,
                    isTwoFactorEnabled: userTblObj?.isTwoFactorEnabled,
                    isAuthenticated: userTblObj?.isAuthenticated,
                  });
              } else {
                const token = jwt.sign(payload, SECRET_KEY_ADMIN, {
                  expiresIn: "12h",
                });
                const cookieOptions = {
                  maxAge: 43200000,
                  httpOnly: true,
                  domain: COOKIE_DOMAIN_API,
                  sameSite: "none",
                  secure: true,
                  path: "/",
                };
                return res
                  .cookie("user_auth_token", token, cookieOptions)
                  .status(200)
                  .json({
                    success: true,
                    message: "Login successful",
                    userRole: userTblObj?.userRole,
                    isTwoFactorEnabled: userTblObj?.isTwoFactorEnabled,
                    isAuthenticated: userTblObj?.isAuthenticated,
                    mobile: userTblObj?.mobile,
                  });
              }
            } else {
              return res.status(500).json({ error: "Incorrect Password." });
            }
          }
        }
      );
    } else {
      return res.status(400).json({ message: "Invalid User" });
    }
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.verifyPassword");
  }
};

publicController.logoutAdmin = async function (req, res) {
  const cookieOptions = {
    maxAge: 1000, // 60 seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
    domain:
      process.env.NODE_ENV === "production" ? COOKIE_DOMAIN_API : undefined,
  };
  res.cookie("user_auth_token", "thoy", cookieOptions).sendStatus(200);
};

publicController.generate2FA = async function (req, res) {
  try {
    const { mobile } = req.body;
    if (mobile === "") {
      return res.status(400).json({ message: "Please enter valid username" });
    }
    const userTblObj = await userTbl.findOne({ where: { mobile, status: 1 } });
    if (!userTblObj) {
      return res.status(400).json({ message: "Invalid User" });
    }
    const secret = speakeasy.generateSecret({
      name: `GURUKUL Academy (${mobile})`,
      length: 20,
    });

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    const encryptedSecret = encrypt(secret.base32);

    await userTbl.update(
      { twoFaSecret: encryptedSecret },
      { where: { id: userTblObj?.id } }
    );

    return res.status(200).json({
      qr: qrDataUrl,
      secret: secret.base32,
      message: "Scan the QR code with your authenticator app.",
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.generate2FA");
  }
};

publicController.verify2FA = async function (req, res) {
  try {
    const { mobile, token } = req.body;
    const userTblObj = await userTbl.findOne({ where: { mobile } });
    if (!userTblObj) {
      return res
        .status(400)
        .json({ message: "User not found with entered username" });
    }
    if (!userTblObj.twoFaSecret) {
      return res
        .status(400)
        .json({ message: "2FA is not enabled for this user." });
    }
    const decryptedSecret = decrypt(userTblObj.twoFaSecret);
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: "base32",
      token: token,
      window: 1,
    });
    if (verified) {
      const payload = {
        uid: userTblObj.id,
        uType: 1,
        userRole: userTblObj?.userRole,
      };

      const date = new Date();
      await userTbl.update(
        {
          lastLogin: date,
        },
        { where: { id: userTblObj?.id } }
      );

      if (NODE_ENV === "development") {
        const token = jwt.sign(payload, SECRET_KEY_ADMIN, {
          expiresIn: "8760h",
        });
        const cookieOptions = {
          maxAge: 31536000000,
          httpOnly: true,
        };
        return res
          .cookie("user_auth_token", token, cookieOptions)
          .status(200)
          .json({
            success: true,
            message: "Login successful 1",
            uType: 1,
            userRole: userTblObj?.userRole,
          });
      } else {
        const token = jwt.sign(payload, SECRET_KEY_ADMIN, {
          expiresIn: "12h",
        });
        const cookieOptions = {
          maxAge: 43200000,
          httpOnly: true,
          domain: COOKIE_DOMAIN_API,
          sameSite: "none",
          secure: true,
          path: "/",
        };
        return res
          .cookie("user_auth_token", token, cookieOptions)
          .status(200)
          .json({
            success: true,
            message: "2-Factor verification complete. Login Successfull.",
            uType: 1,
            userRole: userTblObj?.userRole,
          });
      }
    } else {
      return res.status(400).json({ message: "Invalid 2FA token." });
    }
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.verify2FA");
  }
};

publicController.generateAttendanceSheet = async function (req, res) {
  try {
    const { boardSubjectConditionsTblId, examSessionsTblId } = req.query;

    if (!boardSubjectConditionsTblId) {
      return res
        .status(400)
        .json({ message: "boardSubjectConditionsTblId is required" });
    }
    if (!examSessionsTblId) {
      return res.status(400).json({ message: "examSessionsTblId is required" });
    }

    const examSessionsTblObj = await examSessionsTbl.findByPk(
      examSessionsTblId
    );

    // Fetch board subject condition details with related tables
    const boardSubjectCondition = await boardSubjectConditionsTbl.findOne({
      where: { id: boardSubjectConditionsTblId },
      include: [
        {
          model: boardsTbl,
          as: "tbl_boards",
          attributes: ["id", "name"],
        },
        {
          model: standardsTbl,
          as: "tbl_standards",
          attributes: ["id", "name"],
        },
        {
          model: mediumsTbl,
          as: "tbl_mediums",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!boardSubjectCondition) {
      return res
        .status(404)
        .json({ message: "Board subject condition not found" });
    }

    const allStudents = await studentTbl.findAll({
      where: {
        boardSubjectConditionsId: boardSubjectConditionsTblId,
        status: 1,
      },
      order: [["createdAt", "ASC"]],
    });

    // Fetch subjects for this board subject condition
    const subjects = await subjectsTbl.findAll({
      where: {
        boardSubjectConditionsId: boardSubjectConditionsTblId,
        status: 1,
      },
      order: [["sortOrder", "ASC"]],
    });

    if (!subjects || subjects.length === 0) {
      return res
        .status(404)
        .json({ message: "No subjects found for this condition" });
    }

    let finalResultSet = [];
    // Build map for faster student lookup by ID
    const studentMap = new Map(allStudents.map((s) => [s.id, s]));

    for (const subj of subjects) {
      // Get all student-subject associations for this subject
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

      // Push the final structured result
      finalResultSet.push({
        subject: subj.name,
        studentList: matchedStudents,
      });
    }

    // for (const subj of subjects) {
    //   const studentSubjectsTblResult = await studentSubjectsTbl.findAll({
    //     where: { subjectIdFk: subj.id, isActive: 1 },
    //   });
    //   finalResultSet.push({
    //     subject: subj.name,
    //     studentList: [],
    //   });
    // }

    // Get today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Convert logo to base64
    const logoPath = path.join(__dirname, "../views/images/logo-main.png");
    const logoImage = fs.readFileSync(logoPath).toString("base64");

    // Define fonts for pdfmake
    const fonts = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    const printer = new PdfPrinter(fonts);

    // Create document definition for all subjects
    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "portrait",
      pageMargins: [30, 30, 30, 30],
      content: [],
      defaultStyle: {
        font: "Roboto",
      },
    };

    // Generate a page for each subject
    finalResultSet.forEach((subject, subjectIndex) => {
      if (subjectIndex > 0) {
        docDefinition.content.push({ text: "", pageBreak: "before" });
      }

      // Header with logo
      docDefinition.content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: 120,
            image: `data:image/jpeg;base64,${logoImage}`,
            fit: [100, 50],
            alignment: "center",
          },
          { width: "*", text: "" },
        ],
        margin: [0, 0, 0, 10],
      });

      // Title
      docDefinition.content.push({
        text: "GURUKUL TEST SERIES",
        style: "header",
        alignment: "center",
        margin: [0, 5, 0, 3],
      });

      // Address
      docDefinition.content.push({
        text: "Flat No. 101, Sopan Vihar, Near Venkatesh Bilva Society & Balaji Paradise, Vijaynagar Chowk, Dhayari Gaon, Pune - 411041.",
        alignment: "center",
        fontSize: 9,
        margin: [0, 0, 0, 10],
      });

      // Info table
      docDefinition.content.push({
        table: {
          widths: ["33%", "33%", "34%"],
          body: [
            [
              {
                text: `Std: ${boardSubjectCondition.tbl_standards?.name || "N/A"
                  }`,
                style: "infoCell",
                alignment: "center",
                bold: true,
              },
              {
                text: `Board: ${boardSubjectCondition.tbl_boards?.name || "N/A"
                  }`,
                style: "infoCell",
                alignment: "center",
                bold: true,
              },
              {
                text: `Medium: ${boardSubjectCondition.tbl_mediums?.name || "N/A"
                  }`,
                style: "infoCell",
                alignment: "center",
                bold: true,
              },
            ],
            [
              {
                text: `Subject: ${subject.subject}`,
                style: "infoCell",
                alignment: "center",
                bold: true,
              },
              {
                text: `Total Students: ${subject.studentList.length}`,
                style: "infoCell",
                alignment: "center",
                bold: true,
              },
              {
                text: `Date: ${dateStr}`,
                style: "infoCell",
                alignment: "center",
                bold: true,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function () {
            return 1;
          },
          vLineWidth: function () {
            return 1;
          },
          hLineColor: function () {
            return "#000000";
          },
          vLineColor: function () {
            return "#000000";
          },
        },
        margin: [0, 0, 0, 15],
      });

      // Student attendance table
      const tableBody = [
        [
          { text: "No.", style: "tableHeader", alignment: "center" },
          { text: "Name", style: "tableHeader", alignment: "center" },
          { text: "Roll No", style: "tableHeader", alignment: "center" },
          { text: "Sign", style: "tableHeader", alignment: "center" },
          { text: "S1", style: "tableHeader", alignment: "center" },
          { text: "S2", style: "tableHeader", alignment: "center" },
          { text: "S3", style: "tableHeader", alignment: "center" },
          { text: "S4", style: "tableHeader", alignment: "center" },
          { text: "S5", style: "tableHeader", alignment: "center" },
          { text: "Marks", style: "tableHeader", alignment: "center" },
        ],
      ];

      // Add student rows
      subject.studentList.forEach((student, index) => {
        const rowColor = index % 2 === 0 ? "#E8F4FD" : "#FFF9E6";
        tableBody.push([
          {
            text: (index + 1).toString(),
            style: "studentStyle",
            fillColor: rowColor,
            margin: [2, 5, 2, 5],
          },
          {
            text: `${student.firstName} ${student.surname}`,
            style: "studentStyle",
            fillColor: rowColor,
            margin: [2, 5, 2, 5],
          },
          {
            text: student.rollNo,
            style: "studentStyle",
            fillColor: rowColor,
            margin: [2, 5, 2, 5],
          },
          { text: "", fillColor: rowColor, margin: [2, 5, 2, 5] },
          { text: "", fillColor: rowColor, margin: [2, 5, 2, 5] },
          { text: "", fillColor: rowColor, margin: [2, 5, 2, 5] },
          { text: "", fillColor: rowColor, margin: [2, 5, 2, 5] },
          { text: "", fillColor: rowColor, margin: [2, 5, 2, 5] },
          { text: "", fillColor: rowColor, margin: [2, 5, 2, 5] },
          { text: "", fillColor: rowColor, margin: [2, 5, 2, 5] },
        ]);
      });

      docDefinition.content.push({
        table: {
          widths: [25, "*", 80, 50, 25, 25, 25, 25, 25, 40],
          body: tableBody,
        },
        layout: {
          hLineWidth: function () {
            return 1;
          },
          vLineWidth: function () {
            return 1;
          },
          hLineColor: function () {
            return "#000000";
          },
          vLineColor: function () {
            return "#000000";
          },
        },
      });

      // Footer
      docDefinition.content.push({
        text: `                                                                                                 Page ${subjectIndex + 1
          } of ${subjects.length}`,
        alignment: "left",
        fontSize: 9,
        margin: [0, 15, 0, 0],
      });
    });

    // Styles
    docDefinition.styles = {
      header: {
        fontSize: 18,
        bold: true,
      },
      infoCell: {
        fontSize: 11,
        margin: [5, 5, 5, 5],
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        margin: [2, 5, 2, 5],
      },
      studentStyle: {
        fontSize: 10,
        bold: false,
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-sheet-${boardSubjectConditionsTblId}-${Date.now()}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.log("Error generating attendance sheet:", err);
    handleSequelizeError(err, res, "publicController.generateAttendanceSheet");
  }
};

publicController.generateReportCard = async function (req, res) {
  try {
    const { examSessionsTblId } = req.query;

    if (!examSessionsTblId) {
      return res.status(400).json({ message: "examSessionsTblId is required" });
    }

    // Fetch exam session details
    const examSessionsTblObj = await examSessionsTbl.findByPk(
      examSessionsTblId,
      {
        include: [
          {
            model: boardsTbl,
            as: "tbl_boards",
            attributes: ["id", "name"],
          },
          {
            model: standardsTbl,
            as: "tbl_standards",
            attributes: ["id", "name"],
          },
          {
            model: setsTbl,
            as: "tbl_sets",
            attributes: ["id", "name"],
          },
        ],
      }
    );

    if (!examSessionsTblObj) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    const setIdFk = examSessionsTblObj.setIdFk;
    const boardSubjectConditionsId =
      examSessionsTblObj.boardSubjectConditionsId;

    if (!setIdFk) {
      return res
        .status(400)
        .json({ message: "Exam session does not have a set assigned" });
    }

    // Fetch board subject condition details
    const boardSubjectCondition = await boardSubjectConditionsTbl.findOne({
      where: { id: boardSubjectConditionsId },
      include: [
        {
          model: boardsTbl,
          as: "tbl_boards",
          attributes: ["id", "name"],
        },
        {
          model: standardsTbl,
          as: "tbl_standards",
          attributes: ["id", "name"],
        },
        {
          model: mediumsTbl,
          as: "tbl_mediums",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!boardSubjectCondition) {
      return res
        .status(404)
        .json({ message: "Board subject condition not found" });
    }

    // Get all students that belong to this set
    const studentSetMaps = await studentSetMapTbl.findAll({
      where: { setIdFk: setIdFk },
    });

    const studentIds = studentSetMaps.map((ssm) => ssm.studentIdFk);

    if (studentIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for this set" });
    }

    // Fetch students with the same boardSubjectConditionsId and in the set
    const students = await studentTbl.findAll({
      where: {
        id: { [Op.in]: studentIds },
        boardSubjectConditionsId: boardSubjectConditionsId,
        status: 1,
      },
      order: [["rollNo", "ASC"]],
    });

    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for this exam and set" });
    }

    // Fetch exam timetable for this session
    const examTimetable = await examTimetableTbl.findAll({
      where: { examSessionIdFk: examSessionsTblId },
      order: [["examDate", "ASC"]],
    });

    // Get all subject IDs from timetable
    const subjectIds = examTimetable.map((tt) => tt.subjectIdFk);

    // Fetch subjects
    const subjects = await subjectsTbl.findAll({
      where: {
        id: { [Op.in]: subjectIds },
        status: 1,
      },
      order: [["sortOrder", "ASC"]],
    });

    // Create subject map for easy lookup
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // Fetch all student-subject enrollments
    const allStudentSubjects = await studentSubjectsTbl.findAll({
      where: {
        studentIdFk: { [Op.in]: studentIds },
        subjectIdFk: { [Op.in]: subjectIds },
        isActive: 1,
      },
    });

    // Create a map for student enrollments
    const studentSubjectMap = new Map();
    allStudentSubjects.forEach((ss) => {
      const key = `${ss.studentIdFk}-${ss.subjectIdFk}`;
      studentSubjectMap.set(key, true);
    });

    // Fetch marks conditions for grade calculation
    const marksConditions = await marksConditionTbl.findAll({
      order: [["from", "DESC"]],
    });

    // Fetch all marks for this exam session and these students
    const allMarks = await studentMarksTbl.findAll({
      where: {
        examSessionIdFk: examSessionsTblId,
        studentIdFk: { [Op.in]: studentIds },
      },
    });

    // Create a map for quick marks lookup
    const marksMap = new Map();
    allMarks.forEach((mark) => {
      const key = `${mark.studentIdFk}-${mark.subjectIdFk}`;
      marksMap.set(key, mark);
    });

    // Calculate highest marks per subject
    const highestMarksMap = new Map();
    examTimetable.forEach((tt) => {
      const subjectMarks = allMarks
        .filter((m) => m.subjectIdFk === tt.subjectIdFk)
        .map((m) => m.marksScored || 0);
      highestMarksMap.set(
        tt.subjectIdFk,
        subjectMarks.length > 0 ? Math.max(...subjectMarks) : 0
      );
    });

    // Helper function to determine grade based on percentage
    const getGradeInfo = (percentage) => {
      for (const condition of marksConditions) {
        if (percentage >= condition.from && percentage <= condition.to) {
          return condition;
        }
      }
      return null;
    };

    // Helper function to format date
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDate();
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const month = monthNames[date.getMonth()];

      // Add ordinal suffix
      let suffix = "th";
      if (day === 1 || day === 21 || day === 31) suffix = "st";
      else if (day === 2 || day === 22) suffix = "nd";
      else if (day === 3 || day === 23) suffix = "rd";

      return `${day}${suffix} ${month}`;
    };

    // Calculate year range for the report card header
    const dateFrom = new Date(examSessionsTblObj.dateFrom);
    const startYear = dateFrom.getFullYear();
    const nextYear = startYear + 1;
    const yearRange = `${startYear}-${nextYear}`;

    // Convert logo to base64
    const logoPath = path.join(__dirname, "../views/images/logo-main.png");
    const logoImage = fs.readFileSync(logoPath).toString("base64");

    // Define fonts for pdfmake
    const fonts = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    const printer = new PdfPrinter(fonts);

    // Create document definition for report cards
    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "portrait",
      pageMargins: [40, 30, 40, 30],
      content: [],
      defaultStyle: {
        font: "Roboto",
      },
    };

    // Helper function to create a single report card
    const createReportCard = async (student) => {
      // Calculate student's marks - only for enrolled subjects
      const studentSubjects = [];
      let totalObtained = 0;
      let totalMax = 0;

      examTimetable.forEach((tt) => {
        const subject = subjectMap.get(tt.subjectIdFk);
        if (!subject) return;

        // Check if student is enrolled in this subject
        const enrollmentKey = `${student.id}-${tt.subjectIdFk}`;
        if (!studentSubjectMap.has(enrollmentKey)) return;

        const key = `${student.id}-${tt.subjectIdFk}`;
        const markEntry = marksMap.get(key);

        const obtainedMarks = markEntry?.marksScored || 0;
        const maxMarks = tt.maxMarks || 80;
        const highestMarks = highestMarksMap.get(tt.subjectIdFk) || 0;

        totalObtained += obtainedMarks;
        totalMax += maxMarks;

        studentSubjects.push({
          name: subject.name,
          date: formatDate(tt.examDate),
          obtained: obtainedMarks,
          total: maxMarks,
          highest: highestMarks,
        });
      });

      const percentage =
        totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
      const gradeInfo = getGradeInfo(percentage);

      // Calculate rank (students with higher percentage get better rank)
      const allStudentPercentages = students.map((s) => {
        let stuTotalObtained = 0;
        let stuTotalMax = 0;
        examTimetable.forEach((tt) => {
          const key = `${s.id}-${tt.subjectIdFk}`;
          const markEntry = marksMap.get(key);
          stuTotalObtained += markEntry?.marksScored || 0;
          stuTotalMax += tt.maxMarks || 80;
        });
        return {
          studentId: s.id,
          percentage:
            stuTotalMax > 0
              ? Math.round((stuTotalObtained / stuTotalMax) * 100)
              : 0,
        };
      });

      allStudentPercentages.sort((a, b) => b.percentage - a.percentage);
      const rank =
        allStudentPercentages.findIndex((sp) => sp.studentId === student.id) +
        1;

      // Fetch remarks for this grade
      const remarks = gradeInfo
        ? await marksConditionRemarksTbl.findAll({
          where: { marksConditionIdFk: gradeInfo.id },
          order: [["srno", "ASC"]],
          limit: 4,
        })
        : [];

      // Create the report card page
      const reportCardContent = [
        // Header with logo
        {
          columns: [
            { width: "*", text: "" },
            {
              width: 120,
              image: `data:image/png;base64,${logoImage}`,
              fit: [100, 50],
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
        },

        // Year
        {
          text: yearRange,
          fontSize: 12,
          alignment: "center",
          margin: [0, 0, 0, 2],
        },

        // Address
        {
          text: "Flat No. 101, Sopan Vihar, Near Venkatesh Bilva Society & Balaji Paradise, Vijaynagar Chowk, Dhayari Gaon, Pune - 411041.",
          fontSize: 8,
          alignment: "center",
          margin: [0, 0, 0, 8],
        },

        // Student Info Table
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  text: `NAME: ${student.firstName.toUpperCase()} ${student.surname.toUpperCase()}`,
                  bold: true,
                  fontSize: 10,
                  margin: [4, 3, 4, 3],
                },
              ],
              [
                {
                  text: `STD & BOARD: ${boardSubjectCondition.tbl_standards?.name || ""
                    } ${boardSubjectCondition.tbl_boards?.name || ""}`,
                  bold: true,
                  fontSize: 10,
                  margin: [4, 3, 4, 3],
                },
              ],
              [
                {
                  text: `ROLL NO: ${student.rollNo}`,
                  bold: true,
                  fontSize: 10,
                  margin: [4, 3, 4, 3],
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
          margin: [0, 0, 0, 6],
        },

        // Result Grade Box
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  text: `RESULT: ${gradeInfo ? `GRADE ${gradeInfo.name}` : "N/A"
                    }`,
                  bold: true,
                  fontSize: 11,
                  alignment: "center",
                  margin: [4, 5, 4, 5],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 2,
            vLineWidth: () => 2,
            hLineColor: () => "#000000",
            vLineColor: () => "#000000",
          },
          margin: [0, 0, 0, 6],
        },

        // Set Name Box
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  text: `${examSessionsTblObj.tbl_sets?.name || "SET 1"}`,
                  bold: true,
                  fontSize: 11,
                  alignment: "center",
                  margin: [4, 4, 4, 4],
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
          margin: [0, 0, 0, 6],
        },

        // Marks Table
        {
          table: {
            widths: [30, "*", 60, 55, 50, 55],
            body: [
              [
                {
                  text: "Sr. No.",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: "Subject",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: "Date",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: "Obtained Marks",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: "Total Marks",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: "Highest Marks",
                  bold: true,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
              ],
              ...studentSubjects.map((subj, idx) => [
                {
                  text: (idx + 1).toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: subj.name,
                  fontSize: 9,
                  margin: [2, 3, 2, 3],
                },
                {
                  text: subj.date,
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: subj.obtained.toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: subj.total.toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
                },
                {
                  text: subj.highest.toString(),
                  fontSize: 9,
                  alignment: "center",
                  margin: [2, 3, 2, 3],
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
          margin: [0, 0, 0, 6],
        },

        // Percentage and Rank Table
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  text: `PERCENTAGE: ${percentage}%`,
                  bold: true,
                  fontSize: 10,
                  alignment: "center",
                  margin: [4, 5, 4, 5],
                },
              ],
              [
                {
                  text: `RANK: ${rank}`,
                  bold: true,
                  fontSize: 10,
                  alignment: "center",
                  margin: [4, 5, 4, 5],
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
          margin: [0, 0, 0, 6],
        },

        // Student Remarks Header
        {
          text: "STUDENT REMARKS:",
          bold: true,
          fontSize: 10,
          margin: [0, 0, 0, 3],
        },

        // Student Remarks as lines
        ...remarks.map((remark, idx) => ({
          text: `${idx + 1}) ${remark.remark || ""}`,
          fontSize: 9,
          margin: [0, 0, 0, 2],
        })),

        // Add empty remark lines if less than 4 remarks
        ...(remarks.length < 4
          ? Array(4 - remarks.length)
            .fill(null)
            .map((_, idx) => ({
              text: `${remarks.length + idx + 1})`,
              fontSize: 9,
              margin: [0, 0, 0, 2],
            }))
          : []),

        // Footer Message
        {
          text: "ALL THE BEST",
          fontSize: 11,
          bold: true,
          alignment: "center",
          margin: [0, 8, 0, 3],
        },
        {
          text: "GURUKUL HO…!",
          fontSize: 11,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 6],
        },

        // Website
        {
          text: "",
          fontSize: 8,
          alignment: "center",
        },
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

publicController.generateHallTicket = async function (req, res) {
  try {
    const { examSessionsTblId } = req.query;

    if (!examSessionsTblId) {
      return res.status(400).json({ message: "examSessionsTblId is required" });
    }

    // Fetch exam session details
    const examSessionsTblObj = await examSessionsTbl.findByPk(
      examSessionsTblId,
      {
        include: [
          {
            model: boardsTbl,
            as: "tbl_boards",
            attributes: ["id", "name"],
          },
          {
            model: standardsTbl,
            as: "tbl_standards",
            attributes: ["id", "name"],
          },
          {
            model: setsTbl,
            as: "tbl_sets",
            attributes: ["id", "name"],
          },
        ],
      }
    );

    if (!examSessionsTblObj) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    const setIdFk = examSessionsTblObj.setIdFk;
    const boardSubjectConditionsId =
      examSessionsTblObj.boardSubjectConditionsId;

    if (!setIdFk) {
      return res
        .status(400)
        .json({ message: "Exam session does not have a set assigned" });
    }

    // Fetch board subject condition details
    const boardSubjectCondition = await boardSubjectConditionsTbl.findOne({
      where: { id: boardSubjectConditionsId },
      include: [
        {
          model: boardsTbl,
          as: "tbl_boards",
          attributes: ["id", "name"],
        },
        {
          model: standardsTbl,
          as: "tbl_standards",
          attributes: ["id", "name"],
        },
        {
          model: mediumsTbl,
          as: "tbl_mediums",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!boardSubjectCondition) {
      return res
        .status(404)
        .json({ message: "Board subject condition not found" });
    }

    // Get all students that belong to this set
    const studentSetMaps = await studentSetMapTbl.findAll({
      where: { setIdFk: setIdFk },
    });

    const studentIds = studentSetMaps.map((ssm) => ssm.studentIdFk);

    if (studentIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for this set" });
    }

    // Fetch students with the same boardSubjectConditionsId and in the set
    const students = await studentTbl.findAll({
      where: {
        id: { [Op.in]: studentIds },
        boardSubjectConditionsId: boardSubjectConditionsId,
        status: 1,
      },
      order: [["rollNo", "ASC"]],
    });

    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for this exam and set" });
    }

    console.log(`Total students found: ${students.length}`);
    console.log(`Student IDs: ${students.map(s => s.id).join(', ')}`);

    // Calculate month and year ranges
    const dateFrom = new Date(examSessionsTblObj.dateFrom);
    const monthNames = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];

    const startMonth = monthNames[dateFrom.getMonth()];
    const nextMonth = monthNames[(dateFrom.getMonth() + 1) % 12];
    const monthRange = `${startMonth} - ${nextMonth}`;

    const startYear = dateFrom.getFullYear();
    const nextYear = startYear + 1;
    const yearRange = `${startYear} - ${nextYear}`;

    // Convert logo to base64
    const logoPath = path.join(__dirname, "../views/images/logo-main.png");
    const logoImage = fs.readFileSync(logoPath).toString("base64");

    // Define fonts for pdfmake
    const fonts = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    const printer = new PdfPrinter(fonts);

    // Create document definition for hall tickets
    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [20, 20, 20, 20],
      content: [],
      defaultStyle: {
        font: "Roboto",
      },
    };

    // Helper function to create a hall ticket (landscape orientation for 6 per page)
    const createHallTicket = (student) => {
      // Create roll number boxes - show all characters including dashes
      const rollNoStr = (student.rollNo || "").toString();
      const rollNoBoxes = [];

      // Create enough boxes for the full roll number
      const boxCount = Math.max(13, rollNoStr.length);
      for (let i = 0; i < boxCount; i++) {
        rollNoBoxes.push({
          text: rollNoStr[i] || "",
          alignment: "center",
          fontSize: 11,
          bold: true,
          margin: [0, 5, 0, 5],
          color: "#1E3A8A",
        });
      }

      return {
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  // Header with logo on left and exam info on right
                  {
                    columns: [
                      {
                        width: 90,
                        image: `data:image/png;base64,${logoImage}`,
                        fit: [85, 45],
                        alignment: "left",
                      },
                      {
                        width: "*",
                        stack: [
                          {
                            text: `${examSessionsTblObj.name || "Term Exam"} - EXAMINATION`,
                            fontSize: 14,
                            bold: true,
                            color: "#1E3A8A",
                            alignment: "right",
                            margin: [0, 2, 0, 3],
                          },
                          {
                            text: monthRange,
                            fontSize: 12,
                            color: "#1E3A8A",
                            alignment: "right",
                            margin: [0, 0, 0, 1],
                          },
                          {
                            text: yearRange,
                            fontSize: 12,
                            color: "#1E3A8A",
                            alignment: "right",
                          },
                        ],
                      },
                    ],
                    margin: [0, 0, 0, 8],
                  },

                  // Row 1: Name
                  {
                    columns: [
                      {
                        width: 50,
                        text: "Name:",
                        fontSize: 12,
                        bold: true,
                        color: "#1E3A8A",
                      },
                      {
                        width: "*",
                        stack: [
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 9,
                                x2: 320,
                                y2: 9,
                                lineWidth: 1,
                                lineColor: "#1E3A8A",
                              },
                            ],
                          },
                          {
                            text: `${student.firstName} ${student.surname}`,
                            fontSize: 12,
                            color: "#1E3A8A",
                            margin: [2, -8, 0, 0],
                          },
                        ],
                      },
                    ],
                    margin: [0, 0, 0, 4],
                  },

                  // Row 2: Std and Board
                  {
                    columns: [
                      {
                        width: 32,
                        text: "Std:",
                        fontSize: 12,
                        bold: true,
                        color: "#1E3A8A",
                      },
                      {
                        width: 155,
                        stack: [
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 9,
                                x2: 153,
                                y2: 9,
                                lineWidth: 1,
                                lineColor: "#1E3A8A",
                              },
                            ],
                          },
                          {
                            text: boardSubjectCondition.tbl_standards?.name || "",
                            fontSize: 12,
                            color: "#1E3A8A",
                            margin: [2, -8, 0, 0],
                          },
                        ],
                      },
                      {
                        width: 45,
                        text: "Board:",
                        fontSize: 12,
                        bold: true,
                        color: "#1E3A8A",
                        margin: [8, 0, 0, 0],
                      },
                      {
                        width: "*",
                        stack: [
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 9,
                                x2: 130,
                                y2: 9,
                                lineWidth: 1,
                                lineColor: "#1E3A8A",
                              },
                            ],
                          },
                          {
                            text: boardSubjectCondition.tbl_boards?.name || "",
                            fontSize: 12,
                            color: "#1E3A8A",
                            margin: [2, -8, 0, 0],
                          },
                        ],
                      },
                    ],
                    margin: [0, 0, 0, 5],
                  },

                  // Row 3: Medium and Batch
                  {
                    columns: [
                      {
                        width: 60,
                        text: "Medium:",
                        fontSize: 12,
                        bold: true,
                        color: "#1E3A8A",
                      },
                      {
                        width: 127,
                        stack: [
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 9,
                                x2: 125,
                                y2: 9,
                                lineWidth: 1,
                                lineColor: "#1E3A8A",
                              },
                            ],
                          },
                          {
                            text: boardSubjectCondition.tbl_mediums?.name || "",
                            fontSize: 12,
                            color: "#1E3A8A",
                            margin: [2, -8, 0, 0],
                          },
                        ],
                      },
                      {
                        width: 45,
                        text: "Batch:",
                        fontSize: 12,
                        bold: true,
                        color: "#1E3A8A",
                        margin: [8, 0, 0, 0],
                      },
                      {
                        width: "*",
                        stack: [
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 9,
                                x2: 130,
                                y2: 9,
                                lineWidth: 1,
                                lineColor: "#1E3A8A",
                              },
                            ],
                          },
                          {
                            text: "",
                            fontSize: 12,
                            color: "#1E3A8A",
                            margin: [2, -8, 0, 0],
                          },
                        ],
                      },
                    ],
                    margin: [0, 0, 0, 6],
                  },

                  // Row 4: Roll No
                  {
                    columns: [
                      {
                        width: 62,
                        text: "Roll No.:",
                        fontSize: 12,
                        bold: true,
                        color: "#1E3A8A",
                        margin: [0, 5, 0, 0],
                      },
                      {
                        width: "*",
                        table: {
                          widths: Array(boxCount).fill("*"),
                          body: [rollNoBoxes],
                        },
                        layout: {
                          hLineWidth: function () {
                            return 1;
                          },
                          vLineWidth: function () {
                            return 1;
                          },
                          hLineColor: function () {
                            return "#1E3A8A";
                          },
                          vLineColor: function () {
                            return "#1E3A8A";
                          },
                        },
                      },
                    ],
                    margin: [0, 0, 0, 0],
                  },
                ],
                margin: [12, 12, 12, 12],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function () {
            return 2.5;
          },
          vLineWidth: function () {
            return 2.5;
          },
          hLineColor: function () {
            return "#1E3A8A";
          },
          vLineColor: function () {
            return "#1E3A8A";
          },
        },
        margin: [0, 0, 0, 0],
      };
    };

    // Generate hall tickets - 6 per page in 2x3 grid (2 columns, 3 rows)
    for (let i = 0; i < students.length; i += 6) {
      if (i > 0) {
        docDefinition.content.push({ text: "", pageBreak: "before" });
      }

      const pageStudents = students.slice(i, i + 6);

      // Create 3 rows, each with 2 columns
      const rows = [];

      for (let row = 0; row < 3; row++) {
        const leftIndex = row * 2;
        const rightIndex = row * 2 + 1;

        const rowTickets = [];

        // Left ticket
        if (pageStudents[leftIndex]) {
          rowTickets.push({
            width: "*",
            ...createHallTicket(pageStudents[leftIndex]),
          });
        } else {
          rowTickets.push({ width: "*", text: "" });
        }

        // Right ticket
        if (pageStudents[rightIndex]) {
          rowTickets.push({
            width: "*",
            ...createHallTicket(pageStudents[rightIndex]),
          });
        } else {
          rowTickets.push({ width: "*", text: "" });
        }

        rows.push({
          columns: rowTickets,
          columnGap: 15,
          margin: [0, 0, 0, 12],
        });
      }

      // Add all rows to content
      rows.forEach((row) => docDefinition.content.push(row));
    }

    // Styles (minimal - most styling is inline for horizontal/vertical ticket control)
    docDefinition.styles = {};

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=hall-tickets-${examSessionsTblId}-${Date.now()}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.log("Error generating hall ticket:", err);
    handleSequelizeError(err, res, "publicController.generateHallTicket");
  }
};

publicController.updateMyPassword = async function (req, res) {
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
            handleSequelizeError(err, res, 'publicController.updateMyPassword')
          }
        } else {
          res.status(500).json({ error: 'Existing password is incorrect.' })
        }
      }
    })
  } catch (err) {
    handleSequelizeError(err, res, 'hrController.updateMyPassword')
  }
}

module.exports = publicController;