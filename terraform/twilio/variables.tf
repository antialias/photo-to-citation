variable "account_sid" {
  type        = string
  description = "Twilio account SID"
}

variable "auth_token" {
  type        = string
  description = "Twilio auth token"
  sensitive   = true
}

variable "from_number" {
  type        = string
  description = "Phone number used to send messages"
}

variable "friendly_name" {
  type        = string
  description = "Label for the phone number"
  default     = "photo-to-citation"
}
