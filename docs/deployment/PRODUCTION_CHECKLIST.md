# Production checklist

- [ ] Permanent Worker is `obra-clara`, not `obra-clara-preview`.
- [ ] D1 `obra-clara` exists and UUID is recorded.
- [ ] R2 bucket exists; `RAW_DATA` binding is correct.
- [ ] Rate-limit namespace IDs 1001/1002 are unique in the account.
- [ ] Turnstile hostname equals production hostname.
- [ ] GitHub `production` environment has reviewers, variables, and secrets.
- [ ] Access protects both admin paths; allowlist is tested.
- [ ] Remote migration list reviewed; demo seed was not run.
- [ ] Manual workflow ran from `main` and smoke tests passed.
- [ ] Community test submission persisted and is visible only to a moderator.
- [ ] Logs/alerts and backup procedure were configured and tested.
- [ ] Previous Worker version is identified for rollback.
