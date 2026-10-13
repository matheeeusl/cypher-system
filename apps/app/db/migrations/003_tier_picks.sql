-- Level-up choices made after character creation: the Type abilities picked on
-- reaching tier 2+ and the Focus choice offered at a tier (e.g. tier 3).
-- Shape: { "type": { "2": ["ability-id", …] }, "focus": { "3": ["ability-id", …] } }
-- (keys are tiers). Together with `choices` and `advancement` they define the build.
alter table character add column tier_picks jsonb not null default '{"type":{},"focus":{}}';
