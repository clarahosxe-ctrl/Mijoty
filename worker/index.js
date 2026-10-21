// Mijoty — service d'analyse de recettes (Cloudflare Worker).
// La clé Anthropic reste ici (secret ANTHROPIC_API_KEY) : l'appli n'en a jamais besoin.
// L'appli envoie seulement des images ; la consigne et le modèle sont fixés côté service,
// pour que le service ne puisse servir qu'à extraire des recettes.

const PROMPT = `Tu extrais une ou plusieurs recettes de cuisine à partir de captures d'écran (Instagram ou autre).

RÈGLES STRICTES :
1. N'extrais QUE le contenu factuel (ingrédients, quantités, étapes de préparation). Ne recopie JAMAIS une légende/texte d'accroche mot pour mot ; reformule entièrement en français avec un style neutre de fiche recette.
2. Si un ingrédient contient de la viande, des crevettes ou d'autres fruits de mer, remplace-le par une alternative végétarienne (tofu, tofu fumé, légumineuses, steak végétal, champignons...) et signale la substitution dans "notes".
3. Le thon et le saumon CUIT restent inchangés. Si l'ingrédient est du saumon FUMÉ (ou du poisson cru/fumé en général), remplace-le par du thon et signale-le dans "notes".
4. Si des macros (kcal/protéines/glucides/lipides) sont indiquées dans le post, reprends-les. Sinon, estime-les à partir des ingrédients avec des valeurs nutritionnelles standards.
5. Une image peut contenir plusieurs recettes distinctes, et une recette peut être répartie sur plusieurs images (à recomposer en une seule).
6. "category" doit être exactement l'une de : "petitdej", "repas", "desserts".
7. "subcategories" doit être un sous-ensemble de la liste correspondante :
   - petitdej: ["Sucré","Salé"]
   - repas: ["Salade / Bowl","Réconfortant","Chaud","Froid"]
   - desserts: ["Gourmand","Sain / protéiné"]

Réponds STRICTEMENT en JSON, sans aucun texte avant/après, sans balises markdown. Si tu identifies une seule recette, réponds avec un objet JSON unique. Si tu en identifies plusieurs, réponds avec un tableau JSON d'objets. Chaque objet doit suivre exactement ce schéma :
{
  "name": string,
  "category": "petitdej" | "repas" | "desserts",
  "subcategories": string[],
  "servings": number,
  "macros": {"kcal": number, "protein": number, "carbs": number, "fat": number},
  "ingredients": string[],
  "steps": string[],
  "toppings": string[],
  "notes": string
}`;

const MAX_IMAGES = 6;
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    ok,
    headers: {
      'Access-Control-Allow-Origin': ok ? origin : (allowed[0] || 'null'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    },
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: cors.ok ? 204 : 403, headers: cors.headers });
    if (request.method !== 'POST') return json({ error: { message: 'Méthode non autorisée' } }, 405, cors.headers);
    if (!cors.ok) return json({ error: { message: 'Origine non autorisée' } }, 403, cors.headers);
    if (!env.ANTHROPIC_API_KEY) return json({ error: { message: 'Service non configuré (clé manquante)' } }, 500, cors.headers);

    const declared = Number(request.headers.get('Content-Length') || 0);
    if (declared > MAX_BODY_BYTES) return json({ error: { message: 'Images trop lourdes' } }, 413, cors.headers);

    let payload;
    try { payload = await request.json(); } catch (e) { return json({ error: { message: 'Requête invalide' } }, 400, cors.headers); }

    const images = Array.isArray(payload && payload.images) ? payload.images : [];
    if (images.length < 1 || images.length > MAX_IMAGES) {
      return json({ error: { message: `Envoie entre 1 et ${MAX_IMAGES} images` } }, 400, cors.headers);
    }
    let total = 0;
    for (const im of images) {
      if (!im || !MEDIA_TYPES.includes(im.media_type) || typeof im.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(im.data)) {
        return json({ error: { message: 'Image invalide' } }, 400, cors.headers);
      }
      total += im.data.length;
    }
    if (total > MAX_BODY_BYTES) return json({ error: { message: 'Images trop lourdes' } }, 413, cors.headers);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.MODEL || 'claude-sonnet-5-5',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            ...images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } })),
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });

    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { 'Content-Type': 'application/json', ...cors.headers } });
  },
};
