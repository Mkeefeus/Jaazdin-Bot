import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Poison } from '../../db/models/Poison';
import { 
  getRandomItemByRarity, 
  createItemEmbed, 
  genericRarityAutocomplete,
  calculateSimpleItemPrice
} from '~/functions/boatHelpers';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatepoison')
  .setDescription('Generate a random poison by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the poison').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  await genericRarityAutocomplete(interaction, '~/db/models/Poison');
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rarity = interaction.options.getString('rarity', true);

  const poison = await getRandomItemByRarity<Poison>('~/db/models/Poison', rarity);
  if (!poison) {
    await interaction.reply({
      content: `No poisons found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(poison);

  const embed = createItemEmbed(
    `Random Poison (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    poison.name,
    [
      { name: 'Price', value: `${price} gp` }
    ],
    0x8e44ad
  );

  await interaction.reply({ embeds: [embed] });
}
