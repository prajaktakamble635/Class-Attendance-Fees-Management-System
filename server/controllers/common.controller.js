const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {
  boardSubjectConditionsTbl,
  subjectsTbl,
  boardsTbl,
  standardsTbl,
  mediumsTbl,
  userTbl,
  downloadRequestTbl
} = require("../sequelize");
const { EMAIL_USER, EMAIL_PASSWORD } = require("../config.js")
const nodemailer = require("nodemailer")
const { handleSequelizeError } = require('../sequelizeErrorHandler');

const commonController = {};

commonController.getAllBoardSubjectConditions = async function (req, res) {
  try {
    const result = await boardSubjectConditionsTbl.findAll({
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
      order: [['id', 'ASC']]
    });

    if (result.length == 0) return res.status(206).json({ boardSubjectConditionsData: [] })

    const boardSubjectConditionsData = await Promise.all(result.map(async (obj) => {

      const plainObj = obj.get({ plain: true });

      return {
        ...plainObj,
        boardName: plainObj.tbl_boards?.name || null,
        standard: plainObj.tbl_standards?.name || null,
        medium: plainObj.tbl_mediums?.name || null,
        label: plainObj.name,
        value: plainObj.id
      }
    }))

    return res.status(200).json({
      success: true,
      data: boardSubjectConditionsData,
      message: "Board subject conditions retrieved successfully"
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "commonController.getAllBoardSubjectConditions")
  }
};

commonController.getSubjectsByBoardSubjectConditionId = async function (req, res) {
  try {
    const { boardSubjectConditionsId } = req.query;

    if (!boardSubjectConditionsId) {
      return res.status(400).json({
        success: false,
        message: "boardSubjectConditionsId query parameter is required"
      });
    }

    const subjects = await subjectsTbl.findAll({
      where: {
        boardSubjectConditionsId: boardSubjectConditionsId
      },
      order: [['sortOrder', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: subjects,
      message: "Subjects retrieved successfully"
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "commonController.getSubjectsByBoardSubjectConditionId")
  }
};

commonController.getUserInfo = async (req, res) => {
  try {
    const result = await userTbl.findByPk(req.uid);

    return res.status(200).json(result)
  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "commonController.getUserInfo")
  }
};

commonController.requestOtp = async (req, res) => {
  try {
    const { label, description } = req.body;

    const otp = (Math.floor(1000 + Math.random() * 9000)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const requestObj = await downloadRequestTbl.create({
      label,
      description,
      otp,
      expiresAt,
      employeeIdFk: req.uid
    });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_USER, // your email
        pass: EMAIL_PASSWORD, // app password
      }
    });

    const mailOptions = {
      from: `"Download Request" <${EMAIL_USER}>`,
      to: EMAIL_USER,
      subject: label, // subject from req.body
      html: `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h3>${label}</h3>
          <p>${description}</p>
          <p><strong>Request Approval OTP:</strong> ${otp}</p>
          <p>This OTP will be valid for <b>10 minutes</b>.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: 'OTP sent successfully to email.',
      expiresAt,
      requestId: requestObj?.id
    });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "commonController.requestOtp")
  }
}

commonController.verifyOtp = async (req, res) => {
  try {
    const { requestId, otp } = req.body;

    const otpRecord = await downloadRequestTbl.findOne({
      where: {
        id: requestId,
        otp,
        isUsed: 1,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });

    if (otpRecord.expiresAt < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired' });

    otpRecord.isUsed = 2;
    await otpRecord.save();

    res.json({ success: true, message: 'OTP verified. Proceed to download.' });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "commonController.verifyOtp")
  }
}

module.exports = commonController;
