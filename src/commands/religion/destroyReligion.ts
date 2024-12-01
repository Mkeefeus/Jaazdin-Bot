import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';


export const data = new SlashCommandBuilder()
  .setName('destroyreligion')
  .setDescription('Will remove a religion from the active religions')
;

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;

	console.log(name);
	
}

export default {
  data,
  execute,
};
