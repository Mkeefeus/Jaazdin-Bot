import { db } from 'db/db';
import { ChatInputCommandInteraction } from 'discord.js';
import { IngredientCategory, Ingredient } from '~/db/models/Ingredient';
import { buildCommand } from '~/functions/commandHelpers';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: 'addingredient',
  description: "Adds an ingredient to Kreider's kitchen",
  category: 'fun',
  options: [
    {
      name: 'name',
      type: 'string',
      description: 'The name of the ingredient. You can add multiple separated by commas.',
      required: true,
    },
    {
      name: 'category',
      type: 'string',
      description: 'The type of ingredient',
      required: true,
      choices: Object.values(IngredientCategory).map((category) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: category,
      })),
    },
  ],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const category = interaction.options.getString('category')?.toLowerCase() as string;

  try {
    db.authenticate();

    const ingredientNames = name.split(',').map((name) => name.trim());

    // Remove duplicates from input
    const uniqueNames = [...new Set(ingredientNames)];

    if (uniqueNames.length === 0) {
      await interaction.reply('Please provide valid ingredient names');
      return;
    }

    const existingIngredients = await Ingredient.findAll({
      where: { name: uniqueNames, category: category },
    });

    const existingNames = existingIngredients.map((ing) => (ing.get('name') as string).toLowerCase());

    const newIngredients = uniqueNames.filter((name) => !existingNames.includes(name));

    if (newIngredients.length === 0) {
      await interaction.reply(
        existingNames.length === 1
          ? 'That ingredient already exists in the kitchen'
          : 'All those ingredients already exist in the kitchen'
      );
      return;
    }

    await Promise.all(
      newIngredients.map((name) =>
        Ingredient.create({
          name,
          category: category as IngredientCategory,
        })
      )
    );

    let response = '';
    if (newIngredients.length === uniqueNames.length) {
      response = `Added ${newIngredients.join(', ')} to the kitchen`;
    } else {
      response = `Added ${newIngredients.join(', ')} to the kitchen. ${
        uniqueNames.length - newIngredients.length
      } ingredient(s) already existed in the kitchen`;
    }

    await interaction.reply(`${response}`);
  } catch (e) {
    console.error('Error adding ingredient:', e);
    await interaction.reply('Error adding ingredient');
  }
}

export { data, execute, commandData };
