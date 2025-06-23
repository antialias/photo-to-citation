# Credit System

This document explains how user credits work in **Photo To Citation**.

## Overview

Certain features may require credits. Each user account has a balance that is incremented when credits are purchased. Superadmins control the exchange rate so the number of credits per dollar can change over time.

## Purchasing Credits

1. Navigate to the **Credits** tab on the user settings page.
2. Enter an amount in US dollars and submit the form.
3. The server converts dollars to credits using the current `usdPerCredit` rate.
4. The resulting credit balance is stored on the user record and a transaction row is inserted atomically.

## Managing the Exchange Rate

Superadmins can view and update the exchange rate via `/api/credits/exchange-rate`. Sending a `PUT` request with a JSON body such as `{ "usdPerCredit": 0.25 }` updates `data/creditSettings.json`.

## Checking Balances

Users can retrieve their current balance from `/api/credits/balance`. Each successful purchase appears in the `credit_transactions` table for auditing.

Updates are wrapped in a single SQLite transaction to prevent double spending or partial writes.
