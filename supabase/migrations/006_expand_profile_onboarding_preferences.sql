-- Expand profile onboarding fields for richer personalization.

alter table public.profiles
  add column if not exists brew_frequency text,
  add column if not exists roast_preference text,
  add column if not exists onboarding_goal text,
  add column if not exists flavor_notes text[] not null default '{}'::text[],
  add column if not exists preferred_origins text[] not null default '{}'::text[],
  add column if not exists log_reminders boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_brew_frequency_check,
  add constraint profiles_brew_frequency_check
  check (
    brew_frequency is null
    or brew_frequency in (
      'Daily',
      'Multiple times daily',
      'A few times a week',
      'Weekends mostly',
      'Occasionally'
    )
  );

alter table public.profiles
  drop constraint if exists profiles_roast_preference_check,
  add constraint profiles_roast_preference_check
  check (
    roast_preference is null
    or roast_preference in ('Light', 'Medium', 'Dark', 'No preference')
  );

alter table public.profiles
  drop constraint if exists profiles_onboarding_goal_check,
  add constraint profiles_onboarding_goal_check
  check (
    onboarding_goal is null
    or onboarding_goal in (
      'Track favorites',
      'Discover new beans',
      'Improve brewing',
      'Keep a coffee journal'
    )
  );

alter table public.profiles
  drop constraint if exists profiles_flavor_notes_count_check,
  add constraint profiles_flavor_notes_count_check
  check (cardinality(flavor_notes) <= 3);

alter table public.profiles
  drop constraint if exists profiles_preferred_origins_count_check,
  add constraint profiles_preferred_origins_count_check
  check (cardinality(preferred_origins) <= 3);
