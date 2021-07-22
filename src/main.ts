require('dotenv').config()

import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

(async () => {
  await app.start({port: 3000});
  console.log('⚡️ Bolt app is running!');
})();

app.event('app_home_opened', async ({ message, say }) => {
  await say("Please use this bot in #gatego-sales");
});

app.event('app_mention', async ({ event, context, client, say }) => {
  console.log(event.text)
  var cmd = event.text.substr(event.text.indexOf(">") + 2)
  
  if (cmd.indexOf("help") != undefined) {
    try {
      await say({"blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Commands:* \n\n \`help\` get command list \n \`<@U028PQ7M4KG> assign\` assign a sales rep to a Stripe user \n \`<@U028PQ7M4KG> unassign\` unassign a sales rep from a Stripe user`
          },
        }
    ]});
    }
    catch (error) {
      console.error(error);
    }
  } else {
      try {
      await say({"blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Thanks for the mention <@${event.user}>! I'm currently under development, but stay tuned! \n The command you sent was: \`${cmd}\``
          },
        }
      ]});
    }
    catch (error) {
      console.error(error);
    }
  }
  
});