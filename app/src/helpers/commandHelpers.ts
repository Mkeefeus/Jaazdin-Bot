import { RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from 'discord.js';
import { CommandData, CommandFile, CommandOption } from '~/types';

function sanitizeDescription(description: string, commandName: string, optionName?: string): string {
  if (description.length < 1) {
    throw new Error(`Invalid command description in ${commandName}: Must be at least 1 character.`);
  }
  if (description.length > 100) {
    console.log(
      `Warning: Command description${optionName ? ` for option "${optionName}"` : ''} in ${commandName} exceeded 100 characters. It has been truncated to fit the limit.`
    );
    return `Use /help ${commandName} for details.`;
  }
  return description;
}

/**
 * Builds a Discord.js slash command from a CommandData object
 * @param commandData - The CommandData object containing command details
 * @returns A SlashCommandBuilder instance
 */
export function buildCommand(commandData: CommandData): SlashCommandBuilder {
  if (commandData.name.length < 1 || commandData.name.length > 32) {
    throw new Error(`Command name "${commandData.name}" must be between 1 and 32 characters.`);
  }

  if (commandData.description.length < 1) {
    throw new Error(`Command description for "${commandData.name}" must be at least 1 character.`);
  }

  const sanitizedDescription = sanitizeDescription(commandData.description, commandData.name);

  const builder = new SlashCommandBuilder().setName(commandData.name).setDescription(sanitizedDescription);

  if (commandData.options) {
    buildCommandOptions(builder, commandData.options);
  }

  return builder;
}

/**
 * Builds Discord.js slash command options from an array of CommandOption objects
 * @param builder - The SlashCommandBuilder to add options to
 * @param options - Array of CommandOption objects
 * @returns The modified SlashCommandBuilder
 */
export function buildCommandOptions(builder: SlashCommandBuilder, options: CommandOption[]): SlashCommandBuilder {
  const commandName = builder.name;
  let firstOptionalFound = false;
  for (const option of options) {
    const sanitizedDescription = sanitizeDescription(option.description, commandName, option.name);
    if (option.name.length < 1 || option.name.length > 32) {
      throw new Error(
        `Invalid command option name "${option.name}" in ${commandName}: Must be between 1 and 32 characters.`
      );
    }
    if (!option.required) {
      firstOptionalFound = true;
    } else if (firstOptionalFound && option.required) {
      throw new Error(
        `Invalid command options in ${commandName}: Required option "${option.name}" cannot follow an optional option.`
      );
    }
    switch (option.type) {
      case 'string':
        builder.addStringOption((stringOption) => {
          stringOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            stringOption.setRequired(true);
          }

          if (option.choices) {
            stringOption.addChoices(...option.choices);
          }

          if (option.minLength !== undefined) {
            stringOption.setMinLength(option.minLength);
          }

          if (option.maxLength !== undefined) {
            stringOption.setMaxLength(option.maxLength);
          }

          if (option.autocomplete) {
            stringOption.setAutocomplete(option.autocomplete);
          }

          if (option.name_localizations) {
            stringOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            stringOption.setDescriptionLocalizations(option.description_localizations);
          }

          return stringOption;
        });
        break;

      case 'integer':
        builder.addIntegerOption((integerOption) => {
          integerOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            integerOption.setRequired(true);
          }

          if (option.choices) {
            integerOption.addChoices(...option.choices);
          }

          if (option.minValue !== undefined) {
            integerOption.setMinValue(option.minValue);
          }

          if (option.maxValue !== undefined) {
            integerOption.setMaxValue(option.maxValue);
          }

          if (option.autocomplete) {
            integerOption.setAutocomplete(option.autocomplete);
          }

          if (option.name_localizations) {
            integerOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            integerOption.setDescriptionLocalizations(option.description_localizations);
          }

          return integerOption;
        });
        break;

      case 'boolean':
        builder.addBooleanOption((booleanOption) => {
          booleanOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            booleanOption.setRequired(true);
          }

          if (option.name_localizations) {
            booleanOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            booleanOption.setDescriptionLocalizations(option.description_localizations);
          }

          return booleanOption;
        });
        break;

      case 'number':
        builder.addNumberOption((numberOption) => {
          numberOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            numberOption.setRequired(true);
          }

          if (option.choices) {
            numberOption.addChoices(...option.choices);
          }

          if (option.minValue !== undefined) {
            numberOption.setMinValue(option.minValue);
          }

          if (option.maxValue !== undefined) {
            numberOption.setMaxValue(option.maxValue);
          }

          if (option.autocomplete) {
            numberOption.setAutocomplete(option.autocomplete);
          }

          if (option.name_localizations) {
            numberOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            numberOption.setDescriptionLocalizations(option.description_localizations);
          }

          return numberOption;
        });
        break;

      case 'user':
        builder.addUserOption((userOption) => {
          userOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            userOption.setRequired(true);
          }

          if (option.name_localizations) {
            userOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            userOption.setDescriptionLocalizations(option.description_localizations);
          }

          return userOption;
        });
        break;

      case 'channel':
        builder.addChannelOption((channelOption) => {
          channelOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            channelOption.setRequired(true);
          }

          if (option.channelTypes) {
            channelOption.addChannelTypes(...option.channelTypes);
          }

          if (option.name_localizations) {
            channelOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            channelOption.setDescriptionLocalizations(option.description_localizations);
          }

          return channelOption;
        });
        break;

      case 'role':
        builder.addRoleOption((roleOption) => {
          roleOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            roleOption.setRequired(true);
          }

          if (option.name_localizations) {
            roleOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            roleOption.setDescriptionLocalizations(option.description_localizations);
          }

          return roleOption;
        });
        break;

      case 'mentionable':
        builder.addMentionableOption((mentionableOption) => {
          mentionableOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            mentionableOption.setRequired(true);
          }

          if (option.name_localizations) {
            mentionableOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            mentionableOption.setDescriptionLocalizations(option.description_localizations);
          }

          return mentionableOption;
        });
        break;

      case 'attachment':
        builder.addAttachmentOption((attachmentOption) => {
          attachmentOption.setName(option.name).setDescription(sanitizedDescription);

          if (option.required) {
            attachmentOption.setRequired(true);
          }

          if (option.name_localizations) {
            attachmentOption.setNameLocalizations(option.name_localizations);
          }

          if (option.description_localizations) {
            attachmentOption.setDescriptionLocalizations(option.description_localizations);
          }

          return attachmentOption;
        });
        break;

      default: {
        // TypeScript will ensure this is never reached if all cases are handled
        const exhaustiveCheck: never = option;
        throw new Error(`Unhandled command option type: ${exhaustiveCheck}`);
      }
    }
  }

  return builder;
}

