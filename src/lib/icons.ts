// Lucide icons, inlined at build time. One stroke family across the site.
import trainFront from 'lucide-static/icons/train-front.svg?raw';
import carTaxiFront from 'lucide-static/icons/car-taxi-front.svg?raw';
import bus from 'lucide-static/icons/bus.svg?raw';
import ship from 'lucide-static/icons/ship.svg?raw';
import house from 'lucide-static/icons/house.svg?raw';
import utensils from 'lucide-static/icons/utensils.svg?raw';
import landmark from 'lucide-static/icons/landmark.svg?raw';
import shoppingBag from 'lucide-static/icons/shopping-bag.svg?raw';
import ticket from 'lucide-static/icons/ticket.svg?raw';
import martini from 'lucide-static/icons/martini.svg?raw';
import trees from 'lucide-static/icons/trees.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import phone from 'lucide-static/icons/phone.svg?raw';
import globe from 'lucide-static/icons/globe.svg?raw';
import navigation from 'lucide-static/icons/navigation.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import sunset from 'lucide-static/icons/sunset.svg?raw';
import sunrise from 'lucide-static/icons/sunrise.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import wallet from 'lucide-static/icons/wallet.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import plane from 'lucide-static/icons/plane.svg?raw';
import bed from 'lucide-static/icons/bed-double.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import map from 'lucide-static/icons/map.svg?raw';
import moon from 'lucide-static/icons/moon.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import pause from 'lucide-static/icons/pause.svg?raw';
import rotate3d from 'lucide-static/icons/rotate-3d.svg?raw';
import trendingUp from 'lucide-static/icons/trending-up.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import share from 'lucide-static/icons/share-2.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import snowflake from 'lucide-static/icons/snowflake.svg?raw';
import mountain from 'lucide-static/icons/mountain.svg?raw';
import footprints from 'lucide-static/icons/footprints.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import sun from 'lucide-static/icons/sun.svg?raw';
import cloud from 'lucide-static/icons/cloud.svg?raw';
import cloudSun from 'lucide-static/icons/cloud-sun.svg?raw';
import cloudRain from 'lucide-static/icons/cloud-rain.svg?raw';
import cloudSnow from 'lucide-static/icons/cloud-snow.svg?raw';
import cloudFog from 'lucide-static/icons/cloud-fog.svg?raw';
import alert from 'lucide-static/icons/triangle-alert.svg?raw';
import clock3 from 'lucide-static/icons/clock-3.svg?raw';
import radio from 'lucide-static/icons/radio-tower.svg?raw';
import mic from 'lucide-static/icons/mic.svg?raw';

const RAW = {
  transport: trainFront, stay: house, restaurant: utensils, attraction: landmark,
  shopping: shoppingBag, activity: ticket, bar: martini, nature: trees, other: mapPin,
  pin: mapPin, phone, globe, navigation, prev: chevronLeft, next: chevronRight, sunset, sunrise,
  checklist: listChecks, wallet, info, plane, bed, copy, check, map, moon, clock, play, pause,
  rotate3d, trendingUp, plus, share, x, snowflake, mountain, footprints,
  search, sun, cloud, cloudSun, cloudRain, cloudSnow, cloudFog, alert, clock3, radio, mic,
  car: carTaxiFront, bus, ship,
} as const;

export type IconName = keyof typeof RAW;

export function icon(name: IconName) {
  return RAW[name]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(width|height)="24"/g, '')
    .replace('<svg', '<svg aria-hidden="true" focusable="false"')
    .replace(/class="[^"]*"/, 'class="icon"')
    .trim();
}
