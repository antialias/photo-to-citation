terraform {
  required_version = ">= 1.2"
  required_providers {
    twilio = {
      source  = "twilio/twilio"
      version = "~> 0.18"
    }
  }
}

provider "twilio" {
  account_sid = var.account_sid
  auth_token  = var.auth_token
}

resource "twilio_api_accounts_incoming_phone_numbers" "sms" {
  phone_number  = var.from_number
  friendly_name = var.friendly_name
}
