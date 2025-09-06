export const getElapsedTime = (initialDate: Date, lastDate: Date) => {
  const start = new Date(initialDate).getTime();
  const end = new Date(lastDate).getTime();
  const diff = Math.floor((end - start) / 1000);

  const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
  const seconds = String(diff % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};
