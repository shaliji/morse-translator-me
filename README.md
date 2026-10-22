# morse-translator-me

Zero-dependency Morse code encoder/decoder for TypeScript and JavaScript. This is the engine that powers **[morsetranslator.me](https://morsetranslator.me/)** — a free Morse code translator, generator and audio decoder.

- **Full ITU-R M.1677-1 table** — 26 letters, 10 digits, 18 punctuation marks, all collision-free.
- **Honest results** — unsupported characters come back as warnings instead of being silently dropped.
- **Opt-in Spanish extended letters** — Ñ Á É Ó Ú Ü from the widely cited historical table (off by default, so standard decoding never changes).
- **Reference data included** — the code table and A–Z example words ship as exports, ready for teaching tools and cheat sheets.
- No dependencies, tree-shakeable, ESM + CJS + TypeScript types, runs in Node and the browser.

## Install

```bash
npm install morse-translator-me
```

## Usage

```js
import { encodeText, decodeMorse } from "morse-translator-me";

encodeText("HELLO WORLD");
// { output: ".... . .-.. .-.. --- / .-- --- .-. .-.. -..",
//   warnings: [], warningCount: 0 }

decodeMorse("... --- ...");
// { output: "SOS", warnings: [], warningCount: 0 }
```

Unsupported characters never break the conversion — you get the rest of the message plus a warning list:

```js
encodeText("A#B~C");
// { output: ".- -... -.-.", warnings: ["#", "~"], warningCount: 2 }
```

### Spanish extended letters

```js
encodeText("Ñ", { spanish: true }).output;  // "--.--"
decodeMorse("..--", { spanish: true }).output;  // "Ü"
```

Notes: Ú and Ü intentionally share `..--` exactly as the historical tables did, so decoding that code yields Ü. Í has no agreed code (one common value collides with the digit 2), so it is transcribed as I and reported in `transcribed` instead of being invented.

### Reference data

```js
import { MORSE_ENTRIES, CHARACTER_BY_MORSE, ALPHABET_EXAMPLES } from "morse-translator-me";

MORSE_ENTRIES;        // [["A", ".-"], ["B", "-..."], ...] — 54 entries
CHARACTER_BY_MORSE;   // { ".-": "A", ... } — reverse lookup
ALPHABET_EXAMPLES;    // { A: { word: "apple", code: ".- .--. .--. .-.. ." }, ... }
```

## API

### `encodeText(input: string, options?: { spanish?: boolean }): TranslationResult`

Encodes plain text to Morse code. Letters are separated by spaces, words by ` / `, lines are preserved.

### `decodeMorse(input: string, options?: { spanish?: boolean }): TranslationResult`

Decodes Morse code to text. Words can be separated by `/` or by 3+ spaces. Invalid tokens decode as `�` and are listed in `warnings`.

### `TranslationResult`

| Field | Type | Meaning |
| --- | --- | --- |
| `output` | `string` | Converted text. |
| `warnings` | `string[]` | Up to 5 unique unsupported characters / invalid tokens. |
| `warningCount` | `number` | Total number of problems. |
| `transcribed?` | `string[]` | Spanish mode only: letters written as their base letter (Í → I). |

## Try it in the browser

The full translator — with audio playback, adjustable WPM, light signals, an audio file decoder and printable charts — is at **[morsetranslator.me](https://morsetranslator.me/)**.

## License

[MIT](./LICENSE)
