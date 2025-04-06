import { Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';

const bot = new Telegraf(process.env.BOT_TOKEN);
const mongo = new MongoClient(process.env.MONGO_URI);

const db = mongo.db('terabox_bot');
const users = db.collection('users');
const adminIds = [6025969005, 6018060368];

bot.start(async (ctx) => {
  const { id, username, first_name, last_name } = ctx.from;
  const full_name = `${first_name || ''} ${last_name || ''}`.trim();

  await users.updateOne(
    { user_id: id },
    { $set: { username, full_name } },
    { upsert: true }
  );

  await ctx.telegram.sendMessage(process.env.CHANNEL_ID, 
    `New user started the bot:\nName: ${full_name}\nUsername: @${username}\nUser ID: ${id}`
  );

  await ctx.replyWithPhoto('https://ik.imagekit.io/dvnhxw9vq/unnamed.png?updatedAt=1735280750258', {
    caption: `👋 *Welcome to the TeraBox Online Player!*\n\nSend me any TeraBox link and I'll generate a direct streaming link!`,
    parse_mode: 'Markdown'
  });
});

bot.command('users', async (ctx) => {
  if (adminIds.includes(ctx.from.id)) {
    const count = await users.countDocuments();
    ctx.reply(`Total users: ${count}`);
  } else {
    ctx.reply('Access denied.');
  }
});

bot.on('text', async (ctx) => {
  const msg = ctx.message.text;
  if (msg.startsWith('http://') || msg.startsWith('https://')) {
    const encoded = encodeURIComponent(msg);
    const streamLink = `https://terabox-play.lbni.workers.dev/api?url=${encoded}`;
    const shareLink = `https://t.me/share/url?url=https://t.me/noob_jeRoboT?start=terabox-${msg.split('/').pop()}`;

    return ctx.reply(
      '👇👇 YOUR VIDEO LINK IS READY 👇👇\n\n♥ 👇Your Stream Link👇 ♥\n',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐Stream Server 1🌐', url: streamLink }],
            [{ text: '◀Share▶', url: shareLink }]
          ]
        }
      }
    );
  }
  return ctx.reply('Please send only a valid TeraBox link.');
});

// Required for Vercel
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await mongo.connect();
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('TeraBox Telegram Bot');
  }
}
