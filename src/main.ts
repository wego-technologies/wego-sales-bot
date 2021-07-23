require('dotenv').config()

import { App } from '@slack/bolt';
import assignRepView from './add-rep-view';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SK ?? "", {apiVersion: '2020-08-27'});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_WS_TOK,
  socketMode: true,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

(async () => {
  await app.start({port: 3000});
  console.log('⚡️ Bolt app is running!');
})();

// app.event('app_home_opened', async ({ message, say }) => {
//   await say("Please use this bot in #gatego-sales");
// });

app.command('/sales', async ({ ack, body, client }) => {
  await ack();  
  
  if (body.text == "assign") {
    try {

      const customers = await stripe.customers.list({
        limit: 30,
      });

      const optionsGen = customers.data.forEach(element => {
        assignRepView.blocks[0].element?.options?.unshift({
            "text": {
              "type": "plain_text",
              "text": (element.name ?? "No Name") + " | " + (element.email ?? "No Email") + " ( " + element.id + " ) ",
              "emoji": true
            },
            "value": element.id
          })
      });

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
  } else {
    const result = await client.chat.postMessage(
      {channel: body.channel_id, text: "Command not recognized"}
    )
  }
});

app.view('assign-a-rep', async ({ ack, body, view, client }) => {
  // Acknowledge the view_submission event
  

  //console.log(body);

  var commisionData = {
    customer: undefined as any,
    agent: undefined as any,
  };

  for (const [_, value] of Object.entries(view.state.values)) {
    
    if (value["customer"] != undefined) {
      commisionData.customer = value["customer"].selected_option?.value;
      if (commisionData.customer == "other") {
        client.chat.postMessage({
          channel: body.user.id,
          text: "Please send a valid Stripe customer ID by replying to this message",
        })
      } else {
        await ack();
      }
    } else if (value["user"] != undefined) {
      commisionData.agent = value["user"].selected_user
      await ack();
    }
  }
  

  console.log(commisionData);
  
});

app.action("consent", async ({ ack, body, client }) => {
  // Acknowledge the view_submission event
  await ack();
})