function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  const {
    table,
    field_name,
    field_value,
    task_id,
    id,
    select
  } = event.queryStringParameters || {};

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const targetTable = table || "tareas";
  const targetFieldName = field_name || "task_id";
  const targetFieldValue = field_value ?? task_id ?? id;
  const selectFields = select || "*";

  if (!supabaseUrl) {
    return json(500, { error: "Missing SUPABASE_URL" });
  }

  if (!supabaseSecretKey) {
    return json(500, { error: "Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY" });
  }

  if (!targetFieldValue) {
    return json(400, {
      error: "Missing field_value",
      hint: "Provide field_value or task_id/id"
    });
  }

  try {
    const cleanBaseUrl = supabaseUrl.replace(/\/$/, "");
    const url = new URL(`${cleanBaseUrl}/rest/v1/${encodeURIComponent(targetTable)}`);
    url.searchParams.set(targetFieldName, `eq.${targetFieldValue}`);
    url.searchParams.set("select", selectFields);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
        Accept: "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return json(response.status, {
        error: "Supabase query failed",
        details: data
      });
    }

    const record = Array.isArray(data) ? (data[0] || null) : null;

    return json(200, {
      table: targetTable,
      field_name: targetFieldName,
      field_value: targetFieldValue,
      found: Boolean(record),
      record
    });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: error.message
    });
  }
};
