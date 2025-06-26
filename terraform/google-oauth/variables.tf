variable "project" {
  type        = string
  description = "GCP project ID"
}

variable "support_email" {
  type        = string
  description = "Email shown on the consent screen"
}

variable "application_title" {
  type        = string
  description = "OAuth app name"
  default     = "photo-to-citation"
}
