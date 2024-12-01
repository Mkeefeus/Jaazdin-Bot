import { readdirSync } from 'fs';
import path from 'path';
import { LastWeeklyRunTime } from '~/db/models/LastWeeklyRunTime';

type WeeklyFunctions = {
  update?: () => void;
  post?: () => void;
};

async function executeWeeklyTasks() {
  // Perform the weekly task here
  const weeklyFiles = readdirSync(path.join(__dirname)).filter((file) => file.endsWith('.ts'));
  console.log('Weekly tasks:', weeklyFiles);
  for (const file of weeklyFiles) {
    if (file === 'weekly.ts') continue;
    const { update, post } = (await import(path.join(__dirname, file))) as WeeklyFunctions;
    if (update) {
      update();
    }
    if (post) {
      post();
    }
  }
}

export default function setupWeeklyTasks() {
  setInterval(async () => {
    console.log('Checking weekly tasks');
    const lastRun = await LastWeeklyRunTime.findOne();
    const now = new Date();
    const nextRuntime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay()), 0, 0, 0, 0);

    if (!lastRun) {
      executeWeeklyTasks();
      await LastWeeklyRunTime.create({ value: now }, { silent: true });
    } else if (now >= nextRuntime) {
      executeWeeklyTasks();
      await LastWeeklyRunTime.update({ value: now }, { where: { id: lastRun?.getDataValue('id') }, silent: true });
    }
  }, 60000);
}