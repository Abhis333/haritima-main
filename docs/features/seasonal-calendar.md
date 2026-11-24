# Seasonal calendar

Shows which campus plants usually flower and fruit in each month.

## Files
- Page: `app/(public)/seasons/page.tsx` (`?month=1..12`; defaults to the current month in Asia/Kolkata). Lists this month's flowering and fruiting plants, then a month-by-month strip per plant.
- Component: `components/SeasonStrip.tsx` (two 12-cell rows; flowering `#B04A7A`, fruiting `#B8892E`, a pair validated for colour-blind separation; rows are labelled so colour is never the only cue).
- Plant page: `app/(public)/plants/[slug]/page.tsx` shows a "Seasons on campus" box with the same strip.
- Admin: `components/admin/PlantForm.tsx` "Seasons on campus" fieldset (month checkboxes).
- Seed: `prisma/seed-seasons-trails.ts` fills typical Haridwar months only for plants with no months yet.

## Data
- `Plant.floweringMonths` and `Plant.fruitingMonths`: `Int[]` of 1–12, default `[]`.
- Validation (`lib/validation.ts`, `months`): de-duplicated and sorted; when the field is absent from a request, an update keeps the stored months.

## Notes
- Seed months are typical values, not campus observations; correct them in Admin → Plants.
- Plants with no months recorded are left out of the calendar and show "Season not recorded yet" on their page.
