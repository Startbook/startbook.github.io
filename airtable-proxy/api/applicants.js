const BASE_ID = 'app6FvPARDKaDRKwu';
const TABLE_ID = 'tblon7jDpWeYpLNE3';
const PRESENTATION_VIEW_ID = 'viwz7TBu1WYr4AbOt';

const FIELD_WHITELIST = [
  'Project',
  'Logo',
  'Borough',
  'Website',
  'Organisation Type',
  'Quality Mark',
  'Age Range',
  'Benefiting Age Ranges',
  'No. of Young People Impacted',
  'Engagement (h per person)',
  'Cost per Young Person',
  'Grant Requested',
  'Annual Turnover',
  'Application Type',
  'Video Link',
  'Summary',
  'Proposal Overview',
  'Project Impact',
  'Delivery Plan',
  'Expected Outcomes',
  'Details of Activities',
  'Evidence of Need',
  'Involvement of Young People in Programme Development',
  'Engaging Young People Facing Barriers',
  'Engaging Hard to Reach',
  'Recruitment & Engagement of Young People',
  'Safety & Inclusion Plan',
  'Accreditations',
  'Other Funders',
  'Standalone project or enhancing an existing programme',
  'Project Viability Without Grant Funding',
  'Previous Application History',
  'Start Date',
  'End Date',
  'Financial Breakdown',
  'Young Girls/Women in STEM',
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
  const logo = Array.isArray(f['Logo']) && f['Logo'][0] ? f['Logo'][0].url : null;
  const financial = Array.isArray(f['Financial Breakdown'])
    ? f['Financial Breakdown'].map((att) => ({
        url: att.url,
        filename: att.filename,
        type: att.type || '',
        thumbnailUrl: att.thumbnails?.large?.url || att.thumbnails?.full?.url || '',
      }))
    : [];
  return {
    id: rec.id,
    number: f['No.'] ?? null,
    project: f['Project'] || '',
    logo,
    borough: f['Borough'] || '',
    website: f['Website'] || '',
    organisationType: f['Organisation Type'] || '',
    qualityMark: f['Quality Mark'] || '',
    ageRange: f['Age Range'] || '',
    benefitingAgeRanges: f['Benefiting Age Ranges'] || [],
    youngPeopleImpacted: f['No. of Young People Impacted'] ?? null,
    hoursPerPerson: f['Engagement (h per person)'] ?? null,
    costPerYoungPerson: f['Cost per Young Person'] ?? null,
    grantRequested: f['Grant Requested'] ?? null,
    annualTurnover: f['Annual Turnover'] ?? null,
    applicationType: f['Application Type'] || '',
    videoLink: f['Video Link'] || '',
    summary: f['Summary'] || '',
    proposalOverview: f['Proposal Overview'] || '',
    projectImpact: f['Project Impact'] || '',
    deliveryPlan: f['Delivery Plan'] || '',
    expectedOutcomes: f['Expected Outcomes'] || [],
    detailsOfActivities: f['Details of Activities'] || '',
    evidenceOfNeed: f['Evidence of Need'] || '',
    youngPeopleInvolvement: f['Involvement of Young People in Programme Development'] || '',
    engagingBarriers: f['Engaging Young People Facing Barriers'] || '',
    engagingHardToReach: f['Engaging Hard to Reach'] || '',
    recruitment: f['Recruitment & Engagement of Young People'] || '',
    safetyAndInclusion: f['Safety & Inclusion Plan'] || '',
    accreditations: f['Accreditations'] || '',
    otherFunders: f['Other Funders'] || '',
    standaloneOrEnhancing: f['Standalone project or enhancing an existing programme'] || '',
    viabilityWithoutGrant: f['Project Viability Without Grant Funding'] || '',
    previousApplicationHistory: f['Previous Application History'] || '',
    startDate: f['Start Date'] || '',
    endDate: f['End Date'] || '',
    financialBreakdown: financial,
    youngGirlsWomenInStem: f['Young Girls/Women in STEM'] || '',
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
