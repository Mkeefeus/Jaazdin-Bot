import { readdirSync } from 'fs';
import path from 'path';
import { LastWeeklyRunTime } from '~/db/models/LastWeeklyRunTime';
import { WeeklyFunctions } from '~/types/weeklyfunctions';
import { CronJob } from 'cron';
import cronParser from 'cron-parser';
import { TIMEZONE } from '~/constants';

async function executeWeeklyTasks() {
  // Perform the weekly task here
  const weeklyFiles = readdirSync(path.join(__dirname)).filter((file) => file.endsWith('.ts'));
  for (const file of weeklyFiles) {
    if (file === path.basename(__filename)) continue;
    const { update, post } = (await import(path.join(__dirname, file))) as WeeklyFunctions;
    if (!update || !post) {
      //Some sort of warning
      console.log(`Missing update or post method for ${file}.`);
      return;
    }
    await update();
    await post();
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
