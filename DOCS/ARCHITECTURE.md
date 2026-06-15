# PropManager Pro Architecture

## Principles

- **Server = Source of Truth**
- **Client = Presentation Layer only**
- **Mutations trigger `router.refresh()`**
- **No custom cache layer**
- **Auto-create units during property creation**

## Data Relationships

Property
└── Unit
└── Lease
└── Payment

text

## Soft Delete System

| State    | `deletedAt` value |
| -------- | ----------------- |
| Active   | `null`            |
| Archived | timestamp         |

## Lifecycle Flow

Create Property (with unitCount)
↓
Units auto-created (database transaction)
↓
Lease Creation (units appear immediately)
↓
Archive (sets deletedAt = timestamp)
↓
Restore (sets deletedAt = null)

text

## Key Rules

| Operation           | Query Filter                                                                  |
| ------------------- | ----------------------------------------------------------------------------- |
| List active records | `deletedAt: null`                                                             |
| Archive             | Find with `deletedAt: null`, then set timestamp                               |
| Restore             | Find with NO `deletedAt` filter, verify `deletedAt !== null`, then set `null` |

## Technology Stack

- **Frontend:** Next.js 15 (App Router)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT
