import { Bot } from "grammy";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { getConnector } from "../ton-connect/connector";
import { getWalletInfo } from "../ton-connect/wallets";
import { CHAIN, toUserFriendlyAddress } from "@tonconnect/sdk";

export class ShowWallet extends Command {
  constructor(bot: Bot<IBotContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.command("my_wallet", async (ctx) => {
      const chatId = ctx.chat.id;
      const connector = getConnector(chatId);
      await connector.restoreConnection();
      if (!connector.connected) {
        await ctx.reply("You didn't connect a wallet");
        return;
      }

      const walletName =
        (await getWalletInfo(connector.wallet!.device.appName))?.name ||
        connector.wallet!.device.appName;
      await ctx.reply(
        `Connected wallet: ${walletName}\nYour address: ${toUserFriendlyAddress(
          connector.wallet!.account.address,
          connector.wallet!.account.chain === CHAIN.TESTNET
        )}`
      );
    });
  }
}
