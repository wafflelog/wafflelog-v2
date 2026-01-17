import dayjs from "dayjs";

export function formatDate(date: string) {
  return dayjs(date).format("DD MMM YYYY");
}

export function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
