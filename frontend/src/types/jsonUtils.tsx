export function autoEscapeJSON(raw: string): string {
    return raw
      // Escape unescaped double quotes inside values
      .replace(/:\s*"([^"]*?)"([^,\}\]])/g, (match, p1, p2) => {
        const escaped = p1.replace(/"/g, '\\"');
        return `: "${escaped}"${p2}`;
      })
      // Replace invalid newlines inside strings
      .replace(/[\n\r]/g, "\\n");
  }