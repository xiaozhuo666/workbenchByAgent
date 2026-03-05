const { randomUUID } = require("crypto");
const repository = require("./ticket.repository");
const {
  TICKET_ERROR_CODES,
  draftNotFound,
  draftExpired,
  invalidTicketParams,
} = require("./ticket.errors");

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

function buildMockDirectOptions(draft) {
  const basePrice = draft.preferences?.strategy === "cheapest" ? 420 : 560;
  return [
    {
      optionId: `${draft.draftId}-d1`,
      tripType: "direct",
      trainNo: "G12",
      departAt: `${draft.date} 08:00`,
      arriveAt: `${draft.date} 12:38`,
      durationMinutes: 278,
      priceMin: basePrice,
      seatAvailability: { "二等座": "有票", "一等座": "少量" },
    },
    {
      optionId: `${draft.draftId}-d2`,
      tripType: "direct",
      trainNo: "G24",
      departAt: `${draft.date} 09:30`,
      arriveAt: `${draft.date} 14:20`,
      durationMinutes: 290,
      priceMin: basePrice - 60,
      seatAvailability: { "二等座": "有票", 商务座: "无票" },
    },
    {
      optionId: `${draft.draftId}-d3`,
      tripType: "direct",
      trainNo: "G46",
      departAt: `${draft.date} 11:20`,
      arriveAt: `${draft.date} 16:38`,
      durationMinutes: 318,
      priceMin: basePrice - 80,
      seatAvailability: { "二等座": "少量", "一等座": "有票" },
    },
  ];
}

function buildMockTransferOptions(draft) {
  return [
    {
      optionId: `${draft.draftId}-t1`,
      tripType: "transfer",
      trainNo: "G100 + G220",
      departAt: `${draft.date} 07:10`,
      arriveAt: `${draft.date} 13:20`,
      durationMinutes: 370,
      transferCount: 1,
      transferWaitMinutes: 32,
      priceMin: 430,
      seatAvailability: { "二等座": "有票" },
    },
    {
      optionId: `${draft.draftId}-t2`,
      tripType: "transfer",
      trainNo: "D88 + G300",
      departAt: `${draft.date} 10:00`,
      arriveAt: `${draft.date} 17:30`,
      durationMinutes: 450,
      transferCount: 1,
      transferWaitMinutes: 20,
      priceMin: 360,
      seatAvailability: { "二等座": "有票" },
    },
  ];
}

function applyFilters(options, filters = {}) {
  let result = [...options];
  if (filters.onlySecondClassAvailable) {
    result = result.filter((item) => item.seatAvailability?.["二等座"] && item.seatAvailability["二等座"] !== "无票");
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
    const directOptions = applySort(applyFilters(buildMockDirectOptions(draft), filters), sortBy);
    const transferOptions = applySort(applyFilters(buildMockTransferOptions(draft), filters), sortBy);
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
