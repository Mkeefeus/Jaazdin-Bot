import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Potion } from '../../db/models/Potion';
import { createItemEmbed } from '~/functions/boatHelpers';
import { buildCommand } from '~/functions/commandHelpers';
import { checkUserRole, rarityChoices, randomInt } from '~/functions/helpers';
import { Roles } from '~/types';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: 'generatepotion',
  description: 'Generate a random potion by rarity',
  category: 'items',
  options: [
    {
      name: 'rarity',
      type: 'string',
      description: 'Rarity of the potion',
      required: true,
      choices: rarityChoices,
    },
  ],
};

const data = buildCommand(commandData);

async function getRandomPotionByRarity(rarity: string): Promise<Potion | null> {
  const potions = await Potion.findAll({ where: { rarity } });
  if (!potions || potions.length === 0) return null;
  return potions[Math.floor(Math.random() * potions.length)];
}

async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, [Roles.GM, Roles.DM])) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const rarity = interaction.options.getString('rarity', true);

  const potion = await getRandomPotionByRarity(rarity);
  if (!potion) {
    await interaction.reply({
      content: `No potions found for rarity: ${rarity}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const price = randomInt(potion.price_min, potion.price_max);

  const embed = createItemEmbed(
    `Random Potion (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    potion.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x5dade2
  );

  await interaction.reply({ embeds: [embed] });
}

export { data, execute, commandData, getRandomPotionByRarity };
