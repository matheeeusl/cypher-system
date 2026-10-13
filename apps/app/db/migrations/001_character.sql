-- Saved characters. We store the player's *choices* (the wizard state), not the
-- derived sheet: the sheet is recomputed through graphql-api when opened, so
-- rules fixes apply automatically and `content_versions` can flag "Rules Update".
create table character (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" (id) on delete cascade,
  name text not null,
  -- WizardChoices as sent by the wizard.
  choices jsonb not null,
  -- Denormalized for the list page: { typeName, descriptorName, focusName, tier }.
  summary jsonb not null,
  -- contentVersion of the type/descriptor/focus used: { typeId: "…", … }.
  content_versions jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index character_user_updated_idx on character (user_id, updated_at desc);
