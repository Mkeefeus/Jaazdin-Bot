import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Boat, Shipment } from '~/db/models/Boat';
import { createBoatStatusDescription, tableToGenerateChoices, generateShipmentItems } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('addboat')
  .setDescription('Add a new boat to the database')
  .addStringOption((opt) => opt.setName('name').setDescription('Boat name').setRequired(true))
  .addIntegerOption((opt) => opt.setName('waittime').setDescription('Weeks at sea').setRequired(true))
  .addIntegerOption((opt) => opt.setName('timeintown').setDescription('Weeks in town').setRequired(true))
  .addStringOption((opt) => opt.setName('city').setDescription('City of origin').setRequired(false))
  .addStringOption((opt) => opt.setName('country').setDescription('Country of origin').setRequired(false))
  .addStringOption((opt) => opt.setName('tier2ability').setDescription('Tier 2 ability description').setRequired(false))
  .addStringOption((option) =>
    option
      .setName('table')
      .setDescription('What type of loot the boat will generate')
      .setRequired(false)
      .setChoices(tableToGenerateChoices)
  )
  .addBooleanOption((opt) => opt.setName('istier2').setDescription('Is this a tier 2 boat? (default false)').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isrunning').setDescription('Is this boat running? (default true)').setRequired(false))
  .addIntegerOption((opt) => opt.setName('weeksleft').setDescription('Weeks left (default furthest from town or in town for longest time)').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isintown').setDescription('Is the boat in town? (default false)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const boatName = interaction.options.getString('name', true);
  const city = interaction.options.getString('city', false);
  const country = interaction.options.getString('country', false);
  const waitTime = interaction.options.getInteger('waittime', true);
  const timeInTown = interaction.options.getInteger('timeintown', true);

  // No jobs initially - use /boat-add-job to add jobs after creation
  const jobsAffected: string[] = [];

  const tier2Ability = interaction.options.getString('tier2ability') ?? '';
  const tableToGenerate = interaction.options.getString('table') ?? '';
  const isTier2 = interaction.options.getBoolean('istier2') ?? false;
  const isRunning = interaction.options.getBoolean('isrunning') ?? true;
  const isInTown = interaction.options.getBoolean('isintown') ?? false;
  let weeksLeft = interaction.options.getInteger('weeksleft');
  if (weeksLeft === null) {
    if (isInTown) {
      weeksLeft = isTier2 ? timeInTown + 1 : timeInTown;
    } else {
      weeksLeft = isTier2 ? waitTime - 1 : waitTime;
    }
  }

  try {
    const [boat, created] = await Boat.findOrCreate({
      where: { boatName },
      defaults: {
        city,
        country,
        waitTime,
        timeInTown,
        jobsAffected,
        tier2Ability,
        tableToGenerate,
        isTier2,
        isRunning,
        weeksLeft,
        isInTown,
      },
    });

    if (!created) {
      await interaction.reply({ content: `A boat named "${boatName}" already exists.`, flags: MessageFlags.Ephemeral });
      return;
    }

    // If the boat is in town and has a table to generate, create a shipment
    if (boat.isInTown && boat.tableToGenerate && boat.tableToGenerate !== 'NA') {
      // Remove any existing shipments for this boat (shouldn't be any, but for safety)
      await Shipment.destroy({ where: { boatName: boat.boatName } });
      const goods = await generateShipmentItems(boat);
      for (const item of goods) {
        await Shipment.create({
          boatName: boat.boatName,
          itemName: item.itemName,
          price: item.price,
          quantity: item.quantity,
        });
      }
    }

    // Create detailed response with boat information
    const description = await createBoatStatusDescription(boat);
    const embed = new EmbedBuilder()
      .setTitle('✅ Boat Added Successfully')
      .setDescription(description)
      .setColor(0x00ff00)
      .addFields([
        {
          name: '📋 Next Steps',
          value: 'Use `/boat-add-job` to assign jobs to this boat.\nUse `/showboats` to view boat details.',
          inline: false,
        },
      ]);

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    await interaction.reply({
      content: `Failed to add boat: ${error}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export const help = {
  name: 'addboat',
  description: 'Add a new boat to the database',
  requiredRole: Roles.GM,
  category: 'boats',
};
