# Backend Phases

Phase 0: Foundation setup

Phase 1: Auth + Members + Admin member management

Phase 2: Family tree + relationship APIs

- Mobile tree, member search, and relationship finder APIs.
- Admin tree debugging, relationship path, standalone member, and family head APIs.
- Full graph traversal with response-time privacy masking for hidden female members.
- Admin tree UI provides visual SVG rendering, zoom/reset controls, and print support.
- Relationship finder shows label, local label, side, path text, and path members.

Phase 3: Events + invites + RSVP

- Normalized `FamilyEvent` and `EventInvite` records.
- Admin official events and mobile member-created events.
- RSVP tracking with going/maybe/not-going/pending counts.
- Gender-based event invite audiences for all males and all females.
- Future TODOs: event photos, reminders, recurring events, branch invitations, and event funds.

Phase 4: Funds + ledger + requests

- Normalized `FamilyFund`, `FundTransaction`, and `FundContributionRequest` records.
- Ledger balances count confirmed transactions only.
- Admin fund management screens for funds, detail/edit, transactions, and requests.
- Mobile fund APIs for listing/detail, member-created funds, self requests, and pending contribution submissions.
- No payment gateway or payment credential storage.

Phase 5: Directory + tags + contact requests

- Directory uses `Member` as the source of truth.
- Per-member directory settings control visibility, phone display, bio, availability, and help request opt-in.
- Admin-managed member tags support skills, professions, cities, branch labels, interests, and services.
- Member help requests support pending/accepted/declined/completed/cancelled workflow states.
- Mobile responses apply hidden female privacy and phone visibility rules.
- No chat, upload, push notification provider, or public directory.

Phase 6: Elections + nominations + voting

- Election timeline phases cover nominations, candidate announcement, voting, result reveal, president authorization ceremony, and completion.
- Members submit nominations; admins approve/reject and announce candidates.
- Voting uses AES-256-GCM encrypted anonymous ballots and a separate voter participation table.
- Ballot hash-chain verification and service-computed tally protect against silent result edits.
- Published results expose aggregate counts only.
- Winner can be assigned President after result publication and ceremony scheduling.
- This is a practical confidential voting MVP for a private family platform, not government-grade e-voting.

Phase 7: Mobile API integration

Phase 8: Notifications and production polish

- Expo Push Notifications provider integration.
- In-app notifications, device push tokens, delivery attempts, and per-member notification preferences.
- Mobile notification inbox, unread count, read/archive actions, token registration, and preference APIs.
- Admin notification list, test push, delivery log, stats, and monitoring pages.
- Event, fund, help request, and election workflows create privacy-safe member notifications.
- Future TODOs: scheduled phase/reminder worker, Expo receipt polling, announcement module, and production rate-limit tuning.
