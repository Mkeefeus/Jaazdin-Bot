import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
} from 'discord.js';
import { Model } from 'sequelize';
import { Plant } from '~/db/models/Plant.js';
import { formatNames } from '~/functions/helpers';

const ITEMS_PER_PAGE = 5;

export const data = new SlashCommandBuilder()
  .setName('showplants')
  .setDescription('Shows all plants or just your plants')
  .addBooleanOption((option) => option.setName('self').setDescription('Show only your plants').setRequired(false));

function createPlantsEmbed(plants: Plant[], page: number, showingSelf: boolean): [EmbedBuilder, number] {
  const start = page * ITEMS_PER_PAGE;
  const end = Math.min(start + ITEMS_PER_PAGE, plants.length);

  // Group plants by their properties
  const groupedPlants = plants.reduce(
    (acc, plant) => {
      const ageInWeeks = Math.floor((Date.now() - plant.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const key = `${plant.name}-${ageInWeeks}-${plant.character}-${plant.fertilizer_type}`;
      if (!acc[key]) {
        acc[key] = { ...plant.get({ plain: true }), count: 1 }; // Use `get({ plain: true })` to get a plain object
      } else {
        acc[key].count += 1;
      }
      return acc;
    },
    {} as Record<string, Omit<Plant, keyof Model> & { count: number }>
  );

  const totalPages = Math.ceil(Object.keys(groupedPlants).length / ITEMS_PER_PAGE);

  const currentPlants = Object.values(groupedPlants).slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle('🌱')
    .setColor(0x2ecc71)
    .setDescription(showingSelf ? 'Showing your plants' : 'Showing all plants')
    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

  currentPlants.forEach((plant) => {
    const ageInWeeks = (Date.now() - plant.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const fertilizerInfo = plant.fertilizer_type !== 'NONE' ? `\n🧪 ${formatNames(plant.fertilizer_type)}` : '';

    embed.addFields({
      name: `${formatNames(plant.name) + `${plant.count > 1 ? ` (${plant.count})` : ''}`}`,
      value: [`Age: ${ageInWeeks.toFixed(0)} weeks`, `Owner: ${formatNames(plant.character)}${fertilizerInfo}`].join(
        '\n'
      ),
      inline: false,
    });
  });

  return [embed, totalPages];
}

function createButtons(
  currentPage: number,
  totalPages: number,
  showingSelf: boolean
): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId('first')
      .setLabel('<<')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),

    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('<')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),

    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1),

    new ButtonBuilder()
      .setCustomId('last')
      .setLabel('>>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1)
  );

  const filterRow = new ActionRowBuilder<ButtonBuilder>();
  filterRow.addComponents(
    new ButtonBuilder()
      .setCustomId('toggle')
      .setLabel(showingSelf ? 'Show All Plants' : 'Show My Plants')
      .setStyle(showingSelf ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  return [row, filterRow];
}

async function getPlants(userId: string | null): Promise<Plant[]> {
  const plants = await Plant.findAll({
    where: userId ? { user: userId } : {},
    order: [['created_at', 'DESC']],
  });
  return plants;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  let currentPage = 0;
  let showingSelf = interaction.options.getBoolean('self') ?? false;

  try {
    const plants = await getPlants(showingSelf ? interaction.user.id : null);

    if (plants.length === 0) {
      await interaction.reply({
        content: showingSelf ? "You don't have any plants!" : 'No plants found!',
        ephemeral: true,
      });
      return;
    }

    const [embed, totalPages] = createPlantsEmbed(plants, currentPage, showingSelf);
    const components = createButtons(currentPage, totalPages, showingSelf);

    const response = await interaction.reply({
      embeds: [embed],
      components,
      fetchReply: true,
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
    });

    collector.on('collect', async (i: ButtonInteraction) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: 'Only the command user can navigate these plants!',
          ephemeral: true,
        });
        return;
      }

      switch (i.customId) {
        case 'first':
          currentPage = 0;
          break;
        case 'prev':
          currentPage = Math.max(0, currentPage - 1);
          break;
        case 'next':
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case 'last':
          currentPage = totalPages - 1;
          break;
        case 'toggle': {
          showingSelf = !showingSelf;
          const newPlants = await getPlants(showingSelf ? interaction.user.id : null);
          currentPage = 0;

          const [newEmbed, newTotalPages] = createPlantsEmbed(newPlants, currentPage, showingSelf);
          const newComponents = createButtons(currentPage, newTotalPages, showingSelf);

          await i.update({
            embeds: [newEmbed],
            components: newComponents,
          });
          return;
        }
      }

      const currentPlants = await getPlants(showingSelf ? interaction.user.id : null);
      const [updatedEmbed, _] = createPlantsEmbed(currentPlants, currentPage, showingSelf);
      const updatedComponents = createButtons(currentPage, totalPages, showingSelf);

      await i.update({
        embeds: [updatedEmbed],
        components: updatedComponents,
      });
    });

    collector.on('end', () => {
      interaction
        .editReply({
          components: [],
        })
        .catch(console.error);
    });
  } catch (error) {
    console.error('Error in showplants command:', error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
}

export default {
  data,
  execute,
};
