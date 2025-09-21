import { SlashCommandBuilder } from "discord.js";
import { CommandData, CommandOption } from "~/types";

/**
 * Builds a Discord.js slash command from a Command object
 * @param commandData - The Command object containing command details
 * @returns A SlashCommandBuilder instance
 */
export function buildCommand(commandData: CommandData): SlashCommandBuilder {
  const builder = new SlashCommandBuilder()
    .setName(commandData.name)
    .setDescription(commandData.description);

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
  for (const option of options) {
    switch (option.type) {
      case 'string':
        builder.addStringOption((stringOption) => {
          stringOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            stringOption.setDescription(option.description);
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
          integerOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            integerOption.setDescription(option.description);
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
          booleanOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            booleanOption.setDescription(option.description);
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
          numberOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            numberOption.setDescription(option.description);
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
          userOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            userOption.setDescription(option.description);
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
          channelOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            channelOption.setDescription(option.description);
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
          roleOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            roleOption.setDescription(option.description);
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
          mentionableOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            mentionableOption.setDescription(option.description);
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
          attachmentOption
            .setName(option.name)
            .setRequired(option.required);
          
          if (option.description) {
            attachmentOption.setDescription(option.description);
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