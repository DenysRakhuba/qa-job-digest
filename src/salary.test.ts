import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatSalary, parseSalary, salaryTop } from "./salary.ts";

describe("parseSalary", () => {
  it("parses a range from a DOU title", () => {
    assert.deepEqual(
      parseSalary("Automation QA Engineer в Company, $1900–2300, Київ"),
      { min: 1900, max: 2300 },
    );
  });

  it("parses an upper bound", () => {
    assert.deepEqual(parseSalary("QA Engineer, до $2000, Київ"), { max: 2000 });
  });

  it("parses a lower bound", () => {
    assert.deepEqual(parseSalary("AQA, від $3000, віддалено"), { min: 3000 });
  });

  it("accepts thousands separators", () => {
    assert.deepEqual(parseSalary("SDET, $2,500–3,500"), {
      min: 2500,
      max: 3500,
    });
  });

  it("returns undefined when there is no salary", () => {
    assert.equal(
      parseSalary("Middle QA Automation в COAX, віддалено"),
      undefined,
    );
  });

  it("ignores sums that cannot be a monthly salary", () => {
    assert.equal(parseSalary("delivering over $500,000 in aid"), undefined);
  });
});

describe("salaryTop", () => {
  it("prefers the upper bound", () => {
    assert.equal(salaryTop({ min: 2000, max: 2500 }), 2500);
  });

  it("falls back to the lower bound", () => {
    assert.equal(salaryTop({ min: 3000 }), 3000);
  });
});

describe("formatSalary", () => {
  it("formats a range", () => {
    assert.equal(formatSalary({ min: 2500, max: 3500 }), "$2500–3500");
  });

  it("formats bounds", () => {
    assert.equal(formatSalary({ max: 3000 }), "до $3000");
    assert.equal(formatSalary({ min: 3000 }), "от $3000");
  });
});
