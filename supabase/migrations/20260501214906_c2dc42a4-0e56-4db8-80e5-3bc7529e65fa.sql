
-- Create 7 PDM accounts via admin. Triggers will create profiles + assign 'pdm' role.
-- Password is a temporary placeholder; PDMs will reset via "forgot password".

DO $$
DECLARE
  pdm RECORD;
  new_user_id uuid;
BEGIN
  FOR pdm IN
    SELECT * FROM (VALUES
      ('conall.doyle@factorial.co',     'Conall Doyle'),
      ('jack.carey@factorial.co',       'Jack Carey'),
      ('magdalena.filipek@factorial.co','Magdalena Filipek'),
      ('fredrick.githendu@factorial.co','Fredrick Githendu'),
      ('nicholas.mahon@factorial.co',   'Nicholas Mahon'),
      ('paolo.urzi@factorial.co',       'Paolo Urzi'),
      ('leon.ribeiro@factorial.co',     'Leon Ribeiro Alves')
    ) AS t(email, display_name)
  LOOP
    -- Skip if already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = pdm.email) THEN
      CONTINUE;
    END IF;

    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      pdm.email,
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', pdm.display_name),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', pdm.email),
      'email', new_user_id::text,
      now(), now(), now()
    );
  END LOOP;
END $$;

-- Reassign partners to Leon Ribeiro
UPDATE public.partners
SET owner_id = (SELECT id FROM auth.users WHERE email = 'leon.ribeiro@factorial.co')
WHERE name IN (
  'Davyn','Primordial'
  -- Note: many others from Leon's list don't exist in DB yet (DGTL, Venn, Portals, Venture Miami,
  -- Herkord, Setyl, VentureCity, Shrimp Society, Rokk3r, StartUP FIU, Puzzle HR, Pratiq, Globalfy)
);

-- Reassign partners to Jack Carey (only those that exist in the DB)
UPDATE public.partners
SET owner_id = (SELECT id FROM auth.users WHERE email = 'jack.carey@factorial.co')
WHERE name IN ('NeaMetrics','Strategix');
-- Note from list not in DB: ERS Biometrics, Sage, SimplePay, Adcorp, TydeCo, Synergerp
