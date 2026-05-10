const BASE_ID = 'app6FvPARDKaDRKwu';
const TABLE_ID = 'tblon7jDpWeYpLNE3';
const PRESENTATION_VIEW_ID = 'viwz7TBu1WYr4AbOt';

const FIELD_WHITELIST = [
  'No.',
  'Project',
  'Logo',
  'Borough',
  'Age Range',
  'Benefiting Age Ranges',
  'No. of Young People Impacted',
  'Engagement (h per person)',
  'Cost per Young Person',
  'Grant Requested',
  'Application Type',
  'Video Link',
  'Summary',
  'Proposal Overview',
  'Project Impact',
  'Delivery Plan',
  'Expected Outcomes',
];

const ALLOWED_ORIGINS = [
  'https://startbook.github.io',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function shape(rec) {
  const f = rec.fields || {};
  const logo = Array.isArray(f['Logo']) && f['Logo'][0] ? f['Logo'][0].url : null;
  return {
    id: rec.id,
    number: f['No.'] ?? null,
    project: f['Project'] || '',
    logo,
    borough: f['Borough'] || '',
    ageRange: f['Age Range'] || '',
    benefitingAgeRanges: f['Benefiting Age Ranges'] || [],
    youngPeopleImpacted: f['No. of Young People Impacted'] ?? null,
    hoursPerPerson: f['Engagement (h per person)'] ?? null,
    costPerYoungPerson: f['Cost per Young Person'] ?? null,
    grantRequested: f['Grant Requested'] ?? null,
    applicationType: f['Application Type'] || '',
    videoLink: f['Video Link'] || '',
    summary: f['Summary'] || '',
    proposalOverview: f['Proposal Overview'] || '',
    projectImpact: f['Project Impact'] || '',
    deliveryPlan: f['Delivery Plan'] || '',
    expectedOutcomes: f['Expected Outcomes'] || [],
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server not configured: AIRTABLE_TOKEN missing' });

  const year = String(req.query.year || '2026');
  if (!/^\d{4}$/.test(year)) return res.status(400).json({ error: 'Invalid year' });

  const params = new URLSearchParams();
  params.set('view', PRESENTATION_VIEW_ID);
  params.set('filterByFormula', `{Year}='${year}'`);
  for (const f of FIELD_WHITELIST) params.append('fields[]', f);

  const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
  const records = [];
  let offset;

  try {
    do {
      const url = offset
        ? `${baseUrl}?${params.toString()}&offset=${encodeURIComponent(offset)}`
        : `${baseUrl}?${params.toString()}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        const detail = await r.text();
        return res.status(r.status).json({ error: 'Airtable error', detail });
      }
      const data = await r.json();
      records.push(...(data.records || []));
      offset = data.offset;
    } while (offset);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: String(err) });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.json({ year, count: records.length, applicants: records.map(shape) });
}
