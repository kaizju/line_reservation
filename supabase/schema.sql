-- ID Reserve — Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- Design note: the app uses the public "anon" key on the client, which is
-- readable by anyone who opens the site. So instead of granting anon direct
-- INSERT/UPDATE/SELECT on the table, every write and every read goes through
-- a SECURITY DEFINER function below that does exactly one safe thing. RLS on
-- the table itself stays fully locked — nothing touches the table directly.

create table if not exists public.reservations (
  id              text primary key,           -- queue number, e.g. 20260923-001
  token           text not null,               -- pass verification token
  full_name       text not null,
  contact_number  text not null,
  email           text,
  id_type         text not null,
  purpose         text not null,
  preferred_date  date not null,
  preferred_time  text not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'checked-in', 'done')),
  created_at      timestamptz not null default now(),
  scanned_at      timestamptz
);

create table if not exists public.queue_counters (
  day   date primary key,
  count integer not null default 0
);

alter table public.reservations enable row level security;
alter table public.queue_counters enable row level security;
-- No policies are added for anon/authenticated — with RLS on and zero
-- policies, direct table access is fully denied. All access below goes
-- through SECURITY DEFINER functions, which bypass RLS deliberately.

revoke all on public.reservations from anon, authenticated;
revoke all on public.queue_counters from anon, authenticated;

-- ---------------------------------------------------------------------
-- Atomically issue the next queue number for today (e.g. 20260923-003).
create or replace function public.next_queue_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_count integer;
begin
  insert into public.queue_counters (day, count)
  values (v_today, 1)
  on conflict (day) do update set count = public.queue_counters.count + 1
  returning count into v_count;

  return to_char(v_today, 'YYYYMMDD') || '-' || lpad(v_count::text, 3, '0');
end;
$$;

-- ---------------------------------------------------------------------
-- Create a reservation. Returns the full row (the applicant needs it
-- immediately to render their own QR pass).
create or replace function public.create_reservation(
  p_full_name      text,
  p_contact_number text,
  p_email          text,
  p_id_type        text,
  p_purpose        text,
  p_preferred_date date,
  p_preferred_time text
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    text := public.next_queue_number();
  v_token text := md5(v_id || ':' || gen_random_uuid()::text);
  v_row   public.reservations;
begin
  insert into public.reservations
    (id, token, full_name, contact_number, email, id_type, purpose, preferred_date, preferred_time)
  values
    (v_id, v_token, p_full_name, p_contact_number, p_email, p_id_type, p_purpose, p_preferred_date, p_preferred_time)
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Look up a single reservation by id (used by the pass page to poll its
-- own status). Anyone calling this needs to already know the exact id.
create or replace function public.get_reservation(p_id text)
returns public.reservations
language sql
security definer
set search_path = public
as $$
  select * from public.reservations where id = p_id;
$$;

-- ---------------------------------------------------------------------
-- Check a pass in. Requires both the id AND its token (from the QR
-- payload), so scanning is the only way to flip a reservation to
-- "checked-in" — guessing an id alone isn't enough. Returns the row plus
-- an already_checked_in flag so the scanner can tell "just checked in"
-- apart from "this pass was already used" (both leave status unchanged
-- from the caller's point of view, so the flag is the only way to know).
create or replace function public.check_in_reservation(p_id text, p_token text)
returns table (
  id text, token text, full_name text, contact_number text, email text,
  id_type text, purpose text, preferred_date date, preferred_time text,
  status text, created_at timestamptz, scanned_at timestamptz,
  already_checked_in boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.reservations;
  v_already boolean := false;
begin
  select * into v_row from public.reservations r where r.id = p_id and r.token = p_token;

  if not found then
    return;
  end if;

  if v_row.status = 'pending' then
    update public.reservations r
      set status = 'checked-in', scanned_at = now()
      where r.id = p_id
      returning * into v_row;
  else
    v_already := true;
  end if;

  return query select
    v_row.id, v_row.token, v_row.full_name, v_row.contact_number, v_row.email,
    v_row.id_type, v_row.purpose, v_row.preferred_date, v_row.preferred_time,
    v_row.status, v_row.created_at, v_row.scanned_at, v_already;
end;
$$;

-- ---------------------------------------------------------------------
-- Mark a checked-in reservation as done (front-desk finished serving them).
create or replace function public.mark_reservation_done(p_id text)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.reservations;
begin
  update public.reservations
    set status = 'done'
    where id = p_id and status = 'checked-in'
    returning * into v_row;
  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Today's full queue, for the admin list. NOTE: this returns names and
-- phone numbers to anyone who can call it — see README "Before you launch
-- this for real" for why /admin and /scan need a passcode or real auth
-- before this goes further than a single supervised front desk.
create or replace function public.list_today_reservations()
returns setof public.reservations
language sql
security definer
set search_path = public
as $$
  select * from public.reservations
  where preferred_date = current_date or created_at::date = current_date
  order by created_at desc;
$$;

-- ---------------------------------------------------------------------
-- Let the anon (public, client-side) role call the functions above —
-- this is what actually grants access, since the table itself stays locked.
grant execute on function public.next_queue_number()                 to anon;
grant execute on function public.create_reservation(text,text,text,text,text,date,text) to anon;
grant execute on function public.get_reservation(text)                to anon;
grant execute on function public.check_in_reservation(text,text)      to anon;
grant execute on function public.mark_reservation_done(text)          to anon;
grant execute on function public.list_today_reservations()            to anon;
