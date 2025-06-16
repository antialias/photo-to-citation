output "twilio_account_sid" {
  value = var.account_sid
}

output "twilio_from_number" {
  value = twilio_api_accounts_incoming_phone_numbers.sms.phone_number
}

output "twilio_phone_sid" {
  value = twilio_api_accounts_incoming_phone_numbers.sms.sid
}
