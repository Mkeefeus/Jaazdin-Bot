import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Boat } from '~/db/models/Boat';
import fs from 'fs';
import path from 'path';

const D100TABLES_PATH = path.join(__dirname, '../../../d100tables');

export const data = new SlashCommandBuilder()
  .setName('addboat')
  .setDescription('Add a new boat to the database')
  .addStringOption((opt) => opt.setName('name').setDescription('Boat name').setRequired(true))
  .addStringOption((opt) => opt.setName('city').setDescription('City of origin').setRequired(true))
  .addStringOption((opt) => opt.setName('country').setDescription('Country of origin').setRequired(true))
  .addIntegerOption((opt) => opt.setName('waittime').setDescription('Weeks at sea').setRequired(true))
  .addIntegerOption((opt) => opt.setName('timeintown').setDescription('Weeks in town').setRequired(true))
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
  const city = interaction.options.getString('city', true);
  const country = interaction.options.getString('country', true);
  const waitTime = interaction.options.getInteger('waittime', true);
  const timeInTown = interaction.options.getInteger('timeintown', true);

  let jobsAffected: string[] = [];
  const jobsRaw = interaction.options.getString('jobs');
  if (jobsRaw) {
    try {
      const parsed = JSON.parse(jobsRaw);
      if (!Array.isArray(parsed) || !parsed.every((j) => typeof j === 'string')) {
        throw new Error();
      }
      jobsAffected = parsed;
    } catch {
      await interaction.reply({
        content: 'Please enter job names as a valid JSON array, e.g. ["Smith","Cook"]',
        ephemeral: true,
      });
      return;
    }
  }

  const tier2Ability = interaction.options.getString('tier2ability') ?? '';
  const tableToGenerate = interaction.options.getString('table') ?? '';
  const isTier2 = interaction.options.getBoolean('istier2') ?? false;
  const isRunning = interaction.options.getBoolean('isrunning') ?? true;
  const weeksLeft = interaction.options.getInteger('weeksleft') ?? waitTime;
  const isInTown = interaction.options.getBoolean('isintown') ?? false;

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

    await interaction.reply({
      content: `Boat "${boatName}" added successfully!`,
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      content: `Failed to add boat: ${error}`,
      ephemeral: true,
    });
  }
}

// Autocomplete for jobs option
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused();
  let jobNames: string[] = [];
  try {
    jobNames = fs
      .readdirSync(D100TABLES_PATH)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));
  } catch {
    // fallback: no suggestions
  }

  // Suggest jobs that match the current input (case-insensitive)
  const input = focused
    .replace(/[\[\]",]/g, '')
    .trim()
    .toLowerCase();
  const filtered = jobNames
    .filter((name) => name.toLowerCase().startsWith(input))
    .slice(0, 25)
    .map((name) => ({ name, value: name }));

  await interaction.respond(filtered);
}