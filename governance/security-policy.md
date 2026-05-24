Security governance:
- All external dependencies must be audited before inclusion
- No dependencies from unsanctioned registries
- Secret scanning enabled in CI (detect API keys, tokens, passwords)
- Credential rotation schedule
- Incident response: detection -> containment -> eradication -> recovery -> lessons learned
- Agent permissions: agents cannot access production secrets, only test/dev credentials
- MCP tool sandboxing: terminal commands restricted to allowlist