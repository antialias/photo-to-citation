# Twilio Configuration

This directory contains Terraform code for provisioning the Twilio resources used by the app.

The configuration expects your existing Twilio account credentials and will
ensure the configured phone number exists. Outputs can be copied into `.env`.

```bash
terraform init
terraform apply
```

Pass variables on the command line or in a `terraform.tfvars` file. The provider
uses the account SID as the username and the auth token as the password:

```hcl
account_sid   = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
auth_token    = "your_auth_token"
from_number   = "+15551234567"
```
