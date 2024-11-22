import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
} from "discord.js";
import { Plant } from "db/models/Plant.js";

const ITEMS_PER_PAGE = 3;

interface PlantDisplay {
  name: string;
  weeksLeft: number;
  owner: string;
  repeatable: boolean;
}

export const data = new SlashCommandBuilder()
  .setName("showplants")
  .setDescription("Shows all plants or just your plants")
  .addBooleanOption((option) =>
    option
      .setName("self")
      .setDescription("Show only your plants")
      .setRequired(false)
  );

async function getPlants(
  userId: string | null = null
): Promise<PlantDisplay[]> {
  const whereClause = userId ? { user: userId } : {};
  const plants = await Plant.findAll({ where: whereClause });

  return plants.map((plant) => ({
    name: plant.get("name") as string,
    weeksLeft: plant.get("time") as number,
    owner: plant.get("user") as string,
    repeatable: plant.get("repeatable") as boolean,
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
    .setTitle("🌱 Plants")
    .setThumbnail(
      "https://kittenrescue.org/wp-content/uploads/2017/03/KittenRescue_KittenCareHandbook.jpg"
    )
    .setAuthor({ name: "Plant Tracker" })
    .setColor(0x2ecc71)
    .setDescription(showingSelf ? "Showing your plants" : "Showing all plants")
    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

  currentPlants.forEach((plant) => {
    embed.addFields({
      name: plant.name,
      value: `Weeks Left: ${plant.weeksLeft}\nOwner: <@${plant.owner}>\nRepeatable? ${plant.repeatable}`,
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

  // Navigation buttons
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("first")
      .setLabel("<<")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),

    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("<")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),

    new ButtonBuilder()
      .setCustomId("next")
      .setLabel(">")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1),

    new ButtonBuilder()
      .setCustomId("last")
      .setLabel(">>")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1)
  );

  // Toggle filter button
  const filterRow = new ActionRowBuilder<ButtonBuilder>();
  filterRow.addComponents(
    new ButtonBuilder()
      .setCustomId("toggle")
      .setLabel(showingSelf ? "Show All Plants" : "Show My Plants")
      .setStyle(showingSelf ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  return [row, filterRow];
}

export async function execute(interaction: ChatInputCommandInteraction) {
  let currentPage = 0;
  let showingSelf = interaction.options.getBoolean("self") ?? false;

  try {
    // Get initial plants
    const plants = await getPlants(showingSelf ? interaction.user.id : null);
    const totalPages = Math.ceil(plants.length / ITEMS_PER_PAGE);

    if (plants.length === 0) {
      await interaction.reply({
        content: showingSelf
          ? "You don't have any plants!"
          : "No plants found!",
        ephemeral: true,
      });
      return;
    }

    // Send initial message
    const embed = createPlantsEmbed(
      plants,
      currentPage,
      totalPages,
      showingSelf
    );
    const components = createButtons(currentPage, totalPages, showingSelf);

    const response = await interaction.reply({
      embeds: [embed],
      components,
      fetchReply: true,
    });

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 minutes
    });

    collector.on("collect", async (i: ButtonInteraction) => {
      // Ensure the user who clicked is the one who ran the command
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: "Only the command user can navigate these plants!",
          ephemeral: true,
        });
        return;
      }

      // Handle button clicks
      switch (i.customId) {
        case "first":
          currentPage = 0;
          break;
        case "prev":
          currentPage = Math.max(0, currentPage - 1);
          break;
        case "next":
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case "last":
          currentPage = totalPages - 1;
          break;
        case "toggle":
          showingSelf = !showingSelf;
          const newPlants = await getPlants(
            showingSelf ? interaction.user.id : null
          );
          const newTotalPages = Math.ceil(newPlants.length / ITEMS_PER_PAGE);
          currentPage = 0;

          const newEmbed = createPlantsEmbed(
            newPlants,
            currentPage,
            newTotalPages,
            showingSelf
          );
          const newComponents = createButtons(
            currentPage,
            newTotalPages,
            showingSelf
          );

          await i.update({
            embeds: [newEmbed],
            components: newComponents,
          });
          return;
      }

      // Update embed and buttons
      const currentPlants = await getPlants(
        showingSelf ? interaction.user.id : null
      );
      const updatedEmbed = createPlantsEmbed(
        currentPlants,
        currentPage,
        totalPages,
        showingSelf
      );
      const updatedComponents = createButtons(
        currentPage,
        totalPages,
        showingSelf
      );

      await i.update({
        embeds: [updatedEmbed],
        components: updatedComponents,
      });
    });

    collector.on("end", () => {
      interaction
        .editReply({
          components: [],
        })
        .catch(console.error);
    });
  } catch (error) {
    console.error("Error in showplants command:", error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
}

export default {
  data,
  execute,
};
