const BASE_ID = 'app6FvPARDKaDRKwu';
const TABLE_ID = 'tbl3IO57DDarIXouQ';
const GALLERY_VIEW_ID = 'viw0TqpGfrxD8bM2K';
const ORG_FIELD_NAME = 'Organisation';
const TYPE_FIELD_NAME = 'Attendee Type';

const FIELD_WHITELIST = [
  'Attendee Name',
  'First Name',
  'Last Name',
  'Profile Picture',
  'Email',
  'Job Title',
  'Organisation',
  'Attendee Type',
  'URL',
  'Judging URL',
  'Attendance Status',
];

const ALLOWED_ORIGINS = [
  'https://startbook.github.io',
  'https://startbook.co.uk',
  'https://www.startbook.co.uk',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
];

function setCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function shape(rec) {
  const f = rec.fields || {};
  const photo = Array.isArray(f['Profile Picture']) && f['Profile Picture'][0]
    ? (f['Profile Picture'][0].thumbnails?.large?.url || f['Profile Picture'][0].url)
    : null;
  return {
    id: rec.id,
    name: f['Attendee Name'] || [f['First Name'], f['Last Name']].filter(Boolean).join(' '),
    firstName: f['First Name'] || '',
    lastName: f['Last Name'] || '',
    photo,
    email: f['Email'] || '',
    jobTitle: f['Job Title'] || '',
    organisation: f['Organisation'] || [],
    attendeeType: f['Attendee Type'] || '',
    url: f['URL'] || '',
    judgingUrl: f['Judging URL'] || '',
    attending: !!f['Attendance Status'],
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server not configured: AIRTABLE_TOKEN missing' });

  const params = new URLSearchParams();
  params.set('view', GALLERY_VIEW_ID);
  for (const f of FIELD_WHITELIST) params.append('fields[]', f);

  const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
  const records = [];
  let offset;
  let orgs = [];
  let types = [];

  try {
    const recordsPromise = (async () => {
      do {
        const url = offset
          ? `${baseUrl}?${params.toString()}&offset=${encodeURIComponent(offset)}`
          : `${baseUrl}?${params.toString()}`;
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) {
          const detail = await r.text();
          throw new Error(`records ${r.status}: ${detail}`);
        }
        const data = await r.json();
        records.push(...(data.records || []));
        offset = data.offset;
      } while (offset);
    })();

    const schemaPromise = (async () => {
      const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return; // non-fatal — frontend can fall back to alphabetical
      const data = await r.json();
      const table = (data.tables || []).find((t) => t.id === TABLE_ID);
      if (!table) return;
      const orgField = (table.fields || []).find((f) => f.name === ORG_FIELD_NAME);
      const orgChoices = orgField && orgField.options && orgField.options.choices;
      if (orgChoices) orgs = orgChoices.map((c) => c.name);
      const typeField = (table.fields || []).find((f) => f.name === TYPE_FIELD_NAME);
      const typeChoices = typeField && typeField.options && typeField.options.choices;
      if (typeChoices) types = typeChoices.map((c) => c.name);
    })();

    await Promise.all([recordsPromise, schemaPromise]);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: String(err) });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.json({ count: records.length, orgs, types, attendees: records.map(shape) });
}
