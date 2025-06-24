# Case Chat Action Buttons

Case Chat now supports inline buttons suggested by the LLM. The assistant can include
special tokens in its reply to render a button for any available case action.

Use the token **`[action:ACTION_ID]`** anywhere in a message to display a button.
Write the token exactly as shown—no spaces or extra text inside the brackets.
The chat UI replaces that token with a button labeled according to the
`caseActions` definition, then opens the corresponding page or modal when the
button is clicked.

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

## Inline Edit Buttons

The assistant can also suggest quick updates to the case. Use the token
`[edit:FIELD:VALUE]` to show a button that updates the case when clicked.
Supported fields are `vin`, `plate`, `state`, and `note`.

Example:

```
The license plate is visible: [edit:plate:ABC123]
```

Clicking the button will save `ABC123` as the plate number for the case.
