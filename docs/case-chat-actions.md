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
- `[action:upload-photo]` — **Upload Photo**: select and upload an existing
  picture to the current case.
- `[action:take-photo]` — **Take Photo**: open the camera to capture a new
  picture for the case using an inline camera widget.

This list is populated from the `caseActions` export, so new actions become
available to the chat UI automatically.

## Case Edits

In addition to standard actions, the assistant can suggest edits to the current case. Use the
syntax **`[edit:FIELD=VALUE]`** to render a button that applies the update when clicked.
Supported fields:

- `vin` — set the vehicle's VIN.
- `plate` — set the license plate number.
- `state` — set the license plate state.
- `note` — append text to the case note.

Example:
```
The plate appears to be ABC123. [edit:plate=ABC123]
```
This creates a button labeled **Set Plate to "ABC123"**. Clicking it updates the case.
