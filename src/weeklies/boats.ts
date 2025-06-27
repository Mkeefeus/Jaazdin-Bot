import { Op } from 'sequelize';
import { Boat } from '../db/models/Boat';
import { Shipment } from '../db/models/Shipment';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { client } from '~/index';
// Import helper functions
import {
  getRandomMetalByRarity,
  getRandomMetalByRarityExcludingPlanes,
} from '../commands/itemGeneration/generatemetal';
import { generateRandomWeaponWithMetal } from '../commands/itemGeneration/generateweapon';
import { generateRandomArmorWithMetal } from '../commands/itemGeneration/generatearmor';
import { getRandomMealByRarity } from '../commands/itemGeneration/generatemeal';
import { getRandomPetByRarityAndType } from '../commands/itemGeneration/generatepet';
import { getRandomPoisonByRarity } from '../commands/itemGeneration/generatepoison';
import { getRandomPotionByRarity } from '../commands/itemGeneration/generatepotion';
import { getRandomMagicItemByTable } from '../commands/itemGeneration/generatemagicitem';
import { getRandomSeedByRarity } from '../commands/itemGeneration/generateseeds';
import { getRandomReagentByRarity, getRandomReagentByRarityAndType } from '../commands/itemGeneration/generatereagent';

// Stub: Replace with your actual item generation logic
type ShipmentItem = { itemName: string; price: number; quantity: number };

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to cache metal prices for a shipment
type MetalPriceCache = { [metalName: string]: number };

