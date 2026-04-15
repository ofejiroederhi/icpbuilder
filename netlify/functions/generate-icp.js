const fetch = require("node-fetch");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const REQUIRED_FIELDS = [
  "industry",
  "role",
  "frustrations",
  "success",
  "triggers",
  "objections",
  "channels",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are a senior marketing strategist with deep expertise in B2B customer research
and go-to-market strategy. A user will provide short, raw answers about their target
customer. Synthesise those answers into a complete, professionally written ICP document.
Do not simply reformat the inputs — enrich them with context, nuance, and depth.

Follow this exact structure:

**Role Overview**
2–3 sentences in narrative form. Who they are, what they own, where they sit.

**Goals**
3–5 bullet points. Specific professional goals. Avoid generic phrases.

**Pain Points**
3–5 bullet points. Human, specific, contextual. Go beyond the raw input.

**Buying Triggers**
3–4 bullet points. Specific conditions or moments that open them to a solution.

**Objections**
3–4 bullet points. Written from the customer's perspective, first person where natural.

**Preferred Channels**
2–4 bullet points. Where they are and how they consume content.

**Summary Statement**
One compelling paragraph capturing the full customer picture in a single read.

Rules: No preamble or closing remarks. Return only the formatted ICP document.
Write at a professional but human level — no corporate jargon.`;

const makeResponse = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    ...CORS_HEADERS,
    ...extraHeaders,
  },
  body,
});

const parseBody = (rawBody) => {
  try {
    return { ok: true, data: JSON.parse(rawBody || "{}") };
  } catch (error) {
    return {
      ok: false,
      message: "Invalid JSON body. Please send a valid JSON payload.",
    };
  }
};

const validatePayload = (payload) => {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = payload[field];
    return typeof value !== "string" || !value.trim();
  });

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing required fields: ${missing.join(", ")}.`,
    };
  }

  return { ok: true };
};

const buildUserPrompt = (payload) =>
  [
    `Industry: ${payload.industry.trim()}`,
    `Role: ${payload.role.trim()}`,
    `Frustrations: ${payload.frustrations.trim()}`,
    `Success: ${payload.success.trim()}`,
    `Triggers: ${payload.triggers.trim()}`,
    `Objections: ${payload.objections.trim()}`,
    `Channels: ${payload.channels.trim()}`,
  ].join("\n");

const sendDebugLog = (payload) => {
  // #region agent log
  // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request -- trusted internal path
  fetch("http://127.0.0.1:7327/ingest/bcbb38aa-dc86-4adc-97cf-1331903d0cb8", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "bb765e",
    },
    body: JSON.stringify({
      sessionId: "bb765e",
      runId: "icp-post-debug",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

exports.handler = async (event) => {
  // #region agent log
  sendDebugLog({
    hypothesisId: "H4",
    location: "netlify/functions/generate-icp.js:117",
    message: "Function handler invoked",
    data: { method: event.httpMethod, hasBody: Boolean(event.body) },
  });
  // #endregion
  if (event.httpMethod === "OPTIONS") {
    return makeResponse(204, "");
  }

  if (event.httpMethod !== "POST") {
    return makeResponse(
      405,
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { "Content-Type": "application/json" }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return makeResponse(
      500,
      JSON.stringify({
        error: "Server misconfiguration: OPENAI_API_KEY is not set.",
      }),
      { "Content-Type": "application/json" }
    );
  }

  const parsed = parseBody(event.body);
  if (!parsed.ok) {
    return makeResponse(400, JSON.stringify({ error: parsed.message }), {
      "Content-Type": "application/json",
    });
  }

  const validation = validatePayload(parsed.data);
  if (!validation.ok) {
    return makeResponse(400, JSON.stringify({ error: validation.message }), {
      "Content-Type": "application/json",
    });
  }

  const userPrompt = buildUserPrompt(parsed.data);

  try {
    const openAIResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const apiJson = await openAIResponse.json();

    if (!openAIResponse.ok) {
      const detail =
        apiJson?.error?.message || "OpenAI API request failed unexpectedly.";
      return makeResponse(502, JSON.stringify({ error: detail }), {
        "Content-Type": "application/json",
      });
    }

    const text = apiJson?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return makeResponse(
        502,
        JSON.stringify({ error: "OpenAI response did not include text output." }),
        { "Content-Type": "application/json" }
      );
    }

    return makeResponse(200, text, { "Content-Type": "text/plain" });
  } catch (error) {
    return makeResponse(
      500,
      JSON.stringify({
        error: "Unexpected server error while generating ICP.",
      }),
      { "Content-Type": "application/json" }
    );
  }
};
