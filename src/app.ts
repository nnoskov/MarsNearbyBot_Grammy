import { Bot, GrammyError, HttpError, session } from "grammy";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { IBotContext } from "./context/context.interface";
import { Command, menuCommands } from "./commands/command.class";
import { StartCommand } from "./commands/start.command";
import { InfoCommand } from "./commands/info.command";

class GrammyBot {
  bot: Bot<IBotContext>;
  commands: Command[] = [];

  constructor(private readonly configService: IConfigService) {
    this.bot = new Bot<IBotContext>(this.configService.get("TOKEN"));
    this.bot.use(session());
    this.bot.api.setMyCommands(menuCommands);
  }

  init() {
    this.commands = [new StartCommand(this.bot), new InfoCommand(this.bot)];
    for (const command of this.commands) {
      command.handle();
    }
    this.bot.catch((err) => {
      const ctx = err.ctx;
      console.error(`Error while handling update ${ctx.update.update_id}:`);
      const e = err.error;
      if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
      } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
      } else {
        console.error("Unknow error:", e);
      }
    });
    this.bot.start();
  }

  stop() {
    this.bot.stop();
  }
}

const bot = new GrammyBot(new ConfigService());
bot.init();

// Enable stop
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
