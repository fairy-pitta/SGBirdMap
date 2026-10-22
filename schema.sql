-- SGBirdMap の正本。Supabase（削除済み）から D1 へ移したときの定義。
--
-- 粒度は「種 × 日 × 地点」。eBird の historic エンドポイントが返す単位がこれで、
-- 地図の用途（いつ・どこで記録されたか）にはこれで足りる。全チェックリストを
-- 辿ると 1日あたり数十回の追加リクエストが必要になるため採らない。

CREATE TABLE IF NOT EXISTS species (
  species_code TEXT PRIMARY KEY,
  com_name     TEXT NOT NULL,
  sci_name     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS observations (
  -- eBird の subId（チェックリストID）＋種コード。再取り込みしても増えないよう
  -- 自然キーを主キーにする（AUTOINCREMENT だと毎回重複する）。
  id            TEXT PRIMARY KEY,
  species_code  TEXT NOT NULL,
  obs_dt        TEXT NOT NULL,   -- 'YYYY-MM-DD'
  obs_time      TEXT,            -- 'HH:MM'。eBird が時刻を持たない記録は NULL
  how_many      INTEGER,         -- 個体数。未記入（X）は NULL
  lat           REAL NOT NULL,
  lng           REAL NOT NULL,
  location_id   TEXT,
  location_name TEXT,
  obs_valid     INTEGER NOT NULL DEFAULT 1,
  obs_reviewed  INTEGER NOT NULL DEFAULT 0
);

-- 絞り込みは「期間」と「種」の2軸しかない。複合索引で両方を1本で賄う。
CREATE INDEX IF NOT EXISTS idx_obs_species_date ON observations (species_code, obs_dt);
CREATE INDEX IF NOT EXISTS idx_obs_date ON observations (obs_dt);
