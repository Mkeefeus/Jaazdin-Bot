import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { Roles } from './roles';

export type HelpData = {
  name: string;
  description: string;
  requiredRole?: Roles | Roles[];
  category: string;
};

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete: (interaction: AutocompleteInteraction) => Promise<void>;
  help: HelpData;
}
