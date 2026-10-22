import { describe, expect, it } from "vitest";
import {
  buildObservationsQuery,
  clampLimit,
  DEFAULT_LIMIT,
  isDate,
  MAX_LIMIT,
} from "../query";

describe("clampLimit", () => {
  it("test_clamp_limit_without_value_returns_default", () => {
    expect(clampLimit(null)).toBe(DEFAULT_LIMIT);
  });

  it("test_clamp_limit_above_maximum_returns_maximum", () => {
    expect(clampLimit("999999")).toBe(MAX_LIMIT);
  });

  it("test_clamp_limit_with_non_numeric_returns_default", () => {
    expect(clampLimit("all")).toBe(DEFAULT_LIMIT);
  });

  it("test_clamp_limit_with_zero_or_negative_returns_default", () => {
    expect(clampLimit("0")).toBe(DEFAULT_LIMIT);
    expect(clampLimit("-5")).toBe(DEFAULT_LIMIT);
  });

  it("test_clamp_limit_with_valid_value_returns_that_value", () => {
    expect(clampLimit("120")).toBe(120);
  });

  it("test_clamp_limit_default_covers_one_species_over_the_whole_archive", () => {
    // 粒度は 種×日 なので、1種の最大件数は 2003-01-01 以降の日数（約8,700）。
    // 既定値がこれを下回ると、全期間表示が黙って切れる。
    const daysSince2003 = Math.ceil(
      (Date.parse("2026-10-19") - Date.parse("2003-01-01")) / 86_400_000
    );
    expect(DEFAULT_LIMIT).toBeGreaterThan(daysSince2003);
  });
});

describe("isDate", () => {
  it("test_is_date_with_iso_date_returns_true", () => {
    expect(isDate("2026-10-19")).toBe(true);
  });

  it("test_is_date_with_other_formats_returns_false", () => {
    for (const bad of ["2026/10/19", "19-10-2026", "2026-10", "", "' OR 1=1 --"]) {
      expect(isDate(bad)).toBe(false);
    }
  });
});

describe("buildObservationsQuery", () => {
  it("test_build_query_without_filters_has_no_where_clause", () => {
    const { sql, binds } = buildObservationsQuery({});

    expect(sql).not.toContain("WHERE");
    expect(binds).toEqual([DEFAULT_LIMIT]);
  });

  it("test_build_query_with_every_filter_orders_binds_to_match_sql", () => {
    const { sql, binds } = buildObservationsQuery({
      species: "redjun",
      start: "2026-01-01",
      end: "2026-12-31",
      limit: "100",
    });

    expect(sql).toContain(
      "WHERE o.species_code = ? AND o.obs_dt >= ? AND o.obs_dt <= ?"
    );
    // SQL の ? の数と値の数が一致していなければ D1 が実行時に落ちる。
    expect(sql.split("?").length - 1).toBe(binds.length);
    expect(binds).toEqual(["redjun", "2026-01-01", "2026-12-31", 100]);
  });

  it("test_build_query_with_only_species_binds_species_then_limit", () => {
    const { sql, binds } = buildObservationsQuery({ species: "whbsea" });

    expect(sql).toContain("WHERE o.species_code = ?");
    expect(binds).toEqual(["whbsea", DEFAULT_LIMIT]);
  });

  it("test_build_query_with_only_end_date_omits_start_condition", () => {
    const { sql, binds } = buildObservationsQuery({ end: "2026-06-30" });

    expect(sql).toContain("WHERE o.obs_dt <= ?");
    expect(sql).not.toContain(">=");
    expect(binds).toEqual(["2026-06-30", DEFAULT_LIMIT]);
  });

  it("test_build_query_always_ends_with_ordered_limit", () => {
    const { sql } = buildObservationsQuery({ species: "redjun" });

    expect(sql.endsWith("ORDER BY o.obs_dt LIMIT ?")).toBe(true);
  });
});
