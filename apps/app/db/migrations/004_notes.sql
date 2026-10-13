-- Notes become a list of short entries (a log, newest first) instead of one
-- free-text blob. `character_play.notes` is kept but no longer read: each
-- non-empty old note is carried over as the character's first entry.
create table character_note (
  id bigserial primary key,
  character_id uuid not null references character (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index character_note_character_idx on character_note (character_id, id);

-- Old notes could be up to 20000 characters; entries are limited to 500, so a
-- long one is split into consecutive entries of at most 500 characters.
insert into character_note (character_id, body, created_at)
select p.character_id, substr(p.notes, g.n * 500 + 1, 500), p.updated_at
  from character_play p
  cross join lateral generate_series(0, (char_length(p.notes) - 1) / 500) as g (n)
 where btrim(p.notes) <> ''
 order by p.character_id, g.n;
