import { getLandingStats } from "@/lib/stats";
import LoggedOutLandingClient from "./LoggedOutLandingClient";

export default function LoggedOutLanding() {
  const stats = getLandingStats();
  return <LoggedOutLandingClient stats={stats} />;
}
