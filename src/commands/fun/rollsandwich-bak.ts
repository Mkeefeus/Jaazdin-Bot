// import {
//   SlashCommandBuilder,
//   ChatInputCommandInteraction,
//   ActionRowBuilder,
//   ButtonBuilder,
//   ButtonStyle,
//   EmbedBuilder,
//   ComponentType,
//   ButtonInteraction,
// } from "discord.js";
// import { Command } from "../../types/command.js";

// interface CategoryConfig {
//   items: string[];
//   dice: number;
//   emoji: string;
// }

// interface SandwichState {
//   [key: string]: {
//     value: string;
//     roll?: string;
//   };
// }

// // Configure each category with its dice size
// const categories: Record<string, CategoryConfig> = {
//   bread: {
//     items: [
//       "White Bread",
//       "Wheat Bread",
//       "Sourdough",
//       "Rye",
//       "Italian",
//       "French Baguette",
//       "Ciabatta",
//       "Focaccia",
//       "Pita",
//       "Brioche",
//       "English Muffin",
//       "Bagel",
//     ],
//     dice: 12,
//     emoji: "🍞",
//   },
//   protein: {
//     items: [
//       "Turkey",
//       "Ham",
//       "Roast Beef",
//       "Chicken",
//       "Tuna",
//       "Salami",
//       "Pepperoni",
//       "Bologna",
//       "Pastrami",
//       "Corned Beef",
//       "Prosciutto",
//       "Bacon",
//       "Egg Salad",
//       "Chicken Salad",
//       "Meatballs",
//       "Tofu",
//       "Falafel",
//       "Pulled Pork",
//       "BBQ Brisket",
//       "Grilled Chicken",
//     ],
//     dice: 20,
//     emoji: "🥩",
//   },
//   cheese: {
//     items: [
//       "American",
//       "Cheddar",
//       "Swiss",
//       "Provolone",
//       "Mozzarella",
//       "Pepper Jack",
//       "Muenster",
//       "Gouda",
//       "Brie",
//       "Havarti",
//     ],
//     dice: 10,
//     emoji: "🧀",
//   },
//   vegetables: {
//     items: [
//       "Lettuce",
//       "Tomato",
//       "Onion",
//       "Cucumber",
//       "Bell Peppers",
//       "Spinach",
//       "Pickles",
//       "Jalapeños",
//       "No Veggies",
//     ],
//     dice: 8,
//     emoji: "🥬",
//   },
//   condiments: {
//     items: [
//       "Mayo",
//       "Mustard",
//       "Honey Mustard",
//       "Ranch",
//       "Italian Dressing",
//       "No Sauce",
//     ],
//     dice: 6,
//     emoji: "🥫",
//   },
//   extras: {
//     items: [
//       "Salt & Pepper",
//       "Red Pepper Flakes",
//       "Potato Chips",
//       "Nothing Extra",
//     ],
//     dice: 4,
//     emoji: "✨",
//   },
// };

// const rollDice = (sides: number): number =>
//   Math.floor(Math.random() * sides) + 1;

// const getItemFromRoll = (category: CategoryConfig, roll: number): string => {
//   const index = (roll - 1) % category.items.length;
//   return category.items[index];
// };

// const getInitialState = (): SandwichState => {
//   return Object.keys(categories).reduce((acc, category) => {
//     acc[category] = { value: "???" };
//     return acc;
//   }, {} as SandwichState);
// };

// const createSandwichEmbed = (state: SandwichState): EmbedBuilder => {
//   const embed = new EmbedBuilder()
//     .setColor(0xffa500)
//     .setTitle("🎲 Roll For Sandwich! 🎲")
//     .setDescription("Roll different-sided dice for each ingredient!")
//     .addFields(
//       Object.entries(state).map(([category, data]) => ({
//         name: `${categories[category].emoji} ${
//           category.charAt(0).toUpperCase() + category.slice(1)
//         } (d${categories[category].dice})`,
//         value: data.roll ? `Rolled: ${data.roll}\n${data.value}` : data.value,
//         inline: true,
//       }))
//     )
//     .setFooter({ text: "Roll all ingredients to get a tastiness score!" })
//     .setTimestamp();

