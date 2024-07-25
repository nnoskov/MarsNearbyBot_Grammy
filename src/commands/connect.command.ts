import { Bot, CallbackQueryContext, InlineKeyboard, InputFile, InputMediaBuilder } from "grammy";
import { IBotContext } from "../context/context.interface";
import { getWalletInfo, getWallets } from "../ton-connect/wallets";
import QRCode from "qrcode";
import { Command } from "./command.class";
import { getConnector } from "../ton-connect/connector";
import { WalletInfoRemote } from "@tonconnect/sdk";
import * as fs from "fs";

export class ConnectCommand extends Command {
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.command("connect", async (ctx) => {
      console.log(ctx.message);
      try {
        const chatId = ctx.chat.id;
        const wallets = await getWallets();
        const connector = getConnector(chatId);

        connector.onStatusChange(async (wallet) => {
          if (wallet) {
            const walletName =
              (await getWalletInfo(wallet.device.appName))?.name ||
              wallet.device.appName;
            ctx.reply(`${walletName} wallet connected!`);
          }
        });

        const link = connector.connect(wallets);
        const image = await QRCode.toBuffer(link);
        const inline_keyboard = new InlineKeyboard()
          .text("Choose a Wallet", "choose_wallet")
          .url(
            "Open Link",
            `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
              link
            )}`
          );

        await ctx.replyWithPhoto(new InputFile(image), {
          reply_markup: inline_keyboard,
        });
      } catch (err) {
        console.error(`"connect" command handling error: ${err}`);
      }
    });

    this.bot.callbackQuery(["choose_wallet"], async (ctx) => {
      ctx.answerCallbackQuery();
      const wallets = await getWallets();
      const keysToExtract: (keyof WalletInfoRemote)[] = ["name", "appName"];
      const extractedValues = wallets.map((wallet) =>
        keysToExtract.map((key) => wallet[key])
      );

      const walletNameRow = extractedValues.map(([label, callback_query]) =>
        InlineKeyboard.text(<string>label, <string>callback_query)
      );
      const keyboard = InlineKeyboard.from([walletNameRow])
        .row()
        .text("« Back", "universal_qr");
      const transposed = keyboard.toTransposed();
      await ctx.editMessageReplyMarkup({ reply_markup: transposed });
    });

    this.bot.callbackQuery(["universal_qr"], async (ctx) => {
      const chatId = ctx.chat!.id;
      const wallets = await getWallets();
      const connector = getConnector(chatId);
      const link = connector.connect(wallets);

      await ctx.answerCallbackQuery();
      await editQR(ctx, link);

      const inline_keyboard = new InlineKeyboard()
        .text("Choose a Wallet", "choose_wallet")
        .url(
          "Open Link",
          `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
            link
          )}`
        );

      await ctx.editMessageReplyMarkup({
        reply_markup: inline_keyboard,
      });
    });

    this.bot.on("callback_query:data", async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(`You are selected: ${ctx.callbackQuery.data}`);
    });


  }
}

async function editQR(
  ctx: CallbackQueryContext<IBotContext>,
  link: string
): Promise<void> {
  const fileName = "QR-code-" + Math.round(Math.random() * 10000000000);
  try {
    await QRCode.toFile(`./${fileName}`, link);
    const newQRCode = InputMediaBuilder.photo(new InputFile(`./${fileName}`));
    await ctx.editMessageMedia(newQRCode);
    await new Promise((r) => fs.rm(`./${fileName}`, r));
  } catch (error) {
    console.error(`Method: editQR error:${error}`);
  }
}