const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`)});


import { App } from '@slack/bolt';
import assignRepView from './views/add-rep-view';
import unassignRepView from './views/remove-rep-view';
import Stripe from 'stripe';

import express from 'express';
import calculateCommision from './commsion-calc';
import pendingPayment from './pending-payment';
const bodyParser = require('body-parser');

import { updateCustomers, clients } from './clients-cache';


const stripe = new Stripe(process.env.STRIPE_SK ?? "", { apiVersion: '2020-08-27' });
updateCustomers(stripe);
const intervalController = setInterval(() => updateCustomers(stripe), 60000);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_WS_TOK,
  socketMode: true,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const webhookApp = express();

(async () => {
  await app.start({port: 3000});
  console.log('⚡️ Bolt app is running!');
})();

webhookApp.listen( process.env.PORT, () => {
    console.log( `⚡️ Webhook reciever is running!` );
})

webhookApp.post('/stripe', bodyParser.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature']!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WH_SEC!, 60);
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${(err as any).message}`);
  }
  if (event == undefined) {
    console.log("No event");
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const paymentIntent = event.data.object as any;
      console.log('PaymentIntent was successful!');
      const cust =  await stripe.customers.retrieve(paymentIntent.customer);
      
      if (!cust.deleted && cust.metadata.sales_rep != undefined) {
        app.client.chat.postMessage({ channel: process.env.SLACK_NOTIF_CHAN ?? "", text: `> :tada: *Congratulations!*\n> <@${cust.metadata.sales_rep}> your customer <https://dashboard.stripe.com/customers/${paymentIntent.customer}|${paymentIntent.customer}> | ${cust.name ?? "No Name"} | ${cust.email ?? "No Email"} has just been billed $${(paymentIntent.amount_paid/100)}!\n> Commission:  $${calculateCommision((paymentIntent.amount_paid/100))}` })
        app.client.chat.postMessage({channel: process.env.SLACK_PAY_CHAN ?? "", blocks: pendingPayment(cust.metadata.sales_rep, calculateCommision((paymentIntent.amount_paid/100))) as any, text: `Commission Payment of ${calculateCommision((paymentIntent.amount_paid/100))} pending.`})
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});

// app.event('app_home_opened', async ({ message, say }) => {
//   await say("Please use this bot in #gatego-sales");
// });