async function generateShipmentItems(boat: Boat): Promise<ShipmentItem[]> {
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
          // Check if metal already exists in result
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
      // Determine rarities for 2 weapons and 2 armors, each 1d4 (1-2 Uncommon, 3 Rare, 4 Very Rare)
      for (let i = 0; i < 4; i++) {
        let rarity = 'Uncommon';
        const roll = randomInt(1, 4);
        if (roll === 3) rarity = 'Rare';
        else if (roll === 4) rarity = 'Very Rare';
        rarities.push(rarity);
      }
      const metalsInUse: MetalPriceCache = {};
      // First 2 are weapons, next 2 are armors
      for (let i = 0; i < 4; i++) {
        const rarity = rarities[i];
        if (i < 2) {
          // Weapons
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
          // Armors
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
        // Determine pet type by 1d20 roll
        const typeRoll = randomInt(1, 20);
        let type: string;
        if (typeRoll >= 1 && typeRoll <= 8) type = 'Beast';
        else if (typeRoll >= 9 && typeRoll <= 13) type = 'Monstrosity';
        else if (typeRoll >= 14 && typeRoll <= 17) type = 'Aberration';
        else if (typeRoll >= 18 && typeRoll <= 19) type = 'Ooze';
        else type = 'Dragon';
        const pet = await getRandomPetByRarityAndType(rarity, type);
        if (pet) {
          const price = randomInt(pet.price_min, pet.price_max);
          result.push({ itemName: pet.name, price, quantity: 1 });
        }
      }
      return result;
    }
    case 'meals': {
      const result: ShipmentItem[] = [];
      // Start with 4 Common, 4 Uncommon, 4 Rare, then roll 1d4 for each; on a 4, upgrade rarity by 1 tier
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
      // 5 potions: 3 start Uncommon, 2 start Rare. Roll 1d4 for each; on a 4, upgrade rarity by 1 tier.
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
      // 4 poisons: 2 start Uncommon, 2 start Rare. Roll 1d4 for each; on a 4, upgrade rarity by 1 tier.
      const poisonRarities: string[] = [];
      for (let i = 0; i < 2; i++) poisonRarities.push('Uncommon');
      for (let i = 0; i < 2; i++) poisonRarities.push('Rare');
      for (let i = 0; i < poisonRarities.length; i++) {
        let rarity = poisonRarities[i];
        const roll = randomInt(1, 4);
        const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'];
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
      // 8 magic items: 5 start at table A, 3 at table B. Roll 1d6 for each; on a 5 upgrade by 1 table, on a 6 upgrade by 2 tables.
      const tableOrder = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < 8; i++) {
        let tableIdx = i < 5 ? 0 : 1; // 0 for 'A', 1 for 'B'
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
    case 'seeds': {
      const result: ShipmentItem[] = [];
      // 6 seeds: 2 start Common, 2 Uncommon, 2 Rare. Roll 1d4 for each; on a 3 upgrade rarity by 1 tier, on a 4 upgrade by 2 tiers.
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
      // Generate 3 metals, all not from the material plane. Each starts at Uncommon rarity.
      // For each: 1d6, on 5 = Rare, on 6 = Very Rare.
      const result: ShipmentItem[] = [];
      for (let i = 0; i < 3; i++) {
        let rarity = 'Uncommon';
        const roll = randomInt(1, 6);
        if (roll === 5) rarity = 'Rare';
        else if (roll === 6) rarity = 'Very Rare';
        const metal = await getRandomMetalByRarity(rarity);
        if (metal) {
          const metal = await getRandomMetalByRarityExcludingPlanes(rarity, ['Material']);
          if (metal) {
            const existing = result.find((item) => item.itemName === metal.name);
            if (existing) {
              existing.quantity += 1;
            } else {
              result.push({ itemName: metal.name, price: randomInt(metal.price_min, metal.price_max), quantity: 1 });
            }
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
          // Metal
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
          // Weapon
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
          // Meal
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
          // Potion
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
          // Poison
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
          // Reagent
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
          // Seed
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
          // Magic Item
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

async function update() {
  // 1. Advance all running boats by 1 week
  await Boat.update(
    { weeksLeft: (Boat.sequelize as import('sequelize').Sequelize).literal('weeksLeft - 1') },
    { where: { isRunning: true } }
  );

  // 2. Update boats that reached 0 weeks
  const boatsToUpdate = await Boat.findAll({
    where: {
      isRunning: true,
      weeksLeft: { [Op.lte]: 0 },
    },
  });

  for (const boat of boatsToUpdate) {
    if (boat.isInTown) {
      // Boat is leaving town
      if (boat.isTier2) {
        boat.weeksLeft = boat.waitTime - 1;
      } else {
        boat.weeksLeft = boat.waitTime;
      }
      boat.isInTown = false;
      await boat.save();

      // Remove all shipments for this boat
      await Shipment.destroy({ where: { boatName: boat.boatName } });
    } else {
      // Boat is arriving in town
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
  }
}

async function post() {
  // Boats not in town
  const boatsNotInTownRaw = await Boat.findAll({
    where: { isRunning: true, isInTown: false },
    order: [['weeksLeft', 'ASC']],
    attributes: ['boatName', 'weeksLeft'],
  });
  const boatsNotInTown = boatsNotInTownRaw.map((b) => ({
    boatName: b.boatName,
    weeksLeft: b.weeksLeft,
  }));

  // Boats in town
  const boatsInTownRaw = await Boat.findAll({
    where: { isRunning: true, isInTown: true },
    order: [['weeksLeft', 'ASC']],
  });

  const embeds: EmbedBuilder[] = [];
  const CHANNEL_ID = 'YOUR_CHANNEL_ID_HERE'; // Replace with your Discord channel ID

  // Embed for boats not in town
  if (boatsNotInTown.length > 0) {
    const notInTownDesc = boatsNotInTown.map((b) => `• **${b.boatName}** — ${b.weeksLeft} week(s) left`).join('\n');
    embeds.push(new EmbedBuilder().setTitle('Boats Not In Town').setDescription(notInTownDesc).setColor(0x888888));
  }

  // Embeds for boats in town
  for (const boat of boatsInTownRaw) {
    let goods: ShipmentItem[] = [];
    if (boat.tableToGenerate && boat.tableToGenerate !== 'NA') {
      // Fetch all shipment rows for this boat
      const shipments = await Shipment.findAll({ where: { boatName: boat.boatName } });
      goods = shipments.map((s) => ({
        itemName: s.itemName,
        price: s.price,
        quantity: s.quantity,
      }));
    }

    let desc = `**Weeks Left:** ${boat.weeksLeft}\n`;

    //
    if (boat.jobsAffected && Array.isArray(boat.jobsAffected) && boat.jobsAffected.length > 0) {
      desc += `${boat.jobsAffected.join(', ')} have their gp wage die amount +1.\n`;
    }

    if (boat.isTier2 && boat.tier2Ability) desc += `**Tier 2 Ability:** ${boat.tier2Ability}\n`;
    if (goods.length > 0) {
      desc += `**Shipment:**\n${goods
        .map((item) => `• ${item.itemName} (x${item.quantity}) — ${item.price} gp`)
        .join('\n')}`;
    } else {
      desc += `No shipment generated.`;
    }

    embeds.push(
      new EmbedBuilder()
        .setTitle(boat.boatName)
        .setDescription(desc)
        .setColor(0x2e86c1)
        .setFooter({ text: `Boat Table: ${boat.tableToGenerate || 'N/A'}` })
    );
  }

  if (!client.isReady()) {
    console.warn('Discord client not ready.');
    return;
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel instanceof TextChannel) {
      for (let i = 0; i < embeds.length; i += 10) {
        await channel.send({ embeds: embeds.slice(i, i + 10) });
      }
      console.log('Boat update sent to Discord.');
    } else {
      console.warn('Target channel is not a text channel.');
    }
  } catch (error) {
    console.error('Failed to send boat update:', error);
  }
}

export { update, post };
