import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decodeEntities,
  htmlToText,
  normalizeLink,
} from "../../src/collect/clean.ts";

describe("decodeEntities", () => {
  it("decodes named entities", () => {
    assert.equal(
      decodeEntities("Manual &amp; Automation"),
      "Manual & Automation",
    );
  });

  it("turns &nbsp; into a regular space", () => {
    assert.equal(decodeEntities("до&nbsp;$2000"), "до $2000");
  });

  it("decodes numeric entities", () => {
    assert.equal(decodeEntities("It&#39;s"), "It's");
  });

  it("leaves unknown entities untouched", () => {
    assert.equal(decodeEntities("a &foo; b"), "a &foo; b");
  });
});

describe("htmlToText", () => {
  it("keeps list items on separate lines", () => {
    assert.equal(
      htmlToText("<ul><li>Playwright</li><li>TypeScript</li></ul>"),
      "Playwright\nTypeScript",
    );
  });

  it("removes inline tags without gluing words", () => {
    assert.equal(
      htmlToText("<p>Need <strong>Playwright</strong> skills</p>"),
      "Need Playwright skills",
    );
  });
});

describe("normalizeLink", () => {
  it("removes tracking query and hash", () => {
    assert.equal(
      normalizeLink(
        "https://jobs.dou.ua/companies/x/vacancies/1/?utm_source=jobsrss#reply",
      ),
      "https://jobs.dou.ua/companies/x/vacancies/1/",
    );
  });
});
