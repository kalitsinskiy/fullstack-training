# Lesson 13: Going Further — Build It Yourself

## Quick Overview

You've shipped the whole app. This lesson is different: **no step-by-step**. Each
challenge below is a feature you design and build on your own, applying the
patterns the course already taught you (events, the consumer, the service-key
client, privacy rules, the design system). We give you the *what*, a recommended
approach, and the gotchas — you write the code.

Start with **Email notifications** — it's the best fit for what you've built.

---

## Challenge 1: Email notifications

Right now notifications are **in-app only** (bell + real-time toast). Add **email**
as a second channel: when something important happens, the affected users also get
an email — even when the app isn't open.

### Why it's a small change (not a rewrite)

`santa-notifications` already does the hard part. It consumes domain events
(`draw.completed`, `room.date_changed`, …), works out **who** to notify, and
enriches with user/room data via the service-key internal client — and
`getUserById` already returns the user's **email**. Email is just **one more
delivery channel** next to the in-app notification you already create.

### Recommended approach

1. **A swappable mailer.** Write a small `mailer.ts` with one function
   (`sendMail(to, subject, html)`), so the provider can change without touching
   callers. Use `nodemailer` (SMTP) behind it.
2. **Dev transport = a local catcher.** Run **Mailpit** (one container; SMTP in,
   web UI to read what was "sent") so you never send real mail while developing —
   point `nodemailer` at `smtp://localhost:1025`. Add it to your dev compose.
3. **Hook in where notifications are created.** In the event consumer, right after
   you persist the notification and push it over the socket, call the mailer for
   the same recipient. Wrap it in `try/catch` — **a mail failure must not nack the
   event** (in-app stays the source of truth; email is best-effort).
4. **Templates per event type.** The notification `message` is already written;
   wrap it in a simple HTML/text template with a subject and a link back to the room.
5. **Swap to a real provider for prod** by changing only `mailer.ts` config.

### Which service (and the free limits)

| Use | Service | Free limit | Notes |
|-----|---------|-----------|-------|
| **Dev (recommended)** | **Mailpit** / MailHog | unlimited (local) | nothing leaves your machine; read mail in a browser |
| Real sending | **Brevo** | ~300/day | most generous daily free tier |
| Real sending | **Resend** | 3,000/mo, 100/day | very dev-friendly API; verify a domain |
| Scale / cheap | **Amazon SES** | 3,000/mo (12 mo), then ~$0.10/1k | needs AWS + sandbox→prod request |

> Real providers require **domain verification (SPF/DKIM)** before they'll deliver
> to the inbox, and start in a **sandbox** that only sends to verified addresses.
> For this course, Mailpit avoids all of that.

### Which events to email on

| Event | Email? | To whom | Anonymous? |
|-------|--------|---------|------------|
| `draw.completed` | ✅ | all participants ("names are drawn — see your giftee") | — |
| new message (`message:received`) | ✅ | the recipient | **yes — never name the sender** |
| `room.date_changed` | ✅ | all participants (except the one who changed it) | — |
| `user.joined` | optional | existing members | — |
| `wishlist.updated` | ❌ (or digest) | — | too noisy per-change |

### Rules & gotchas (the same ones the in-app channel follows)

- **Anonymity.** A "you got a message" email must **never reveal the sender** —
  reuse the already-safe notification text, add nothing.
- **Don't self-notify the actor.** Same exclusion as in-app (e.g. the owner who
  moved the date doesn't get the email).
- **Idempotency.** Reuse the per-recipient key so a redelivered event doesn't send
  a duplicate email.
- **Failure isolation.** Catch and log mail errors; never let them fail the event.
- **Deliverability (prod only).** SPF/DKIM on a real domain, or everything lands
  in spam.

### Acceptance criteria

- [ ] Mailpit (or equivalent) runs in dev; you can see sent emails in its UI.
- [ ] A `mailer` abstraction — switching provider touches one file.
- [ ] Emails fire for at least: draw completed, new message, date changed.
- [ ] Message emails do **not** reveal the sender.
- [ ] A failing mail send does **not** break in-app notifications.
- [ ] (Stretch) per-user email preferences / opt-out, an unsubscribe link, and a
      daily **digest** instead of one email per wishlist change.

---

## More ideas (pick your own)

- **Recurring rooms** — clone a room for next year, carry members over.
- **Wishlist links & images** — turn plain items into rich cards (URL preview).
- **Reactions on messages** — emoji reactions over the same socket channel.
- **Admin moderation** — use the stored `senderId` to let an admin investigate abuse.
- **Push notifications** — Web Push as a third channel beside in-app + email.
- **i18n** — the app is English; add a second language with the design tokens intact.
