export interface Room {
  id: string;
  name: string;
  location: string;
  library: string;
  isAvailable: boolean;
  timeSlot?: string;
  bookingUrl: string;
  capacity?: number;
}

interface RoomInfo {
  eid: number;
  name: string;
  capacity: number;
}

interface AvailabilitySlot {
  start: string;
  end: string;
  itemId: number;
  className?: string;
}

interface AvailabilityResponse {
  slots: AvailabilitySlot[];
  bookings: unknown[];
}

// Hardcoded room catalogs from LibCal (spaces.lib.uci.edu)
const ROOM_CATALOG: Record<string, { lid: string; gid: string; libraryName: string; rooms: RoomInfo[] }> = {
  langson: {
    lid: '6539',
    gid: '11679',
    libraryName: 'Langson Library',
    rooms: [
      { eid: 44696, name: 'Langson 380', capacity: 6 },
      { eid: 44697, name: 'Langson 382', capacity: 6 },
      { eid: 44698, name: 'Langson 386', capacity: 4 },
      { eid: 44699, name: 'Langson 388', capacity: 4 },
      { eid: 44700, name: 'Langson 390', capacity: 4 },
      { eid: 44701, name: 'Langson 392', capacity: 4 },
      { eid: 44702, name: 'Langson 394', capacity: 4 },
      { eid: 44703, name: 'Langson 396', capacity: 4 },
      { eid: 131264, name: 'LL Collaboration Zone (360)', capacity: 43 },
      { eid: 155343, name: 'Study Pod 1A', capacity: 1 },
      { eid: 155344, name: 'Study Pod 1B', capacity: 1 },
      { eid: 168432, name: 'Study Pod 1C', capacity: 1 },
      { eid: 168433, name: 'Study Pod 1D', capacity: 1 },
      { eid: 168434, name: 'Study Pod 2A', capacity: 1 },
      { eid: 168435, name: 'Study Pod 2B', capacity: 1 },
      { eid: 168436, name: 'Study Pod 2C', capacity: 1 },
      { eid: 168437, name: 'Study Pod 2D', capacity: 1 },
    ],
  },
  science: {
    lid: '6580',
    gid: '11678',
    libraryName: 'Science Library',
    rooms: [
      { eid: 111031, name: 'Science 277 (Tech Enhanced)', capacity: 6 },
      { eid: 44668, name: 'Science 402', capacity: 4 },
      { eid: 44669, name: 'Science 410', capacity: 6 },
      { eid: 44670, name: 'Science 471', capacity: 4 },
      { eid: 44671, name: 'Science 472', capacity: 4 },
      { eid: 44672, name: 'Science 473', capacity: 4 },
      { eid: 44673, name: 'Science 474', capacity: 4 },
      { eid: 44674, name: 'Science 475', capacity: 4 },
      { eid: 44675, name: 'Science 476', capacity: 4 },
      { eid: 44676, name: 'Science 477', capacity: 4 },
      { eid: 44677, name: 'Science 478', capacity: 4 },
      { eid: 44678, name: 'Science 479', capacity: 4 },
      { eid: 44679, name: 'Science 480', capacity: 4 },
      { eid: 44680, name: 'Science 520 (Tech Enhanced)', capacity: 4 },
      { eid: 44681, name: 'Science 522 (Tech Enhanced)', capacity: 4 },
      { eid: 44683, name: 'Science 524 (Tech Enhanced)', capacity: 5 },
      { eid: 44684, name: 'Science 526 (Tech Enhanced)', capacity: 5 },
      { eid: 44685, name: 'Science 528 (Tech Enhanced)', capacity: 5 },
      { eid: 44686, name: 'Science 530 (Tech Enhanced)', capacity: 5 },
      { eid: 44687, name: 'Science 531 (Tech Enhanced)', capacity: 5 },
      { eid: 44688, name: 'Science 533', capacity: 4 },
      { eid: 44689, name: 'Science 579', capacity: 8 },
      { eid: 44690, name: 'Science 610', capacity: 4 },
      { eid: 111030, name: 'Science 483', capacity: 5 },
      { eid: 178733, name: 'Study Pod 2A', capacity: 1 },
      { eid: 178734, name: 'Study Pod 2B', capacity: 1 },
    ],
  },
};

async function fetchAvailability(
  lid: string,
  gid: string,
  date: string
): Promise<AvailabilitySlot[]> {
  // end date is the next day (the grid API uses an exclusive end date)
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const end = endDate.toISOString().split('T')[0];

  const body = new URLSearchParams({
    lid,
    gid,
    start: date,
    end,
    pageIndex: '0',
    pageSize: '50',
    seat: '0',
    seatId: '0',
    zone: '0',
    bookings: '',
  });

  const response = await fetch('https://spaces.lib.uci.edu/spaces/availability/grid', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Referer': `https://spaces.lib.uci.edu/spaces?lid=${lid}`,
      'Origin': 'https://spaces.lib.uci.edu',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    console.warn(`[LibCal] HTTP ${response.status} for lid=${lid}`);
    return [];
  }

  const data: AvailabilityResponse = await response.json();
  return data.slots ?? [];
}

// A room is available if every 30-min slot in [startTime, endTime) has no className
function isAvailableForWindow(
  slots: AvailabilitySlot[],
  eid: number,
  date: string,
  startTime: string,
  endTime: string
): boolean {
  const windowStart = `${date} ${startTime}:00`;
  const windowEnd = `${date} ${endTime}:00`;

  const roomSlots = slots.filter(
    (s) => s.itemId === eid && s.start >= windowStart && s.start < windowEnd
  );

  // No slots means the room isn't offered in that window (closed, etc.)
  if (roomSlots.length === 0) return false;

  // All slots must be unbooked (no className)
  return roomSlots.every((s) => !s.className);
}

export async function scrapeLibCalRooms(
  locationKey: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<Room[]> {
  const catalog = ROOM_CATALOG[locationKey];
  if (!catalog) {
    console.warn(`[LibCal] Unknown location key: ${locationKey}`);
    return [];
  }

  console.log(`[LibCal] Fetching availability for ${catalog.libraryName}...`);

  try {
    const slots = await fetchAvailability(catalog.lid, catalog.gid, date);
    console.log(`[LibCal] Got ${slots.length} slots for ${catalog.libraryName}`);

    return catalog.rooms.map((room) => ({
      id: `${catalog.lid}-${room.eid}`,
      name: room.name,
      location: catalog.libraryName,
      library: catalog.libraryName,
      capacity: room.capacity,
      isAvailable: isAvailableForWindow(slots, room.eid, date, startTime, endTime),
      timeSlot: `${startTime}–${endTime}`,
      bookingUrl: `https://spaces.lib.uci.edu/space/${room.eid}?date=${date}`,
    }));
  } catch (error) {
    console.error(`[LibCal] Error fetching ${catalog.libraryName}:`, error);
    return [];
  }
}

export const LIBCAL_LOCATION_KEYS = Object.keys(ROOM_CATALOG);
