interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT name, score FROM scores ORDER BY score DESC LIMIT 10',
  ).all<{ name: string; score: number }>();

  return Response.json(results ?? [], {
    headers: { 'Cache-Control': 'no-cache' },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { name?: string; score?: number };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { name, score } = body;
  if (!name || typeof name !== 'string' || typeof score !== 'number' || score <= 0) {
    return new Response('Invalid input', { status: 400 });
  }

  const sanitized = name.replace(/[^A-Z]/g, '').slice(0, 3).toUpperCase();
  if (sanitized.length === 0) {
    return new Response('Invalid name', { status: 400 });
  }

  await env.DB.prepare('INSERT INTO scores (name, score) VALUES (?, ?)')
    .bind(sanitized, Math.floor(score))
    .run();

  return Response.json({ ok: true });
};
