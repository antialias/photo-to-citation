# Case Chat Actions

Case Chat replies are JSON objects with a `response` string, an `actions` array, and a `noop` boolean. Each action may reference a case action, suggest an edit, or add a photo note. When `noop` is `true` the assistant had nothing useful to add, even if it produced conversational text.

Example:
```json
{
  "response": "You may want to notify the vehicle owner.",
  "actions": [
    { "id": "notify-owner" },
    { "field": "plate", "value": "ABC123" },
    { "photo": "a.jpg", "note": "Clear view" }
  ],
  "noop": false
}
```

The chat UI renders the `response` as text and creates a button for each entry in `actions`:

- `id` &mdash; opens the corresponding page from `caseActions`.
- `field` and `value` &mdash; apply an edit to the case.
- `photo` and `note` &mdash; append a note to a photo.

The LLM receives a list of available actions formatted like:

```
- Draft Report (id: compose) - Open a form to draft an email report.
- Follow Up (id: followup) - Send a follow up email.
```

Use the `id` value from that list when populating the `actions` array.
