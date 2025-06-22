export interface LandingStats {
  casesLastWeek: number;
  authorityNotifications: number;
  avgDaysToNotification: number;
  notificationSuccessRate: number;
}

export function getLandingStats(): LandingStats {
  return {
    casesLastWeek: 0,
    authorityNotifications: 0,
    avgDaysToNotification: 0,
    notificationSuccessRate: 0,
  };
}
