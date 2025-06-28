-- Add notes widget type to widget_types table
INSERT INTO widget_types (name, display_name, description, icon, category, default_config, is_active)
VALUES (
    'notes',
    'Quick Notes',
    'Capture your thoughts and ideas instantly',
    '📝',
    'productivity',
    '{"maxNotes": 5, "showSearch": true, "showCategories": true, "showStats": true, "compactMode": false}'::jsonb,
    true
) ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    default_config = EXCLUDED.default_config,
    is_active = EXCLUDED.is_active; 