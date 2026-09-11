/** Parse content written by CreatorPosts buildContent back into form fields. */
export function parsePostContent(content: string | null): {
  sport: string;
  event: string;
  pickType: string;
  pick: string;
  usOdds: string;
  euOdds: string;
  units: string;
  notes: string;
} {
  const empty = {
    sport: '',
    event: '',
    pickType: '',
    pick: '',
    usOdds: '',
    euOdds: '',
    units: '1',
    notes: '',
  };
  if (!content?.trim()) return empty;

  const lines = content.split('\n');
  let sport = '';
  let event = '';
  let pickType = '';
  let pick = '';
  let usOdds = '';
  let euOdds = '';
  let units = '1';
  const noteLines: string[] = [];
  let pastStructured = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!pastStructured) {
      const sportMatch = /^Sport:\s*(.+)$/i.exec(line);
      if (sportMatch) {
        sport = sportMatch[1].trim();
        continue;
      }
      const eventMatch = /^Event:\s*(.+)$/i.exec(line);
      if (eventMatch) {
        event = eventMatch[1].trim();
        continue;
      }
      const typeMatch = /^Type:\s*(.+)$/i.exec(line);
      if (typeMatch) {
        pickType = typeMatch[1].trim();
        continue;
      }
      const pickMatch = /^Pick:\s*(.+)$/i.exec(line);
      if (pickMatch) {
        pick = pickMatch[1].trim();
        continue;
      }
      const oddsMatch = /^Odds:\s*(.+)$/i.exec(line);
      if (oddsMatch) {
        const oddsBody = oddsMatch[1];
        const usPart = /([+-]?\d+(?:\.\d+)?)\s*\(US\)/i.exec(oddsBody);
        const euPart = /(\d+(?:\.\d+)?)\s*\(EU\)/i.exec(oddsBody);
        if (usPart) usOdds = usPart[1];
        if (euPart) euOdds = euPart[1];
        continue;
      }
      const unitsMatch = /^Units:\s*([\d.]+)u?/i.exec(line);
      if (unitsMatch) {
        units = unitsMatch[1];
        continue;
      }
      if (line.trim() === '') {
        pastStructured = true;
        continue;
      }
      pastStructured = true;
      noteLines.push(line);
      continue;
    }
    noteLines.push(line);
  }

  return {
    sport,
    event,
    pickType,
    pick,
    usOdds,
    euOdds,
    units,
    notes: noteLines.join('\n').replace(/^\n+/, '').trimEnd(),
  };
}
