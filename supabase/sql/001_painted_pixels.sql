-- Draft schema for painted pixel storage.
-- Chunk size is fixed at 40x40 cells.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.painted_pixels (
  region_id text not null,
  pixel_x integer not null check (pixel_x >= 0),
  pixel_y integer not null check (pixel_y >= 0),
  chunk_x integer generated always as (floor(pixel_x / 40.0)::integer) stored,
  chunk_y integer generated always as (floor(pixel_y / 40.0)::integer) stored,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now(),
  updated_by uuid null,
  constraint painted_pixels_pkey primary key (region_id, pixel_x, pixel_y)
);

create index if not exists painted_pixels_region_chunk_idx
  on public.painted_pixels (region_id, chunk_x, chunk_y);

create index if not exists painted_pixels_region_updated_at_idx
  on public.painted_pixels (region_id, updated_at desc);

drop trigger if exists painted_pixels_set_updated_at on public.painted_pixels;

create trigger painted_pixels_set_updated_at
before update on public.painted_pixels
for each row
execute function public.set_updated_at();

comment on table public.painted_pixels is
  'Stores only painted cells. Empty cells are represented by the absence of a row.';

comment on column public.painted_pixels.region_id is
  'Logical map region identifier. Final naming scheme is still TBD.';

comment on column public.painted_pixels.pixel_x is
  'Absolute cell x coordinate.';

comment on column public.painted_pixels.pixel_y is
  'Absolute cell y coordinate.';

comment on column public.painted_pixels.chunk_x is
  'Generated chunk x coordinate using 40x40 cell chunks.';

comment on column public.painted_pixels.chunk_y is
  'Generated chunk y coordinate using 40x40 cell chunks.';

comment on column public.painted_pixels.color is
  'Hex string color value in #RRGGBB format.';
