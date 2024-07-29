import {
  Bot,
  Context,
  InlineKeyboard,
  InputFile,
  InputMediaBuilder,
} from "grammy";
import { IBotContext } from "../context/context.interface";
import { getWalletInfo, getWallets } from "../ton-connect/wallets";
import QRCode from "qrcode";
import { Command } from "./command.class";
import { getConnector } from "../ton-connect/connector";
import {
  WalletInfoRemote,
  CHAIN,
  toUserFriendlyAddress,
  isTelegramUrl,
} from "@tonconnect/sdk";
import { addTGReturnStrategy, buildUniversalKeyboard } from "../utils";
import * as fs from "fs";

export class ConnectCommand extends Command {
  newConnectRequestListenersMap = new Map<number, () => void>();
  wallets: string[][] = [];
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }
  //handle ConnectCommand
  handle(): void {
    this.bot.command("connect", async (ctx) => {
      const chatId = ctx.chat.id;
      let messageWasDeleted = false;
      console.log(ctx);
      this.newConnectRequestListenersMap.get(chatId)?.();

      const connector = getConnector(chatId, () => {
        try {
          unsubscribe();
          this.newConnectRequestListenersMap.delete(chatId);
          deleteMessage();
        } catch (err) {
          console.error(err);
        }
      });

      await connector.restoreConnection();
      if (connector.connected) {
        const connectedName =
          (await getWalletInfo(connector.wallet!.device.appName))?.name ||
          connector.wallet!.device.appName;
        ctx.reply(
          `You have already connect ${connectedName} wallet\nYour address: ${toUserFriendlyAddress(
            connector.wallet!.account.address,
            connector.wallet!.account.chain === CHAIN.TESTNET
          )}\n\n Disconnect wallet firstly to connect a new one`
        );
        return;
      }

      const unsubscribe = connector.onStatusChange(async (wallet) => {
        console.log(`Status changed callback: ${wallet}`);
        if (wallet) {
          await deleteMessage();
          const walletName =
            (await getWalletInfo(wallet.device.appName))?.name ||
            wallet.device.appName;
          await ctx.reply(`${walletName} wallet connected successfully`);
          unsubscribe();
          this.newConnectRequestListenersMap.delete(chatId);
        }
      });

      const wallets = await getWallets();
      const link = connector.connect(wallets);
      const image = await QRCode.toBuffer(link);

      const inline_keyboard = await buildUniversalKeyboard(link, wallets);

      const botMessage = await ctx.replyWithPhoto(new InputFile(image), {
        reply_markup: inline_keyboard,
      });

      const deleteMessage = async (): Promise<void> => {
        if (!messageWasDeleted) {
          messageWasDeleted = true;
          await this.bot.api.deleteMessage(ctx.chat.id, botMessage.message_id);
        }
      };

      this.newConnectRequestListenersMap.set(chatId, async () => {
        unsubscribe();
        await deleteMessage();
        this.newConnectRequestListenersMap.delete(chatId);
      });
    });

    this.bot.callbackQuery(["choose_wallet"], async (ctx) => {
      await ctx.answerCallbackQuery();
      const wallets = await getWallets();
      const keysToExtract: (keyof WalletInfoRemote)[] = ["name", "appName"];
      const extractedValues = wallets.map((wallet) =>
        keysToExtract.map((key) => wallet[key])
      );
      this.wallets = <[][]>extractedValues;
      const walletNameRow = extractedValues.map(([label, callback_query]) =>
        InlineKeyboard.text(<string>label, <string>callback_query)
      );

      const keyboard = InlineKeyboard.from([walletNameRow]);
      const transposed = keyboard
        .toTransposed()
        .row()
        .text("« Back", "universal_qr");
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
      const chatId = ctx.chat!.id;
      console.log(ctx);
      if (!containsWallet(this.wallets, ctx.callbackQuery.data)) {
        console.log("return");
        return;
      }

      const connector = getConnector(chatId);

      console.log(`Callback_query:data ${ctx.callbackQuery.data}`);
      const selectedWallet = await getWalletInfo(ctx.callbackQuery.data);
      if (!selectedWallet) {
        return;
      }
      let buttonLink = connector.connect({
        bridgeUrl: selectedWallet.aboutUrl,
        universalLink: selectedWallet.universalLink,
      });

      let qrLink = buttonLink;

      if (isTelegramUrl(selectedWallet.universalLink)) {
        buttonLink = addTGReturnStrategy(
          buttonLink,
          process.env.TELEGRAM_BOT_LINK!
        );
        qrLink = addTGReturnStrategy(qrLink, "none");
      }

      await editQR(ctx, qrLink);
      const keyboard = new InlineKeyboard()
        .text("« Back", "choose_wallet")
        .url(`Open ${selectedWallet.name}`, buttonLink);
      ctx.editMessageReplyMarkup({ reply_markup: keyboard });
    });
  }
}

async function editQR(ctx: Context, link: string): Promise<void> {
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

function containsWallet(wallets: string[][], callback: string): boolean {
  return wallets.some((row) => row.includes(callback));
}

