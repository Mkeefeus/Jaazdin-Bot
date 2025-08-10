import { AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Boat, Shipment } from '~/db/models/Boat';
import { formatNames, randomInt } from './helpers';
import path from 'path';

const D100TABLES_PATH = path.join(__dirname, '../../d100tables');

/**
 * Find a boat by name, with error handling
 */
export async function findBoatByName(interaction: ChatInputCommandInteraction, name: string): Promise<Boat | null> {
  const boat = await Boat.findOne({ where: { boatName: name } });

  if (!boat) {
    await interaction.reply({
      content: `⚠️ **Boat Not Found**\n\nNo boat named "${formatNames(name)}" exists in the system.`,
      ephemeral: true,
    });
    return null;
  }

  return boat;
}

/**
 * Boat name autocomplete helper
 */
export async function boatNameAutocomplete(
  interaction: AutocompleteInteraction,
  options: { runningOnly?: boolean; inTown?: boolean } = {}
): Promise<void> {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const whereClause = {
    ...(options.runningOnly && { isRunning: true }),
    ...(options.inTown && { isInTown: true }),
  };
  const boats = await Boat.findAll({
    attributes: ['boatName'],
    where: whereClause,
  });

  const filtered = boats
    .map((boat) => boat.boatName)
    .filter((name) => name.toLowerCase().startsWith(focusedValue))
    .slice(0, 25)
    .map((name) => ({
      name: formatNames(name),
      value: name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  await interaction.respond(filtered);
}

export const tableToGenerateChoices = [
  { name: 'Metal Trading', value: 'metals' },
  { name: 'Weapons & Armor', value: 'weaponry' },
  { name: 'Exotic Creatures', value: 'pets' },
  { name: 'Fine Cuisine', value: 'meals' },
  { name: 'Potions & Poisons', value: 'poisonsPotions' },
  { name: 'Magic Items', value: 'magicItems' },
  { name: 'Seeds & Plants', value: 'plants' },
  { name: 'Magical Reagents', value: 'reagents' },
  { name: 'Otherworldly Materials', value: 'otherworld' },
  { name: 'Contraband Goods', value: 'smuggle' },
];

/**
 * Create a standard item generation embed
 */
export function createItemEmbed(
  title: string,
  itemName: string,
  additionalFields: Array<{ name: string; value: string }> = [],
  color: number = 0x2e86c1
) {
  let description = `**Item:** ${itemName}`;

  for (const field of additionalFields) {
    description += `\n**${field.name}:** ${field.value}`;
  }

  return {
    title,
    description,
    color,
  };
}

// Import additional models for shipment generation
import { generateRandomWeaponWithMetalByRarity } from '~/commands/itemGeneration/generateweapon';
import { generateRandomArmorWithMetalByRarity } from '~/commands/itemGeneration/generatearmor';
import { getRandomPetByRarityAndType } from '~/commands/itemGeneration/generatepet';
import { getRandomReagentByRarity, getRandomReagentByRarityAndType } from '~/commands/itemGeneration/generatereagent';
import { getRandomMetalByRarity, getRandomMetalByRarityExcludingPlanes } from '~/commands/itemGeneration/generatemetal';
import { getRandomMealByRarity } from '~/commands/itemGeneration/generatemeal';
import { getRandomPotionByRarity } from '~/commands/itemGeneration/generatepotion';
import { getRandomPoisonByRarity } from '~/commands/itemGeneration/generatepoison';
import { getRandomSeedByRarity } from '~/commands/itemGeneration/generateseeds';
import { getRandomMagicItemByTable } from '~/commands/itemGeneration/generatemagicitem';

// Type definitions for shipment generation
export type ShipmentItem = { itemName: string; price: number; quantity: number };
type MetalPriceCache = { [metalName: string]: number };

/**
 * Generate shipment items based on boat's table configuration
 */
export async function generateShipmentItems(boat: Boat): Promise<ShipmentItem[]> {
  switch (boat.tableToGenerate) {
    case 'metals': {
      const result: ShipmentItem[] = [];
      const rarities: string[] = [];
      for (let i = 0; i < 5; i++) {
        let rarity = 'Uncommon';
        const roll = randomInt(1, 6);
        if (roll === 5) rarity = 'Rare';
        else if (roll === 6) rarity = 'Very Rare';
        rarities.push(rarity);
      }
      for (let i = 0; i < 3; i++) {
        let rarity = 'Rare';
        const roll = randomInt(1, 6);
        if (roll === 5) rarity = 'Very Rare';
        else if (roll === 6) rarity = 'Legendary';
        rarities.push(rarity);
      }
      for (const rarity of rarities) {
        const metal = await getRandomMetalByRarity(rarity);
        if (metal) {
          const existing = result.find((item) => item.itemName === metal.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            const price = randomInt(metal.price_min, metal.price_max);
            result.push({ itemName: metal.name, price, quantity: 1 });
          }
        }
      }
      return result;
    }
    case 'weaponry': {
      const result: ShipmentItem[] = [];
      const rarities: string[] = [];
      for (let i = 0; i < 4; i++) {
        let rarity = 'Uncommon';
        const roll = randomInt(1, 4);
        if (roll === 3) rarity = 'Rare';
        else if (roll === 4) rarity = 'Very Rare';
        rarities.push(rarity);
      }
      const metalsInUse: MetalPriceCache = {};
      for (let i = 0; i < 4; i++) {
        const rarity = rarities[i];
        if (i < 2) {
          const combo = await generateRandomWeaponWithMetalByRarity(rarity);
          if (!combo) continue;
          const { weapon, metal } = combo;
          if (!metalsInUse[metal.name]) {
            metalsInUse[metal.name] = randomInt(metal.price_min, metal.price_max);
          }
          const itemName = `${metal.name} ${weapon.name}`;
          const existing = result.find((item) => item.itemName === itemName);
          if (existing) {
            existing.quantity += 1;
          } else {
            const price = Math.round((metalsInUse[metal.name] * weapon.plates + weapon.price) * 1.33);
            result.push({ itemName, price, quantity: 1 });
          }
        } else {
          const combo = await generateRandomArmorWithMetalByRarity(rarity);
          if (!combo) continue;
          const { armor, metal } = combo;
          if (!metalsInUse[metal.name]) {
            metalsInUse[metal.name] = randomInt(metal.price_min, metal.price_max);
          }
          const itemName = `${metal.name} ${armor.name}`;
          const existing = result.find((item) => item.itemName === itemName);
          if (existing) {
            existing.quantity += 1;
          } else {
            const price = Math.round((metalsInUse[metal.name] * armor.plates + armor.price) * 1.33);
            result.push({ itemName, price, quantity: 1 });
          }
        }
      }
      return result;
    }
    case 'pets': {
      const result: ShipmentItem[] = [];
      for (let i = 0; i < 5; i++) {
        const roll = randomInt(1, 20);
        let rarity = 'Common';
        if (roll >= 1 && roll <= 5) rarity = 'Common';
        else if (roll >= 6 && roll <= 10) rarity = 'Uncommon';
        else if (roll >= 11 && roll <= 15) rarity = 'Rare';
        else if (roll >= 16 && roll <= 18) rarity = 'Very Rare';
        else if (roll >= 19) rarity = 'Legendary';
        let pet = null;
        let type: string;
        do {
          const typeRoll = randomInt(1, 20);
          if (typeRoll >= 1 && typeRoll <= 8) type = 'Beast';
          else if (typeRoll >= 9 && typeRoll <= 13) type = 'Monstrosity';
          else if (typeRoll >= 14 && typeRoll <= 17) type = 'Aberration';
          else if (typeRoll >= 18 && typeRoll <= 19) type = 'Ooze';
          else type = 'Dragon';
          pet = await getRandomPetByRarityAndType(rarity, type);
        } while (!pet);
        const existing = result.find((item) => item.itemName === pet.name);
        if (existing) {
          existing.quantity += 1;
        } else {
          const price = randomInt(pet.price_min, pet.price_max);
          result.push({ itemName: pet.name, price, quantity: 1 });
        }
      }
      return result;
    }
    case 'meals': {
      const result: ShipmentItem[] = [];
      const baseRarities = ['Common', 'Uncommon', 'Rare'];
      const rarities: { rarity: string; count: number }[] = [];
      const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare'];
      const counts: { [key: string]: number } = {};
      for (let i = 0; i < 12; i++) {
        let rarity = baseRarities[Math.floor(i / 4)];
        const roll = randomInt(1, 4);
        if (roll === 4) {
          const idx = rarityOrder.indexOf(rarity);
          if (idx < rarityOrder.length - 1) {
            rarity = rarityOrder[idx + 1];
          }
        }
        counts[rarity] = (counts[rarity] || 0) + 1;
      }
      for (const rarity of Object.keys(counts)) {
        rarities.push({ rarity, count: counts[rarity] });
      }
      for (const { rarity, count } of rarities) {
        for (let i = 0; i < count; i++) {
          const meal = await getRandomMealByRarity(rarity);
          if (meal) {
            const existing = result.find((item) => item.itemName === meal.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: meal.name, price: randomInt(meal.price_min, meal.price_max), quantity: 1 });
            }
          }
        }
      }
      return result;
    }
    case 'poisonsPotions': {
      const result: ShipmentItem[] = [];
      const potionRarities: string[] = [];
      for (let i = 0; i < 3; i++) potionRarities.push('Uncommon');
      for (let i = 0; i < 2; i++) potionRarities.push('Rare');
      const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'];
      for (let i = 0; i < potionRarities.length; i++) {
        let rarity = potionRarities[i];
        const roll = randomInt(1, 4);
        if (roll === 4) {
          const idx = rarityOrder.indexOf(rarity);
          if (idx < rarityOrder.length - 1) {
            rarity = rarityOrder[idx + 1];
          }
        }
        const potion = await getRandomPotionByRarity(rarity);
        if (potion) {
          const existing = result.find((item) => item.itemName === potion.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            result.push({ itemName: potion.name, price: randomInt(potion.price_min, potion.price_max), quantity: 1 });
          }
        }
      }
      const poisonRarities: string[] = [];
      for (let i = 0; i < 2; i++) poisonRarities.push('Uncommon');
      for (let i = 0; i < 2; i++) poisonRarities.push('Rare');
      for (let i = 0; i < poisonRarities.length; i++) {
        let rarity = poisonRarities[i];
        const roll = randomInt(1, 4);
        if (roll === 4) {
          const idx = rarityOrder.indexOf(rarity);
          if (idx < rarityOrder.length - 1) {
            rarity = rarityOrder[idx + 1];
          }
        }
        const poison = await getRandomPoisonByRarity(rarity);
        if (poison) {
          const existing = result.find((item) => item.itemName === poison.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            result.push({ itemName: poison.name, price: randomInt(poison.price_min, poison.price_max), quantity: 1 });
          }
        }
      }
      return result;
    }
    case 'magicItems': {
      const result: ShipmentItem[] = [];
      const tableOrder = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < 8; i++) {
        let tableIdx = i < 5 ? 0 : 1;
        const roll = randomInt(1, 6);
        if (roll === 5 && tableIdx < tableOrder.length - 1) {
          tableIdx += 1;
        } else if (roll === 6) {
          tableIdx += 2;
          if (tableIdx > tableOrder.length - 1) tableIdx = tableOrder.length - 1;
        }
        const table = tableOrder[tableIdx];
        const item = await getRandomMagicItemByTable(table);
        if (item) {
          const existing = result.find((shipmentItem) => shipmentItem.itemName === item.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            result.push({ itemName: item.name, price: randomInt(item.price_min, item.price_max), quantity: 1 });
          }
        }
      }
      return result;
    }
    case 'plants': {
      const result: ShipmentItem[] = [];
      const baseRarities = ['Common', 'Common', 'Uncommon', 'Uncommon', 'Rare', 'Rare'];
      const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'];
      for (let i = 0; i < 6; i++) {
        let rarity = baseRarities[i];
        const roll = randomInt(1, 4);
        let idx = rarityOrder.indexOf(rarity);
        if (roll === 3 && idx < rarityOrder.length - 1) {
          idx += 1;
        } else if (roll === 4) {
          idx += 2;
          if (idx > rarityOrder.length - 1) idx = rarityOrder.length - 1;
        }
        rarity = rarityOrder[idx];
        const seed = await getRandomSeedByRarity(rarity);
        if (seed) {
          const existing = result.find((item) => item.itemName === seed.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            result.push({ itemName: seed.name, price: randomInt(seed.price_min, seed.price_max), quantity: 1 });
          }
        }
      }
      return result;
    }
    case 'reagents': {
      const result: ShipmentItem[] = [];
      const types = [
        'Aberration',
        'Fiend',
        'Celestial',
        'Giant',
        'Construct',
        'Monstrosity',
        'Dragon',
        'Ooze',
        'Elemental',
        'Plant',
        'Fey',
        'Undead',
      ];
      const rarityOrder = [
        { min: 1, max: 3, rarity: 'Common' },
        { min: 4, max: 12, rarity: 'Uncommon' },
        { min: 13, max: 15, rarity: 'Rare' },
        { min: 16, max: 19, rarity: 'Very Rare' },
        { min: 20, max: 20, rarity: 'Legendary' },
      ];
      for (let i = 0; i < 4; i++) {
        const rarityRoll = randomInt(1, 20);
        const rarity = rarityOrder.find((r) => rarityRoll >= r.min && rarityRoll <= r.max)?.rarity || 'Common';
        const type = types[randomInt(0, types.length - 1)];
        const reagent = await getRandomReagentByRarityAndType(rarity, type);
        if (reagent) {
          const existing = result.find((item) => item.itemName === reagent.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            result.push({
              itemName: reagent.name,
              price: randomInt(reagent.price_min, reagent.price_max),
              quantity: 1,
            });
          }
        }
      }
      return result;
    }
    case 'otherworld': {
      const result: ShipmentItem[] = [];
      for (let i = 0; i < 3; i++) {
        let rarity = 'Uncommon';
        const roll = randomInt(1, 6);
        if (roll === 5) rarity = 'Rare';
        else if (roll === 6) rarity = 'Very Rare';
        const metal = await getRandomMetalByRarityExcludingPlanes(rarity, 'Material');
        if (metal) {
          const existing = result.find((item) => item.itemName === metal.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            result.push({ itemName: metal.name, price: randomInt(metal.price_min, metal.price_max), quantity: 1 });
          }
        }
      }
      return result;
    }
    case 'smuggle': {
      const result: ShipmentItem[] = [];
      for (let i = 0; i < 4; i++) {
        const typeRoll = randomInt(1, 8);
        const rarityRoll = randomInt(1, 6);
        let rarity = 'Uncommon';
        if (rarityRoll === 5) rarity = 'Rare';
        else if (rarityRoll === 6) rarity = 'Very Rare';

        if (typeRoll === 1) {
          const metal = await getRandomMetalByRarity(rarity);
          if (metal) {
            const existing = result.find((item) => item.itemName === metal.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: metal.name, price: randomInt(metal.price_min, metal.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 2) {
          const combo = await generateRandomWeaponWithMetalByRarity(rarity);
          if (combo) {
            const { weapon, metal } = combo;
            const price = Math.round(
              (randomInt(metal.price_min, metal.price_max) * weapon.plates + weapon.price) * 1.33
            );
            const itemName = `${metal.name} ${weapon.name}`;
            const existing = result.find((item) => item.itemName === itemName);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName, price, quantity: 1 });
            }
          }
        } else if (typeRoll === 3) {
          const meal = await getRandomMealByRarity(rarity);
          if (meal) {
            const existing = result.find((item) => item.itemName === meal.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: meal.name, price: randomInt(meal.price_min, meal.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 4) {
          const potion = await getRandomPotionByRarity(rarity);
          if (potion) {
            const existing = result.find((item) => item.itemName === potion.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: potion.name, price: randomInt(potion.price_min, potion.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 5) {
          const poison = await getRandomPoisonByRarity(rarity);
          if (poison) {
            const existing = result.find((item) => item.itemName === poison.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: poison.name, price: randomInt(poison.price_min, poison.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 6) {
          const reagent = await getRandomReagentByRarity(rarity);
          if (reagent) {
            const existing = result.find((item) => item.itemName === reagent.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({
                itemName: reagent.name,
                price: randomInt(reagent.price_min, reagent.price_max),
                quantity: 1,
              });
            }
          }
        } else if (typeRoll === 7) {
          const seed = await getRandomSeedByRarity(rarity);
          if (seed) {
            const existing = result.find((item) => item.itemName === seed.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: seed.name, price: randomInt(seed.price_min, seed.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 8) {
          let table = 'A';
          if (rarityRoll === 5) table = 'B';
          else if (rarityRoll === 6) table = 'C';
          const item = await getRandomMagicItemByTable(table);
          if (item) {
            const existing = result.find((shipmentItem) => shipmentItem.itemName === item.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: item.name, price: randomInt(item.price_min, item.price_max), quantity: 1 });
            }
          }
        }
      }
      return result;
    }
    default:
      return [];
  }
}

export async function boatInTownEmbedBuilder(boat: Boat) {
  let desc = `⏰ **Weeks Left:** ${boat.weeksLeft}\n\n`;

  if (boat.jobsAffected && Array.isArray(boat.jobsAffected) && boat.jobsAffected.length > 0) {
    desc += `💰 **${boat.jobsAffected.join(', ')}** have their gp wage die amount +1.\n\n`;
  }
  if (boat.isTier2 && boat.tier2Ability) desc += `⭐ ${boat.tier2Ability}\n`;

  let fields: { name: string; value: string }[] = [];
  if (boat.tableToGenerate && boat.tableToGenerate !== 'NA') {
    desc += `### Goods:\n\n`;
    const shipments = await Shipment.findAll({ where: { boatName: boat.boatName } });
    fields = shipments.map((s) => ({
      name: s.itemName,
      value: `💵 Price: ${s.price} gp\n📦 Remaining Stock: ${s.quantity}`,
      inline: true,
    }));
    if (fields.length === 0) {
      fields.push({ name: '❌ Sold Out', value: '🔄 Check back next time.' });
    }
  }

  // If there are more than 25 fields, split them into multiple embeds
  if (fields.length > 25) {
    const embeds: EmbedBuilder[] = [];
    const chunks = [];

    // Split fields into chunks of 25
    for (let i = 0; i < fields.length; i += 25) {
      chunks.push(fields.slice(i, i + 25));
    }

    // Create embeds for each chunk
    chunks.forEach((chunk, index) => {
      const embed = new EmbedBuilder().setColor(0x2e86c1).setFields(chunk);

      if (index === 0) {
        // First embed gets the title and description
        embed.setTitle(`⛵ ${boat.boatName}`).setDescription(desc);
      } else {
        // Subsequent embeds get continuation title
        embed.setTitle(`⛵ ${boat.boatName} (continued ${index + 1})`);
      }

      embeds.push(embed);
    });

    return embeds;
  }

  // If 25 or fewer fields, return single embed as before
  return new EmbedBuilder().setTitle(`⛵ ${boat.boatName}`).setDescription(desc).setColor(0x2e86c1).setFields(fields);
}

export const boatTableDescriptions: { [key: string]: string } = {
  metals: 'Metal Trading',
  weaponry: 'Weapons & Armor',
  pets: 'Exotic Creatures',
  meals: 'Fine Cuisine',
  poisonsPotions: 'Potions & Poisons',
  magicItems: 'Magic Items',
  plants: 'Seeds & Plants',
  reagents: 'Magical Reagents',
  otherworld: 'Otherworldly Materials',
  smuggle: 'Contraband Goods',
};

export async function boatAtSeaEmbedBuilder(boat: Boat) {
  let desc = `**Weeks Left:** ${boat.weeksLeft}\n`;

  if (boat.jobsAffected && Array.isArray(boat.jobsAffected) && boat.jobsAffected.length > 0) {
    desc += `${boat.jobsAffected.join(', ')} have their gp wage die amount +1.\n\n`;
  }

  if (boat.isTier2 && boat.tier2Ability) desc += `**Tier 2 Ability:** ${boat.tier2Ability}\n\n`;
  desc += `*Shipment Type:* ${boat.tableToGenerate ? boatTableDescriptions[boat.tableToGenerate] : 'None'}`;
  return new EmbedBuilder().setTitle(boat.boatName).setDescription(desc).setColor(0x2e86c1);
}

/**
 * Create a comprehensive boat status embed description
 */
export async function createBoatStatusDescription(boat: Boat): Promise<string> {
  let description = formatBoatInfo(boat);

  // Add shipment type description
  const tableDesc = boatTableDescriptions[boat.tableToGenerate] || 'Unknown';
  description += `**Shipment Type:** ${tableDesc}\n\n`;

  // Add actual shipment info if in town
  if (boat.isInTown && boat.tableToGenerate && boat.tableToGenerate !== 'NA') {
    const shipmentInfo = await formatShipmentInfo(boat.boatName);
    description += shipmentInfo;
  } else if (!boat.isInTown) {
    description += '*Boat is at sea - no shipments available*';
  } else {
    description += '*No shipments generated*';
  }

  return description;
}

/**
 * Calculate price for a metal-based item (weapons, armor)
 */
export function calculateMetalItemPrice(
  item: { plates: number; price: number },
  metal: { price_min: number; price_max: number }
): number {
  const metalPrice = randomInt(metal.price_min, metal.price_max);
  return Math.round((metalPrice * item.plates + item.price) * 1.33);
}

/**
 * Format boat information for consistent display across commands
 */
export function formatBoatInfo(boat: Boat): string {
  let info = `**${formatNames(boat.boatName)}**\n`;

  // Basic status
  info += `**Status:** ${boat.isRunning ? 'Running' : 'Stopped'}\n`;
  info += `**Location:** ${boat.isInTown ? 'In Town' : 'At Sea'}\n`;
  info += `**Weeks Left:** ${boat.weeksLeft}\n`;

  // Destination info
  if (boat.city && boat.country) {
    info += `**Destination:** ${formatNames(boat.city)}, ${formatNames(boat.country)}\n`;
  }

  // Timing info
  info += `**Travel Time:** ${boat.waitTime} weeks\n`;
  info += `**Time in Town:** ${boat.timeInTown} weeks\n`;

  // Job benefits
  if (boat.jobsAffected && Array.isArray(boat.jobsAffected) && boat.jobsAffected.length > 0) {
    const jobNames = boat.jobsAffected.map((job) => formatNames(job)).join(', ');
    info += `**Job Benefits:** ${jobNames} get +1 gp wage die\n`;
  }

  // Tier 2 info
  if (boat.isTier2) {
    info += `**Tier 2 Boat:** Yes\n`;
    if (boat.tier2Ability) {
      info += `**Tier 2 Ability:** ${boat.tier2Ability}\n`;
    }
  }

  return info;
}

/**
 * Format shipment information for display
 */
export async function formatShipmentInfo(boatName: string): Promise<string> {
  const shipments = await Shipment.findAll({ where: { boatName } });

  if (shipments.length === 0) {
    return 'No active shipments';
  }

  const shipmentList = shipments.map((s) => `• ${formatNames(s.itemName)} (x${s.quantity}) — ${s.price} gp`).join('\n');

  return `**Active Shipments:**\n${shipmentList}`;
}

/**
 * Update a boat's Discord embed with current information
 */
export async function updateBoatEmbed(boatName: string): Promise<boolean> {
  const { client } = await import('~/index');

  if (!client.isReady()) {
    console.warn('Discord client not ready for embed update');
    return false;
  }

  const boat = await Boat.findOne({ where: { boatName } });
  if (!boat || !boat.messageId) {
    return false;
  }

  const CHANNEL_ID = process.env.BOT_CHANNEL_ID;
  if (!CHANNEL_ID) {
    console.error('BOT_CHANNEL_ID is not defined');
    return false;
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.warn('Target channel is not a text channel');
      return false;
    }

    // Fetch the message
    const message = await channel.messages.fetch(boat.messageId);
    if (!message) {
      console.warn(`Message ${boat.messageId} not found for boat ${boatName}`);
      // Clear the messageId since the message no longer exists
      boat.messageId = null;
      await boat.save();
      return false;
    }

    // Create updated embed
    const { EmbedBuilder } = await import('discord.js');
    const boatInfo = formatBoatInfo(boat);
    const shipmentInfo = await formatShipmentInfo(boat.boatName);
    const tableDescription = boatTableDescriptions[boat.tableToGenerate] || 'Unknown';

    let desc = boatInfo;
    if (tableDescription) {
      desc += `\n**Table:** ${tableDescription}`;
    }
    if (shipmentInfo) {
      desc += `\n\n${shipmentInfo}`;
    }

    const updatedEmbed = new EmbedBuilder().setTitle(boat.boatName).setDescription(desc).setColor(0x2e86c1);

    // Update the message
    await message.edit({ embeds: [updatedEmbed] });
    console.log(`Updated embed for boat: ${boatName}`);
    return true;
  } catch (error) {
    console.error(`Failed to update boat embed for ${boatName}:`, error);
    // If the message is not found or can't be edited, clear the messageId
    if (error instanceof Error && error.message.includes('Unknown Message')) {
      boat.messageId = null;
      await boat.save();
    }
    return false;
  }
}
