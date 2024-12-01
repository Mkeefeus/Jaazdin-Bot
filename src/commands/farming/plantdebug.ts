import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AutocompleteInteraction } from 'discord.js';
import { Op } from 'sequelize';
import { PlantHarvestInformation, PlantInformation } from '~/db/models/Plant';
import { isBotDev } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('plantdebug')
  .setDescription('Shows detailed plant information for debugging')
  .addStringOption((option) =>
    option.setName('name').setDescription('Name of the plant to look up').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.member) return;

  const hasRole = isBotDev(interaction);
  if (!hasRole) {
    await interaction.reply({
      content: 'You do not have permission to use this command',
      ephemeral: true,
    });
    return;
  }

  const plantName = interaction.options.getString('name', true);

  try {
    // Find the plant and include its harvest information
    const plant = await PlantInformation.findOne({
      where: { name: plantName },
      include: [
        {
          model: PlantHarvestInformation,
          as: 'harvests',
        },
      ],
    });

    if (!plant) {
      await interaction.reply({
        content: `No plant found with name: ${plantName}`,
        ephemeral: true,
      });
      return;
    }

    // Create an embed with the plant information
    const embed = new EmbedBuilder()
      .setTitle(`🌱 Debug Info: ${plant.getDataValue('name')}`)
      .setColor(0x00ff00)
      .addFields(
        { name: 'ID', value: `${plant.getDataValue('id')}`, inline: true },
        { name: 'Maturity Time', value: `${plant.getDataValue('maturity_time')} weeks`, inline: true },
        { name: 'Created At', value: plant.getDataValue('createdAt').toLocaleString(), inline: true }
      );

    // Add harvest information
    const harvests = plant.getDataValue('harvests');
    if (harvests && harvests.length > 0) {
      embed.addFields({
        name: '🔄 Harvests',
        value: '───────────────────',
        inline: false,
      });

      harvests.forEach((harvest: any, index: number) => {
        embed.addFields({
          name: `Harvest ${index + 1}: ${harvest.harvest_name}`,
          value: [
            `ID: ${harvest.id}`,
            `Time: ${harvest.harvest_time} weeks`,
            `Amount: ${harvest.harvest_amount}`,
            `Renewable: ${harvest.renewable ? 'Yes' : 'No'}`,
            `Created: ${harvest.createdAt.toLocaleString()}`,
          ].join('\n'),
          inline: true,
        });
      });
    } else {
      embed.addFields({
        name: '🔄 Harvests',
        value: 'No harvest information found',
        inline: false,
      });
    }

    // Add raw data field for complete debugging
    embed.addFields({
      name: '📑 Raw Data',
      value: `\`\`\`json\n${JSON.stringify(
        {
          plant: {
            id: plant.getDataValue('id'),
            name: plant.getDataValue('name'),
            maturity_time: plant.getDataValue('maturity_time'),
            createdAt: plant.getDataValue('createdAt'),
            updatedAt: plant.getDataValue('updatedAt'),
          },
          harvests: harvests,
        },
        null,
        2
      )}\`\`\``,
      inline: false,
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error in plantdebug command:', error);
    await interaction.reply({
      content: 'Error retrieving plant information',
      ephemeral: true,
    });
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  try {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    // Get all plants if no search term, or search by partial name
    const plants = await PlantInformation.findAll({
      where: focusedValue
        ? {
            name: {
              [Op.like]: `%${focusedValue}%`,
            },
          }
        : {},
      limit: 25,
      order: [['name', 'ASC']],
    });

    await interaction.respond(
      plants.map((plant) => ({
        name: plant.getDataValue('name'),
        value: plant.getDataValue('name'),
      }))
    );
  } catch (error) {
    console.error('Error in plantdebug autocomplete:', error);
    await interaction.respond([]);
  }
}

export default {
  data,
  execute,
  autocomplete,
};
