import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { IngredientCategory, Ingredient } from '~/db/models/Ingredient';
import { HelpData } from '~/types/command';

export const data = new SlashCommandBuilder()
  .setName('kitchen')
  .setDescription('Shows all available ingredients in the kitchen');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const ingredients: Ingredient[] = (await Ingredient.findAll()).map((ingredient) => ingredient.toJSON());

    if (ingredients.length === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🚫 Empty Kitchen!')
            .setDescription('The kitchen is empty! Add some ingredients with `/addingredient`')
            .setFooter({
              text: 'Tip: Try adding bread, meat, cheese, and other ingredients!',
            }),
        ],
      });
      return;
    }

    const categories = Object.values(IngredientCategory).reduce(
      (acc, category) => {
        acc[category] = [];
        return acc;
      },
      {} as Record<IngredientCategory, Ingredient[]>
    );

    ingredients.forEach((ingredient) => {
      if (ingredient.category in categories) {
        categories[ingredient.category as IngredientCategory].push(ingredient);
      }
    });

    const totalIngredients = ingredients.length;
    const categoryStats = Object.entries(categories)
      .map(([cat, ingredients]) => `${getCategoryEmoji(cat as IngredientCategory)} ${ingredients.length}`)
      .join(' // ');

    const embed = new EmbedBuilder()
      .setTitle("👨‍🍳 Kreider's Gourmet Kitchen")
      .setColor(0xffa500)
      .setDescription(
        `**Total Ingredients:** ${totalIngredients}\n` +
          `${categoryStats}\n\n` +
          `*Available ingredients for your perfect sandwich:*`
      )
      .setTimestamp();

    // Add category fields in two rows for better layout
    const categoryEntries = Object.entries(categories);
    const midpoint = Math.ceil(categoryEntries.length / 2);

    // First row
    categoryEntries.slice(0, midpoint).forEach(([category, categoryIngredients]) => {
      const emoji = getCategoryEmoji(category as IngredientCategory);
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      const header = `${emoji} ${formattedCategory}`;

      const ingredientList =
        categoryIngredients.length > 0
          ? categoryIngredients.map((ingredient) => `• ${ingredient.name}`).join('\n')
          : '*None available*';

      embed.addFields({
        name: header,
        value: ingredientList,
        inline: true,
      });
    });

    // Add a blank field for spacing if needed
    if (categoryEntries.length % 2 !== 0) {
      embed.addFields({ name: '\u200b', value: '\u200b', inline: true });
    }

    // Second row
    categoryEntries.slice(midpoint).forEach(([category, categoryIngredients]) => {
      const emoji = getCategoryEmoji(category as IngredientCategory);
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      const header = `${emoji} ${formattedCategory}`;

      const ingredientList =
        categoryIngredients.length > 0
          ? categoryIngredients.map((ingredient) => `• ${ingredient.name}`).join('\n')
          : '*None available*';

      embed.addFields({
        name: header,
        value: ingredientList,
        inline: true,
      });
    });

    // Footer with tip
    // embed.setFooter({
    //   text: "💡 Use /makesandwich to create a random sandwich with these ingredients!",
    // });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error listing ingredients:', error);
    if (interaction.deferred) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Error')
            .setDescription('There was an error accessing the kitchen!'),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Error')
            .setDescription('There was an error accessing the kitchen!'),
        ],
      });
    }
  }
}

function getCategoryEmoji(category: IngredientCategory): string {
  const emojiMap: Record<IngredientCategory, string> = {
    [IngredientCategory.bread]: '🍞',
    [IngredientCategory.protein]: '🥩',
    [IngredientCategory.cheese]: '🧀',
    [IngredientCategory.roughage]: '🥬',
    [IngredientCategory.sauce]: '🥫',
    [IngredientCategory.extra]: '✨',
  };
  return emojiMap[category];
}

export const help: HelpData = {
  name: 'kitchen',
  description: "Display all ingredients in Kreider's kitchen organized by category",
  category: 'fun',
};

export default {
  data,
  execute,
};
