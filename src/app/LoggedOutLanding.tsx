import { getLandingStats } from "@/lib/stats";

function formatCount(n: number): string {
  if (n < 10) return n.toString();
  const digits = Math.floor(Math.log10(n));
  const base = 10 ** digits;
  return `>${Math.floor(n / base) * base}`;
}

export default async function LoggedOutLanding() {
  const stats = getLandingStats();
  return (
    <main className="p-8 flex flex-col items-center text-center gap-6">
      <h1 className="text-3xl font-bold">Photo To Citation</h1>
      <p className="text-lg max-w-xl">
        Snap a quick photo of blocked bike lanes or sidewalks and let the app
        handle the paperwork.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {formatCount(stats.casesLastWeek)}
          </div>
          <div className="text-sm">cases created in the last week</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {formatCount(stats.authorityNotifications)}
          </div>
          <div className="text-sm">notifications sent to authorities</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {`<${Math.ceil(stats.avgDaysToNotification)} days`}
          </div>
          <div className="text-sm">average time to notify authorities</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow">
          <div className="text-2xl font-semibold">
            {`>${Math.floor(stats.notificationSuccessRate * 100)}%`}
          </div>
          <div className="text-sm">cases with authority notification</div>
        </div>
      </div>
      <p className="mt-4">
        <a href="/signin" className="text-blue-600 underline">
          Sign in to get started
        </a>
      </p>
    </main>
  );
}