//   // Add tastiness score if all ingredients are rolled
//   // if (Object.values(state).every((data) => data.value !== "???")) {
//   //   const tastyScore = rollDice(100);
//   //   embed.addFields({
//   //     name: "📊 Tastiness Score",
//   //     value: `${tastyScore}/100 - ${getTastyVerdict(tastyScore)}`,
//   //     inline: false,
//   //   });
//   // }

//   return embed;
// };

// const getTastyVerdict = (score: number): string => {
//   if (score >= 90) return "Natural 20! This sandwich is legendary! 🌟";
//   if (score >= 70) return "High roll! Sounds delicious! 😋";
//   if (score >= 50) return "Medium roll... Might be worth trying! 🤔";
//   if (score >= 30) return "Low roll... Proceed with caution! 😅";
//   return "Critical fail! Order takeout instead... 😬";
// };

// const createButtons = (
//   state: SandwichState
// ): ActionRowBuilder<ButtonBuilder>[] => {
//   const rows: ActionRowBuilder<ButtonBuilder>[] = [];

//   // Category buttons (split into two rows)
//   const categories1 = Object.keys(categories).slice(0, 3);
//   const categories2 = Object.keys(categories).slice(3);

//   [categories1, categories2].forEach((categoryGroup) => {
//     const row = new ActionRowBuilder<ButtonBuilder>();
//     categoryGroup.forEach((category) => {
//       row.addComponents(
//         new ButtonBuilder()
//           .setCustomId(`roll_${category}`)
//           .setLabel(`Roll d${categories[category].dice}`)
//           .setStyle(ButtonStyle.Primary)
//           .setEmoji(categories[category].emoji)
//       );
//     });
//     rows.push(row);
//   });

//   // Control buttons
//   const controlRow = new ActionRowBuilder<ButtonBuilder>();
//   controlRow.addComponents(
//     new ButtonBuilder()
//       .setCustomId("roll_all")
//       .setLabel("Roll All Dice")
//       .setStyle(ButtonStyle.Success)
//       .setEmoji("🎲"),
//     new ButtonBuilder()
//       .setCustomId("reset")
//       .setLabel("Reset")
//       .setStyle(ButtonStyle.Danger)
//       .setEmoji("🔄")
//   );
//   rows.push(controlRow);

//   return rows;
// };

// const rollSandwich: Command = {
//   data: new SlashCommandBuilder()
//     .setName("rollsandwich")
//     .setDescription("Roll different dice for each sandwich ingredient!"),

//   async execute(interaction: ChatInputCommandInteraction) {
//     const state = getInitialState();
//     const embed = createSandwichEmbed(state);
//     const buttons = createButtons(state);

//     const response = await interaction.reply({
//       embeds: [embed],
//       components: buttons,
//       fetchReply: true,
//     });

//     const collector = response.createMessageComponentCollector({
//       componentType: ComponentType.Button,
//       time: 300000, // 5 minutes
//     });

//     collector.on("collect", async (i: ButtonInteraction) => {
//       const [action, category] = i.customId.split("_");

//       if (action === "roll") {
//         if (category === "all") {
//           // Roll all categories
//           Object.keys(categories).forEach((cat) => {
//             const roll = rollDice(categories[cat].dice);
//             state[cat] = {
//               value: getItemFromRoll(categories[cat], roll),
//               roll: `${roll}`,
//             };
//           });
//         } else {
//           // Roll single category
//           const roll = rollDice(categories[category].dice);
//           state[category] = {
//             value: getItemFromRoll(categories[category], roll),
//             roll: `${roll}`,
//           };
//         }
//       } else if (action === "reset") {
//         Object.keys(state).forEach((cat) => {
//           state[cat] = { value: "???" };
//         });
//       }

//       await i.update({
//         embeds: [createSandwichEmbed(state)],
//         components: createButtons(state),
//       });
//     });

//     collector.on("end", () => {
//       interaction
//         .editReply({
//           components: [],
//         })
//         .catch(console.error);
//     });
//   },
// };

// // export default rollSandwich;
