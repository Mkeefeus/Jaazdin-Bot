import { EmbedBuilder, TextChannel } from 'discord.js';
import { Plant, PlantHarvestInformation } from '~/db/models/Plant';
import { client } from '~/index'; // Adjust the import based on your project structure
import { formatNames } from '~/functions/helpers';

const finishedPlants: Plant[] = [];
const replantedPlants: Plant[] = [];

async function update() {
  const allPlants = await Plant.findAll({
    include: [
      {
        model: PlantHarvestInformation,
        as: 'harvest_information',
      },
    ],
  });

  allPlants.forEach((plant) => {
    // console.log(plant.dataValues)
    plant.setDataValue('weeks_remaining', plant.getDataValue('weeks_remaining') - 1);
    if (plant.getDataValue('weeks_remaining') <= 0) {
      finishedPlants.push(plant);
      const harvest_info = plant.getDataValue('harvest_information');
      if (!harvest_info) {
        console.error(`Plant ${plant.getDataValue('name')} has no harvest information.`);
        return;
      }
      if (harvest_info.renewable) {
        replantedPlants.push(plant);
        Plant.create({
          name: plant.getDataValue('name'),
          plant_info_id: plant.getDataValue('plant_info_id'),
          plant_harvest_info_id: harvest_info.id,
          fertilizer_type: plant.getDataValue('fertilizer_type'),
          character: plant.getDataValue('character'),
          has_persistent_fertilizer: plant.getDataValue('has_persistent_fertilizer'),
          quantity: plant.getDataValue('quantity'),
          user: plant.getDataValue('user'),
          yield: harvest_info.harvest_amount,
          weeks_remaining: harvest_info.harvest_time,
        }).catch((err) => {
          console.error(`Failed to replant ${plant.getDataValue('name')}:`, err);
        });
        plant.destroy();
      }
    } else {
      plant.save();
    }
  });
}
async function post() {
  console.log('Finished Plants:', finishedPlants);
  console.log('Replanted Plants:', replantedPlants);

  if (finishedPlants.length === 0 && replantedPlants.length === 0) {
    return;
  }
  const CHANNEL_ID = '1309206984196755506';
  const userIdsToMention = new Set<string>(); // Use a Set to store unique user IDs for mentions

  // --- Construct Finished Plants Embed ---
  let finishedDescription = 'No plants finished.';
  if (finishedPlants.length > 0) {
    finishedDescription = finishedPlants
      .map((p) => {
        const userId = p.getDataValue('user');
        userIdsToMention.add(userId); // Add user ID to the set
        const plantName = formatNames(p.getDataValue('name'));
        const characterName = formatNames(p.getDataValue('character'));
        const quantity = p.getDataValue('quantity');
        return `${plantName} x${quantity} (${characterName})`; // No mention in description, just the info
      })
      .join('\n');
  }

  const finishedEmbed = new EmbedBuilder()
    .setTitle('Finished Plants')
    .setDescription(finishedDescription)
    .setColor('#00FF00');

  // --- Construct Replanted Plants Embed ---
  let replantedDescription = 'No plants replanted.';
  if (replantedPlants.length > 0) {
    replantedDescription = replantedPlants
      .map((p) => {
        const userId = p.getDataValue('user');
        userIdsToMention.add(userId); // Add user ID to the set
        const plantName = formatNames(p.getDataValue('name'));
        const characterName = formatNames(p.getDataValue('character'));
        const quantity = p.getDataValue('quantity');
        return `${plantName} x${quantity} (${characterName})`; // No mention in description
      })
      .join('\n');
  }

  const replantedEmbed = new EmbedBuilder()
    .setTitle('Replanted Plants')
    .setDescription(replantedDescription)
    .setColor('#FFFF00');

  if (finishedPlants.length > 0) {
    finishedEmbed.setFooter({ text: `Total: ${finishedPlants.length} plants finished` });
  }
  if (replantedPlants.length > 0) {
    replantedEmbed.setFooter({ text: `Total: ${replantedPlants.length} plants replanted` });
  }

  // --- Generate the content for mentions ---
  let mentionContent = '';
  if (userIdsToMention.size > 0) {
    // Convert the set of unique user IDs into mention strings, separated by space
    mentionContent = Array.from(userIdsToMention)
      .map((id) => `<@${id}>`)
      .join(' ');
  }

  if (!client.isReady()) {
    console.warn('Client is not ready yet. Delaying message send.');
    return;
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (channel instanceof TextChannel) {
      const embedsToSend = [];
      if (finishedPlants.length > 0) {
        embedsToSend.push(finishedEmbed);
      }
      if (replantedPlants.length > 0) {
        embedsToSend.push(replantedEmbed);
      }

      if (embedsToSend.length > 0) {
        await channel.send({
          content: mentionContent, // <-- THE MENTION GOES HERE!
          embeds: embedsToSend,
          allowedMentions: { users: Array.from(userIdsToMention) }, // Important for security and control
        });
        console.log(`Update message sent to channel ${channel.name} (${channel.id})`);
      } else {
        console.log('No embeds to send.');
      }
    } else {
      console.log('Target channel is not a text channel or not found.');
    }
  } catch (error) {
    console.error('Failed to send update message:', error);
  }

  finishedPlants.length = 0; // Clear the array after processing
  replantedPlants.length = 0; // Clear the array after processing
}

export { update, post };
