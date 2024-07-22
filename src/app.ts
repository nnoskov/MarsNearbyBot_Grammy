import { Bot } from "grammy";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { IBotContext } from "./context/context.interface";
import { Command, menuCommands } from "./commands/command.class";
import { StartCommand } from "./commands/start.command";

class GrammyBot {
  bot: Bot<IBotContext>;
  commands: Command[] = [];

  constructor(private readonly configService: IConfigService) {
    this.bot = new Bot<IBotContext>(this.configService.get("TOKEN"));
    //this.bot.use(new LocalSession({ database: "sessions.json" }).middleware());
    this.bot.api.setMyCommands(menuCommands);
  }

  init() {
    this.commands = [new StartCommand(this.bot)];
    for (const command of this.commands) {
      command.handle();
    }
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
