import { describe, expect, it } from "vitest";
import { isUsable, rowId, splitObsDt, type RawObservation } from "../ingest";

const base: RawObservation = {
  speciesCode: "yevbul1",
  comName: "Yellow-vented Bulbul",
  sciName: "Pycnonotus goiavier",
  locId: "L5878876",
  locName: "Kent Ridge Park",
  obsDt: "2026-10-19 10:58",
  howMany: 2,
  lat: 1.2829977,
  lng: 103.7914353,
  subId: "S403619139",
};

describe("rowId", () => {
  it("test_row_id_with_sub_id_combines_checklist_and_species", () => {
    expect(rowId(base, "2026-10-19")).toBe("S403619139:yevbul1");
  });

  it("test_row_id_without_sub_id_falls_back_to_date_and_location", () => {
    const { subId, ...noSub } = base;

    expect(rowId(noSub, "2026-10-19")).toBe("2026-10-19:L5878876:yevbul1");
  });

  it("test_row_id_without_sub_id_or_location_still_returns_a_stable_key", () => {
    const { subId, locId, ...bare } = base;

    expect(rowId(bare, "2026-10-19")).toBe("2026-10-19:?:yevbul1");
  });

  it("test_row_id_for_two_species_in_one_checklist_differs", () => {
    const other = { ...base, speciesCode: "blnori1" };

    expect(rowId(base, "2026-10-19")).not.toBe(rowId(other, "2026-10-19"));
  });
});

describe("splitObsDt", () => {
  it("test_split_obs_dt_with_time_returns_both_parts", () => {
    expect(splitObsDt("2026-10-19 10:58")).toEqual({ date: "2026-10-19", time: "10:58" });
  });

  it("test_split_obs_dt_without_time_returns_null_time", () => {
    expect(splitObsDt("2026-10-19")).toEqual({ date: "2026-10-19", time: null });
  });
});

describe("isUsable", () => {
  it("test_is_usable_with_species_and_coordinates_returns_true", () => {
    expect(isUsable(base)).toBe(true);
  });

  it("test_is_usable_without_species_code_returns_false", () => {
    expect(isUsable({ ...base, speciesCode: "" })).toBe(false);
  });

  it("test_is_usable_with_non_numeric_coordinates_returns_false", () => {
    expect(isUsable({ ...base, lat: NaN })).toBe(false);
    expect(isUsable({ ...base, lng: undefined as unknown as number })).toBe(false);
  });
});
