export interface ScheduleRecord {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  scheduled: boolean;
  scheduleEvery: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
}
