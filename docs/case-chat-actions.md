# Case Chat Action Buttons

Case Chat now supports inline buttons suggested by the LLM. The assistant can include
special tokens in its reply to render a button for any available case action.

Use the syntax `[action:ACTION_ID]` within the message text. When displayed, this
placeholder becomes a button using the label from the case action list. The
button opens a modal or page with the requested action.

Example:
```
You may want to notify the vehicle owner. [action:notify-owner]
```
This produces a **Notify Owner** button in the chat.

Available actions:

- `[action:compose]` — **Draft Report**: open a form to compose an email report
  to the appropriate authority.
- `[action:followup]` — **Follow Up**: send another email in an existing thread
  to ask about citation status.
- `[action:notify-owner]` — **Notify Owner**: create an anonymous email warning
  the vehicle owner about their violation.
- `[action:ownership]` — **Request Ownership Info**: record the request for
  official ownership details from the state.

This list is populated from the `caseActions` export, so new actions become
available to the chat UI automatically.
