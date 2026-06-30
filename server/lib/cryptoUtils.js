const crypto = require("crypto");
const {ENCRYPTION_KEY} = require("../config.js");

const encryption_key = Buffer.from(ENCRYPTION_KEY, "utf8")
const iv_length = 16;

function encrypt(text){
    let formattedText = text?.toString().trim();
    let iv = crypto.randomBytes(iv_length);
    let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(encryption_key), iv);
    let encrypted = cipher.update(formattedText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString("hex") + ":" + encrypted;
};

function decrypt(text){
    if (!text) return "";

  try {
    let parts = text.split(":");
    if (parts.length < 2) {
      return text;
    }

    let iv = Buffer.from(parts.shift(), "hex");
    if (iv.length !== 16) {
      return text;
    }

    let encryptedText = parts.join(":");
    let decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return text;
  }
};

module.exports = {encrypt, decrypt};