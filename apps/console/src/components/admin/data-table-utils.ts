export function serializeCsvCell(value: unknown) {
  let text = String(value ?? '');
  // Spreadsheet applications trim leading whitespace before evaluating cells.
  // Keep untrusted values text-only in exported operational data.
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
