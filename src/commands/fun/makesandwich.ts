import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { IngredientCategory, Ingredient } from "../../db/models/Ingredient.js";

// Fun rating messages
const TASTE_RATINGS = [
  "Gordon Ramsay would cry... tears of joy! 😭",
  "This sandwich belongs in a museum! 🏛️",
  "It's so beautiful, even the ingredients are crying 🥺",
  "Subway is filing for bankruptcy after this one 🥪",
  "This isn't a sandwich, it's a work of art! 🎨",
  "Scientists say this is peak sandwich evolution 🧬",
  "Legend says this sandwich grants immortality 🧙‍♂️",
  "Your taste buds just filed a thank you note 📝",
  "This sandwich just won a Michelin star ⭐",
  "Even picky eaters would love this one! 🤤",
];

const DANGER_RATINGS = [
  "Eating this might give you superpowers... or heartburn 🦸‍♂️",
  "Your stomach: 'Challenge accepted!' 💪",
  "Medical insurance recommended before consumption 🏥",
  "Side effects may include extreme happiness 😊",
  "Caution: May cause spontaneous dance moves 💃",
  "Warning: Highly addictive combination 🚨",
  "Sandwich difficulty level: LEGENDARY 🔥",
  "Your digestive system signed a waiver for this one 📝",
  "Not responsible for any flavor explosions 💥",
  "Approaching dangerous levels of deliciousness ⚠️",
];

const EMOJI_MAP: { [key in IngredientCategory]?: string } = {
  bread: "🍞",
  protein: "🥩",
  cheese: "🧀",
  roughage: "🥬",
  sauce: "🥫",
  extra: "✨",
};

export const data = new SlashCommandBuilder()
  .setName("makesandwich")
  .setDescription("Make Kreider a sandwich!");

function getRandomRating(ratings: string[]): string {
  return ratings[Math.floor(Math.random() * ratings.length)];
}

function generateSandwichScore(): number {
  // Generate a score between 85-100 because all our sandwiches are amazing
  return Math.floor(Math.random() * 16) + 85;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const ingredients: Ingredient[] = (await Ingredient.findAll()).map(
    (ingredient) => ingredient.toJSON()
  );

  if (ingredients.length === 0) {
    await interaction.reply("There are no ingredients in the kitchen!");
    return;
  }

  // Group ingredients by category
  const categories: { [key in IngredientCategory]?: Ingredient[] } = {};
  ingredients.forEach((ingredient) => {
    if (!categories[ingredient.category]) {
      categories[ingredient.category] = [];
    }
    categories[ingredient.category]?.push(ingredient);
  });

  // Generate random sandwich
  const sandwich: { [key in IngredientCategory]?: string } = {};
  Object.keys(categories).forEach((category) => {
    const ingredientsInCategory = categories[category as IngredientCategory];
    if (ingredientsInCategory && ingredientsInCategory.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * ingredientsInCategory.length
      );
      sandwich[category as IngredientCategory] =
        ingredientsInCategory[randomIndex].name;
    }
  });

  // Create fancy embed
  const sandwichScore = generateSandwichScore();
  const embed = new EmbedBuilder()
    .setTitle("🎯 Kreider's Random Sandwich Generator 🎯")
    .setColor(
      sandwichScore >= 95 ? 0xffd700 : sandwichScore >= 90 ? 0x00ff00 : 0x0099ff
    )
    .setDescription("*The ancient sandwich gods have spoken...*")
    .addFields(
      {
        name: "🥪 The Masterpiece",
        value: `A magnificent creation featuring ${sandwich.protein} on ${sandwich.bread}`,
        inline: false,
      },
      {
        name: "👨‍🍳 The Build",
        value: [
          `${EMOJI_MAP.bread} Bread: ${sandwich.bread}`,
          `${EMOJI_MAP.protein} Protein: ${sandwich.protein}`,
          `${EMOJI_MAP.cheese} Cheese: ${sandwich.cheese}`,
          `${EMOJI_MAP.roughage} Roughage: ${sandwich.roughage}`,
          `${EMOJI_MAP.sauce} Sauce: ${sandwich.sauce}`,
          `${EMOJI_MAP.extra} Extra: ${sandwich.extra}`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "⭐ Taste Rating",
        value: getRandomRating(TASTE_RATINGS),
        inline: false,
      },
      {
        name: "☢️ Danger Level",
        value: getRandomRating(DANGER_RATINGS),
        inline: false,
      },
      {
        name: "📊 Sandwich Score",
        value: `${sandwichScore}/100 - ${
          sandwichScore >= 95
            ? "LEGENDARY!"
            : sandwichScore >= 90
            ? "EPIC!"
            : "AWESOME!"
        }`,
        inline: false,
      }
    )
    .setFooter({
      text: `Requested by ${interaction.user.tag} • Warning: Sandwich may cause extreme satisfaction`,
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export default {
  data,
  execute,
};