// Function overloads for type-safe returns
export async function loadCommandFiles(
  returnType: 'commands'
): Promise<RESTPostAPIChatInputApplicationCommandsJSONBody[]>;
export async function loadCommandFiles(returnType: 'commandsData'): Promise<CommandData[]>;
export async function loadCommandFiles(
  returnType?: 'both'
): Promise<{ commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]; commandsData: CommandData[] }>;

export async function loadCommandFiles(
  returnType?: 'commands' | 'commandsData' | 'both'
): Promise<
  | RESTPostAPIChatInputApplicationCommandsJSONBody[]
  | CommandData[]
  | { commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]; commandsData: CommandData[] }
> {
  const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  const commandsData: CommandData[] = [];

  // Use Bun's built-in path resolution
  const commandsPath = new URL('../commands', import.meta.url).pathname;

  try {
    // Use Bun's native file system APIs
    const commandFolders = await Array.fromAsync(new Bun.Glob('*').scan({ cwd: commandsPath, onlyFiles: false }));

    for (const folder of commandFolders) {
      const folderPath = `${commandsPath}/${folder}`;

      // Check if it's actually a directory by trying to scan it directly
      try {
        const commandFiles = await Array.fromAsync(new Bun.Glob('*.{ts,js}').scan({ cwd: folderPath }));

        for (const file of commandFiles) {
          const filePath = `${folderPath}/${file}`;

          try {
            const command = (await import(filePath)) as CommandFile;

            if (!command) {
              console.log(`[WARNING] The command at ${filePath} does not export a valid command.`);
              continue;
            }
            if (!command.data) {
              console.log(`[WARNING] The command at ${filePath} is missing a required "data" property.`);
              continue;
            }
            if (!command.execute) {
              console.log(`[WARNING] The command at ${filePath} is missing a required "execute" function.`);
              continue;
            }
            if (!command.commandData) {
              console.log(`[WARNING] The command at ${filePath} is missing a required "commandData" property.`);
              continue;
            }

            // Only process commands if we need them
            if (returnType === 'commands' || returnType === 'both' || !returnType) {
              commands.push(command.data.toJSON());
              // console.log(`Loaded command: ${command.data.name}`);
            }
            // Only process commandsData if we need them
            if (returnType === 'commandsData' || returnType === 'both' || !returnType) {
              commandsData.push(command.commandData);
            }
          } catch (error) {
            console.error(`Error loading command from ${filePath}:`, error);
          }
        }
      } catch (_globError) {
        // If we can't scan the folder, it's likely a file, so skip it
        // console.log(`Skipping ${folder} - not a directory`);
        continue;
      }
    }
  } catch (error) {
    console.error('Error loading command files:', error);
  }

  // Return based on the specified type with proper type safety
  switch (returnType) {
    case 'commands':
      return commands;
    case 'commandsData':
      return commandsData;
    case 'both':
    default:
      return { commands, commandsData };
  }
}
