-- Dashboard analytics functions.
-- These aggregate data server-side and only read rows owned by auth.uid().

drop function if exists public.dashboard_summary(timestamptz, timestamptz);
drop function if exists public.dashboard_activity(integer);
drop function if exists public.dashboard_method_mix(integer, timestamptz, timestamptz);
drop function if exists public.dashboard_taste_profile(timestamptz, timestamptz);
drop function if exists public.dashboard_top_origins(integer, timestamptz, timestamptz);

create function public.dashboard_summary(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  total bigint,
  average_score numeric,
  completed_this_week bigint,
  recent_average numeric,
  previous_average numeric,
  top_roaster text,
  top_overall smallint,
  top_method text,
  recent_roaster text,
  recent_created_at timestamptz
)
language sql
stable
as $$
with scoped as (
  select *
  from public.sipps
  where user_id = auth.uid()
    and (p_from is null or created_at >= p_from)
    and (p_to is null or created_at <= p_to)
),
recent_window as (
  select overall
  from scoped
  order by created_at desc
  limit 5
),
previous_window as (
  select overall
  from scoped
  order by created_at desc
  offset 5
  limit 5
),
top_sipp as (
  select roaster, overall, method
  from scoped
  order by overall desc, created_at desc
  limit 1
),
recent_sipp as (
  select roaster, created_at
  from scoped
  order by created_at desc
  limit 1
)
select
  count(*)::bigint as total,
  coalesce(round(avg(overall)::numeric, 0), 0)::numeric as average_score,
  count(*) filter (where created_at >= now() - interval '7 days')::bigint as completed_this_week,
  coalesce((select round(avg(overall)::numeric, 0) from recent_window), 0)::numeric as recent_average,
  coalesce((select round(avg(overall)::numeric, 0) from previous_window), 0)::numeric as previous_average,
  (select roaster from top_sipp) as top_roaster,
  (select overall from top_sipp) as top_overall,
  (select method from top_sipp) as top_method,
  (select roaster from recent_sipp) as recent_roaster,
  (select created_at from recent_sipp) as recent_created_at
from scoped;
$$;

create function public.dashboard_activity(
  p_days integer default 7
)
returns table (
  day_date date,
  count bigint,
  average_score numeric
)
language sql
stable
as $$
with bounds as (
  select greatest(coalesce(p_days, 7), 1) as days
),
series as (
  select (current_date - (days - 1) + idx)::date as day_date
  from bounds,
  generate_series(0, (select days - 1 from bounds)) as idx
),
scoped as (
  select *
  from public.sipps
  where user_id = auth.uid()
    and created_at >= (current_date - ((select days - 1 from bounds) * interval '1 day'))
)
select
  s.day_date,
  count(sc.id)::bigint as count,
  coalesce(round(avg(sc.overall)::numeric, 0), 0)::numeric as average_score
from series s
left join scoped sc
  on sc.created_at >= s.day_date::timestamptz
 and sc.created_at < (s.day_date::timestamptz + interval '1 day')
group by s.day_date
order by s.day_date asc;
$$;

create function public.dashboard_method_mix(
  p_limit integer default 4,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  method text,
  count bigint,
  average_score numeric,
  share numeric
)
language sql
stable
as $$
with scoped as (
  select *
  from public.sipps
  where user_id = auth.uid()
    and (p_from is null or created_at >= p_from)
    and (p_to is null or created_at <= p_to)
),
aggregated as (
  select
    method,
    count(*)::bigint as count,
    coalesce(round(avg(overall)::numeric, 0), 0)::numeric as average_score
  from scoped
  group by method
),
ranked as (
  select
    method,
    count,
    average_score,
    coalesce(round((count::numeric / nullif(sum(count) over (), 0)) * 100, 0), 0)::numeric as share
  from aggregated
)
select
  method,
  count,
  average_score,
  share
from ranked
order by count desc, average_score desc
limit greatest(coalesce(p_limit, 4), 1);
$$;

create function public.dashboard_taste_profile(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  aroma numeric,
  flavor numeric,
  acidity numeric,
  body numeric,
  aftertaste numeric
)
language sql
stable
as $$
with scoped as (
  select *
  from public.sipps
  where user_id = auth.uid()
    and (p_from is null or created_at >= p_from)
    and (p_to is null or created_at <= p_to)
)
select
  coalesce(round(avg(aroma)::numeric, 1), 0)::numeric as aroma,
  coalesce(round(avg(flavor)::numeric, 1), 0)::numeric as flavor,
  coalesce(round(avg(acidity)::numeric, 1), 0)::numeric as acidity,
  coalesce(round(avg(body)::numeric, 1), 0)::numeric as body,
  coalesce(round(avg(aftertaste)::numeric, 1), 0)::numeric as aftertaste
from scoped;
$$;

create function public.dashboard_top_origins(
  p_limit integer default 3,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  origin text,
  count bigint,
  average_score numeric
)
language sql
stable
as $$
with scoped as (
  select *
  from public.sipps
  where user_id = auth.uid()
    and (p_from is null or created_at >= p_from)
    and (p_to is null or created_at <= p_to)
)
select
  origin,
  count(*)::bigint as count,
  coalesce(round(avg(overall)::numeric, 0), 0)::numeric as average_score
from scoped
group by origin
order by average_score desc, count desc
limit greatest(coalesce(p_limit, 3), 1);
$$;

grant execute on function public.dashboard_summary(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_activity(integer) to authenticated;
grant execute on function public.dashboard_method_mix(integer, timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_taste_profile(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_top_origins(integer, timestamptz, timestamptz) to authenticated;
