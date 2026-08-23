import { getCasesDb } from '@/db/cases';
import type { CaseRecord } from '@/db/schema';

export const runtime = 'edge';

type IncomingCase = Partial<Omit<CaseRecord, 'created_at'>>;

const text = (value: unknown, max = 500) => String(value ?? '').trim().slice(0, max);
const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export async function GET(request: Request) {
  const db = await getCasesDb();
  const url = new URL(request.url);
  const query = text(url.searchParams.get('q'), 80);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 100));
  const pattern = `%${query.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
  const where = query
    ? `WHERE brand LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR industry LIKE ? ESCAPE '\\' OR objective LIKE ? ESCAPE '\\' OR audience LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\'`
    : '';
  const statement = db.prepare(`
    SELECT id, brand, title, industry, objective, audience, budget, channels,
           period, result_metric, result_value, summary, source, created_at
    FROM cases
    ${where}
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `);
  const bound = query
    ? statement.bind(pattern, pattern, pattern, pattern, pattern, pattern, limit)
    : statement.bind(limit);
  const [rows, count] = await Promise.all([
    bound.all<CaseRecord>(),
    db.prepare('SELECT COUNT(*) AS total FROM cases').first<{ total: number }>(),
  ]);
  return Response.json({ cases: rows.results, total: count?.total ?? 0 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { cases?: IncomingCase[] } | null;
  if (!payload || !Array.isArray(payload.cases) || payload.cases.length === 0) {
    return Response.json({ error: '请提供 cases 数组' }, { status: 400 });
  }
  if (payload.cases.length > 100) {
    return Response.json({ error: '单次最多导入 100 个案例' }, { status: 400 });
  }

  const normalized = payload.cases.map((item, index) => ({
    id: text(item.id, 80) || crypto.randomUUID(),
    brand: text(item.brand, 120),
    title: text(item.title, 180),
    industry: text(item.industry, 120),
    objective: text(item.objective, 300),
    audience: text(item.audience, 300),
    budget: number(item.budget),
    channels: text(item.channels, 500),
    period: text(item.period, 120),
    result_metric: text(item.result_metric, 160),
    result_value: text(item.result_value, 160),
    summary: text(item.summary, 1200),
    source: text(item.source, 500),
    row: index + 1,
  }));
  const invalid = normalized.find((item) => !item.brand || !item.title || !item.source);
  if (invalid) {
    return Response.json({ error: `第 ${invalid.row} 行缺少 brand、title 或 source` }, { status: 400 });
  }

  const db = await getCasesDb();
  const sql = `
    INSERT INTO cases (
      id, brand, title, industry, objective, audience, budget, channels,
      period, result_metric, result_value, summary, source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      brand = excluded.brand,
      title = excluded.title,
      industry = excluded.industry,
      objective = excluded.objective,
      audience = excluded.audience,
      budget = excluded.budget,
      channels = excluded.channels,
      period = excluded.period,
      result_metric = excluded.result_metric,
      result_value = excluded.result_value,
      summary = excluded.summary,
      source = excluded.source,
      created_at = CURRENT_TIMESTAMP
  `;
  await db.batch(normalized.map((item) => db.prepare(sql).bind(
    item.id,
    item.brand,
    item.title,
    item.industry,
    item.objective,
    item.audience,
    item.budget,
    item.channels,
    item.period,
    item.result_metric,
    item.result_value,
    item.summary,
    item.source,
  )));
  return Response.json({ imported: normalized.length }, { status: 201 });
}

export async function DELETE(request: Request) {
  const id = text(new URL(request.url).searchParams.get('id'), 80);
  if (!id) return Response.json({ error: '缺少案例 id' }, { status: 400 });
  const db = await getCasesDb();
  const result = await db.prepare('DELETE FROM cases WHERE id = ?').bind(id).run();
  return Response.json({ deleted: result.meta.changes > 0 });
}

