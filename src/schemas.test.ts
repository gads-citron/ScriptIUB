import { ValidationError } from "yup";

import { rowSchema } from "./schemas";

describe("rowSchema", () => {
  it("can have string", () => {
    const row = ["", "", "", ""];
    expect(() => {
      rowSchema.validateSync(row);
    }).not.toThrow();
  });

  it("throws if there is no value", () => {
    const row = [null, "", "", ""];
    expect(() => {
      rowSchema.validateSync(row);
    }).toThrowError(ValidationError);
  });
});
