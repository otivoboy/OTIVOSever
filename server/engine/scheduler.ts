import { storage } from '../storage.js';
import { BotRecord } from '../types.js';

export interface SchedulerCallback {
  onStartBot: (bot: BotRecord) => Promise<void>;
  onStopBot: (bot: BotRecord, reason: string) => Promise<void>;
}

export class DurableScheduler {
  private intervalHandle: NodeJS.Timeout | null = null;
  private callbacks: SchedulerCallback | null = null;

  public start(callbacks: SchedulerCallback): void {
    this.callbacks = callbacks;
    if (this.intervalHandle) clearInterval(this.intervalHandle);

    // Evaluate schedules every 2 seconds
    this.intervalHandle = setInterval(() => {
      this.evaluateSchedules();
    }, 2000);

    storage.addLog({
      level: 'INFO',
      message: '[SCHEDULER] Persistent cloud schedule engine started. Independent UTC clock active.'
    });
  }

  public stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async evaluateSchedules() {
    if (!this.callbacks) return;
    const bots = storage.getBots();
    const now = new Date();
    const nowUtcMs = now.getTime();
    const nowUtcDay = now.getUTCDay();

    for (const bot of bots) {
      const schedule = bot.schedule;

      // 1. Check STOP time for RUNNING bots
      if (bot.status === 'RUNNING' && schedule.stopDateTime) {
        const stopMs = new Date(schedule.stopDateTime).getTime();
        if (nowUtcMs >= stopMs) {
          await this.callbacks.onStopBot(bot, `Configured scheduled stop time (${schedule.stopDateTime}) reached.`);
          continue;
        }
      }

      // Check permitted hours/days
      if (bot.status === 'RUNNING' && schedule.permittedDays && schedule.permittedDays.length > 0) {
        if (!schedule.permittedDays.includes(nowUtcDay)) {
          await this.callbacks.onStopBot(bot, `Current UTC day (${nowUtcDay}) outside permitted trading days.`);
          continue;
        }
      }

      // 2. Check START time for SCHEDULED bots
      if (bot.status === 'SCHEDULED' && schedule.startDateTime) {
        const startMs = new Date(schedule.startDateTime).getTime();
        if (nowUtcMs >= startMs) {
          // If past stop time as well, cancel
          if (schedule.stopDateTime && nowUtcMs >= new Date(schedule.stopDateTime).getTime()) {
            bot.status = 'STOPPED';
            bot.executionState = 'STOPPED';
            bot.lastError = 'Missed schedule window: start & stop times already expired.';
            storage.saveBot(bot);
            continue;
          }

          storage.addLog({
            botId: bot.id,
            userId: bot.userId,
            level: 'INFO',
            message: `[SCHEDULER] Scheduled start time reached for '${bot.name}'. Booting worker trading lifecycle.`
          });

          storage.addNotification({
            userId: bot.userId,
            type: 'SCHEDULE_STARTED',
            title: 'Bot Scheduled Start Triggered',
            message: `Bot "${bot.name}" has started executing according to your cloud schedule.`,
            data: { botId: bot.id }
          });

          await this.callbacks.onStartBot(bot);
        }
      }
    }
  }
}

export const scheduler = new DurableScheduler();
