const service = require("./ticket.service");

async function createDraft(req, res, next) {
  try {
    const { route, date, preferences } = req.body || {};
    const data = await service.createDraft({
      userId: req.auth.id,
      source: "ai_assistant",
      route,
      date,
      preferences,
    });
    res.json({ code: "OK", data });
  } catch (error) {
    next(error);
  }
}

async function getDraft(req, res, next) {
  try {
    const { draftId } = req.params;
    const data = await service.getDraftOrThrow({
      userId: req.auth.id,
      draftId,
    });
    res.json({ code: "OK", data });
  } catch (error) {
    next(error);
  }
}

async function searchTickets(req, res, next) {
  try {
    const { draftId, sortBy, filters } = req.body || {};
    const data = await service.searchTickets({
      userId: req.auth.id,
      draftId,
      sortBy,
      filters,
    });
    res.json({ code: "OK", data });
  } catch (error) {
    next(error);
  }
}

async function getRecommendations(req, res, next) {
  try {
    const { draftId } = req.body || {};
    const data = await service.getRecommendations({
      userId: req.auth.id,
      draftId,
    });
    res.json({ code: "OK", data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDraft,
  getDraft,
  searchTickets,
  getRecommendations,
};
