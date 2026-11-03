const EVENT_FILTERS = new Set(["all", "featured", "weekend", "in-person", "online"]);

const normalizeEventDiscoveryFilter = (value) =>
  typeof value === "string" && EVENT_FILTERS.has(value) ? value : "all";

const nextWeekendRange = (now = new Date()) => {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const day = today.getUTCDay();
  const daysUntilSaturday = day === 0 ? -1 : (6 - day + 7) % 7;
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() + daysUntilSaturday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);
  return { start, end };
};

const eventDiscoveryFilter = (baseFilter, selected, now = new Date()) => {
  const filter = normalizeEventDiscoveryFilter(selected);
  if (filter === "all") return baseFilter;

  let extra;
  if (filter === "featured") {
    extra = {
      promotionTags: { $in: ["featured", "home-featured", "home-banner"] },
      promotionExpiresAt: { $gt: now },
    };
  } else if (filter === "weekend") {
    const { start, end } = nextWeekendRange(now);
    extra = { date: { $gte: start, $lt: end } };
  } else if (filter === "online") {
    extra = { type: { $in: ["online-pop-up", "online"] } };
  } else {
    extra = { type: { $in: ["in-person-pop-up", "pop-up", "fair"] } };
  }

  return { $and: [baseFilter, extra] };
};

module.exports = { eventDiscoveryFilter, nextWeekendRange, normalizeEventDiscoveryFilter };
