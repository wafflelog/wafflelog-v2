import { describe, expect, it } from "vitest";

import {
  getDatabaseFileName,
  isSameDatabaseFileName,
} from "./database-path";

describe("getDatabaseFileName", () => {
  it("extracts the database filename from an iOS path", () => {
    expect(
      getDatabaseFileName(
        "/private/var/mobile/Containers/Data/Application/app/Documents/SQLite/wafflelog.db",
      ),
    ).toBe("wafflelog.db");
  });

  it("extracts the database filename from a file URI", () => {
    expect(
      getDatabaseFileName(
        "file:///var/mobile/Containers/Data/Application/app/Documents/SQLite/wafflelog.db",
      ),
    ).toBe("wafflelog.db");
  });
});

describe("isSameDatabaseFileName", () => {
  it("matches the same filename across different iOS path forms", () => {
    expect(
      isSameDatabaseFileName(
        "/private/var/mobile/Containers/Data/Application/app/Documents/SQLite/wafflelog.db",
        "/var/mobile/Containers/Data/Application/app/Documents/SQLite/wafflelog.db",
      ),
    ).toBe(true);
  });

  it("matches the expected filename on Android", () => {
    expect(
      isSameDatabaseFileName(
        "/data/user/0/co.uk.wafflelog/databases/wafflelog.db",
        "/data/data/co.uk.wafflelog/databases/wafflelog.db",
      ),
    ).toBe(true);
  });

  it("rejects a genuinely different database", () => {
    expect(
      isSameDatabaseFileName(
        "/var/mobile/Containers/Data/Application/app/Documents/SQLite/wafflelog.db",
        "/var/mobile/Containers/Data/Application/app/Documents/SQLite/other.db",
      ),
    ).toBe(false);
  });
});
