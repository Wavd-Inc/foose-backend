const test = require("node:test");
const assert = require("node:assert/strict");
const {
  eventDiscoveryFilter,
  nextWeekendRange,
  normalizeEventDiscoveryFilter,
} = require("../src/utils/eventDiscoveryFilters");

test("accepts known filters and falls back to all for unknown values", () => {
  assert.equal(normalizeEventDiscoveryFilter("online"), "online");
  assert.equal(normalizeEventDiscoveryFilter("near-me"), "all");
  assert.equal(normalizeEventDiscoveryFilter(["featured"]), "all");
});

test("this weekend includes the current weekend on Sunday and moves forward on Monday", () => {
  const sunday = nextWeekendRange(new Date("2026-11-08T18:00:00Z"));
  assert.equal(sunday.start.toISOString(), "2026-11-07T00:00:00.000Z");
  assert.equal(sunday.end.toISOString(), "2026-11-09T00:00:00.000Z");
  const monday = nextWeekendRange(new Date("2026-11-09T00:00:00Z"));
  assert.equal(monday.start.toISOString(), "2026-11-14T00:00:00.000Z");
});

test("filters combine with the upcoming predicate before pagination", () => {
  const upcoming = { status: { $ne: "past" } };
  assert.equal(eventDiscoveryFilter(upcoming, "all"), upcoming);
  assert.deepEqual(eventDiscoveryFilter(upcoming, "online").$and[1], {
    type: { $in: ["online-pop-up", "online"] },
  });
  assert.deepEqual(eventDiscoveryFilter(upcoming, "in-person").$and[1], {
    type: { $in: ["in-person-pop-up", "pop-up", "fair"] },
  });
  assert.deepEqual(eventDiscoveryFilter(upcoming, "featured", new Date("2026-11-03T12:00:00Z")).$and[1], {
    promotionTags: { $in: ["featured", "home-featured", "home-banner"] },
    promotionExpiresAt: { $gt: new Date("2026-11-03T12:00:00Z") },
  });
  assert.deepEqual(eventDiscoveryFilter(upcoming, "weekend", new Date("2026-11-03T12:00:00Z")).$and[1], {
    date: { $gte: new Date("2026-11-07T00:00:00Z"), $lt: new Date("2026-11-09T00:00:00Z") },
  });
});
