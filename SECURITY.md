# Security Policy

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue, discussion, or pull request.

Use the repository's private **Report a vulnerability** option on GitHub when it is available. If private vulnerability reporting is not enabled, contact the V12 Labs maintainers through a private channel listed on the organization's official website and include:

- the affected revision and component;
- reproduction steps or a minimal proof of concept;
- the potential impact;
- any known mitigation.

Do not include real credentials, personal data, or customer data in a report. Maintainers should acknowledge the report, validate it, coordinate a fix, and publish details only after affected users have had a reasonable opportunity to update.

## Deployment responsibilities

- Store server credentials only in the deployment platform's secret manager.
- Rotate any credential that may have entered logs, screenshots, commits, or build artifacts.
- Restrict database and Supabase service-role access to the minimum required scope.
- Treat uploaded files and generated Blob URLs as public unless the storage configuration explicitly enforces private access.
- Use a long, random `CRON_SECRET` and require TLS in production.
- Keep dependencies and the runtime on supported, patched releases.

## Supported versions

This project is under active development and does not yet publish versioned security-support windows. Security fixes target the current default branch.
