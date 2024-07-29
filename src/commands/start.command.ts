import { Bot, InlineKeyboard } from "grammy";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { beginCell, toNano } from "ton-core";
import qs from "qs";

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
      const msg_body = beginCell().storeUint(2, 32).endCell();
      const link = `https://app.tonkeeper.com/transfer/${
        process.env.SC_ADDRESS
      }?${qs.stringify({
        text: "Donate by 0.01 TON",
        amount: toNano("0.01").toString(10),
        bin: msg_body.toBoc({ idx: false }).toString("base64"),
      })}`;
      await ctx.reply("To donation me 0.01 TON, please sign a transaction:", {
        reply_markup: {
          inline_keyboard: [[{ text: "Sign transaction", url: link }]],
        },
      });
    });
  }
}