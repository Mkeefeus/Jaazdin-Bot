import { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { Boat, Shipment } from '~/db/models/Boat';
import { formatNames } from './helpers';
import fs from 'fs';
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
 * Find a shipment by boat and item name, with error handling
 */
export async function findShipmentByBoatAndItem(
  interaction: ChatInputCommandInteraction,
  boatName: string,
  itemName: string
): Promise<Shipment | null> {
  const shipment = await Shipment.findOne({ where: { boatName, itemName } });

  if (!shipment) {
    await interaction.reply({
      content: `⚠️ **Shipment Not Found**\n\nNo shipment found for boat **${formatNames(boatName)}** with item **${formatNames(itemName)}**.`,
      ephemeral: true,
    });
    return null;
  }

  return shipment;
}

/**
 * Parse job names from comma-separated or JSON string format
 */
export function parseJobsFromString(jobsRaw: string | null): { jobs: string[]; error?: string } {
  if (!jobsRaw) {
    return { jobs: [] };
  }

  const trimmed = jobsRaw.trim();

  // If it looks like JSON (starts with [), try JSON parsing first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed) || !parsed.every((j) => typeof j === 'string')) {
        return {
          jobs: [],
          error: 'Please enter job names as comma-separated (Smith, Cook) or JSON array ["Smith","Cook"]',
        };
      }
      // Normalize job names (trim and filter empty)
      const normalizedJobs = parsed.map((job) => job.trim()).filter((job) => job.length > 0);
      return { jobs: normalizedJobs };
    } catch {
      return {
        jobs: [],
        error: 'Invalid JSON format. Please use comma-separated (Smith, Cook) or valid JSON ["Smith","Cook"]',
      };
    }
  }

  // Otherwise, treat as comma-separated
  const jobs = trimmed
    .split(',')
    .map((job) => job.trim())
    .filter((job) => job.length > 0);

  // Validate that all jobs are non-empty strings
  if (jobs.some((job) => typeof job !== 'string' || job.length === 0)) {
    return {
      jobs: [],
      error: 'All job names must be non-empty strings',
    };
  }

  return { jobs };
}

/**
 * Parse job names from JSON string format (legacy - kept for compatibility)
 */
export function parseJobsFromJSON(jobsRaw: string | null): { jobs: string[]; error?: string } {
  return parseJobsFromString(jobsRaw);
}

/**
 * Get available job names from d100 tables
 */
export function getAvailableJobNames(): string[] {
  try {
    return fs
      .readdirSync(D100TABLES_PATH)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));
  } catch {
    return [];
  }
}

/**
 * Get available table names for shipment generation
 */
export function getAvailableTableNames(): string[] {
  return [
    'metals',
    'weaponry',
    'pets',
    'meals',
    'poisonsPotions',
    'magicItems',
    'plants',
    'reagents',
    'otherworld',
    'smuggle',
  ];
}

/**
 * Boat name autocomplete helper
 */
