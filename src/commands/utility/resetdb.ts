import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
// import { PlantHarvestInformation, PlantHarvest, PlantInformation, Plants } from "~/db/models/Plants";
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
  .addBooleanOption((option) => option.setName('drop').setDescription('Drop tables if they exist').setRequired(true))
  .addBooleanOption((option) =>
    option.setName('seed').setDescription('Seed the database with default data').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  interaction.deferReply({ ephemeral: true });
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const hasRole = isBotDev(interaction);
  if (!hasRole) {
    await interaction.reply('You do not have permission to use this command');
    return;
  }

  const dropTables = interaction.options.getBoolean('drop');
  const seedTables = interaction.options.getBoolean('seed');

  if (dropTables) {
    await db.sync({ force: true });
  } else {
    await db.sync();
  }
  const modelsPath = path.join(__dirname, '../../db', 'models');

  const modelFiles = (await readdir(modelsPath)).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  if (seedTables) {
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
  await interaction.editReply('DB Reset Complete');
}
