
/**
 * Calcula los valores tipográficos (peso y ancho) a partir de una relevancia 0–1.
 *
 * Los límites corresponden a la fuente variable Mona Sans:
 * - font-weight: 200 900
 * - font-stretch: 75% 125%
 *
 * @param {number} relevance - Valor de relevancia entre 0 y 1
 * @returns {{ wght: number, wdth: number }}
 */
export function fitText(relevance = 1) {
  // Límites fijos de la familia tipográfica (solo como indicadores de rango)
  const minWght = 200;
  const maxWght = 900;
  const minWdth = 75;
  const maxWdth = 125;

  // Asegurar que relevance esté en el rango [0, 1]
  const r = Math.min(1, Math.max(0, Number(relevance) || 0));

  const lerp = (min, max, t) => min + (max - min) * t;

  // Redondear siempre hacia abajo para obtener valores enteros estables
  const wght = Math.floor(lerp(minWght, maxWght, r));
  const wdth = Math.floor(lerp(minWdth, maxWdth, r));

  return { wght, wdth };
}