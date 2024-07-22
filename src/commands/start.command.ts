import { Bot, InlineKeyboard } from "grammy";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";

export class StartCommand extends Command {
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.command("start", async (ctx) => {
      const inlineKeyboard = new InlineKeyboard()
        .webApp("🧪  Start TMA", "https://marsnearby.fun")
        .text("🍩  Donate 0.01 TON", "donate")
        .row()
        .url("About", "https://t.me/marsnearbybot?start=info");
      console.log(`Session data: ${ctx.session}`);
      const text = `Hi ${
        ctx.message?.from.first_name ?? "User"
      }! Welcome to Mars Nearby TON Smart Contract testing bot!`;
      await ctx.react("👌");
      await ctx.reply(text, {
        reply_markup: inlineKeyboard,
      });
    });
    this.bot.callbackQuery(["donate"], async (ctx) => {
      await ctx.answerCallbackQuery(); //To hide the long waiting
      await ctx.reply("Donate or about is selected");
    });
    // this.bot.on("callback_query:data", async (ctx) => {
    //   await ctx.answerCallbackQuery();
    //   await ctx.reply(`${ctx.callbackQuery.data}`);
    // });
  }
}
