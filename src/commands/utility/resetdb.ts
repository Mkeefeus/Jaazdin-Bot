import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
// import { PlantHarvestInformation, PlantHarvests, PlantInformation, Plants } from "~/db/models/Plants";
import { isBotDev } from '~/functions/helpers';
import { db } from '~/db/db';
// import { Ingredients, Ingredient, IngredientCategory } from "~/db/models/Ingredients";
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir } from 'fs/promises';
// import { Command } from "~/types/command";

interface SeedFunction {
  seed: () => Promise<void>;
}

export const data = new SlashCommandBuilder()
  .setName('resetdb')
  .setDescription('Resets the database')
  .addBooleanOption((option) => option.setName('drop').setDescription('Drop tables if they exist').setRequired(false))
  .addBooleanOption((option) =>
    option.setName('seed').setDescription('Seed the database with default data').setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let hasRole = isBotDev(interaction);
  if (!hasRole) {
    await interaction.reply('You do not have permission to use this command');
    return;
  }

  const dropTables = interaction.options.getBoolean('drop') ?? false;
  const seedTables = interaction.options.getBoolean('seed') ?? false;

  if (dropTables) {
    await db.sync({ force: true });
    await interaction.reply('Tables dropped successfully');
  } else {
    await db.sync();
  }
  const modelsPath = path.join(__dirname, '../../db', 'models');

  const modelFiles = (await readdir(modelsPath)).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of modelFiles) {
    const filePath = path.join(modelsPath, file);
    const fileUrl = new URL(`file://${filePath}`).href;

    try {
      const model = (await import(fileUrl)) as SeedFunction;
      try {
        if (model.seed) {
          await model.seed();
          console.log(`Seeded ${file}`);
        }
      } catch (error) {
        console.error(`Error seeding ${file}:`, error);
      }

      // if (seedTables) {
      //     await syncPlantsDatabase(interaction);
      //     const plantData = await import('~/../plantInformation.json');
      //     await seedPlantsDatabase(plantData);
      //     await interaction.reply("Database seeded successfully");
      // }
    } catch (error) {
      console.error(error);
      await interaction.reply('An error occurred');
    }
  }
}
