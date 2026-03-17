# Security Notes

## Accepted Alerts

- Date: 2026-03-17
- Scope: functions (Firebase Cloud Functions dependencies)
- Severity: low
- Source: firebase-admin transitive dependencies (e.g., @google-cloud/*, google-gax, http-proxy-agent)
- Rationale: Only available remediation is a breaking downgrade to firebase-admin 10.3.0. We are keeping firebase-admin at ^13.7.0 and firebase-functions at ^7.2.0 for compatibility and support. We will revisit if a non-breaking fix becomes available.
