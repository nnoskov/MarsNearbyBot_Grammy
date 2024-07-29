import { Bot, InlineKeyboard } from "grammy";
import { IBotContext } from "../context/context.interface";
import { Command } from "./command.class";
import { getConnector } from "../ton-connect/connector";
import { UserRejectsError } from "@tonconnect/sdk";
import { getWalletInfo } from "../ton-connect/wallets";
import { pTimeout } from "../utils";

export class SendTxCommand extends Command {
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.command("send_tx", async (ctx) => {
      const chatId = ctx.chat.id;
      const connector = getConnector(chatId);

      await connector.restoreConnection();

      if (!connector.connected) {
        await ctx.reply("Connect wallet to send transaction");
        return;
      }

      pTimeout(
        connector.sendTransaction({
          validUntil: Math.round(
            Date.now() +
              Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS) / 1000
          ),
          messages: [
            {
              amount: "1000000",
              address:
                "0:9407deb4ef98679de28840a61f06fbfaa51b6f3dfbae7d5a03dd779d3c6abc7d",
            },
          ],
        }),
        Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS)
      )
        .then(() => {
          ctx.reply("Transaction sent successfully");
        })
        .catch((e) => {
          if (e instanceof UserRejectsError) {
            ctx.reply("You rejected the transaction");
            return;
          }
          ctx.reply("Unknown error happened");
        })
        .finally(() => connector.pauseConnection());

      let deepLink = "";
      const walletInfo = await getWalletInfo(connector.wallet!.device.appName);
      if (walletInfo) {
        deepLink = walletInfo.universalLink;
      }
      const keyboard = new InlineKeyboard().url("Open Wallet", deepLink);
      await ctx.reply(
        `Open ${
          walletInfo?.name || connector.wallet!.device.appName
        } and confirm transaction`,
        { reply_markup: keyboard }
      );
    });
  }
}
