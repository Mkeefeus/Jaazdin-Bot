import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Boat, Shipment } from '~/db/models/Boat';

//TODO player command only.

export const data = new SlashCommandBuilder()
  .setName('showboats')
  .setDescription('Show all boats and their current status');

export async function execute(interaction: ChatInputCommandInteraction) {
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

  // Embed for boats not in town
  if (boatsNotInTown.length > 0) {
    const notInTownDesc = boatsNotInTown.map((b) => `• **${b.boatName}** — ${b.weeksLeft} week(s) left`).join('\n');
    embeds.push(new EmbedBuilder().setTitle('Boats Not In Town').setDescription(notInTownDesc).setColor(0x888888));
  }

  // Embeds for boats in town
  for (const boat of boatsInTownRaw) {
    let goods: { itemName: string; price: number; quantity: number }[] = [];
    if (boat.tableToGenerate && boat.tableToGenerate !== 'NA') {
      // Fetch all shipment rows for this boat
      const shipments = await Shipment.findAll({ where: { boatName: boat.boatName } });
      goods = shipments.map((s) => ({
        itemName: s.itemName,
        price: s.price,
        quantity: s.quantity,
      }));
    }

    let desc = `**Weeks Left:** ${boat.weeksLeft}\n`;

    if (boat.jobsAffected && Array.isArray(boat.jobsAffected) && boat.jobsAffected.length > 0) {
      desc += `${boat.jobsAffected.join(', ')} have their gp wage die amount +1.\n\n`;
    }

    if (boat.isTier2 && boat.tier2Ability) desc += `**Tier 2 Ability:** ${boat.tier2Ability}\n\n`;
    if (goods.length > 0) {
      desc += `**Shipment:**\n${goods
        .map((item) => `• ${item.itemName} (x${item.quantity}) — ${item.price} gp`)
        .join('\n')}`;
    } else {
      desc += `No shipment generated.`;
    }

    embeds.push(new EmbedBuilder().setTitle(boat.boatName).setDescription(desc).setColor(0x2e86c1));
  }

  if (embeds.length === 0) {
    await interaction.reply({ content: 'No boats found.', ephemeral: true });
    return;
  }

  // Discord allows up to 10 embeds per message
  for (let i = 0; i < embeds.length; i += 10) {
    await interaction.reply({ embeds: embeds.slice(i, i + 10), ephemeral: false });
  }
}

export const help = {
  name: 'showboats',
  description: 'Display all boats and their current status',
  requiredRole: null,
  category: 'boats',
};
