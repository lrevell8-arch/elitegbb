# app.elitegbb.com Email Settings (Hostinger)

Use these mailbox server settings for accounts on `app.elitegbb.com`:

- **Incoming (IMAP):** `imap.hostinger.com`
  - Port: `993`
  - Encryption: `SSL/TLS`
- **Outgoing (SMTP):** `smtp.hostinger.com`
  - Port: `465`
  - Encryption: `SSL/TLS`
- **Incoming (POP3):** `pop.hostinger.com`
  - Port: `995`
  - Encryption: `SSL/TLS`

## App Runtime Configuration

If backend email sending is enabled, set the following environment variables:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=your-email@app.elitegbb.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=noreply@app.elitegbb.com
SMTP_USE_STARTTLS=false
```

> Note: Keep `SMTP_USE_STARTTLS=false` when using SMTPS on port 465.
> Use `SMTP_USE_STARTTLS=true` only for STARTTLS endpoints (usually port 587).
