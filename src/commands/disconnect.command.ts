import { Bot } from "grammy";
import { IBotContext } from "../context/context.interface";
import { Command } from "./command.class";
import { getConnector } from "../ton-connect/connector";

export class DisconnectCommand extends Command {
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.command("disconnect", async (ctx) => {
      const chatId = ctx.chat.id;
      const connector = getConnector(chatId);
      await connector.restoreConnection();
      if (!connector.connected) {
        await ctx.reply("You didn't connect a wallet");
        return;
      }

      await connector.disconnect();
      await ctx.reply("Wallet has been disconnected");
    });
  }
}
