import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { Boat } from '~/db/models/Boat';
import { createBoatStatusDescription, tableNamesAutocomplete } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('addboat')
  .setDescription('Add a new boat to the database')
  .addStringOption((opt) => opt.setName('name').setDescription('Boat name').setRequired(true))
  .addIntegerOption((opt) => opt.setName('waittime').setDescription('Weeks at sea').setRequired(true))
  .addIntegerOption((opt) => opt.setName('timeintown').setDescription('Weeks in town').setRequired(true))
  .addStringOption((opt) => opt.setName('city').setDescription('City of origin').setRequired(false))
  .addStringOption((opt) => opt.setName('country').setDescription('Country of origin').setRequired(false))
  .addStringOption((opt) => opt.setName('tier2ability').setDescription('Tier 2 ability description').setRequired(false))
  .addStringOption((opt) =>
    opt.setName('table').setDescription('Table to generate (optional)').setRequired(false).setAutocomplete(true)
  )
  .addBooleanOption((opt) => opt.setName('istier2').setDescription('Is this a tier 2 boat?').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isrunning').setDescription('Is this boat running?').setRequired(false))
  .addIntegerOption((opt) => opt.setName('weeksleft').setDescription('Weeks left (optional)').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isintown').setDescription('Is the boat in town?').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
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
  const weeksLeft = interaction.options.getInteger('weeksleft') ?? waitTime; //TODO if isTier2 then wait time is -1 & if it's in town then use weeks in town.

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
      await interaction.reply({ content: `A boat named "${boatName}" already exists.`, ephemeral: true });
      return;
    }

    console.log(boat);

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
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      content: `Failed to add boat: ${error}`,
      ephemeral: true,
    });
  }
}

// Autocomplete for table options only
export async function autocomplete(interaction: AutocompleteInteraction) {
  await tableNamesAutocomplete(interaction);
}

export const help = {
  name: 'addboat',
  description: 'Add a new boat to the database',
  requiredRole: Roles.GM,
  category: 'boats',
};