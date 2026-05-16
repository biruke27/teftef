# Schema Snapshot

> This is the authoritative Prisma schema for TefTef.
> Paste this into every LLM prompt that touches the database.
> Update this file after EVERY Prisma migration.

**Last updated:** 2026-05-16 (initial — schema not yet migrated)
**Migration status:** NOT YET RUN

---

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String        @id @default(cuid())
  telegramId     String        @unique
  username       String?
  role_mode      RoleMode      @default(FREELANCER)
  can_hire       Boolean       @default(true)
  can_freelance  Boolean       @default(true)
  trust_score    Int           @default(50)
  bio            String?
  is_banned      Boolean       @default(false)
  phone_verified Boolean       @default(false)
  created_at     DateTime      @default(now())
  jobs           Job[]
  proposals      Proposal[]
  transactions   Transaction[]
}

model Job {
  id          String     @id @default(cuid())
  clientId    String
  title       String
  description String
  budget      Int
  status      JobStatus  @default(OPEN)
  created_at  DateTime   @default(now())
  proposals   Proposal[]
  client      User       @relation(fields: [clientId], references: [id])

  @@index([status, created_at(sort: Desc)])
}

model Proposal {
  id           String         @id @default(cuid())
  jobId        String
  freelancerId String
  amount       Int
  message      String
  status       ProposalStatus @default(PENDING)
  created_at   DateTime       @default(now())
  job          Job            @relation(fields: [jobId], references: [id])
  freelancer   User           @relation(fields: [freelancerId], references: [id])

  @@unique([jobId, freelancerId])
  @@index([jobId])
  @@index([freelancerId])
}

model Transaction {
  id             String     @id @default(cuid())
  userId         String
  jobId          String?
  amount         Int
  method         PayMethod
  status         TxStatus   @default(PENDING)
  gateway_ref    String?
  manual_tx_id   String?
  admin_verified Boolean    @default(false)
  admin_note     String?
  created_at     DateTime   @default(now())
  user           User       @relation(fields: [userId], references: [id])

  @@index([status])
  @@index([userId])
}

enum JobStatus      { OPEN IN_PROGRESS COMPLETED DISPUTED CLOSED }
enum ProposalStatus { PENDING ACCEPTED REJECTED WITHDRAWN }
enum TxStatus       { PENDING AWAITING_VERIFICATION CONFIRMED FAILED REFUNDED }
enum RoleMode       { CLIENT FREELANCER }
enum PayMethod      { CHAPA TELEBIRR MANUAL }
```

---

## Migration History

| Migration Name | Date | Notes |
|---|---|---|
| (none yet) | — | Schema defined, not yet run |
