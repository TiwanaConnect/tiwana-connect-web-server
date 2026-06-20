# Security Notes

## Elections

Phase 6 implements confidential family voting as a practical MVP.

- Vote choices are encrypted with AES-256-GCM using `ELECTION_VOTE_ENCRYPTION_KEY`.
- Ballot hashes and vote receipts use `ELECTION_HASH_SECRET`.
- `ElectionVoter` records eligibility, vote participation, and receipt data only.
- `ElectionBallot` records encrypted payloads and ballot-chain hashes only.
- The vote-cast audit log intentionally omits candidate choice.
- Admin screens must show turnout and aggregate results, not individual vote choices.
- Tally decrypts ballots after voting and writes aggregate counts to `ElectionResult`.
- This is not government-grade end-to-end verifiable voting and should not be described as such.
