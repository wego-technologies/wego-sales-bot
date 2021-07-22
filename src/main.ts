require('dotenv').config()

import { App } from '@slack/bolt';
import assignRepView from './add-rep-view';

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

app.command('/sales', async ({ ack, body, client }) => {
  await ack();  
  
  if (body.text = "assign") {
    try {
    // Call views.open with the built-in client
    const result = await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: assignRepView as any
    });
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
  }
});

app.action('consent', async ({ ack }) => {
  await ack();
  // Update the message to reflect the action
});

app.view('assign-a-rep', async ({ ack, body, view, client }) => {
  // Acknowledge the view_submission event
  await ack();

  //console.log(body);
  console.log(view.state.values);
  
  

});