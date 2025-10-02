import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Poison } from '../../db/models/Poison';
import { buildCommand, checkUserRole, createItemEmbed, randomInt, rarityChoices } from '~/helpers';
import { CommandData, Roles } from '~/types';

const commandData: CommandData = {
  name: 'generatepoison',
  description: 'Generate a random poison by rarity',
  category: 'items',
  options: [
    {
      name: 'rarity',
      type: 'string',
      description: 'Rarity of the poison',
      required: true,
      choices: rarityChoices,
    },
  ],
};

const data = buildCommand(commandData);

async function getRandomPoisonByRarity(rarity: string): Promise<Poison | null> {
  const poisons = await Poison.findAll({ where: { rarity } });
  if (!poisons || poisons.length === 0) return null;
  return poisons[Math.floor(Math.random() * poisons.length)];
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

  // const poison = await getRandomItemByRarity<Poison>('~/db/models/Poison', rarity);
  const poison = await getRandomPoisonByRarity(rarity);
  if (!poison) {
    await interaction.reply({
      content: `No poisons found for rarity: ${rarity}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const price = randomInt(poison.price_min, poison.price_max);

  const embed = createItemEmbed(
    `Random Poison (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    poison.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x8e44ad
  );

  await interaction.reply({ embeds: [embed] });
}

export { data, execute, commandData, getRandomPoisonByRarity };
