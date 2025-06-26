terraform {
  required_version = ">= 1.2"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project
}

resource "google_project_service" "iap" {
  project = var.project
  service = "iap.googleapis.com"
}

resource "google_iap_brand" "brand" {
  support_email     = var.support_email
  application_title = var.application_title
  project           = var.project
  depends_on        = [google_project_service.iap]
}

resource "google_iap_client" "client" {
  display_name = var.application_title
  brand        = google_iap_brand.brand.name
}
