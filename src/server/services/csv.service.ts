export function parseCsv(text: string) {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let index = 0; index < row.length; index += 1) {
        const char = row[index];
        const next = row[index + 1];

        if (char === '"' && next === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      values.push(current.trim());
      return values;
    });

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((values) => {
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });
}

export function parseBoolean(value?: string) {
  return ["true", "yes", "1", "y"].includes(value?.toLowerCase() ?? "");
}
