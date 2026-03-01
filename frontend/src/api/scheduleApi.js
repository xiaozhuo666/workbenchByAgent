import httpClient from "./httpClient";

export const getSchedules = async (params) => {
  const { data } = await httpClient.get("/schedules", { params });
  return data.data;
};

export const createSchedule = async (scheduleData) => {
  const { data } = await httpClient.post("/schedules", scheduleData);
  return data.data;
};

export const deleteSchedule = async (id) => {
  await httpClient.delete(`/schedules/${id}`);
};
