import httpClient from "./httpClient";

export async function createTicketDraft(payload) {
  const { data } = await httpClient.post("/ticket-drafts", payload);
  return data.data;
}

export async function getTicketDraft(draftId) {
  const { data } = await httpClient.get(`/ticket-drafts/${draftId}`);
  return data.data;
}

export async function searchTickets(payload) {
  const { data } = await httpClient.post("/tickets/search", payload);
  return data.data;
}

export async function getTicketRecommendations(payload) {
  const { data } = await httpClient.post("/tickets/recommendations", payload);
  return data.data;
}
