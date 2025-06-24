# Case Chat Action Buttons

Case Chat now supports inline buttons suggested by the LLM. The assistant can include
special tokens in its reply to render a button for any available case action.

Use the syntax `[action:ACTION_ID]` within the message text. When displayed, this
placeholder becomes a link using the label from the case action list.

Example:
```
You may want to notify the vehicle owner. [action:notify-owner]
```
This produces a **Notify Owner** button in the chat.

The list of actions is defined by the application and updates automatically, so
no UI changes are required when new actions are added.
