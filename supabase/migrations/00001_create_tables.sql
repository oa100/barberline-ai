create extension if not exists "uuid-ossp";

create type call_outcome as enum (
  'booked', 'no_availability', 'fallback', 'hangup', 'info_only'
);

create type booking_status as enum (
  'confirmed', 'cancelled', 'no_show'
);

create table shops (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text not null unique,
  name text not null,
  phone_number text,
  square_token text,
  square_location text,
  vapi_agent_id text,
  timezone text not null default 'America/Chicago',
  greeting text,
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  square_member_id text,
  name text not null,
  active boolean not null default true
);

create table call_logs (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  vapi_call_id text,
  caller_phone text,
  duration_sec integer,
  outcome call_outcome not null,
  transcript jsonb,
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  call_log_id uuid references call_logs(id),
  square_booking_id text,
  customer_name text not null,
  customer_phone text,
  team_member_id uuid references team_members(id),
  service text not null,
  start_time timestamptz not null,
  status booking_status not null default 'confirmed',
  created_at timestamptz not null default now()
);

create index idx_call_logs_shop_id on call_logs(shop_id);
create index idx_call_logs_created_at on call_logs(created_at desc);
create index idx_bookings_shop_id on bookings(shop_id);
create index idx_bookings_start_time on bookings(start_time);
create index idx_team_members_shop_id on team_members(shop_id);

alter table shops enable row level security;
alter table team_members enable row level security;
alter table call_logs enable row level security;
alter table bookings enable row level security;
