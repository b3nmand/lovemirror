-- Migration: Add/Update fields for partner_invitations to support robust invite/accept flow
ALTER TABLE partner_invitations
  ADD COLUMN IF NOT EXISTS receiver_email text,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add index for code (for fast lookup)
CREATE INDEX IF NOT EXISTS partner_invitations_code_idx ON partner_invitations(code);

-- Add index for receiver_email (for dashboard/status lookup)
CREATE INDEX IF NOT EXISTS partner_invitations_receiver_email_idx ON partner_invitations(receiver_email);

-- Add index for status
CREATE INDEX IF NOT EXISTS partner_invitations_status_idx ON partner_invitations(status);
