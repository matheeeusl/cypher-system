-- Play mode: advancement, per-session state and the XP log.

-- The advancement purchases the engine validates (GraphQL AdvancementPurchaseInput
-- objects, in purchase order). Together with `choices` they define the build.
alter table character add column advancement jsonb not null default '[]';

-- Cached derived pool maximums ({ might, speed, intellect }). Lets pool taps in
-- play mode clamp in SQL without calling graphql-api; refreshed on save,
-- on every advancement purchase, and whenever the play page re-derives.
alter table character add column pool_max jsonb;

-- Live state, one row per character (created lazily). We store points *spent*,
-- not current points: current = max - spent, so a +4 Pool advancement raises
-- the current value on its own.
create table character_play (
  character_id uuid primary key references character (id) on delete cascade,
  spent jsonb not null default '{"might":0,"speed":0,"intellect":0}',
  notes text not null default '',
  inventory jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- Append-only XP ledger. Entries that pay for an advancement are `locked`: they
-- can't be removed on their own, or the log would disagree with the purchases.
create table character_xp_entry (
  id bigserial primary key,
  character_id uuid not null references character (id) on delete cascade,
  kind text not null check (kind in ('gain', 'spend')),
  amount integer not null check (amount > 0 and amount <= 1000),
  reason text not null,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

create index character_xp_entry_character_idx on character_xp_entry (character_id, id);
