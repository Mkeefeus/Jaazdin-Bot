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

export default function setupWeeklyTasks() {
  setInterval(async () => {
    console.log('Checking weekly tasks');
    const lastRun = await LastWeeklyRunTime.findOne();
    const now = new Date();
    const nextRuntime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((1 + 7 - now.getDay()) % 7), 0, 1);

    if (!lastRun) {
      executeWeeklyTasks();
      await LastWeeklyRunTime.create({ value: now }, { silent: true });
    } else if (now >= nextRuntime) {
      executeWeeklyTasks();
      await LastWeeklyRunTime.update({ value: now }, { where: { id: lastRun?.getDataValue('id') }, silent: true });
    } else {
      //always run tasks for dev purposes
      // executeWeeklyTasks();
    }
  }, 6000);
}
