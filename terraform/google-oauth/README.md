# Google OAuth Client

This directory contains Terraform configuration for creating a Google OAuth client
used by the production deployment. The resources enable the IAP API, create an
internal brand, and provision an OAuth client ID and secret.

```
terraform init
terraform apply
```

Pass the required variables on the command line or in a `terraform.tfvars` file:

```hcl
project          = "your-gcp-project-id"
support_email    = "you@example.com"
application_title = "photo-to-citation"
```

After apply, copy `google_client_id` and `google_client_secret` from the outputs
into your environment as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
