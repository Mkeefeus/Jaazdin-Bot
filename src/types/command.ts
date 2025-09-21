import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  AutocompleteInteraction,
  LocalizationMap,
  ApplicationCommandOptionAllowedChannelTypes,
  APIApplicationCommandOptionChoice,
} from 'discord.js';
import { Roles } from './roles';

// Base properties shared by all command options
interface BaseCommandOption {
  name: string;
  description: string;
  required?: boolean;
}

// String option with string-specific properties
interface StringCommandOption extends BaseCommandOption {
  type: 'string';
  choices?: APIApplicationCommandOptionChoice<string>[];
  minLength?: number;
  maxLength?: number;
  autocomplete?: boolean;
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Integer option with integer-specific properties
interface IntegerCommandOption extends BaseCommandOption {
  type: 'integer';
  minValue?: number;
  maxValue?: number;
  choices?: APIApplicationCommandOptionChoice<number>[];
  autocomplete?: boolean;
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Boolean option (no specific properties beyond base)
interface BooleanCommandOption extends BaseCommandOption {
  type: 'boolean';
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Number option with number-specific properties
interface NumberCommandOption extends BaseCommandOption {
  type: 'number';
  minValue?: number;
  maxValue?: number;
  choices?: APIApplicationCommandOptionChoice<number>[];
  autocomplete?: boolean;
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// User option
interface UserCommandOption extends BaseCommandOption {
  type: 'user';
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Channel option
interface ChannelCommandOption extends BaseCommandOption {
  type: 'channel';
  channelTypes?: ApplicationCommandOptionAllowedChannelTypes[];
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Role option
interface RoleCommandOption extends BaseCommandOption {
  type: 'role';
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Mentionable option
interface MentionableCommandOption extends BaseCommandOption {
  type: 'mentionable';
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Attachment option
interface AttachmentCommandOption extends BaseCommandOption {
  type: 'attachment';
  description_localizations?: LocalizationMap;
  name_localizations?: LocalizationMap;
}

// Union type for all command options
export type CommandOption =
  | StringCommandOption
  | IntegerCommandOption
  | BooleanCommandOption
  | NumberCommandOption
  | UserCommandOption
  | ChannelCommandOption
  | RoleCommandOption
  | MentionableCommandOption
  | AttachmentCommandOption;

export type HelpDetails = {
  name: string;
  description: string;
  args?: CommandOption[];
};

export type HelpData = {
  name: string;
  description: string;
  requiredRole?: Roles | Roles[];
  category: string;
  options?: CommandOption[];
};

export type CommandData = {
  name: string;
  description: string;
  requiredRole?: Roles | Roles[];
  category: string;
  options?: CommandOption[];
};

export interface CommandFile {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete: (interaction: AutocompleteInteraction) => Promise<void>;
  help?: HelpData;
  commandData?: CommandData;
}
