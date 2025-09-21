import { readdirSync } from 'fs';
import path from 'path';
import { LastWeeklyRunTime } from '~/db/models/LastWeeklyRunTime';
import { WeeklyData } from '~/types';
import { CronJob } from 'cron';
import cronParser from 'cron-parser';
import { TIMEZONE } from '~/constants';

async function executeWeeklyTasks() {
  try {
    console.log('Starting weekly tasks execution...');

    // Get all TypeScript files in the current directory except this file
    const weeklyFiles = readdirSync(__dirname)
      .filter((file) => file.endsWith('.ts') && file !== path.basename(__filename));

    if (weeklyFiles.length === 0) {
      console.log('No weekly task files found.');
      return;
    }

    // Load and collect all tasks
    const tasks: WeeklyData[] = [];
    for (const file of weeklyFiles) {
      try {
        const module = await import(path.join(__dirname, file));
        const { update, post, order } = module as WeeklyData;

        if (typeof update !== 'function' || typeof post !== 'function') {
          console.warn(`Skipping ${file}: missing required update or post function`);
          continue;
        }

        tasks.push({ update, post, order: order ?? 0 });
      } catch (error) {
        console.error(`Failed to load weekly task from ${file}:`, error);
      }
    }

    if (tasks.length === 0) {
      console.log('No valid weekly tasks found.');
      return;
    }

    // Sort by order (lower numbers = earlier posting)
    tasks.sort((a, b) => (a.order as number) - (b.order as number));

    console.log(`Executing ${tasks.length} weekly task(s)...`);

    // Execute tasks in priority order
    for (const [index, task] of tasks.entries()) {
      try {
        console.log(`Executing task ${index + 1}/${tasks.length} (order: ${task.order})`);
        await task.update();
        await task.post();
        console.log(`Task ${index + 1} completed successfully`);
      } catch (error) {
        console.error(`Task ${index + 1} failed:`, error);
        // Continue with other tasks even if one fails
      }
    }

    console.log('Weekly tasks execution completed.');
  } catch (error) {
    console.error('Failed to execute weekly tasks:', error);
    throw error;
  }
}

async function checkAndRunMissedWeeklyTasks() {
  const now = new Date();

  // Get the most recent scheduled Monday 12:01am occurrence
  const cronExpression = cronParser.parse('1 0 * * 1', {
    tz: TIMEZONE,
    currentDate: now,
  });
  const lastScheduled = cronExpression.prev().toDate();

  const lastRun = await LastWeeklyRunTime.findOne();

  if (!lastRun) {
    // No previous run recorded, execute weekly tasks
    console.log('No previous weekly run found. Executing weekly tasks on startup.');
    await executeWeeklyTasks();
    await LastWeeklyRunTime.create({ value: now }, { silent: true });
  } else {
    const lastRunDate = new Date(lastRun.getDataValue('value'));

    // If the last run was before the most recent scheduled occurrence, run now
    if (lastRunDate < lastScheduled) {
      console.log(
        `Weekly tasks missed (last run: ${lastRunDate.toISOString()}, last scheduled: ${lastScheduled.toISOString()}). Running now.`
      );
      await executeWeeklyTasks();
      await LastWeeklyRunTime.update({ value: now }, { where: { id: lastRun.getDataValue('id') }, silent: true });
    } else {
      console.log('Weekly tasks are up to date.');
    }
  }
}

export default function setupWeeklyTasks() {
  // Check for missed weekly tasks on startup
  checkAndRunMissedWeeklyTasks();

  new CronJob(
    '1 0 * * 1', // 00:01 every Monday
    // '* * * * *', // Every minute
    async () => {
      console.log('Weekly tasks triggered');
      const now = new Date();
      const lastRun = await LastWeeklyRunTime.findOne();

      await executeWeeklyTasks();

      if (!lastRun) {
        await LastWeeklyRunTime.create({ value: now }, { silent: true });
      } else {
        await LastWeeklyRunTime.update({ value: now }, { where: { id: lastRun.getDataValue('id') }, silent: true });
      }
    },
    null,
    true, // start the job now
    'America/New_York' // set your timezone, e.g. 'America/New_York'
  );
}
