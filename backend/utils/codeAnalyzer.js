/**
 * Analyseur de complexité JavaScript/TypeScript
 * - Complexité cyclomatique (McCabe)
 * - Complexité cognitive
 * - Métriques Halstead
 * - LOC / SLOC / Commentaires
 * - Profondeur d'imbrication
 * - Métriques de fonctions
 */

/**
 * Compte les lignes significatives
 */
function countLines(code) {
  const lines = code.split('\n');
  let loc = lines.length;
  let comments = 0;
  let blank = 0;
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { blank++; continue; }
    if (inBlock) {
      comments++;
      if (trimmed.includes('*/')) inBlock = false;
      continue;
    }
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) { comments++; continue; }
    if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
      comments++;
      if (!trimmed.includes('*/')) inBlock = true;
      continue;
    }
  }

  const sloc = loc - comments - blank;
  const commentRatio = loc > 0 ? Math.round((comments / loc) * 100) : 0;
  return { loc, sloc, comments, blank_lines: blank, comment_ratio: commentRatio };
}

/**
 * Calcule la complexité cyclomatique (McCabe) d'un bloc de code
 * V(G) = nb de points de décision + 1
 */
function cyclomaticComplexity(code) {
  // Compter les points de décision
  const decisionPatterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bdo\s*\{/g,
    /\bcase\s+.+:/g,
    /\bcatch\s*\(/g,
    /\?\s*.+\s*:/g,           // opérateur ternaire
    /&&/g,
    /\|\|/g,
    /\?\?/g,                   // nullish coalescing
    /\.forEach\s*\(/g,
    /\.map\s*\(/g,
    /\.filter\s*\(/g,
    /\.reduce\s*\(/g,
    /\.some\s*\(/g,
    /\.every\s*\(/g,
    /\.find\s*\(/g,
  ];

  let count = 1; // Base = 1
  // Retirer les chaînes de caractères pour éviter les faux positifs
  const cleaned = code
    .replace(/`[^`]*`/g, '""')
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""')
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''")
    .replace(/\/\/.*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  for (const pattern of decisionPatterns) {
    const matches = cleaned.match(pattern);
    if (matches) count += matches.length;
  }

  return count;
}

/**
 * Complexité cognitive (approximation SonarQube)
 * Pénalise davantage les imbrications et certains patterns
 */
function cognitiveComplexity(code) {
  const lines = code.split('\n');
  let score = 0;
  let nestingLevel = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Incrémente l'imbrication
    const opens = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;

    // Points de complexité avec pénalité d'imbrication
    if (/\bif\s*\(/.test(trimmed) && !/\belse\s+if/.test(trimmed)) score += 1 + nestingLevel;
    else if (/\belse\s+if\s*\(/.test(trimmed)) score += 1;
    else if (/\belse\b/.test(trimmed) && !/\belse\s+if/.test(trimmed)) score += 1;
    if (/\bfor\s*\(/.test(trimmed)) score += 1 + nestingLevel;
    if (/\bwhile\s*\(/.test(trimmed)) score += 1 + nestingLevel;
    if (/\bdo\s*\{/.test(trimmed)) score += 1 + nestingLevel;
    if (/\bswitch\s*\(/.test(trimmed)) score += 1 + nestingLevel;
    if (/\bcatch\s*\(/.test(trimmed)) score += 1 + nestingLevel;
    if (/\?\s*.+\s*:/.test(trimmed)) score += 1;  // ternaire
    if (/&&|\|\|/.test(trimmed)) score += (trimmed.match(/&&|\|\|/g) || []).length;

    nestingLevel = Math.max(0, nestingLevel + opens - closes);
  }

  return score;
}

/**
 * Calcule la profondeur d'imbrication maximale
 */
function maxNestingDepth(code) {
  let max = 0;
  let current = 0;
  const cleaned = code
    .replace(/`[^`]*`/g, '""')
    .replace(/"[^"\\]*"/g, '""')
    .replace(/'[^'\\]*'/g, "''");

  for (const char of cleaned) {
    if (char === '{') { current++; max = Math.max(max, current); }
    else if (char === '}') { current = Math.max(0, current - 1); }
  }
  return max;
}

/**
 * Métriques de Halstead
 * n1 = opérateurs uniques, n2 = opérandes uniques
 * N1 = total opérateurs, N2 = total opérandes
 */
function halsteadMetrics(code) {
  const cleaned = code
    .replace(/\/\/.*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/`[^`]*`/g, '"str"')
    .replace(/"[^"]*"/g, '"str"')
    .replace(/'[^']*'/g, '"str"');

  const operators = ['+','-','*','/','%','=','==','===','!=','!==','<','>','<=','>=',
    '&&','||','!','++','--','+=','-=','*=','/=','%=','??','?.','=>',
    'if','else','for','while','do','switch','case','break','return','throw','new','typeof','instanceof'];
  const operandPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*|\d+\.?\d*)\b/g;

  const uniqueOperators = new Set();
  const uniqueOperands = new Set();
  let N1 = 0; let N2 = 0;

  for (const op of operators) {
    const re = new RegExp(`\\${op}|\\b${op}\\b`, 'g');
    try {
      const matches = cleaned.match(re) || [];
      if (matches.length > 0) { uniqueOperators.add(op); N1 += matches.length; }
    } catch {}
  }

  const operandMatches = cleaned.match(operandPattern) || [];
  operandMatches.forEach(m => { uniqueOperands.add(m); N2++; });

  const n1 = uniqueOperators.size;
  const n2 = uniqueOperands.size;
  const N = N1 + N2;
  const n = n1 + n2;
  const vocabulary = n;
  const length = N;
  const volume = n > 0 ? Math.round(N * Math.log2(n) * 10) / 10 : 0;
  const difficulty = n2 > 0 ? Math.round((n1 / 2) * (N2 / n2) * 10) / 10 : 0;
  const effort = Math.round(volume * difficulty);

  return { halstead_volume: volume, halstead_difficulty: difficulty, halstead_effort: effort };
}

/**
 * Indice de maintenabilité (0-100)
 * MI = MAX(0, (171 - 5.2*ln(V) - 0.23*V(G) - 16.2*ln(SLOC)) * 100/171)
 */
function maintainabilityIndex(volume, cyclomatic, sloc) {
  if (!volume || !cyclomatic || !sloc || sloc === 0) return null;
  const mi = Math.max(0, (171 - 5.2 * Math.log(volume) - 0.23 * cyclomatic - 16.2 * Math.log(sloc)) * 100 / 171);
  return Math.round(mi);
}

/**
 * Extrait les fonctions/méthodes et calcule leurs métriques
 */
function extractFunctions(code) {
  const functions = [];
  // Pattern pour fonctions nommées, arrow, méthodes de classe
  const patterns = [
    /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(([^)]*)\)/g,
    /^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/gm, // méthodes de classe
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1];
      const params = match[2] ? match[2].split(',').filter(p => p.trim()).length : 0;
      // Extraire le corps de la fonction (approximation)
      const start = match.index;
      let depth = 0; let end = start;
      for (let i = start; i < code.length; i++) {
        if (code[i] === '{') depth++;
        else if (code[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
      const body = code.slice(start, end + 1);
      const fnLoc = body.split('\n').length;
      const fnCC = cyclomaticComplexity(body);
      const fnCognitive = cognitiveComplexity(body);
      const fnNesting = maxNestingDepth(body);
      const { halstead_volume } = halsteadMetrics(body);

      if (name && name !== 'if' && name !== 'for' && name !== 'while') {
        functions.push({
          name,
          loc: fnLoc,
          cyclomatic_complexity: fnCC,
          cognitive_complexity: fnCognitive,
          params_count: params,
          max_nesting: fnNesting,
          halstead_volume,
        });
      }
    }
  }

  return functions;
}

/**
 * Analyse complète d'un fichier JS/TS
 */
function analyzeCode(code, filename = '') {
  const lineMetrics = countLines(code);
  const cc = cyclomaticComplexity(code);
  const cognitive = cognitiveComplexity(code);
  const nesting = maxNestingDepth(code);
  const halstead = halsteadMetrics(code);
  const mi = maintainabilityIndex(halstead.halstead_volume, cc, lineMetrics.sloc);
  const functions = extractFunctions(code);

  const avgCC = functions.length > 0
    ? Math.round(functions.reduce((s, f) => s + f.cyclomatic_complexity, 0) / functions.length * 10) / 10
    : cc;

  const avgMethodLen = functions.length > 0
    ? Math.round(functions.reduce((s, f) => s + f.loc, 0) / functions.length)
    : null;

  const maxMethodLen = functions.length > 0
    ? Math.max(...functions.map(f => f.loc))
    : null;

  return {
    module_name: filename || 'Unknown',
    language: filename.endsWith('.ts') || filename.endsWith('.tsx') ? 'TypeScript' : 'JavaScript',
    source: 'AUTO',
    ...lineMetrics,
    cyclomatic_complexity: cc,
    cognitive_complexity: cognitive,
    max_nesting_depth: nesting,
    avg_complexity_per_fn: avgCC,
    ...halstead,
    maintainability_index: mi,
    num_methods: functions.length,
    avg_method_length: avgMethodLen,
    max_method_length: maxMethodLen,
    functions,
  };
}

module.exports = { analyzeCode, cyclomaticComplexity, cognitiveComplexity, halsteadMetrics, maintainabilityIndex, countLines, extractFunctions };
