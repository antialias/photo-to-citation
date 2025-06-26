output "google_client_id" {
  value = google_iap_client.client.client_id
}

output "google_client_secret" {
  value     = google_iap_client.client.secret
  sensitive = true
}
