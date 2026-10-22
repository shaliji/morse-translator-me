import { describe, expect, it } from "vitest";
import {
  ALPHABET_EXAMPLES,
  CHARACTER_BY_MORSE,
  MORSE_ENTRIES,
  decodeMorse,
  encodeText,
} from "../src/index";

describe("encodeText", () => {
  it("encodes SOS", () => {
    expect(encodeText("SOS").output).toBe("... --- ...");
  });

  it("separates words with slash and letters with space", () => {
    expect(encodeText("HELLO WORLD").output).toBe(
      ".... . .-.. .-.. --- / .-- --- .-. .-.. -..",
    );
  });

  it("encodes punctuation from the ITU table", () => {
    expect(encodeText("HI!").output).toBe(".... .. -.-.--");
    expect(encodeText("A@B").output).toBe(".- .--.-. -...");
    expect(encodeText("$5").output).toBe("...-..- .....");
  });

  it("round-trips the full standard table", () => {
    const all = MORSE_ENTRIES.map(([character]) => character).join("");
    const encoded = encodeText(all);
    expect(encoded.warningCount).toBe(0);
    expect(decodeMorse(encoded.output).output).toBe(all);
  });

  it("collects unsupported characters into warnings", () => {
    const result = encodeText("A#B~C");
    expect(result.output).toBe(".- -... -.-.");
    expect(result.warnings).toEqual(["#", "~"]);
    expect(result.warningCount).toBe(2);
  });

  it("preserves lines", () => {
    expect(encodeText("AA\nBB").output).toBe(".- .-\n-... -...");
  });
});

describe("decodeMorse", () => {
  it("decodes with slash or wide gaps between words", () => {
    expect(decodeMorse(".... .. / - .... . .-. .").output).toBe("HI THERE");
    expect(decodeMorse(".... ..    - .... . .-. .").output).toBe("HI THERE");
  });

  it("marks invalid tokens instead of failing", () => {
    const result = decodeMorse(".- .....----");
    expect(result.output).toBe("A�");
    expect(result.warnings).toEqual([".....----"]);
    expect(result.warningCount).toBe(1);
  });
});

describe("Spanish extended letters", () => {
  it("encodes Ñ and Ü only in Spanish mode", () => {
    expect(encodeText("Ñ").output).toBe("");
    expect(encodeText("Ñ", { spanish: true }).output).toBe("--.--");
    expect(encodeText("Ü", { spanish: true }).output).toBe("..--");
  });

  it("decodes shared Ú/Ü code as Ü in Spanish mode", () => {
    expect(decodeMorse("..--", { spanish: true }).output).toBe("Ü");
  });

  it("transcribes Í as I with a visible note in Spanish mode", () => {
    const result = encodeText("Í", { spanish: true });
    expect(result.output).toBe("..");
    expect(result.transcribed).toEqual(["Í"]);
  });

  it("keeps the standard table intact when decoding Spanish input", () => {
    expect(decodeMorse(".- --. .- .--. ---", { spanish: true }).output).toBe("AGAPO");
  });
});

describe("reference data", () => {
  it("exposes 54 standard characters", () => {
    expect(MORSE_ENTRIES).toHaveLength(54);
    expect(Object.keys(CHARACTER_BY_MORSE)).toHaveLength(54);
  });

  it("ships A–Z example words with matching codes", () => {
    for (const letter of Object.keys(ALPHABET_EXAMPLES)) {
      const { word, code } = ALPHABET_EXAMPLES[letter];
      expect(encodeText(word).output).toBe(code);
    }
  });
});
