import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Boat } from '~/db/models/Boat';
import { boatInTownEmbedBuilder } from '~/functions/boatHelpers';

export const data = new SlashCommandBuilder()
  .setName('showboats')
  .setDescription('Show all boats and their current status');

export async function createBoatEmbed(boats: Boat[]) {
  const embeds: EmbedBuilder[] = [];

  const boatsInTown = boats.filter((b) => b.isInTown);
  const boatsNotInTown = boats.filter((b) => !b.isInTown);

  // Embeds for boats in town
  for (const boat of boatsInTown) {
    const boatEmbeds = await boatInTownEmbedBuilder(boat);
    if (Array.isArray(boatEmbeds)) {
      embeds.push(...boatEmbeds);
    } else {
      embeds.push(boatEmbeds);
    }
  }

  // Embed for boats not in town
  if (boatsNotInTown.length > 0) {
    const notInTownDesc = boatsNotInTown.map((b) => `🌊 **${b.boatName}** — ⏳ ${b.weeksLeft} week(s) left`).join('\n');
    embeds.push(
      new EmbedBuilder().setTitle('🚢 Boats Not In Town (At Sea)').setDescription(notInTownDesc).setColor(0x888888)
    );
  }

  return embeds;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  // Boats not in town
  // const boatsNotInTown = await Boat.findAll({
  //   where: { isRunning: true, isInTown: false },
  //   order: [['weeksLeft', 'ASC']],
  //   attributes: ['boatName', 'weeksLeft'],
  // });

  // // Boats in town
  // const boatsInTown = await Boat.findAll({
  //   where: { isRunning: true, isInTown: true },
  //   order: [['weeksLeft', 'ASC']],
  // });

  const runningBoats = await Boat.findAll({
    where: { isRunning: true },
    order: [['weeksLeft', 'ASC']],
  });

  const embeds: EmbedBuilder[] = await createBoatEmbed(runningBoats);
  if (embeds.length === 0) {
    await interaction.reply({ content: 'No boats found.', ephemeral: true });
    return;
  }

  // Discord allows up to 10 embeds per message
  for (let i = 0; i < embeds.length; i += 10) {
    const embedChunk = embeds.slice(i, i + 10);

    if (i === 0) {
      // First message uses reply
      await interaction.reply({ embeds: embedChunk, ephemeral: false });
    } else {
      // Subsequent messages use followUp
      await interaction.followUp({ embeds: embedChunk, ephemeral: false });
    }
  }
}

export const help = {
  name: 'showboats',
  description: 'Display all boats and their current status',
  requiredRole: null,
  category: 'boats',
};
