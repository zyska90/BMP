export function intentScoreCalc(offerA: string | null, seekA: string | null, offerB: string | null, seekB: string | null): number {
  if (!offerA || !seekA || !offerB || !seekB) return 0;
  const aOfferWords = offerA.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const bSeekWords = seekB.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const bOfferWords = offerB.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const aSeekWords = seekA.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const matchAtoB = aOfferWords.filter(w => bSeekWords.some(bw => bw.includes(w) || w.includes(bw))).length;
  const matchBtoA = bOfferWords.filter(w => aSeekWords.some(aw => aw.includes(w) || w.includes(aw))).length;
  const totalWords = Math.max(aOfferWords.length + bOfferWords.length, 1);
  return Math.min(30, Math.round(((matchAtoB + matchBtoA) / totalWords) * 60));
}

export function jaccardCalc(tagsA: number[], tagsB: number[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0;
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return Math.min(25, Math.round((intersection / union) * 25));
}

export function industryCalc(indA: number | null, indB: number | null, adjacencyMap: Map<string, number>): number {
  if (!indA || !indB) return 0;
  if (indA === indB) return 20;
  const weight = adjacencyMap.get(`${indA}-${indB}`) || adjacencyMap.get(`${indB}-${indA}`) || 0;
  return Math.round((weight / 5) * 15);
}

export function scaleCalc(sizeA: string | null, sizeB: string | null): number {
  if (!sizeA || !sizeB) return 5;
  const ORDER = ['Solo', '2-10', '11-50', '51-200', '200+'];
  const iA = ORDER.indexOf(sizeA);
  const iB = ORDER.indexOf(sizeB);
  if (iA === -1 || iB === -1) return 5;
  const diff = Math.abs(iA - iB);
  return diff === 0 ? 15 : diff === 1 ? 10 : diff === 2 ? 5 : 0;
}

export function geoCalc(cityA: string | null, cityB: string | null, remoteA: boolean, remoteB: boolean): number {
  if (remoteA || remoteB) return 10;
  if (!cityA || !cityB) return 5;
  return cityA.toLowerCase().trim() === cityB.toLowerCase().trim() ? 10 : 0;
}

export function buildReasonText(scores: { intent: number; expertise: number; industry: number; scale: number; geo: number }, industryName?: string): string {
  const parts: string[] = [];
  if (scores.intent >= 15) parts.push('strong intent match');
  else if (scores.intent >= 8) parts.push('partial intent overlap');
  if (scores.expertise >= 15) parts.push('high expertise alignment');
  else if (scores.expertise >= 8) parts.push('some shared expertise');
  if (scores.industry >= 15) parts.push(`same industry${industryName ? ` (${industryName})` : ''}`);
  else if (scores.industry >= 8) parts.push('adjacent industries');
  if (scores.scale >= 10) parts.push('similar company scale');
  if (scores.geo >= 10) parts.push('same location or remote-friendly');
  return parts.length > 0 ? parts.join(', ') : 'general business compatibility';
}