export async function boatNameAutocomplete(
  interaction: AutocompleteInteraction,
  runningOnly: boolean = false
): Promise<void> {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const whereClause = runningOnly ? { isRunning: true } : {};
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

/**
 * Job names autocomplete helper (supports comma-separated input)
 */
export async function jobNamesAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedValue = interaction.options.getFocused();
  const jobNames = getAvailableJobNames();

  // Handle comma-separated input - get the last job being typed
  let currentInput = focusedValue;
  let prefix = '';

  if (focusedValue.includes(',')) {
    const parts = focusedValue.split(',');
    currentInput = parts[parts.length - 1].trim();
    prefix = parts.slice(0, -1).join(', ');
    if (prefix) prefix += ', ';
  }

  // Remove any JSON formatting characters from the current input
  const input = currentInput
    .replace(/[[\]"]/g, '')
    .trim()
    .toLowerCase();

  const filtered = jobNames
    .filter((name) => name.toLowerCase().startsWith(input))
    .slice(0, 25)
    .map((name) => {
      const fullValue = prefix + name;
      return {
        name: formatNames(name),
        value: fullValue,
      };
    })
    .filter((choice) => {
      // Discord autocomplete choice values are limited to 100 characters
      // Only show choices that won't exceed the limit
      return choice.value.length <= 100;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // If no choices are available due to character limit, provide a helpful message
  if (filtered.length === 0 && input.length > 0) {
    const potentialMatches = jobNames.filter((name) => name.toLowerCase().startsWith(input));
    if (potentialMatches.length > 0) {
      // There are matches but they exceed the character limit
      await interaction.respond([
        {
          name: '⚠️ Character limit reached - please submit current jobs and add more separately',
          value: focusedValue.substring(0, 100),
        },
      ]);
      return;
    }
  }

  await interaction.respond(filtered);
}

/**
 * Table names autocomplete helper (from d100 tables for shipment generation)
 */
export async function tableNamesAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedValue = interaction.options.getFocused();
  const tableNames = getAvailableTableNames();

  const input = focusedValue.trim().toLowerCase();

  // Create user-friendly display names
  const tableDisplayNames: { [key: string]: string } = {
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

  const filtered = tableNames
    .filter((name) => name.toLowerCase().includes(input) || tableDisplayNames[name]?.toLowerCase().includes(input))
    .slice(0, 25)
    .map((name) => ({
      name: tableDisplayNames[name] || formatNames(name),
      value: name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  await interaction.respond(filtered);
}

/**
 * Shipment item autocomplete helper (based on boat)
 */
export async function shipmentItemAutocomplete(interaction: AutocompleteInteraction, boatName?: string): Promise<void> {
  const focusedValue = interaction.options.getFocused().toLowerCase();

  if (!boatName) {
    await interaction.respond([]);
    return;
  }

  const shipments = await Shipment.findAll({
    where: { boatName },
    attributes: ['itemName'],
  });

  const filtered = shipments
    .map((shipment) => shipment.itemName)
    .filter((name) => name.toLowerCase().startsWith(focusedValue))
    .slice(0, 25)
    .map((name) => ({
      name: formatNames(name),
      value: name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  await interaction.respond(filtered);
}

/**
 * Combined autocomplete for boat commands
 */
export async function boatCommandAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedOption = interaction.options.getFocused(true).name;

  switch (focusedOption) {
    case 'name':
    case 'boat':
      await boatNameAutocomplete(interaction, focusedOption === 'boat');
      break;
    case 'jobs':
      await jobNamesAutocomplete(interaction);
      break;
    case 'item': {
      const boatName = interaction.options.getString('boat');
      await shipmentItemAutocomplete(interaction, boatName || undefined);
      break;
    }
    case 'table':
      await tableNamesAutocomplete(interaction);
      break;
    default:
      await interaction.respond([]);
  }
}

/**
 * Handle boat purchase logic (decrease quantity or remove if zero)
 */
export async function handleShipmentPurchase(
  interaction: ChatInputCommandInteraction,
  shipment: Shipment,
  boatName: string,
  itemName: string
): Promise<void> {
  const price = shipment.price;

  if (shipment.quantity <= 1) {
    await shipment.destroy();
    
    // Update the boat's Discord embed if it exists
    await updateBoatEmbed(boatName);
    
    await interaction.reply({
      content: `💰 **Purchase Complete!**\n\nYou purchased the last **${formatNames(itemName)}** from **${formatNames(boatName)}** for **${price} gp**.\n\n⚠️ This item is now sold out!`,
      ephemeral: false,
    });
    return;
  }

  shipment.quantity -= 1;
  await shipment.save();
  
  // Update the boat's Discord embed if it exists
  await updateBoatEmbed(boatName);

  await interaction.reply({
    content: `💰 **Purchase Complete!**\n\nYou purchased **${formatNames(itemName)}** from **${formatNames(boatName)}** for **${price} gp**.\n\n📦 Remaining quantity: **${shipment.quantity}**`,
    ephemeral: false,
  });
}

/**
 * Build update object from interaction options for boat updates
 */
export function buildBoatUpdatesFromOptions(
  interaction: ChatInputCommandInteraction,
  existingBoat?: Boat
): { updates: Record<string, unknown>; error?: string } {
  const updates: Record<string, unknown> = {};

  // Helper function to add non-null values to updates
  const addIfNotNull = (key: string, value: unknown) => {
    if (value !== null) updates[key] = value;
  };

  // String fields
  addIfNotNull('city', interaction.options.getString('city'));
  addIfNotNull('country', interaction.options.getString('country'));
  addIfNotNull('tier2Ability', interaction.options.getString('tier2ability'));
  addIfNotNull('tableToGenerate', interaction.options.getString('table'));

  // Integer fields
  addIfNotNull('waitTime', interaction.options.getInteger('waittime'));
  addIfNotNull('timeInTown', interaction.options.getInteger('timeintown'));
  addIfNotNull('weeksLeft', interaction.options.getInteger('weeksleft'));

  // Boolean fields
  addIfNotNull('isTier2', interaction.options.getBoolean('istier2'));
  addIfNotNull('isRunning', interaction.options.getBoolean('isrunning'));
  addIfNotNull('isInTown', interaction.options.getBoolean('isintown'));

  // Jobs are managed separately with /boat-add-job, /boat-remove-job commands

  // Auto-calculate weeksLeft if not explicitly set
  if (!updates.weeksLeft) {
    // Calculate weeksLeft based on boat state and timing values
    const waitTime = interaction.options.getInteger('waittime') ?? existingBoat?.waitTime;
    const timeInTown = interaction.options.getInteger('timeintown') ?? existingBoat?.timeInTown;
    const isTier2 = interaction.options.getBoolean('istier2') ?? existingBoat?.isTier2 ?? false;
    const isInTown = interaction.options.getBoolean('isintown') ?? existingBoat?.isInTown ?? true;

    const timeToUse = isInTown ? timeInTown : waitTime;

    if (timeToUse !== null && timeToUse !== undefined) {
      if (isInTown) {
        // Boat in town: use timeInTown (+ 1 for tier 2)
        updates.weeksLeft = isTier2 ? timeToUse + 1 : timeToUse;
      } else {
        // Boat at sea: use waitTime (- 1 for tier 2)
        updates.weeksLeft = isTier2 ? timeToUse - 1 : timeToUse;
      }
    }
  }

  return { updates };
}

// ====================
// ITEM GENERATION HELPERS
// ====================

/**
 * Generic function to generate random item by rarity
 */
export async function getRandomItemByRarity<T>(
  modelImportPath: string,
  rarity: string,
  whereClause?: Record<string, unknown>
): Promise<T | null> {
  const { default: Model } = await import(modelImportPath);
  const whereCondition = { rarity, ...whereClause };
  const items = await Model.findAll({ where: whereCondition });
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Generic function to generate random item by table/category
 */
export async function getRandomItemByTable<T>(
  modelImportPath: string,
  table: string,
  tableField: string = 'table'
): Promise<T | null> {
  const { default: Model } = await import(modelImportPath);
  const whereCondition = { [tableField]: table };
  const items = await Model.findAll({ where: whereCondition });
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

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

/**
 * Generic autocomplete for rarity fields from any model
 */
export async function genericRarityAutocomplete(
  interaction: AutocompleteInteraction,
  modelImportPath: string
): Promise<void> {
  const { default: Model } = await import(modelImportPath);
  const items = await Model.findAll({ attributes: ['rarity'] });
  const uniqueRarities = Array.from(new Set(items.map((item: { rarity: string }) => item.rarity)));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = uniqueRarities
    .filter((r): r is string => typeof r === 'string' && r.toLowerCase().startsWith(focused))
    .map((r) => ({
      name: r.charAt(0).toUpperCase() + r.slice(1),
      value: r,
    }));

  await interaction.respond(filtered);
}

/**
 * Generic autocomplete for table fields from any model
 */
export async function genericTableAutocomplete(
  interaction: AutocompleteInteraction,
  modelImportPath: string,
  tableField: string = 'table',
  displayFormat?: (value: string) => string
): Promise<void> {
  const { default: Model } = await import(modelImportPath);
  const items = await Model.findAll({ attributes: [tableField] });
  const uniqueTables = Array.from(new Set(items.map((item: Record<string, string>) => item[tableField])));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = uniqueTables
    .filter((t): t is string => typeof t === 'string' && t.toLowerCase().startsWith(focused))
    .map((t) => ({
      name: displayFormat ? displayFormat(t) : t.charAt(0).toUpperCase() + t.slice(1),
      value: t,
    }));

  await interaction.respond(filtered);
}

/**
 * Generic autocomplete for type fields from any model
 */
export async function genericTypeAutocomplete(
  interaction: AutocompleteInteraction,
  modelImportPath: string,
  typeField: string = 'type'
): Promise<void> {
  const { default: Model } = await import(modelImportPath);
  const items = await Model.findAll({ attributes: [typeField] });
  const uniqueTypes = Array.from(new Set(items.map((item: Record<string, string>) => item[typeField])));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = uniqueTypes
    .filter((t): t is string => typeof t === 'string' && t.toLowerCase().startsWith(focused))
    .map((t) => ({
      name: t.charAt(0).toUpperCase() + t.slice(1),
      value: t,
    }));

  await interaction.respond(filtered);
}

/**
 * Standardized item generation command execute function
 */
export async function executeItemGeneration(
  interaction: ChatInputCommandInteraction,
  generatorFunction: () => Promise<unknown>,
  noItemMessage: string,
  embedCreator: (item: unknown) => Record<string, unknown>
): Promise<void> {
  try {
    const item = await generatorFunction();

    if (!item) {
      await interaction.reply({
        content: noItemMessage,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [embedCreator(item)],
    });
  } catch (error) {
    await interaction.reply({
      content: `Failed to generate item: ${error}`,
      ephemeral: true,
    });
  }
}

/**
 * Generic function to generate an item (weapon/armor) with a valid metal by rarity
 */
export async function generateItemWithValidMetal<T extends { invalidMetals?: string[] }>(
  itemModelPath: string,
  rarity: string
): Promise<{ item: T; metal: Metal } | null> {
  // Get random metal by rarity
  const metal = await getRandomItemByRarity<Metal>('~/db/models/Metal', rarity);
  if (!metal) return null;

  // Import the item model and get all items
  const { default: ItemModel } = await import(itemModelPath);
  const allItems = await ItemModel.findAll();

  // Filter items that are compatible with this metal
  const validItems = allItems.filter((item: T) => !item.invalidMetals || !item.invalidMetals.includes(metal.name));
  if (validItems.length === 0) return null;

  // Return random valid item with the metal
  const item = validItems[Math.floor(Math.random() * validItems.length)];
  return { item, metal };
}

// Import additional models for shipment generation
import { Metal } from '~/db/models/Metal';
import { Meal } from '~/db/models/Meal';
import { Potion } from '~/db/models/Potion';
import { Poison } from '~/db/models/Poison';
import { Seed } from '~/db/models/Seed';
import { Reagent } from '~/db/models/Reagent';
import { MagicItem } from '~/db/models/MagicItem';
import { generateRandomWeaponWithMetal } from '~/commands/itemGeneration/generateweapon';
import { generateRandomArmorWithMetal } from '~/commands/itemGeneration/generatearmor';
import { getRandomPetByRarityAndType } from '~/commands/itemGeneration/generatepet';
import { getRandomReagentByRarityAndType } from '~/commands/itemGeneration/generatereagent';
import { getRandomMetalByRarityExcludingPlanes } from '~/commands/itemGeneration/generatemetal';

// Type definitions for shipment generation
export type ShipmentItem = { itemName: string; price: number; quantity: number };
type MetalPriceCache = { [metalName: string]: number };

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
        const metal = await getRandomItemByRarity<Metal>('~/db/models/Metal', rarity);
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
          const combo = await generateRandomWeaponWithMetal(rarity);
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
          const combo = await generateRandomArmorWithMetal(rarity);
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
          const meal = await getRandomItemByRarity<Meal>('~/db/models/Meal', rarity);
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
        const potion = await getRandomItemByRarity<Potion>('~/db/models/Potion', rarity);
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
        const poison = await getRandomItemByRarity<Poison>('~/db/models/Poison', rarity);
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
        const item = await getRandomItemByTable<MagicItem>('~/db/models/MagicItem', table);
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
        const seed = await getRandomItemByRarity<Seed>('~/db/models/Seed', rarity);
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
          const metal = await getRandomItemByRarity<Metal>('~/db/models/Metal', rarity);
          if (metal) {
            const existing = result.find((item) => item.itemName === metal.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: metal.name, price: randomInt(metal.price_min, metal.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 2) {
          const combo = await generateRandomWeaponWithMetal(rarity);
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
          const meal = await getRandomItemByRarity<Meal>('~/db/models/Meal', rarity);
          if (meal) {
            const existing = result.find((item) => item.itemName === meal.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: meal.name, price: randomInt(meal.price_min, meal.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 4) {
          const potion = await getRandomItemByRarity<Potion>('~/db/models/Potion', rarity);
          if (potion) {
            const existing = result.find((item) => item.itemName === potion.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: potion.name, price: randomInt(potion.price_min, potion.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 5) {
          const poison = await getRandomItemByRarity<Poison>('~/db/models/Poison', rarity);
          if (poison) {
            const existing = result.find((item) => item.itemName === poison.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: poison.name, price: randomInt(poison.price_min, poison.price_max), quantity: 1 });
            }
          }
        } else if (typeRoll === 6) {
          const reagent = await getRandomItemByRarity<Reagent>('~/db/models/Reagent', rarity);
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
          const seed = await getRandomItemByRarity<Seed>('~/db/models/Seed', rarity);
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
          const item = await getRandomItemByTable<MagicItem>('~/db/models/MagicItem', table);
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

/**
 * Handle shipment management when boat properties are updated
 */
export async function handleShipmentUpdate(boat: Boat, updates: Partial<Boat>): Promise<void> {
  // If tableToGenerate was changed in the updates, use the new value
  const newTableToGenerate = updates.tableToGenerate !== undefined ? updates.tableToGenerate : boat.tableToGenerate;
  const newIsInTown = updates.isInTown !== undefined ? updates.isInTown : boat.isInTown;

  const shouldHaveShipmentAfterUpdate = newIsInTown && newTableToGenerate && newTableToGenerate !== 'NA';

  if (shouldHaveShipmentAfterUpdate) {
    // Remove old shipments for this boat
    await Shipment.destroy({ where: { boatName: boat.boatName } });

    // Generate new shipment if the boat should have one
    const goods = await generateShipmentItems({
      ...boat.dataValues,
      ...updates,
      tableToGenerate: newTableToGenerate,
      isInTown: newIsInTown,
    } as Boat);

    // Insert new shipment items
    for (const item of goods) {
      await Shipment.create({
        boatName: boat.boatName,
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity,
      });
    }
  } else {
    // Remove shipments if boat should not have them
    await Shipment.destroy({ where: { boatName: boat.boatName } });
  }
}

/**
 * Create informative response message for boat updates with shipment status
 */
export async function createBoatUpdateMessage(
  boatName: string,
  updates: Partial<Boat>,
  originalBoat: Boat
): Promise<string> {
  const updatedBoat = { ...originalBoat.dataValues, ...updates } as Boat;

  let responseMessage = `✅ **Boat "${formatNames(boatName)}" updated successfully!**\n\n`;

  // Add comprehensive boat information
  responseMessage += await createBoatStatusDescription(updatedBoat);

  return responseMessage;
}

/**
 * Handle a boat leaving town - sets up timing and clears shipments
 */
export async function handleBoatLeavingTown(boat: Boat): Promise<void> {
  if (boat.isTier2) {
    boat.weeksLeft = boat.waitTime - 1;
  } else {
    boat.weeksLeft = boat.waitTime;
  }
  boat.isInTown = false;
  await boat.save();

  // Remove all shipments for this boat
  await Shipment.destroy({ where: { boatName: boat.boatName } });
}

/**
 * Handle a boat arriving in town - sets up timing and generates shipments
 */
export async function handleBoatArrivingInTown(boat: Boat): Promise<void> {
  if (boat.isTier2) {
    boat.weeksLeft = boat.timeInTown + 1;
  } else {
    boat.weeksLeft = boat.timeInTown;
  }
  boat.isInTown = true;
  await boat.save();

  // Generate shipment if needed
  if (boat.tableToGenerate && boat.tableToGenerate !== 'NA') {
    // Remove any old shipments for this boat (just in case)
    await Shipment.destroy({ where: { boatName: boat.boatName } });

    const goods = await generateShipmentItems(boat);
    // Insert each item as a row in the Shipment table
    for (const item of goods) {
      await Shipment.create({
        boatName: boat.boatName,
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity,
      });
    }
  }
}

/**
 * Safely destroy a boat and all associated shipments with cascade deletion
 */
export async function destroyBoatWithCascade(boatName: string): Promise<{ shipmentCount: number }> {
  // First count the shipments that will be deleted
  const shipmentCount = await Shipment.count({ where: { boatName } });

  // Delete all shipments first
  await Shipment.destroy({ where: { boatName } });

  // Then delete the boat
  await Boat.destroy({ where: { boatName } });

  return { shipmentCount };
}

/**
 * Calculate price for a simple item (potions, pets, meals, etc.)
 */
export function calculateSimpleItemPrice(item: { price_min: number; price_max: number }): number {
  return randomInt(item.price_min, item.price_max);
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
 * Calculate price for metal itself
 */
export function calculateMetalPrice(metal: { price_min: number; price_max: number }): number {
  return randomInt(metal.price_min, metal.price_max);
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
 * Format boat basic info for listings (shorter version)
 */
export function formatBoatBasicInfo(boat: Boat): string {
  let info = `**${formatNames(boat.boatName)}**\n`;
  info += `${boat.isRunning ? '🚢' : '⚓'} ${boat.isInTown ? 'In Town' : 'At Sea'} • ${boat.weeksLeft} week(s) left`;

  if (boat.isTier2) {
    info += ' • Tier 2';
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
 * Get user-friendly table description instead of internal table name
 */
export function getTableDescription(tableToGenerate: string | null): string {
  if (!tableToGenerate || tableToGenerate === 'NA') {
    return 'No shipments generated';
  }

  const tableDescriptions: { [key: string]: string } = {
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

  return tableDescriptions[tableToGenerate] || formatNames(tableToGenerate);
}

/**
 * Create a comprehensive boat status embed description
 */
export async function createBoatStatusDescription(boat: Boat): Promise<string> {
  let description = formatBoatInfo(boat);

  // Add shipment type description
  const tableDesc = getTableDescription(boat.tableToGenerate);
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
    const tableDescription = getTableDescription(boat.tableToGenerate);

    let desc = boatInfo;
    if (tableDescription) {
      desc += `\n**Table:** ${tableDescription}`;
    }
    if (shipmentInfo) {
      desc += `\n\n${shipmentInfo}`;
    }

    const updatedEmbed = new EmbedBuilder()
      .setTitle(boat.boatName)
      .setDescription(desc)
      .setColor(0x2e86c1);

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
