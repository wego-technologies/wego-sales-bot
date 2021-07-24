function pendingPayment(user: String, amount: number, pending: boolean = true, paidBy? : String) {
  var text = `*Commission to*: <@${ user }>\n*Amount*: $${amount} ${pending ? "\nPay at the earliest convenience." : `\n*PAID* by <@${paidBy}>`}`;
  
  var basic : any =  [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "A payment has been proccessed by Stripe - " + (pending ? "PENDING" : "PAID"),
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": text
        }
      },
  ]
  
  if (pending) {
    basic += [{
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Click here to go to *Let's Deel.*"
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Open Deel",
            "emoji": true
          },
          "value": "open_deel",
          "url": "https://app.letsdeel.com/contracts",
          "action_id": "open-deel-btn"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Payment has been made",
              "emoji": true
            },
            "value": `${user},${amount}`,
            "action_id": "payment-complete"
          }
        ]
      }]
  }

  return basic;
}

export default pendingPayment;