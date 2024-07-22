import { Bot, InputFile } from 'grammy';
import { IBotContext } from '../context/context.interface';
import { getWallets } from '../ton-connect/wallets';
import TonConnect from '@tonconnect/sdk';
import { TonConnectStorage } from '../ton-connect/storage';
import QRCode from 'qrcode';
import { Command } from './command.class';


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

        const connector = new TonConnect({
          storage: new TonConnectStorage(chatId),
          manifestUrl: process.env.MANIFEST_URL,
        });

        connector.onStatusChange((wallet) => {
          if (wallet) {
            ctx.reply(`${wallet.device.appName} wallet connected!`);
          }
        });
        const tonkeeper = wallets.find(
          (wallet) => wallet.appName === "tonkeeper"
        )!;
        const link = connector.connect({
          bridgeUrl: tonkeeper.bridgeUrl,
          universalLink: tonkeeper.universalLink,
        });
        const image = await QRCode.toBuffer(link);

        await ctx.replyWithPhoto(new InputFile(image));
      } catch (err) {
        console.error(`"connect" command handling error: ${err}`);
      }
    });
  }
}