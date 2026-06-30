// =============================
// CONFIGURATION

const { boardsTbl } = require("../sequelize");

// =============================
const BOARD_RANGES = {
  CBSE: {
    code: "C",
    floors: { 1: 26, 2: 28, 3: 35, 4: 36 },
  },
  SSC: {
    code: "B",
    floors: { 1: 26, 2: 32, 3: 33 },
  },
  ICSE: {
    code: "D",
    floors: { 1: 26, 2: 25 },
  },
  HSC: {
    code: "A",
    floors: { 1: 30, 2: 21, 3: 31, 4: 24 },
  },
};

// HSC-only extended ranges
const HSC_EXTENSIONS = [
  { prefix: "D", floor: 3, start: 1, end: 21 },
];

const SSC_EXTENSIONS = [{ prefix: "D", floor: 2, start: 26, end: 36 }];

// =============================
// HELPERS
// =============================
const parseRoll = (roll) => {
  const [prefix, floorStr, numStr] = roll.split("-");
  return {
    prefix,
    floor: Number(floorStr),
    num: Number(numStr),
  };
};

const formatRoll = (prefix, floor, num) => {
  return `${prefix}-${floor}-${String(num).padStart(3, "0")}`;
};

// Check if a roll number is in HSC extension
const isHSCExtension = (roll) => {
  const parsed = parseRoll(roll);
  return HSC_EXTENSIONS.some(
    (ext) =>
      parsed.prefix === ext.prefix &&
      parsed.floor === ext.floor &&
      parsed.num >= ext.start
  );
};

const isSSCExtension = (roll) => {
  const parsed = parseRoll(roll);
  return SSC_EXTENSIONS.some(
    (ext) =>
      parsed.prefix === ext.prefix &&
      parsed.floor === ext.floor &&
      parsed.num >= ext.start
  );
};

// Get next roll for a single board
const getNextRoll = (board, lastRoll) => {
  const config = BOARD_RANGES[board];
  if (!config) throw new Error(`Unknown board ${board}`);

  const code = config.code;

  // --------------------------
  // HSC SPECIAL
  // --------------------------
  if (board === "HSC") {
    if (!lastRoll) return formatRoll("A", 1, 1);

    const parsed = parseRoll(lastRoll);

    // If still inside A floors
    if (parsed.prefix === "A") {
      const max = config.floors[parsed.floor] || Infinity;
      if (parsed.num < max) return formatRoll("A", parsed.floor, parsed.num + 1);
      if (parsed.floor < 4) return formatRoll("A", parsed.floor + 1, 1);
      
      if (HSC_EXTENSIONS.length > 0) {
        return formatRoll(HSC_EXTENSIONS[0].prefix, HSC_EXTENSIONS[0].floor, HSC_EXTENSIONS[0].start);
      }
      return formatRoll("A", parsed.floor, parsed.num + 1);
    }

    // Move to HSC extensions
    for (let i = 0; i < HSC_EXTENSIONS.length; i++) {
      const ext = HSC_EXTENSIONS[i];
      if (parsed.prefix === ext.prefix && parsed.floor === ext.floor) {
        if (parsed.num < ext.end) return formatRoll(ext.prefix, ext.floor, parsed.num + 1);
        
        if (HSC_EXTENSIONS[i + 1]) {
           const nextExt = HSC_EXTENSIONS[i + 1];
           return formatRoll(nextExt.prefix, nextExt.floor, nextExt.start);
        }
        return formatRoll(ext.prefix, ext.floor, parsed.num + 1);
      }
      // If this extension hasn't been used yet
      if (!lastRoll.startsWith(ext.prefix)) return formatRoll(ext.prefix, ext.floor, ext.start);
    }

    return formatRoll(parsed.prefix || "A", parsed.floor || 1, (parsed.num || 0) + 1);
  }

  // --------------------------
  // SSC SPECIAL
  // --------------------------
  if (board === "SSC") {
    if (!lastRoll) return formatRoll("B", 1, 1);

    const parsed = parseRoll(lastRoll);

    // If still inside B floors
    if (parsed.prefix === "B") {
      const max = config.floors[parsed.floor] || Infinity;
      if (parsed.num < max) return formatRoll("B", parsed.floor, parsed.num + 1);
      if (parsed.floor < 3) return formatRoll("B", parsed.floor + 1, 1);
      
      if (SSC_EXTENSIONS.length > 0) {
        return formatRoll(SSC_EXTENSIONS[0].prefix, SSC_EXTENSIONS[0].floor, SSC_EXTENSIONS[0].start);
      }
      return formatRoll("B", parsed.floor, parsed.num + 1);
    }

    // Move to SSC extensions
    for (let i = 0; i < SSC_EXTENSIONS.length; i++) {
      const ext = SSC_EXTENSIONS[i];
      if (parsed.prefix === ext.prefix && parsed.floor === ext.floor) {
        if (parsed.num < ext.end) return formatRoll(ext.prefix, ext.floor, parsed.num + 1);
        
        if (SSC_EXTENSIONS[i + 1]) {
           const nextExt = SSC_EXTENSIONS[i + 1];
           return formatRoll(nextExt.prefix, nextExt.floor, nextExt.start);
        }
        return formatRoll(ext.prefix, ext.floor, parsed.num + 1);
      }
      // If this extension hasn't been used yet
      if (!lastRoll.startsWith(ext.prefix)) return formatRoll(ext.prefix, ext.floor, ext.start);
    }

    return formatRoll(parsed.prefix || "B", parsed.floor || 1, (parsed.num || 0) + 1);
  }

  // --------------------------
  // OTHER BOARDS
  // --------------------------

  if (!lastRoll) {
    const firstFloor = Number(Object.keys(config.floors)[0]) || 1;
    return formatRoll(code, firstFloor, 1);
  }

  const parsed = parseRoll(lastRoll);
  
  if (parsed.prefix === code) {
    const max = config.floors[parsed.floor] || Infinity;
    if (parsed.num < max) return formatRoll(code, parsed.floor, parsed.num + 1);

    // move to next floor
    const nextFloor = parsed.floor + 1;
    if (config.floors[nextFloor]) return formatRoll(code, nextFloor, 1);

    // Keep incrementing indefinitely if no more floors
    return formatRoll(code, parsed.floor, parsed.num + 1);
  }
  
  // Fallback
  return formatRoll(parsed.prefix || code, parsed.floor || 1, (parsed.num || 0) + 1);
};

// =============================
// IMPORT / BULK GENERATION SUPPORT
// =============================
const generateRollForImport = async (boardId, tracker) => {

  const boardTblObj = await boardsTbl.findOne({
    where: { id: boardId }
  });
  let board = boardTblObj?.code

  const code = BOARD_RANGES[board].code;
  const key = `BOARD-${code}`;
  const lastRoll = tracker[key] || null;

  const nextRoll = getNextRoll(board, lastRoll);
  tracker[key] = nextRoll;

  return nextRoll;
};

// =============================
// EXPORTS
// =============================
module.exports = {
  getNextRoll,
  generateRollForImport,
};
