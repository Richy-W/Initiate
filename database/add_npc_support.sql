-- Add is_npc field to characters table to support GM-created NPCs

ALTER TABLE characters ADD COLUMN is_npc BOOLEAN DEFAULT FALSE AFTER user_id;