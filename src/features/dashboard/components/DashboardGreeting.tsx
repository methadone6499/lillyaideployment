import type { DashboardUser } from "../types";

type DashboardGreetingProps = {
  user: DashboardUser;
};

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning,";
  }

  if (hour < 17) {
    return "Good Afternoon,";
  }

  return "Good Evening,";
}

export function DashboardGreeting({ user }: DashboardGreetingProps) {
  return (
    <h1 className="flex flex-wrap items-center gap-2.5 text-[29px] leading-[29px]">
      <span className="font-medium text-text-body">{getGreeting()}</span>
      <span className="font-semibold text-brand">{user.displayName}</span>
    </h1>
  );
}
