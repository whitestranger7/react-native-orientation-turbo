'use strict';

// Keep offsets and line breaks intact so matches can be edited in the original source.
function sourceView(source, { strings = true, language = 'swift' } = {}) {
  const characters = source.split('');

  function nonCodeEnd(index) {
    if (source.startsWith('//', index)) {
      const end = source.indexOf('\n', index);
      return end < 0 ? source.length : end;
    }
    if (source.startsWith('/*', index)) {
      let depth = 1;
      let end = index + 2;
      while (end < source.length && depth > 0) {
        if (source.startsWith('/*', end)) {
          depth++;
          end += 2;
        } else if (source.startsWith('*/', end)) {
          depth--;
          end += 2;
        } else end++;
      }
      return end;
    }
    const literal = /^(#*)("""|["'`])/.exec(source.slice(index));
    if (literal == null) return index;
    const [, hashes, quote] = literal;
    const closing = quote + hashes;
    const escape = '\\' + hashes;
    let end = index + hashes.length + quote.length;
    while (end < source.length) {
      if (source.startsWith(closing, end)) return end + closing.length;
      if (
        language === 'swift' &&
        quote[0] === '"' &&
        source.startsWith(escape + '(', end)
      ) {
        end = balancedEnd(end + escape.length);
      } else if (
        language === 'kotlin' &&
        quote[0] === '"' &&
        source.startsWith('${', end)
      ) {
        end = balancedEnd(end + 1);
      } else if (
        !(language === 'kotlin' && quote === '"""') &&
        source.startsWith(escape, end)
      ) {
        end += escape.length + 1;
      } else end++;
    }
    return Math.min(end, source.length);
  }

  function balancedEnd(index) {
    const closing = { '(': ')', '{': '}', '[': ']' }[source[index]];
    let end = index + 1;
    while (end < source.length) {
      const skipped = nonCodeEnd(end);
      if (skipped !== end) end = skipped;
      else if (source[end] === closing) return end + 1;
      else if ('({['.includes(source[end])) end = balancedEnd(end);
      else end++;
    }
    return end;
  }

  for (let index = 0; index < source.length;) {
    const end = nonCodeEnd(index);
    if (end === index) {
      index++;
      continue;
    }
    // Backticks escape native identifiers; they are not string delimiters.
    if (source[index] === '`' && /^`\w+`$/.test(source.slice(index, end))) {
      characters[index] = ' ';
      characters[end - 1] = ' ';
      index = end;
      continue;
    }
    if (
      strings ||
      source.startsWith('//', index) ||
      source.startsWith('/*', index)
    ) {
      for (let cursor = index; cursor < end; cursor++) {
        if (characters[cursor] !== '\n' && characters[cursor] !== '\r')
          characters[cursor] = ' ';
      }
    }
    index = end;
  }
  return characters.join('');
}

function depthAt(code, start, end) {
  let depth = 0;
  for (let index = start; index < end; index++) {
    if (code[index] === '{') depth++;
    else if (code[index] === '}') depth--;
  }
  return depth;
}

function isConditional(code, index) {
  let depth = 0;
  for (const directive of code
    .slice(0, index)
    .matchAll(/^[ \t]*#(if|endif)\b/gm)) {
    depth += directive[1] === 'if' ? 1 : -1;
  }
  return depth > 0;
}

function bodies(code, pattern) {
  const result = [];
  for (const match of code.matchAll(pattern)) {
    const start = match.index + match[0].lastIndexOf('{') + 1;
    let end = start;
    let depth = 1;
    while (end < code.length && depth > 0) {
      if (code[end] === '{') depth++;
      else if (code[end] === '}') depth--;
      end++;
    }
    if (depth === 0) result.push({ match, start, end: end - 1 });
  }
  return result;
}

function typeBodies(code, name) {
  return bodies(
    code,
    new RegExp(`\\b(?:class|extension)\\s+${name}\\b[^{}]*\\{`, 'g')
  );
}

function declarations(code, owner, language) {
  const types = typeBodies(code, owner);
  const pattern =
    language === 'swift' ? /\bfunc\s+(\w+)\s*\(/g : /\bfun\s+(\w+)\s*\(/g;
  const result = [];
  for (const declaration of code.matchAll(pattern)) {
    if (
      !types.some(
        (type) =>
          declaration.index >= type.start &&
          declaration.index < type.end &&
          depthAt(code, type.start, declaration.index) === 0
      )
    )
      continue;
    let end = declaration.index + declaration[0].length;
    let depth = 1;
    while (end < code.length && depth > 0) {
      if (code[end] === '(') depth++;
      else if (code[end] === ')') depth--;
      end++;
    }
    if (depth === 0)
      result.push({
        match: Object.assign(
          [code.slice(declaration.index, end), declaration[1]],
          { index: declaration.index }
        ),
        end,
      });
  }
  return result;
}

function methods(code, owner, language) {
  const result = [];
  for (const declaration of declarations(code, owner, language)) {
    const suffix = code
      .slice(declaration.end)
      .match(
        language === 'swift'
          ? /^\s*(?:->\s*[\w.<>?]+\s*)?\{/
          : /^\s*(?::\s*[\w.<>?]+\s*)?\{/
      );
    if (suffix == null) continue;
    const start = declaration.end + suffix[0].length;
    let end = start;
    let depth = 1;
    while (end < code.length && depth > 0) {
      if (code[end] === '{') depth++;
      else if (code[end] === '}') depth--;
      end++;
    }
    if (depth === 0)
      result.push({
        match: Object.assign(
          [code.slice(declaration.match.index, start), declaration.match[1]],
          { index: declaration.match.index }
        ),
        start,
        end: end - 1,
      });
  }
  return result;
}

module.exports = {
  sourceView,
  depthAt,
  isConditional,
  typeBodies,
  declarations,
  methods,
};
