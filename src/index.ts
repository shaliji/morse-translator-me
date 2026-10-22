/**
 * morse-translator-me — Morse code encoder/decoder.
 *
 * The engine that powers https://morsetranslator.me : the full ITU-R
 * M.1677-1 table (letters, digits, punctuation), Spanish extended letters
 * behind an opt-in flag, line/word-aware round trips and honest warnings
 * instead of silently dropped characters.
 *
 * Zero dependencies, TypeScript, works in browsers and Node.
 * @license MIT
 */

export type TranslationResult = {
  output: string;
  warnings: string[];
  warningCount: number;
  // Spanish mode only: characters with no independent standard code, written
  // as their base letter instead of being dropped (currently Í → I).
  transcribed?: string[];
};

// Transcription table for letters the published tables disagree on. The
// base letter keeps the message usable while the warning keeps it honest;
// no code value is invented.
const SPANISH_TRANSCRIPTIONS: Record<string, string> = {
  "Í": "I",
};

const MORSE_BY_CHARACTER: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", 0: "-----", 1: ".----", 2: "..---",
  3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...",
  8: "---..", 9: "----.", ".": ".-.-.-", ",": "--..--",
  "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.",
  "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-",
  _: "..--.-", '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};

export const CHARACTER_BY_MORSE = Object.fromEntries(
  Object.entries(MORSE_BY_CHARACTER).map(([character, code]) => [
    code,
    character,
  ]),
);

// Spanish extended letters from the widely cited non-English alphabet table
// (historical international arrangements; not part of ITU-R M.1677-1).
// All values are collision-free against the standard table except that
// Ú and Ü intentionally share ..--, as they historically did. Í is NOT
// included: published tables disagree and one common value (..---)
// collides with the digit 2 — it stays unsupported pending confirmation.
const SPANISH_BY_CHARACTER: Record<string, string> = {
  "Ñ": "--.--",
  "Á": ".--.-",
  "É": "..-..",
  "Ó": "---.",
  "Ú": "..--",
  "Ü": "..--",
};

const SPANISH_BY_MORSE: Record<string, string> = {
  "--.--": "Ñ",
  ".--.-": "Á",
  "..-..": "É",
  "---.": "Ó",
  "..--": "Ü",
};

export type TranslationOptions = {
  // Spanish extended letters only apply inside the Spanish page scope.
  spanish?: boolean;
};

export const MORSE_ENTRIES = Object.entries(MORSE_BY_CHARACTER);

export const ALPHABET_EXAMPLES: Readonly<Record<string, { word: string; code: string }>> = {
  A: { word: "apple", code: ".- .--. .--. .-.. ." },
  B: { word: "boat", code: "-... --- .- -" },
  C: { word: "cat", code: "-.-. .- -" },
  D: { word: "dog", code: "-.. --- --." },
  E: { word: "echo", code: ". -.-. .... ---" },
  F: { word: "fish", code: "..-. .. ... ...." },
  G: { word: "gold", code: "--. --- .-.. -.." },
  H: { word: "house", code: ".... --- ..- ... ." },
  I: { word: "ice", code: ".. -.-. ." },
  J: { word: "jump", code: ".--- ..- -- .--." },
  K: { word: "kite", code: "-.- .. - ." },
  L: { word: "lamp", code: ".-.. .- -- .--." },
  M: { word: "moon", code: "-- --- --- -." },
  N: { word: "night", code: "-. .. --. .... -" },
  O: { word: "ocean", code: "--- -.-. . .- -." },
  P: { word: "plane", code: ".--. .-.. .- -. ." },
  Q: { word: "queen", code: "--.- ..- . . -." },
  R: { word: "radio", code: ".-. .- -.. .. ---" },
  S: { word: "sun", code: "... ..- -." },
  T: { word: "tree", code: "- .-. . ." },
  U: { word: "umbrella", code: "..- -- -... .-. . .-.. .-.. .-" },
  V: { word: "violin", code: "...- .. --- .-.. .. -." },
  W: { word: "water", code: ".-- .- - . .-." },
  X: { word: "xylophone", code: "-..- -.-- .-.. --- .--. .... --- -. ." },
  Y: { word: "yellow", code: "-.-- . .-.. .-.. --- .--" },
  Z: { word: "zebra", code: "--.. . -... .-. .-" },
};

function uniqueFirstFive(values: string[]) {
  return [...new Set(values)].slice(0, 5);
}

function encodeLine(line: string, spanish: boolean) {
  const unsupported: string[] = [];
  const transcribed: string[] = [];
  const words = line.trim().split(/\s+/).filter(Boolean);
  const output = words.map((word) =>
    Array.from(word.toUpperCase())
      .flatMap((character) => {
        const code = spanish
          ? SPANISH_BY_CHARACTER[character] ?? MORSE_BY_CHARACTER[character]
          : MORSE_BY_CHARACTER[character];
        if (code) return [code];
        if (spanish && SPANISH_TRANSCRIPTIONS[character]) {
          transcribed.push(character);
          return [MORSE_BY_CHARACTER[SPANISH_TRANSCRIPTIONS[character]]];
        }
        unsupported.push(character);
        return [];
      })
      .join(" "),
  );

  return { output: output.filter(Boolean).join(" / "), unsupported, transcribed };
}

export function encodeText(input: string, options: TranslationOptions = {}): TranslationResult {
  const results = input.split("\n").map((line) => encodeLine(line, Boolean(options.spanish)));
  const unsupported = results.flatMap((result) => result.unsupported);
  const transcribed = results.flatMap((result) => result.transcribed);

  return {
    output: results.map((result) => result.output).join("\n"),
    warnings: uniqueFirstFive(unsupported),
    warningCount: unsupported.length,
    ...(transcribed.length ? { transcribed: uniqueFirstFive(transcribed) } : {}),
  };
}

function decodeWord(word: string, invalid: string[], spanish: boolean) {
  return word
    .trim()
    .split(/\s{1,2}/)
    .filter(Boolean)
    .map((token) => {
      const character = spanish
        ? SPANISH_BY_MORSE[token] ?? CHARACTER_BY_MORSE[token]
        : CHARACTER_BY_MORSE[token];
      if (character) return character;
      invalid.push(token);
      return "�";
    })
    .join("");
}

function decodeLine(line: string, spanish: boolean) {
  const invalid: string[] = [];
  const output = line
    .trim()
    .split(/\s*\/\s*|\s{3,}/)
    .filter(Boolean)
    .map((word) => decodeWord(word, invalid, spanish))
    .join(" ");

  return { output, invalid };
}

export function decodeMorse(input: string, options: TranslationOptions = {}): TranslationResult {
  const results = input.split("\n").map((line) => decodeLine(line, Boolean(options.spanish)));
  const invalid = results.flatMap((result) => result.invalid);

  return {
    output: results.map((result) => result.output).join("\n"),
    warnings: uniqueFirstFive(invalid),
    warningCount: invalid.length,
  };
}
