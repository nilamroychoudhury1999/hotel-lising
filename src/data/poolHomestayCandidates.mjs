const DEFAULT_UPDATED_AT = "2026-06-12T00:00:00+05:30";

export const OSM_ATTRIBUTION = {
  label: "OpenStreetMap contributors",
  url: "https://www.openstreetmap.org/copyright",
  license: "ODbL"
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/@/g, "at")
    .replace(/'/g, "")
    .replace(/"/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 78)
    .replace(/-+$/g, "");

export const CONFIRMED_OSM_POOL_STAYS = [
  { name: "Amara Ayurveda Retreat", category: "hotel", city: "Thiruvananthapuram", state: "Kerala", area: "Ayurveda retreat belt", lat: 8.413327, lon: 76.981269, poolTag: "outdoor", osmType: "node", osmId: 12749591720 },
  { name: "Anjuna 4br Private Pool Villa Bard A1", category: "chalet", city: "Anjuna", state: "Goa", area: "Anjuna", lat: 15.589043, lon: 73.74451, poolTag: "yes", osmType: "node", osmId: 12544925490 },
  { name: "Clarion Hotel Khayal", category: "hotel", city: "Kochi", state: "Kerala", area: "Kakkanad / Infopark side", lat: 10.002973, lon: 76.362272, poolTag: "yes", osmType: "way", osmId: 1360717949, website: "https://www.subahotels.com/clarion-hotel-khayal-kochi/overview" },
  { name: "Crowne Plaza Rohini", category: "hotel", city: "New Delhi", state: "Delhi", area: "Rohini", lat: 28.719934, lon: 77.10972, poolTag: "outdoor", osmType: "way", osmId: 1230064950, website: "https://www.crowneplaza.com/hotels/us/en/new-delhi/delba/hoteldetail" },
  { name: "DoubleTree by Hilton Goa - Panaji", category: "hotel", city: "Velha Goa", state: "Goa", area: "Kadamba Plateau", lat: 15.49684, lon: 73.883901, poolTag: "outdoor", osmType: "way", osmId: 637513273, website: "https://www.hilton.com/en/hotels/goigddi-doubletree-goa-panaji" },
  { name: "DoubleTree by Hilton Hotel Goa - Arpora - Baga", category: "hotel", city: "Arpora", state: "Goa", area: "Arpora / Baga", lat: 15.575416, lon: 73.762214, poolTag: "outdoor", osmType: "way", osmId: 434511956, website: "https://www.hilton.com/en/hotels/goiabdi-doubletree-goa-arpora-baga/" },
  { name: "Fairfield by Marriott Goa Benaulim", category: "hotel", city: "Benaulim", state: "Goa", area: "South Goa", lat: 15.255922, lon: 73.923107, poolTag: "outdoor", osmType: "node", osmId: 9247107849, website: "https://www.marriott.com/hotels/fact-sheet/travel/goifb-fairfield-goa-benaulim/" },
  { name: "Four Points by Sheraton", category: "hotel", city: "Kochi", state: "Kerala", area: "Infopark Kochi", lat: 10.007388, lon: 76.362784, poolTag: "outdoor", osmType: "way", osmId: 1074703594, website: "https://www.marriott.com/en-us/hotels/cokfp-four-points-kochi-infopark" },
  { name: "Hilton Garden Inn Trivandrum", category: "hotel", city: "Trivandrum", state: "Kerala", area: "Punnen Road", lat: 8.499494, lon: 76.950154, poolTag: "outdoor", osmType: "way", osmId: 451550777, website: "https://www.hilton.com/en/hotels/trvgigi-hilton-garden-inn-trivandrum/" },
  { name: "Hilton Goa Resort", category: "hotel", city: "Candolim", state: "Goa", area: "Pilerne / Candolim", lat: 15.520091, lon: 73.795217, poolTag: "outdoor", osmType: "way", osmId: 751602824, website: "https://www.hilton.com/en/hotels/goishhi-hilton-goa-resort/" },
  { name: "Holiday Inn Goa Candolim", category: "hotel", city: "Candolim", state: "Goa", area: "Candolim", lat: 15.503479, lon: 73.771951, poolTag: "outdoor", osmType: "way", osmId: 1112537414 },
  { name: "Hyatt Centric", category: "hotel", city: "New Delhi", state: "Delhi", area: "Janakpuri / West Delhi", lat: 28.628984, lon: 77.078591, poolTag: "outdoor", osmType: "way", osmId: 1101654446 },
  { name: "The Claridges", category: "hotel", city: "New Delhi", state: "Delhi", area: "Lutyens Delhi", lat: 28.600648, lon: 77.216322, poolTag: "outdoor", osmType: "way", osmId: 318808654 },
  { name: "The Mercy", category: "hotel", city: "Kochi", state: "Kerala", area: "MG Road / Ravipuram side", lat: 9.958474, lon: 76.28866, poolTag: "outdoor", osmType: "way", osmId: 591871723 },
  { name: "Velan Hotel Greenfields", category: "hotel", city: "Tiruppur", state: "Tamil Nadu", area: "Kangayam Road side", lat: 11.103747, lon: 77.363611, poolTag: "yes", osmType: "way", osmId: 1201115545 }
].map((stay, index) => ({
  ...stay,
  id: `osm-pool-${String(index + 1).padStart(3, "0")}-${stay.osmId}`,
  slug: slugify(`${stay.name}-${stay.city}-${stay.osmId}`),
  source: "OpenStreetMap",
  sourceUrl: `https://www.openstreetmap.org/${stay.osmType}/${stay.osmId}`,
  poolStatus: "confirmed_map_pool_tag",
  verificationStatus: "Map pool tag found. Verify current pool access, stay type, pricing, and booking terms directly before publishing as bookable.",
  updatedAt: DEFAULT_UPDATED_AT
}));

const poolLeadAreas = [
  { area: "Baga Calangute Beach Belt", city: "Goa", state: "Goa", lat: 15.552, lon: 73.755, context: "beach holidays, scooter rentals, nightlife routes, and private villa demand" },
  { area: "South Goa Colva Benaulim Belt", city: "Goa", state: "Goa", lat: 15.263, lon: 73.919, context: "quiet beach stays, family holidays, and long-stay pool villas" },
  { area: "Guwahati Airport Borjhar Side", city: "Guwahati", state: "Assam", lat: 26.106, lon: 91.586, context: "airport transit, family stays, early flights, and private apartment searches" },
  { area: "Kharguli River View Belt", city: "Guwahati", state: "Assam", lat: 26.19, lon: 91.765, context: "premium city escapes, river-view stays, couples, and short private breaks" },
  { area: "Police Bazar Hill Stay Belt", city: "Shillong", state: "Meghalaya", lat: 25.578, lon: 91.893, context: "central hill stays, cafes, family walks, and Guwahati-Shillong road trips" },
  { area: "Sohra Waterfall Route", city: "Cherrapunji", state: "Meghalaya", lat: 25.284, lon: 91.724, context: "waterfall routes, rainy-season stays, trekking, and nature breaks" },
  { area: "Kohora Safari Gate", city: "Kaziranga", state: "Assam", lat: 26.585, lon: 93.414, context: "wildlife safaris, family resorts, and early reporting times" },
  { area: "Old Manali Cafe Belt", city: "Manali", state: "Himachal Pradesh", lat: 32.252, lon: 77.188, context: "workations, mountain cafes, snow trips, and adventure routes" },
  { area: "Shimla Mall Road / Kufri Route", city: "Shimla", state: "Himachal Pradesh", lat: 31.104, lon: 77.173, context: "family hill holidays, snow-season breaks, and local taxi planning" },
  { area: "Tapovan Laxman Jhula Belt", city: "Rishikesh", state: "Uttarakhand", lat: 30.129, lon: 78.324, context: "rafting, yoga stays, riverside walks, and group trips" },
  { area: "Lake Pichola / Fateh Sagar Belt", city: "Udaipur", state: "Rajasthan", lat: 24.579, lon: 73.682, context: "lake-view stays, destination weddings, couple trips, and heritage sightseeing" },
  { area: "Amer Fort / Jal Mahal Route", city: "Jaipur", state: "Rajasthan", lat: 26.985, lon: 75.851, context: "fort sightseeing, wedding guests, family villas, and car rental routes" },
  { area: "Tajganj Taj Mahal Belt", city: "Agra", state: "Uttar Pradesh", lat: 27.171, lon: 78.042, context: "Taj Mahal sunrise visits, family heritage trips, and Golden Triangle stays" },
  { area: "Assi Ghat / Lanka Belt", city: "Varanasi", state: "Uttar Pradesh", lat: 25.288, lon: 83.006, context: "ghat access, temple timing, boat rides, and family pilgrimage stays" },
  { area: "Fort Kochi / Marine Drive Belt", city: "Kochi", state: "Kerala", lat: 9.966, lon: 76.242, context: "coastal city stays, heritage walks, backwater starts, and airport arrivals" },
  { area: "Alleppey Backwater Belt", city: "Alleppey", state: "Kerala", lat: 9.498, lon: 76.338, context: "backwaters, houseboat planning, family stays, and slow coastal travel" },
  { area: "Munnar Anachal Tea Estate Belt", city: "Munnar", state: "Kerala", lat: 10.029, lon: 77.047, context: "tea estate views, couple trips, driver-led sightseeing, and family hill stays" },
  { area: "Ooty Lake / Lovedale Belt", city: "Ooty", state: "Tamil Nadu", lat: 11.406, lon: 76.695, context: "Nilgiri hill trips, tea gardens, family stays, and workations" },
  { area: "White Town / Auroville Belt", city: "Pondicherry", state: "Puducherry", lat: 11.936, lon: 79.834, context: "beach cafes, heritage walks, couples, scooter rentals, and long stays" },
  { area: "Coorg Coffee Estate Belt", city: "Coorg", state: "Karnataka", lat: 12.424, lon: 75.738, context: "coffee estate stays, waterfalls, family road trips, and private pool villas" },
  { area: "Hampi Bazaar / Anegundi Belt", city: "Hampi", state: "Karnataka", lat: 15.335, lon: 76.462, context: "heritage ruins, backpacking, cycling, and sunrise route planning" },
  { area: "Leh Market / Changspa Belt", city: "Leh", state: "Ladakh", lat: 34.164, lon: 77.584, context: "acclimatization, permit checks, road trips, and high-altitude stays" },
  { area: "Dal Lake / Nishat Belt", city: "Srinagar", state: "Jammu and Kashmir", lat: 34.107, lon: 74.871, context: "lake stays, family trips, garden visits, and Kashmir valley movement" },
  { area: "Havelock / Neil Island Belt", city: "Andaman", state: "Andaman and Nicobar Islands", lat: 11.965, lon: 92.995, context: "island hopping, ferry timing, diving, beach stays, and family holidays" },
  { area: "Puri Beach / Temple Belt", city: "Puri", state: "Odisha", lat: 19.813, lon: 85.831, context: "Jagannath Temple visits, beach stays, family pilgrimages, and Konark routes" }
];

const poolLeadProfiles = [
  { label: "Private Pool Villa Homestay Lead", roomType: "Entire villa", guestFit: "Families and premium groups", poolType: "private pool to verify", priceBand: "Premium" },
  { label: "Family Pool Homestay Lead", roomType: "Entire home", guestFit: "Families and small groups", poolType: "shared or private pool to verify", priceBand: "Mid-range" },
  { label: "Couple Friendly Pool Suite Lead", roomType: "Private suite", guestFit: "Couples", poolType: "pool access to verify", priceBand: "Mid-range" },
  { label: "Workation Pool Stay Lead", roomType: "Apartment or villa", guestFit: "Remote workers and long stays", poolType: "pool plus WiFi to verify", priceBand: "Long-stay" }
];

export const MAP_POOL_HOMESTAY_LEADS = poolLeadAreas.flatMap((area, areaIndex) =>
  poolLeadProfiles.map((profile, profileIndex) => {
    const sequence = areaIndex * poolLeadProfiles.length + profileIndex + 1;
    const latOffset = ((profileIndex % 2) - 0.5) * 0.012;
    const lonOffset = (Math.floor(profileIndex / 2) - 0.5) * 0.012;
    const name = `${profile.label} near ${area.area}`;

    return {
      id: `pool-map-lead-${String(sequence).padStart(3, "0")}`,
      slug: slugify(`${name}-${area.city}-${sequence}`),
      name,
      category: "homestay pool lead",
      city: area.city,
      state: area.state,
      area: area.area,
      lat: Number((area.lat + latOffset).toFixed(6)),
      lon: Number((area.lon + lonOffset).toFixed(6)),
      roomType: profile.roomType,
      guestFit: profile.guestFit,
      poolTag: profile.poolType,
      priceBand: profile.priceBand,
      source: "Homavia map-area research lead",
      sourceUrl: "",
      poolStatus: "pool_to_verify",
      verificationStatus: "Map-area lead only. Contact host or property owner before publishing as a verified Homavia listing.",
      mapContext: area.context,
      updatedAt: DEFAULT_UPDATED_AT
    };
  })
);

export const POOL_HOMESTAY_CANDIDATES = [
  ...CONFIRMED_OSM_POOL_STAYS,
  ...MAP_POOL_HOMESTAY_LEADS
];

export const CONFIRMED_OSM_POOL_STAY_COUNT = CONFIRMED_OSM_POOL_STAYS.length;
export const MAP_POOL_HOMESTAY_LEAD_COUNT = MAP_POOL_HOMESTAY_LEADS.length;
export const POOL_HOMESTAY_CANDIDATE_COUNT = POOL_HOMESTAY_CANDIDATES.length;
