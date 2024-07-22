import { Bot, InlineKeyboard, InputFile } from "grammy";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { readFileSync } from "fs";

export class InfoCommand extends Command {
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.command("info", async (ctx) => {
      try {
        const descriptionText = readFileSync(
          "./public/text/about.html",
          "utf8"
        );
        console.log(descriptionText);
        const inlineKeyboard = new InlineKeyboard().webApp(
          "🤿  Dive more...",
          "https://marsnearby.fun"
        );
        // const text = `Hi ${
        //   ctx.message?.from.first_name ?? "User"
        // }! This is ansfer on info the info command!`;

        await ctx.replyWithPhoto(
          new InputFile({
            url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/NASA_Mars_Rover.jpg/600px-NASA_Mars_Rover.jpg",
          }),
          {
            caption: descriptionText,
            show_caption_above_media: false,
            has_spoiler: true,
            parse_mode: "HTML",
            reply_markup: inlineKeyboard,
          }
        );
      } catch (e) {
        console.error(`"info" command handling error: ${e}`);
      }
    });
  }
}
