const GREETING_NAME = "Ramonian";

export function getGreeting(): string {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  return `${greeting} ${GREETING_NAME}!`;
}

export const mask = (str: string) =>
  str.length <= 4
    ? "*".repeat(str.length)
    : str.slice(0, 2) + "*".repeat(str.length - 4) + str.slice(-2);
