import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { HelpData } from '~/types/command';

// Skill bonus
// Item Bonus
// Flat bonus
// Has tool prof
// Formula: (tier)d(die) + ((Skill + Item + (Math.Max(0, tier - 7)) * (tier >=5 && hasToolProf ? 2 : 1)) + flat bonus

export const data = new SlashCommandBuilder()
  .setName('getwage')
  .setDescription('Calculate your wage formula')
  .addIntegerOption((option) =>
    option.setName('tier').setDescription('The tier of the job').setMinValue(1).setMaxValue(30).setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('die')
      .setDescription('The wage die')
      .addChoices(['d4', 'd6', 'd8', 'd10', 'd12'].map((die) => ({ name: die, value: die })))
      .setRequired(true)
  )
  .addIntegerOption((option) => option.setName('skill_bonus').setDescription('The skill bonus').setRequired(true).setMinValue(-4).setMaxValue(30))
  .addIntegerOption((option) =>
    option.setName('item_bonus').setDescription('The item bonus (+1 tools, luckstone, etc)').setMinValue(1)
  )
  .addStringOption((option) => option.setName('flat_bonus').setDescription('The flat bonus (Boats, festivals, etc)'))
  .addBooleanOption((option) => option.setName('has_proficiency').setDescription('Whether you have tool proficiency'));

function generateMultipliedBonusString(
  skillBonusString: string,
  itemBonusString: string,
  tierBonusString: string,
  toolProfMultiplier: number
) {
  if (!skillBonusString && !itemBonusString && !tierBonusString) return '';
  const skillItemTierString = `${skillBonusString}${itemBonusString}${tierBonusString}`.trim();
  if (toolProfMultiplier > 1) {
    return `+ (${skillItemTierString}) * ${toolProfMultiplier} (Proficiency) `;
  }
  return `+ ${skillItemTierString} `;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const tier = interaction.options.getInteger('tier', true);
  const die = interaction.options.getString('die', true);
  const skillBonus = interaction.options.getInteger('skill_bonus') || 0;
  const itemBonus = interaction.options.getInteger('item_bonus') || 0;
  const flatBonus = interaction.options.getString('flat_bonus') || '';
  const hasToolProf = interaction.options.getBoolean('has_proficiency') || false;

  const tierBonus = Math.max(0, tier - 7);
  const toolProfMultiplier = tier >= 5 && hasToolProf ? 2 : 1;
  const totalBonus = (skillBonus + itemBonus + tierBonus) * toolProfMultiplier;

  const dieString = `${tier}${die} (Tier)`;
  const skillBonusString = skillBonus > 0 ? `${skillBonus} (Skill) ` : ''; // No plus sign here, handled in generateMultipliedBonusString
  const itemBonusString = itemBonus > 0 ? `+ ${itemBonus} (Item) ` : '';
  const tierBonusString = tierBonus > 0 ? `+ ${tierBonus} (Tier Bonus) ` : '';
  // const flatBonusString = flatBonus > 0 ? `+ ${flatBonus} (Flat Bonus)` : '';

  const multipliedBonusString = generateMultipliedBonusString(
    skillBonusString,
    itemBonusString,
    tierBonusString,
    toolProfMultiplier
  );

  const totalBonusString = `${multipliedBonusString}${flatBonus ? `+ ${flatBonus} (Flat Bonus)` : ''}`.trim();

  const wageFormula = `${tier}${die}${totalBonus > 0 ? ` + ${totalBonus}` : ''} + ${flatBonus}`;

  await interaction.reply({
    embeds: [
      {
        title: 'Wage Calculation',
        description: `Your wage formula is: **${wageFormula}**`,
        fields: [
          { name: 'Breakdown', value: `${dieString} ${totalBonusString || 'No bonuses applied'}`, inline: false },
        ],
        color: 0x00FF00,
      },
    ],
  });
}

export const help: HelpData = {
  name: 'getwage',
  category: 'jobs',
  description: 'Calculate your wage formula',
};
