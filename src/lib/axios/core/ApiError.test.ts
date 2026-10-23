import { describe, expect, it } from "vitest";
import { ApiError } from "./ApiError";

describe("ApiError", () => {
  it("is an instance of Error and ApiError", () => {
    const err = new ApiError({ message: "boom", status: 500, code: "INTERNAL_SERVER_ERROR" });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ApiError");
  });

  it("preserves message, status, code, data", () => {
    const data = { reason: "x" };
    const err = new ApiError({ message: "nope", status: 400, code: "BAD_REQUEST", data });
    expect(err.message).toBe("nope");
    expect(err.status).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.data).toBe(data);
  });

  it("toString() includes the code and status", () => {
    const err = new ApiError({ message: "fail", status: 401, code: "UNAUTHORIZED" });
    expect(err.toString()).toBe("ApiError [UNAUTHORIZED] (401): fail");
  });

  it("toJSON() returns a plain serializable object", () => {
    const err = new ApiError({ message: "x", status: 404, code: "NOT_FOUND" });
    expect(err.toJSON()).toEqual({
      name: "ApiError",
      message: "x",
      status: 404,
      code: "NOT_FOUND",
      data: null,
    });
  });
});