app.command('/sales', async ({ ack, body, client }) => {
  await ack();  
  
  if (body.text == "assign") {
    try {

      assignRepView.blocks[0].element!.options.length = 0;

      clients.data.forEach(element => {
        var isAssigned = (element.metadata.sales_rep != undefined)
        assignRepView.blocks[0].element?.options?.push({
            "text": {
              "type": "plain_text",
              "text": (isAssigned ? ":warning: " : ":white_check_mark: ") + " | " + (element.name ?? "No Name"),
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
  } else if (body.text == "unassign") {try {

    unassignRepView.blocks[0].element!.options.length = 0;

    clients.data.forEach(element => {
      var isAssigned = (element.metadata.sales_rep == undefined)
      unassignRepView.blocks[0].element?.options?.unshift({
          "text": {
            "type": "plain_text",
            "text": (isAssigned ? ":warning: " : ":white_check_mark: ") + (element.name ?? "No Name"),
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
      view: unassignRepView as any
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
  await ack();


  var commisionData = {
    customer: undefined as any,
    agent: undefined as any,
  };

  for (const [_, value] of Object.entries(view.state.values)) {
    
    if (value["customer"] != undefined) {
      commisionData.customer = value["customer"].selected_option?.value;
    } else if (value["user"] != undefined) {
      commisionData.agent = value["user"].selected_user
    }
  }
  

  console.log(commisionData);

  try {
    const res = await client.chat.postMessage({
      channel: process.env.SLACK_NOTIF_CHAN as any,
      text: `Linking <@${commisionData.agent}> with  \`<https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}>\`...`,
    })

    const currentCust = await stripe.customers.retrieve(commisionData.customer)

    if (!currentCust.deleted && currentCust.metadata.sales_rep == undefined) {
      const updatedCust = await stripe.customers.update(
        commisionData.customer,
        {metadata: {sales_rep: commisionData.agent}}
      );

      if (updatedCust.metadata.sales_rep == commisionData.agent) {
        client.chat.update({ channel: res.channel ?? "", ts: res.ts ?? "", text: `> :tada: *Congratulations!*\n> <@${commisionData.agent}> will now recieve commision from <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}>.` })

      }
    } else if (currentCust.deleted) {
      client.chat.update({channel: res.channel ?? "", ts: res.ts ?? "", text: `> :warning: *Error!*\n> Could not link <@${commisionData.agent}> with <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}> because this customer does not exist or has been deleted.`})
    } else if (currentCust.metadata.sales_rep != undefined) {
      client.chat.update({ channel: res.channel ?? "", ts: res.ts ?? "", text: `> :warning: *Error!*\n> Could not link <@${commisionData.agent}> with <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}> because this customer is already linked with <@${currentCust.metadata.sales_rep}>, please unlink the customer before continuing.` })
      client.chat.postMessage({channel: currentCust.metadata.sales_rep, text: `> :warning: *Warning!*\n> <@${commisionData.agent}> tried linking <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}> to them, but was stopped from doing so as you are currently assigned to them.\n\nThis is only a notification.` })
    }

    
  } catch (error){
    console.log(error);
    
  }

  
  
});

app.view('unassign-a-rep', async ({ ack, body, view, client }) => {
  // Acknowledge the view_submission event
  

  //console.log(body);
  await ack();


  var commisionData = {
    customer: undefined as any,
  };

  for (const [_, value] of Object.entries(view.state.values)) {
    
    if (value["customer"] != undefined) {
      commisionData.customer = value["customer"].selected_option?.value;
    }
  }

  const currentCust = await stripe.customers.retrieve(commisionData.customer)

  if (currentCust.deleted) {
    return;
  }
  

  console.log(commisionData);

  try {
    const res = await client.chat.postMessage({
      channel: process.env.SLACK_NOTIF_CHAN as any,
      text: `Unlinking \`<https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}>\` from <@${currentCust.metadata.sales_rep}>...`,
    })

    

    if (!currentCust.deleted && currentCust.metadata.sales_rep != undefined) {
      const updatedCust = await stripe.customers.update(
        commisionData.customer,
        {metadata: {sales_rep: null}}
      );

      if (updatedCust.metadata.sales_rep == null) {
        client.chat.update({ channel: res.channel ?? "", ts: res.ts ?? "", text: `> :white_check_mark: *Success!*\n> <@${currentCust.metadata.sales_rep}> is now unlinked from <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}>.` })
        client.chat.postMessage({channel: currentCust.metadata.sales_rep, text: `> :warning: *Warning!*\n> <@${body.user.id}> unlinked <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}> from you, this means you *will no longer recieve a commission from this customer*. You may always relink the customer if it was a mistake.\n\nThis is only a notification.` })

      }
    } else if (currentCust.deleted) {
      client.chat.update({channel: res.channel ?? "", ts: res.ts ?? "", text: `> :warning: *Error!*\n> Could not unlink <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}> because this customer does not exist or has been deleted.`})
    } else if (currentCust.metadata.sales_rep == undefined) {
      client.chat.update({ channel: res.channel ?? "", ts: res.ts ?? "", text: `> :warning: *Error!*\n> Could not unlink <https://dashboard.stripe.com/customers/${commisionData.customer}|${commisionData.customer}> because this customer is not linked to anyone.` })
    }

    
  } catch (error){
    console.log(error);
    
  }
});

app.action("consent", async ({ ack, body, client }) => {
  // Acknowledge the view_submission event
  await ack();
})

app.action("open-deel-btn", async ({ ack, body, client }) => {
  // Acknowledge the view_submission event
  await ack();
})

app.action("payment-complete", async ({ ack, body, client, respond, context, action, payload, say, logger, next}) => {
  // Acknowledge the view_submission event
  await ack();
  console.log(body as any);

  var extractedData = ((body as any).actions[0].value as String).split(",")
  
  respond({
    //replace_original: true,
    text: `Comission paid by <@${body.user.id}>`,
    blocks: pendingPayment(extractedData[0], parseInt(extractedData[1]), false, body.user.id)
  })
  

})
