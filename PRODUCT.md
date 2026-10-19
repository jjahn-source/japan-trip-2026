# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7.3 static output with every view pre-rendered from the trip data at build time (readable at
first paint and without JavaScript), and one Svelte 5 app that takes over in the browser (the
URL, the back button, the map and the view share one store). Mapbox GL 3 with the Standard style
for the 3D night map and leg playback. Hand-authored CSS with oklch tokens, self-hosted subset
fonts, local WebP copies of photos, and a hand-written service worker for offline use. Trip data
comes from the itinerary agent (`data/itinerary.json`), so a new plan rebuilds the site.
Deploys as static files to any host.

## Users

Eight friends travelling Japan together, Dec 14–29 2026. Two uses, both primary:
1. Before the trip: the group (and anyone they share it with) understands and gets
   excited about the whole 16-day plan: route, bases, big nights, bookings still to make.
2. During the trip: each person on their own phone, often outdoors, in transit, at night,
   with patchy signal, needs "what's now, what's next, how do I get there, is it open,
   when is the last train" in seconds.

## Product Purpose

Turn the TREK "Plan C" export into a site that makes the trip legible and memorable at a
glance and dependable on the ground. Success: nobody in the group has to ask "where are
we going next?" or dig through a chat thread for a booking time.

## Positioning

It is this trip, not a template: 4 bases (Toshima, Hakone, Osaka Kujō, Shinjuku), ~150
timed stops, real booking deadlines, Christmas in Santa suits, all-nighters. It knows the
date and time in Japan, so it can tell the group where they should be right now.

## Operating Context

- Times are Japan time (JST). Trip runs Mon Dec 14 – Tue Dec 29 2026.
- Each stop has a time window, category (transport, stay, restaurant, attraction,
  shopping, activity, bar/cafe, nature), price (per person or group total, ¥ or $),
  practical notes (hours, booking, getting there, tips), website, Google Maps link,
  phone, address.
- Each day has a title, briefing notes and a "night-before check".
- A dated booking/to-do schedule (many deadlines in Oct–Dec 2026) and a group budget
  (~$4,817 per person).
- Navigation itself happens in Google Maps; the site hands off with map links.
- Used on iPhones mostly; may be added to the home screen.

## Capabilities and Constraints

- Source of truth: `/Users/jjahn/TREK/japan-plan-c.md` (TREK export, 2026-10-12).
- Include everything, including Airbnb addresses, confirmation codes and phone numbers
  (user decision). The link is shared privately within the group.
- Must work offline once loaded (itinerary text, times, addresses, links).
- Map tiles need network; previously viewed tiles may be cached.
- Some facts in the plan are explicitly unconfirmed (TBA dates, "check the night before");
  the site keeps that uncertainty visible, never presents it as confirmed.

## Brand Commitments

None. The plan's own voice is direct, practical, a bit irreverent ("8 degenerates").

## Evidence on Hand

- The full itinerary markdown (days, stops, notes, links, coordinates in map URLs).
- No photography supplied. Do not fabricate photos of specific venues.

## Product Principles

1. Right now beats everything: the current/next stop is never more than one tap away.
2. Every fact traceable to the plan; uncertainty stays labelled.
3. Works with one thumb, in the cold, on bad signal.
4. The whole trip should be graspable in one view before diving into a day.

## Accessibility & Inclusion

WCAG AA contrast, readable at arm's length outdoors, full keyboard support, respects
reduced motion. Japanese text (venue names, booking phrases) must render properly.
