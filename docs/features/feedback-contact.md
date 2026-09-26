# Feedback and contact

A public contact form whose messages admins review.

## Files
- Page: `app/(public)/contact/page.tsx`, `components/FeedbackForm.tsx`
- API: `app/api/feedback/route.ts` (public POST, admin GET of the latest 200), `app/api/feedback/[id]/route.ts` (admin PATCH `{resolved}`, DELETE)
- Admin: `app/admin/feedback/page.tsx`
- Validation: `feedbackSchema` (name, email, subject, message of 10–3000 characters, and a `website` **honeypot** field; any value up to 200 characters passes validation, so bots get no 422 hint)

## Behavior
- Rate limit: 3 messages per 10 minutes per IP.
- If the honeypot is filled, the handler returns `{ok: true}` without saving anything, so bots don't notice they were blocked.
- For a signed-in user, the message is linked to their account through `userId`, which is set to null if the user is deleted.
- Resolving or deleting a message is audited.
