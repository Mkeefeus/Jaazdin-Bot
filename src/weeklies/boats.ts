import { Op } from 'sequelize';
import { Boat } from '../db/models/Boat';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { client } from '~/index';
// Import helper functions from boatHelpers
import { handleBoatLeavingTown, handleBoatArrivingInTown, formatBoatInfo, formatShipmentInfo, getTableDescription } from '../functions/boatHelpers';

async function update() {
  // 1. Advance all running boats by 1 week
  await Boat.update(
    { weeksLeft: (Boat.sequelize as import('sequelize').Sequelize).literal('weeks_left - 1') },
    { where: { isRunning: true } }
  );

  // 2. Update boats that reached 0 weeks
  const boatsToUpdate = await Boat.findAll({
    where: {
      isRunning: true,
      weeksLeft: { [Op.lte]: 0 },
    },
  });

  for (const boat of boatsToUpdate) {
    if (boat.isInTown) {
      // Boat is leaving town
      await handleBoatLeavingTown(boat);
    } else {
      // Boat is arriving in town
      await handleBoatArrivingInTown(boat);
    }
  }
}

async function post() {
  // Boats not in town
  const boatsNotInTownRaw = await Boat.findAll({
    where: { isRunning: true, isInTown: false },
    order: [['weeksLeft', 'ASC']],
    attributes: ['boatName', 'weeksLeft'],
  });
  const boatsNotInTown = boatsNotInTownRaw.map((b) => ({
    boatName: b.boatName,
    weeksLeft: b.weeksLeft,
  }));

  // Boats in town
  const boatsInTownRaw = await Boat.findAll({
    where: { isRunning: true, isInTown: true },
    order: [['weeksLeft', 'ASC']],
  });

  const embeds: EmbedBuilder[] = [];
  const CHANNEL_ID = '1309206984196755506';

  // Embed for boats not in town
  if (boatsNotInTown.length > 0) {
    const notInTownDesc = boatsNotInTown.map((b) => `• **${b.boatName}** — ${b.weeksLeft} week(s) left`).join('\n');
    embeds.push(new EmbedBuilder().setTitle('Boats Not In Town').setDescription(notInTownDesc).setColor(0x888888));
  }

  // Embeds for boats in town
  for (const boat of boatsInTownRaw) {
    // Use the standardized boat info formatting
    const boatInfo = formatBoatInfo(boat);
    const shipmentInfo = await formatShipmentInfo(boat.boatName);
    const tableDescription = getTableDescription(boat.tableToGenerate);
    
    let desc = boatInfo;
    if (tableDescription) {
      desc += `\n**Table:** ${tableDescription}`;
    }
    if (shipmentInfo) {
      desc += `\n\n${shipmentInfo}`;
    }

    embeds.push(new EmbedBuilder().setTitle(boat.boatName).setDescription(desc).setColor(0x2e86c1));
  }

  if (!client.isReady()) {
    console.warn('Discord client not ready.');
    return;
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel instanceof TextChannel) {
      for (let i = 0; i < embeds.length; i += 10) {
        await channel.send({ embeds: embeds.slice(i, i + 10) });
      }
      console.log('Boat update sent to Discord.');
    } else {
      console.warn('Target channel is not a text channel.');
    }
  } catch (error) {
    console.error('Failed to send boat update:', error);
  }
}

export { update, post };
