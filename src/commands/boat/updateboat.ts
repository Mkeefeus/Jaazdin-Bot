import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Boat } from '~/db/models/Boat';
import fs from 'fs';
import path from 'path';

const D100TABLES_PATH = path.join(__dirname, '../../../d100tables');

export const data = new SlashCommandBuilder()
  .setName('updateboat')
  .setDescription('Update properties of an existing boat')
  .addStringOption((opt) =>
    opt.setName('name').setDescription('Boat name (required)').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((opt) => opt.setName('city').setDescription('City of origin').setRequired(false))
  .addStringOption((opt) => opt.setName('country').setDescription('Country of origin').setRequired(false))
  .addIntegerOption((opt) => opt.setName('waittime').setDescription('Weeks at sea').setRequired(false))
  .addIntegerOption((opt) => opt.setName('timeintown').setDescription('Weeks in town').setRequired(false))
  .addStringOption((opt) =>
    opt
      .setName('jobs')
      .setDescription('Enter job names as a JSON array, e.g. ["Smith","Cook"]')
      .setRequired(false)
      .setAutocomplete(true)
  )
  .addStringOption((opt) => opt.setName('tier2ability').setDescription('Tier 2 ability description').setRequired(false))
  .addStringOption((opt) => opt.setName('table').setDescription('Table to generate (optional)').setRequired(false))
  .addBooleanOption((opt) => opt.setName('istier2').setDescription('Is this a tier 2 boat?').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isrunning').setDescription('Is this boat running?').setRequired(false))
  .addIntegerOption((opt) => opt.setName('weeksleft').setDescription('Weeks left (optional)').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isintown').setDescription('Is the boat in town?').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  const boatName = interaction.options.getString('name', true);
  const boat = await Boat.findOne({ where: { boatName } });

  if (!boat) {
    await interaction.reply({ content: `No boat named "${boatName}" found.`, ephemeral: true });
    return;
  }

  // Build update object from provided options
  const updates: any = {};
  if (interaction.options.getString('city') !== null) updates.city = interaction.options.getString('city');
  if (interaction.options.getString('country') !== null) updates.country = interaction.options.getString('country');
  if (interaction.options.getInteger('waittime') !== null)
    updates.waitTime = interaction.options.getInteger('waittime');
  if (interaction.options.getInteger('timeintown') !== null)
    updates.timeInTown = interaction.options.getInteger('timeintown');
  if (interaction.options.getString('jobs') !== null) {
    try {
      const jobs = JSON.parse(interaction.options.getString('jobs')!);
      if (!Array.isArray(jobs) || !jobs.every((j) => typeof j === 'string')) throw new Error();
      updates.jobsAffected = jobs;
    } catch {
      await interaction.reply({
        content: 'Please enter job names as a valid JSON array, e.g. ["Smith","Cook"]',
        ephemeral: true,
      });
      return;
    }
  }
  if (interaction.options.getString('tier2ability') !== null)
    updates.tier2Ability = interaction.options.getString('tier2ability');
  if (interaction.options.getString('table') !== null) updates.tableToGenerate = interaction.options.getString('table');
  if (interaction.options.getBoolean('istier2') !== null) updates.isTier2 = interaction.options.getBoolean('istier2');
  if (interaction.options.getBoolean('isrunning') !== null)
    updates.isRunning = interaction.options.getBoolean('isrunning');
  if (interaction.options.getInteger('weeksleft') !== null)
    updates.weeksLeft = interaction.options.getInteger('weeksleft');
  if (interaction.options.getBoolean('isintown') !== null)
    updates.isInTown = interaction.options.getBoolean('isintown');

  try {
    await boat.update(updates);
    await interaction.reply({ content: `Boat "${boatName}" updated successfully!`, ephemeral: true });
  } catch (error) {
    await interaction.reply({ content: `Failed to update boat: ${error}`, ephemeral: true });
  }
}

// Autocomplete for boat name and jobs
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'name') {
    // Autocomplete for boat names
    const boats = await Boat.findAll({ attributes: ['boatName'] });
    const input = focusedOption.value.toLowerCase();
    const filtered = boats
      .map((b) => b.boatName)
      .filter((name) => name.toLowerCase().startsWith(input))
      .slice(0, 25)
      .map((name) => ({ name, value: name }));
    await interaction.respond(filtered);
  } else if (focusedOption.name === 'jobs') {
    // Autocomplete for jobs (from d100tables)
    let jobNames: string[] = [];
    try {
      jobNames = fs
        .readdirSync(D100TABLES_PATH)
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''));
    } catch {}
    const input = focusedOption.value
      .replace(/[\[\]",]/g, '')
      .trim()
      .toLowerCase();
    const filtered = jobNames
      .filter((name) => name.toLowerCase().startsWith(input))
      .slice(0, 25)
      .map((name) => ({ name, value: name }));
    await interaction.respond(filtered);
  }
}