var assignRepView = {
  "type": "modal",
  "callback_id": "assign-a-rep",
  "title": {
    "type": "plain_text",
    "text": "Assign a Rep",
    "emoji": true
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit",
    "emoji": true
  },
  "close": {
    "type": "plain_text",
    "text": "Cancel",
    "emoji": true
  },
  "blocks": [
    {
      "type": "input",
      "element": {
        "type": "static_select",
        "placeholder": {
          "type": "plain_text",
          "text": "Select a customer",
          "emoji": true
        },
        "options": [
          {
            "text": {
              "type": "plain_text",
              "text": "Other",
              "emoji": true
            },
            "value": "other"
          }
        ],
        "action_id": "customer"
      },
      "label": {
        "type": "plain_text",
        "text": "Customer selection",
        "emoji": true
      }
    },
    {
      "type": "input",
      "element": {
        "type": "users_select",
        "placeholder": {
          "type": "plain_text",
          "text": "Select users",
          "emoji": true
        },
        "action_id": "user"
      },
      "label": {
        "type": "plain_text",
        "text": "Sales Representative Selection",
        "emoji": true
      }
    },
    {
      "type": "divider"
    },
    // {
    //   "type": "section",
    //   "text": {
    //     "type": "mrkdwn",
    //     "text": "Please tick the checkbox below."
    //   },
    //   "accessory": {
    //     "type": "checkboxes",
    //     "options": [
    //       {
    //         "text": {
    //           "type": "mrkdwn",
    //           "text": "All the information is correct"
    //         },
    //         "description": {
    //           "type": "mrkdwn",
    //           "text": "Assign this customer to the selected representative."
    //         },
    //         "value": "consent"
    //       }
    //     ],
    //     "action_id": "consent"
    //   }
    // }
  ]
};

export default assignRepView;