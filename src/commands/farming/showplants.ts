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
import { Plant, PlantInformation } from '~/db/models/Plant.js';
import { formatNames } from '~/functions/helpers';

const ITEMS_PER_PAGE = 3;

interface PlantDisplay {
  id: number;
  name: string;
  plantedAt: Date;
  fertilizerType: string;
  yieldMultiplier: number;
  growthMultiplier: number;
  owner: string;
}

export const data = new SlashCommandBuilder()
  .setName('showplants')
  .setDescription('Shows all plants or just your plants')
  .addBooleanOption((option) => option.setName('self').setDescription('Show only your plants').setRequired(false));

async function getPlants(userId: string | null = null): Promise<PlantDisplay[]> {
  const whereClause = userId ? { user: userId } : {};
  const plants = await Plant.findAll({
    where: whereClause,
    include: [
      {
        model: PlantInformation,
        as: 'information',
      },
    ],
    order: [['planted_at', 'DESC']],
  });

  return plants.map((plant) => ({
    id: plant.getDataValue('id'),
    name: plant.getDataValue('name'),
    plantedAt: plant.getDataValue('planted_at'),
    fertilizerType: plant.getDataValue('fertilizer_type'),
    yieldMultiplier: plant.getDataValue('yield_multiplier') || 1.0,
    growthMultiplier: plant.getDataValue('growth_multiplier') || 1.0,
    owner: plant.getDataValue('user'),
  }));
}

function createPlantsEmbed(
  plants: PlantDisplay[],
  page: number,
  totalPages: number,
  showingSelf: boolean
): EmbedBuilder {
  const start = page * ITEMS_PER_PAGE;
  const end = Math.min(start + ITEMS_PER_PAGE, plants.length);
  const currentPlants = plants.slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle('🌱 Your Garden')
    .setColor(0x2ecc71)
    .setDescription(showingSelf ? 'Showing your plants' : 'Showing all plants')
    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

  currentPlants.forEach((plant) => {
    const ageInWeeks = (Date.now() - plant.plantedAt.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const fertilizerInfo =
      plant.fertilizerType !== 'NONE'
        ? `\n🧪 ${plant.fertilizerType} (Yield: ${((plant.yieldMultiplier - 1) * 100).toFixed(0)}%, Growth: ${((plant.growthMultiplier - 1) * 100).toFixed(0)}%)`
        : '';

    embed.addFields({
      name: `${formatNames(plant.name)} (ID: ${plant.id})`,
      value: [`Age: ${ageInWeeks.toFixed(1)} weeks`, `Owner: <@${plant.owner}>${fertilizerInfo}`].join('\n'),
      inline: false,
    });
  });

  return embed;
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

export async function execute(interaction: ChatInputCommandInteraction) {
  let currentPage = 0;
  let showingSelf = interaction.options.getBoolean('self') ?? false;

  try {
    const plants = await getPlants(showingSelf ? interaction.user.id : null);
    const totalPages = Math.ceil(plants.length / ITEMS_PER_PAGE);

    if (plants.length === 0) {
      await interaction.reply({
        content: showingSelf ? "You don't have any plants!" : 'No plants found!',
        ephemeral: true,
      });
      return;
    }

    const embed = createPlantsEmbed(plants, currentPage, totalPages, showingSelf);
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
          const newTotalPages = Math.ceil(newPlants.length / ITEMS_PER_PAGE);
          currentPage = 0;

          const newEmbed = createPlantsEmbed(newPlants, currentPage, newTotalPages, showingSelf);
          const newComponents = createButtons(currentPage, newTotalPages, showingSelf);

          await i.update({
            embeds: [newEmbed],
            components: newComponents,
          });
          return;
        }
      }

      const currentPlants = await getPlants(showingSelf ? interaction.user.id : null);
      const updatedEmbed = createPlantsEmbed(currentPlants, currentPage, totalPages, showingSelf);
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
