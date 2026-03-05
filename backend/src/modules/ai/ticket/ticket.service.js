const { randomUUID } = require("crypto");
const path = require("path");
const repository = require("./ticket.repository");
const mcpManager = require("../mcp/mcpServerManager");
const {
  TICKET_ERROR_CODES,
  draftNotFound,
  draftExpired,
  invalidTicketParams,
} = require("./ticket.errors");

let register12306Promise = null;

function ensureDraftPayload({ route, date }) {
  if (!route?.fromCity || !route?.toCity || !date) {
    throw invalidTicketParams("缺少出发地、到达地或日期");
  }
  if (route.fromCity === route.toCity) {
    throw invalidTicketParams("出发地和到达地不能相同");
  }
}

function toIsoDate(input) {
  if (!input) return "";
  return String(input).slice(0, 10);
}

function parseJsonArraySafe(input) {
  if (Array.isArray(input)) return input;
  if (input === null || input === undefined) return [];
  const text = String(input).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function buildDraftResponse(record) {
  return {
    draftId: record.draft_id,
    source: record.source,
    route: {
      fromCity: record.from_city,
      fromStationCode: record.from_station_code,
      toCity: record.to_city,
      toStationCode: record.to_station_code,
    },
    date: toIsoDate(record.travel_date),
    preferences: {
      trainTypes: parseJsonArraySafe(record.train_types),
      departureTimeRange: record.departure_time_range || "",
      seatTypes: parseJsonArraySafe(record.seat_types),
      strategy: record.strategy || "fastest",
    },
    status: record.status,
    expiresAt: record.expires_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

async function createDraft({ userId, source = "ai_assistant", route, date, preferences = {} }) {
  ensureDraftPayload({ route, date });
  const draftId = `td_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await repository.createDraft({
    draftId,
    userId,
    source,
    route,
    date,
    preferences,
    status: "ready",
    expiresAt,
  });

  return { draftId, status: "ready", expiresAt };
}

async function getDraftOrThrow({ userId, draftId }) {
  const record = await repository.getDraftById(userId, draftId);
  if (!record) throw draftNotFound();

  const isExpired = new Date(record.expires_at).getTime() < Date.now();
  if (isExpired && record.status !== "expired") {
    await repository.updateDraftStatus(draftId, "expired");
    record.status = "expired";
  }
  if (record.status === "expired") {
    throw draftExpired();
  }
  return buildDraftResponse(record);
}

async function ensure12306ServerRegistered() {
  if (register12306Promise) return register12306Promise;
  const projectRoot = path.resolve(process.cwd());
  const actualRoot = projectRoot.endsWith("backend") ? path.dirname(projectRoot) : projectRoot;
  register12306Promise = mcpManager.registerServer("12306-server", {
    command: "node",
    args: [path.join(actualRoot, "MCP-Tools", "12306-mcp", "build", "index.js")],
    env: {},
  });
  return register12306Promise;
}

function safeJsonParse(input, fallback) {
  try {
    return JSON.parse(input);
  } catch (_) {
    return fallback;
  }
}

function extractMcpText(result) {
  const content = result?.content || [];
  const firstText = content.find((item) => item?.type === "text")?.text || "";
  return String(firstText || "");
}

function toDurationMinutes(lishi = "") {
  const [hh = "0", mm = "0"] = String(lishi).split(":");
  return Number(hh) * 60 + Number(mm);
}

function toSeatStatus(num) {
  if (num === "有" || num === "充足") return "有票";
  if (num === "候补") return "候补";
  if (num === "无" || num === "--" || num === "") return "无票";
  if (/^\d+$/.test(String(num))) return Number(num) > 0 ? `剩余${num}张` : "无票";
  return String(num || "未知");
}

function buildSeatAvailability(prices = []) {
  const map = {};
  prices.forEach((price) => {
    if (!price?.seat_name) return;
    map[price.seat_name] = toSeatStatus(price.num);
  });
  return map;
}

function minPriceFromPrices(prices = []) {
  const list = prices
    .map((item) => Number(item?.price))
    .filter((val) => Number.isFinite(val) && val > 0);
  if (!list.length) return null;
  return Math.min(...list);
}

function buildTrainFilterFlags(trainTypes = []) {
  const set = new Set();
  (trainTypes || []).forEach((item) => {
    const type = String(item || "").trim().toUpperCase();
    if (["G", "D", "Z", "T", "K", "O", "F", "S"].includes(type)) {
      set.add(type);
    }
    if (type === "C") set.add("G");
  });
  return Array.from(set).join("");
}

function mapSortToMcp(sortBy) {
  if (sortBy === "shortest_duration") return { sortFlag: "duration", sortReverse: false };
  if (sortBy === "earliest_departure") return { sortFlag: "startTime", sortReverse: false };
  return { sortFlag: "", sortReverse: false };
}

async function resolveStationCodes(fromCity, toCity) {
  await ensure12306ServerRegistered();
  const stationResult = await mcpManager.callTool("get-station-code-of-citys", {
    citys: `${fromCity}|${toCity}`,
  });
  const payload = safeJsonParse(extractMcpText(stationResult), {});
  const from = payload?.[fromCity];
  const to = payload?.[toCity];
  if (!from?.station_code || !to?.station_code) {
    throw invalidTicketParams("未能识别出发地或到达地的站点编码");
  }
  return { fromStation: from.station_code, toStation: to.station_code };
}

function mapDirectOption(ticket, draft, idx) {
  const priceMin = minPriceFromPrices(ticket.prices);
  return {
    optionId: `${draft.draftId}-d-${ticket.train_no || idx}`,
    tripType: "direct",
    trainNo: ticket.start_train_code || ticket.train_no || "--",
    departAt: `${ticket.start_date} ${ticket.start_time}`,
    arriveAt: `${ticket.arrive_date} ${ticket.arrive_time}`,
    durationMinutes: toDurationMinutes(ticket.lishi),
    priceMin,
    seatAvailability: buildSeatAvailability(ticket.prices),
  };
}

function parseWaitMinutes(waitTime = "") {
  const matched = String(waitTime).match(/(?:(\d+)小时)?(\d+)分钟/);
  if (!matched) return 0;
  return Number(matched[1] || 0) * 60 + Number(matched[2] || 0);
}

function mapTransferOption(interline, draft, idx) {
  const allPrices = (interline.ticketList || []).flatMap((ticket) => ticket.prices || []);
  const priceMin = minPriceFromPrices(allPrices);
  return {
    optionId: `${draft.draftId}-t-${interline.first_train_no || idx}`,
    tripType: "transfer",
    trainNo: `${interline.first_train_no || "--"} + ${interline.second_train_no || "--"}`,
    departAt: `${interline.start_date} ${interline.start_time}`,
    arriveAt: `${interline.arrive_date} ${interline.arrive_time}`,
    durationMinutes: toDurationMinutes(interline.lishi),
    transferCount: Math.max((interline.train_count || 2) - 1, 1),
    transferWaitMinutes: parseWaitMinutes(interline.wait_time),
    priceMin,
    seatAvailability: buildSeatAvailability(allPrices),
  };
}

function applyFilters(options, filters = {}) {
  let result = [...options];
  if (filters.onlySecondClassAvailable) {
    result = result.filter((item) => item.seatAvailability?.["二等座"] && item.seatAvailability["二等座"] !== "无票");
  }
  if (filters.preferredOptionId) {
    const preferredId = String(filters.preferredOptionId);
    result.sort((a, b) => {
      const aPreferred = String(a.optionId) === preferredId ? 0 : 1;
      const bPreferred = String(b.optionId) === preferredId ? 0 : 1;
      return aPreferred - bPreferred;
    });
  }
  return result;
}

function applySort(options, sortBy) {
  const result = [...options];
  if (sortBy === "shortest_duration") {
    result.sort((a, b) => a.durationMinutes - b.durationMinutes);
  } else if (sortBy === "lowest_price") {
    result.sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
  } else {
    result.sort((a, b) => String(a.departAt).localeCompare(String(b.departAt)));
  }
  return result;
}

async function searchTickets({ userId, draftId, sortBy, filters }) {
  const startedAt = Date.now();
  try {
    const draft = await getDraftOrThrow({ userId, draftId });
    const { fromStation, toStation } = await resolveStationCodes(
      draft.route.fromCity,
      draft.route.toCity
    );
    await ensure12306ServerRegistered();
    const { sortFlag, sortReverse } = mapSortToMcp(sortBy);
    const trainFilterFlags = buildTrainFilterFlags(draft.preferences?.trainTypes || []);

    const directRaw = await mcpManager.callTool("get-tickets", {
      date: draft.date,
      fromStation,
      toStation,
      trainFilterFlags,
      sortFlag,
      sortReverse,
      limitedNum: 20,
      format: "json",
    });
    const directPayload = safeJsonParse(extractMcpText(directRaw), []);
    const directMapped = Array.isArray(directPayload)
      ? directPayload.map((item, idx) => mapDirectOption(item, draft, idx))
      : [];

    const transferRaw = await mcpManager.callTool("get-interline-tickets", {
      date: draft.date,
      fromStation,
      toStation,
      trainFilterFlags,
      sortFlag,
      sortReverse,
      limitedNum: 12,
      format: "json",
    });
    const transferPayload = safeJsonParse(extractMcpText(transferRaw), []);
    const transferMapped = Array.isArray(transferPayload)
      ? transferPayload.map((item, idx) => mapTransferOption(item, draft, idx))
      : [];

    const directOptions = applySort(applyFilters(directMapped, filters), sortBy);
    const transferOptions = applySort(applyFilters(transferMapped, filters), sortBy);
    const total = directOptions.length + transferOptions.length;

    await repository.logTicketQuery({
      draftId,
      userId,
      queryStatus: "success",
      resultCount: total,
      durationMs: Date.now() - startedAt,
      errorCode: null,
    });

    return {
      directOptions,
      transferOptions,
      meta: {
        queryStatus: "success",
        fetchedAt: new Date().toISOString(),
        notice: total === 0 ? "当前条件下暂无可用车次，可尝试调整时段或席别偏好。" : "",
      },
    };
  } catch (error) {
    await repository.logTicketQuery({
      draftId,
      userId,
      queryStatus: error.code === TICKET_ERROR_CODES.DRAFT_EXPIRED ? "partial" : "error",
      resultCount: 0,
      durationMs: Date.now() - startedAt,
      errorCode: error.code || "UNKNOWN_ERROR",
    });
    throw error;
  }
}

function pickRecommendation(list, type) {
  if (!list.length) return null;
  if (type === "fastest") {
    return [...list].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
  }
  if (type === "cheapest") {
    return [...list].sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0))[0];
  }
  return [...list].sort((a, b) => String(a.departAt).localeCompare(String(b.departAt)))[0];
}

function mapRecommendation(option, type) {
  if (!option) return null;
  const reasonByType = {
    fastest: [
      `总耗时约 ${option.durationMinutes} 分钟`,
      "适合优先考虑到达效率",
    ],
    cheapest: [
      `最低票价约 ${option.priceMin} 元`,
      "预算优先时更具性价比",
    ],
    comfortable: [
      "发车时间更友好，行程节奏更稳妥",
      "余票状态相对稳定，改签风险更低",
    ],
  };
  return {
    optionId: option.optionId,
    tripType: option.tripType,
    trainNo: option.trainNo,
    departAt: option.departAt,
    arriveAt: option.arriveAt,
    durationMinutes: option.durationMinutes,
    price: option.priceMin ? `${option.priceMin} 元` : "",
    reasons: reasonByType[type],
    confidence: "medium",
    appliedFilters: {
      preferredOptionId: option.optionId,
    },
  };
}

async function getRecommendations({ userId, draftId }) {
  try {
    const { directOptions, transferOptions } = await searchTickets({
      userId,
      draftId,
      sortBy: "earliest_departure",
      filters: {},
    });
    const all = [...directOptions, ...transferOptions];
    return {
      fastest: mapRecommendation(pickRecommendation(all, "fastest"), "fastest"),
      cheapest: mapRecommendation(pickRecommendation(all, "cheapest"), "cheapest"),
      comfortable: mapRecommendation(pickRecommendation(all, "comfortable"), "comfortable"),
    };
  } catch (_) {
    return {
      fastest: null,
      cheapest: null,
      comfortable: null,
    };
  }
}

module.exports = {
  createDraft,
  getDraftOrThrow,
  searchTickets,
  getRecommendations,
};
