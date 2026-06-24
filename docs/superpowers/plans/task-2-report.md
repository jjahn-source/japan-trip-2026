# Task 2 Report: Transit (Real-Time Train Delays)

## Summary
Successfully implemented real-time transit delay monitoring by integrating the Tetsudo API and exposing the result via the new `useTrainDelays` hook. A global warning banner has been added to the application's `Nav` component to ensure travellers have immediate visibility into disruptions affecting critical lines (e.g., 山手線, 中央線) prior to departure.

## Files Created/Modified
- `src/hooks/useTrainDelays.ts` (Created)
- `src/components/Nav.tsx` (Modified)

## Implementation Details
- **Hook `useTrainDelays`**: 
  - Fetches from `https://rti-giken.jp/fhc/api/train_tetsudo/delay.json`.
  - Filters and identifies delays against `CRITICAL_LINES` (山手線, 東海道新幹線, 中央線, 大阪環状線, 御堂筋線, 銀座線, 丸ノ内線).
  - Handles client-side fetch errors gracefully without breaking the UI.
- **Nav modifications**: 
  - Subscribes to `useTrainDelays`.
  - Conditionally renders a high-visibility alert banner (`bg-red-500/90`) showing affected major lines when delays are detected.
  - Sticky positioned at `top-0` above the rest of the layout.

## Testing
- **Compilation/Build Check**: Verified that the app builds successfully with `npm run build` with no type errors.

## Concerns
- No significant concerns. The silent fallback behavior requested in the brief works as intended, meaning network disruptions to `rti-giken.jp` will naturally result in no banners being shown.