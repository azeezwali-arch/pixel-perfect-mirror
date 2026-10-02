CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('frukost','bastu')),
  date date NOT NULL,
  time text NOT NULL,
  room text,
  persons int NOT NULL CHECK (persons > 0),
  guest_name text NOT NULL,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv','avbokad')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX bookings_slot_idx ON public.bookings (type, date, time, room) WHERE status = 'aktiv';

CREATE TABLE public.fault_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL,
  location text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.fault_reports TO service_role;
ALTER TABLE public.fault_reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_booking(
  _type text, _date date, _time text, _room text, _persons int, _guest_name text, _code text
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cap int;
  used int;
  rec public.bookings;
BEGIN
  IF _type = 'frukost' THEN cap := 30; ELSIF _type = 'bastu' THEN cap := 8; ELSE RAISE EXCEPTION 'Ogiltig typ'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_type || _date::text || _time || coalesce(_room,'')));
  SELECT coalesce(sum(persons),0) INTO used FROM public.bookings
    WHERE type=_type AND date=_date AND time=_time AND coalesce(room,'')=coalesce(_room,'') AND status='aktiv';
  IF used + _persons > cap THEN RAISE EXCEPTION 'FULLT'; END IF;
  INSERT INTO public.bookings(type,date,time,room,persons,guest_name,code)
    VALUES (_type,_date,_time,_room,_persons,_guest_name,_code) RETURNING * INTO rec;
  RETURN rec;
END $$;
REVOKE ALL ON FUNCTION public.create_booking FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking TO service_role;