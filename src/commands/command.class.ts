import { Bot } from "grammy";
import { IBotContext } from "../context/context.interface";
import { BotCommand } from "grammy/types";

export abstract class Command {
  constructor(public bot: Bot<IBotContext>) {}
  abstract handle(): void;
}

export const menuCommands: BotCommand[] = [
  {
    command: "/start",
    description: "Running and Restart the Grammy Bot 🏃",
  },
  {
    command: "/info",
    description: "About the Grammy Bot text formatting ✨",
  },
  {
    command: "/connect",
    description: "Connect wallet  🤑",
  },
];
