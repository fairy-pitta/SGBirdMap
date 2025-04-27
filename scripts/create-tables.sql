-- ホットスポットテーブルの作成
CREATE TABLE IF NOT EXISTS hotspots (
  loc_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  subnational1_code TEXT NOT NULL,
  subnational1_name TEXT NOT NULL,
  subnational2_code TEXT,
  subnational2_name TEXT,
  is_hotspot BOOLEAN NOT NULL DEFAULT TRUE,
  num_species_all_time INTEGER,
  latest_obs_dt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 鳥の種テーブルの作成
CREATE TABLE IF NOT EXISTS bird_species (
  species_code TEXT PRIMARY KEY,
  com_name TEXT NOT NULL,
  sci_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 鳥の観測データテーブルの作成
CREATE TABLE IF NOT EXISTS bird_observations (
  id SERIAL PRIMARY KEY,
  species_code TEXT NOT NULL REFERENCES bird_species(species_code),
  com_name TEXT NOT NULL,
  sci_name TEXT NOT NULL,
  loc_id TEXT NOT NULL REFERENCES hotspots(loc_id),
  loc_name TEXT NOT NULL,
  obs_dt TEXT NOT NULL,
  obs_time TEXT,
  how_many INTEGER,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  obs_valid BOOLEAN NOT NULL DEFAULT TRUE,
  obs_reviewed BOOLEAN NOT NULL DEFAULT TRUE,
  location_private BOOLEAN NOT NULL DEFAULT FALSE,
  user_display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(species_code, obs_dt, obs_time, lat, lng)
);

-- 種ごとの観測数を取得するための関数
CREATE OR REPLACE FUNCTION get_species_observation_counts()
RETURNS TABLE (
  species_code TEXT,
  com_name TEXT,
  sci_name TEXT,
  observation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.species_code,
    bs.com_name,
    bs.sci_name,
    COUNT(bo.id) AS observation_count
  FROM 
    bird_species bs
  LEFT JOIN 
    bird_observations bo ON bs.species_code = bo.species_code
  GROUP BY 
    bs.species_code, bs.com_name, bs.sci_name
  ORDER BY 
    observation_count DESC;
END;
$$ LANGUAGE plpgsql;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_bird_observations_species_code ON bird_observations(species_code);
CREATE INDEX IF NOT EXISTS idx_bird_observations_loc_id ON bird_observations(loc_id);
CREATE INDEX IF NOT EXISTS idx_bird_observations_obs_dt ON bird_observations(obs_dt);
CREATE INDEX IF NOT EXISTS idx_hotspots_country_code ON hotspots(country_code);
