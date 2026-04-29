
-- Partner intelligence: documents, metrics, AI insight runs

-- 1) Documents uploaded for a partner
CREATE TABLE public.partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'other', -- business_plan | sales_data | presentation | contract | notes | other
  description TEXT,
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_documents_partner ON public.partner_documents(partner_id);
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View docs for accessible partners"
ON public.partner_documents FOR SELECT
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_documents.partner_id
    AND (p.owner_id = auth.uid()
         OR private.has_role(auth.uid(), 'leadership'::app_role)
         OR private.has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Insert docs on own partners"
ON public.partner_documents FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Delete docs on own partners"
ON public.partner_documents FOR DELETE
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_documents.partner_id AND p.owner_id = auth.uid()));

CREATE POLICY "Update docs on own partners"
ON public.partner_documents FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_documents.partner_id AND p.owner_id = auth.uid()));

-- 2) Quick metrics about a partner (free-form numbers + notes per period)
CREATE TABLE public.partner_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  user_id UUID NOT NULL,
  period TEXT, -- e.g. "2026-Q1" or "Last 6 months"
  revenue NUMERIC,
  deals_open INTEGER,
  deals_won INTEGER,
  trained_people INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_metrics_partner ON public.partner_metrics(partner_id);
ALTER TABLE public.partner_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View metrics for accessible partners"
ON public.partner_metrics FOR SELECT
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_metrics.partner_id
    AND (p.owner_id = auth.uid()
         OR private.has_role(auth.uid(), 'leadership'::app_role)
         OR private.has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Insert metrics on own partners"
ON public.partner_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Update metrics on own partners"
ON public.partner_metrics FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_metrics.partner_id AND p.owner_id = auth.uid()));

CREATE POLICY "Delete metrics on own partners"
ON public.partner_metrics FOR DELETE
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_metrics.partner_id AND p.owner_id = auth.uid()));

-- 3) AI insight runs (history of generations)
CREATE TABLE public.partner_intel_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  user_id UUID NOT NULL,
  model TEXT NOT NULL,
  input_summary TEXT,
  output JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intel_runs_partner ON public.partner_intel_runs(partner_id);
ALTER TABLE public.partner_intel_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View intel runs for accessible partners"
ON public.partner_intel_runs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_intel_runs.partner_id
    AND (p.owner_id = auth.uid()
         OR private.has_role(auth.uid(), 'leadership'::app_role)
         OR private.has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Insert intel runs on own partners"
ON public.partner_intel_runs FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Delete intel runs on own partners"
ON public.partner_intel_runs FOR DELETE
USING (EXISTS (SELECT 1 FROM public.partners p
  WHERE p.id = partner_intel_runs.partner_id AND p.owner_id = auth.uid()));

-- 4) Storage bucket for partner docs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-docs', 'partner-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files stored under {partner_id}/{filename}
CREATE POLICY "Read partner docs for accessible partners"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'partner-docs'
  AND EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.owner_id = auth.uid()
           OR private.has_role(auth.uid(), 'leadership'::app_role)
           OR private.has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Upload partner docs to own partners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-docs'
  AND EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Delete partner docs from own partners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'partner-docs'
  AND EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);
