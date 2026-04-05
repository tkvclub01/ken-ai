-- ============================================
-- KEN AI - FIX AUDIT LOG FUNCTION
-- Fix JSONB diff calculation in log_audit_changes()
-- ============================================

-- Drop and recreate the function with proper JSONB diff logic
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB;
  old_data JSONB;
  new_data JSONB;
  key TEXT;
  old_value JSONB;
  new_value JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    changed_fields := new_data;
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changes, performed_by_email)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', NULL, new_data, changed_fields, current_setting('app.current_user_email', true));
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Calculate diff manually by comparing keys
    changed_fields := '{}'::jsonb;
    
    FOR key IN SELECT jsonb_object_keys(new_data)
    LOOP
      old_value := old_data->key;
      new_value := new_data->key;
      
      -- Only include if values are different
      IF old_value IS DISTINCT FROM new_value THEN
        changed_fields := jsonb_set(changed_fields, ARRAY[key], new_value);
      END IF;
    END LOOP;
    
    -- Only log if there are actual changes
    IF changed_fields != '{}'::jsonb THEN
      INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changes, performed_by_email)
      VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', old_data, new_data, changed_fields, current_setting('app.current_user_email', true));
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changes, performed_by_email)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', old_data, NULL, old_data, current_setting('app.current_user_email', true));
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT LOG FUNCTION FIXED! ✅
-- ============================================
