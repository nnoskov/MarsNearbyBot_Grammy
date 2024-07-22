import { Bot } from "grammy";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";

export class StartCommand extends Command {
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.command("start", async (ctx) => {
      console.log(ctx.session, ctx.message);
      const text = `Hi ${
        ctx.message?.from.first_name ?? "User"
      }! Welcome to Mars Nearby TON Smart Contract testing bot!`;
      await ctx.reply(text);
    });
  }
}
