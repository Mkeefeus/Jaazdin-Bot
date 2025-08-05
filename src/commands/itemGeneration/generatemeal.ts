import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Meal } from '../../db/models/Meal';
import { 
  getRandomItemByRarity, 
  createItemEmbed, 
  genericRarityAutocomplete,
  calculateSimpleItemPrice
} from '~/functions/boatHelpers';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatemeal')
  .setDescription('Generate a random meal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the meal').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  await genericRarityAutocomplete(interaction, '~/db/models/Meal');
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rarity = interaction.options.getString('rarity', true);

  const meal = await getRandomItemByRarity<Meal>('~/db/models/Meal', rarity);
  if (!meal) {
    await interaction.reply({
      content: `No meals found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(meal);

  const embed = createItemEmbed(
    `Random Meal (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    meal.name,
    [
      { name: 'Price', value: `${price} gp` }
    ],
    0x27ae60
  );

  await interaction.reply({ embeds: [embed] });
}
