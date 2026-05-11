function getCFByName(fields, name) {
  if (!name) return undefined;
  return (fields || []).find(f => (f.name || '').toLowerCase() === name.toLowerCase());
}

function getDropdownOptionName(cf) {
    if (!cf) return null;
    const options = cf.type_config?.options || [];
    let rawValue = cf.value;
    if (rawValue == null && Array.isArray(cf.labels)) { rawValue = cf.labels; }
    const valueArray = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const v of valueArray) {
        if (v == null) continue;
        if (typeof v === 'object') {
            if (typeof v.name === 'string' && v.name) return v.name;
            if (v.id != null) {
                const matchingOption = options.find(o => String(o.id) === String(v.id));
                if (matchingOption?.name) return matchingOption.name;
            }
        }
        let matchingOption = options.find(o => String(o.id) === String(v));
        if (matchingOption?.name) return matchingOption.name;
        matchingOption = options.find(o => o.orderindex === v);
        if (matchingOption?.name) return matchingOption.name;
        if (typeof v === 'string' && options.some(o => o.name === v)) return v;
    }
    return null;
}

function getAttachmentUrl(cf) {
  if (!cf) return null;
  const value = cf.value;
  if (Array.isArray(value) && value.length > 0) {
    return value[0]?.url ?? null;
  }
  return null;
}

function formatDate(timestamp) {
  if (timestamp == null) return null;
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getCustomFieldValue(cf) {
  if (!cf) return null;

  if (cf.type === 'drop_down') {
    return getDropdownOptionName(cf);
  }

  if (cf.type === 'attachment') {
    return getAttachmentUrl(cf);
  }

  if (cf.type === 'labels') {
    const options = cf.type_config?.options || [];
    const raw = Array.isArray(cf.value) ? cf.value : (Array.isArray(cf.labels) ? cf.labels : []);
    return raw.map(v => {
      if (v == null) return null;
      if (typeof v === 'object') return v.name ?? null;
      const found = options.find(o => String(o.id) === String(v));
      return found?.name ?? String(v);
    }).filter(Boolean);
  }

  return cf.value ?? null;
}

export async function handler(event) {
  const {
    task_id,
    id,
    team_id,
    custom_task_ids,
    include_subtasks,
    include_markdown_description,
  } = event.queryStringParameters || {};

  const pathTaskId = event.pathParameters?.task_id || event.pathParameters?.id;
  const resolvedTaskId = task_id || id || pathTaskId;

  const TOKEN = process.env.CLICKUP_TOKEN;

  if (!resolvedTaskId) return json(400, { error: "Missing task_id" });
  if (!TOKEN) return json(500, { error: "Missing CLICKUP_TOKEN" });

  try {
    const u = new URL(`https://api.clickup.com/api/v2/task/${resolvedTaskId}`);
    if (custom_task_ids === 'true' && team_id) { u.searchParams.set('custom_task_ids', 'true'); u.searchParams.set('team_id', team_id); }
    if (include_subtasks === 'true') { u.searchParams.set('include_subtasks', 'true'); }
    if (include_markdown_description === 'true') { u.searchParams.set('include_markdown_description', 'true'); }

    const res = await fetch(u.toString(), {
      headers: { Authorization: TOKEN }
    });

    if (res.status === 401 || res.status === 403) {
      return json(401, { error: "Unauthorized: revisa CLICKUP_TOKEN o permisos" });
    }

    const data = await res.json();
    if (!data?.id) return json(400, { error: "Invalid ClickUp response", details: data });

    const customFields = (data.custom_fields || []).reduce((acc, cf) => {
      acc[cf.name] = getCustomFieldValue(cf);
      return acc;
    }, {});

    const genericFields = {
      id: data.id,
      name: data.name,
      status: data.status?.status ?? null,
      status_color: data.status?.color ?? null,
      date_created: formatDate(data.date_created),
      date_updated: formatDate(data.date_updated),
      date_closed: formatDate(data.date_closed),
      start_date: formatDate(data.start_date),
      due_date: formatDate(data.due_date),
      priority: data.priority?.priority ?? null,
      creator: data.creator?.username ?? null,
      assignees: (data.assignees || []).map(a => a.username).filter(Boolean),
      tags: (data.tags || []).map(t => t.name).filter(Boolean),
      list: data.list?.name ?? null,
      folder: data.folder?.name ?? null,
      space: data.space?.name ?? null,
      url: data.url ?? null,
    };

    const task = {
      ...genericFields,
      ...customFields,
    };

    return json(200, task);
  } catch (err) {
    return json(500, { error: "Server error", details: err.message });
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(obj)
  };
}
