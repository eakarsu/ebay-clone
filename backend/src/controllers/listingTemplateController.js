const { pool } = require('../config/database');

// List all templates for current seller
const listTemplates = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name AS category_name
         FROM listing_templates t
         LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
        ORDER BY t.is_default DESC, t.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List templates error:', error.message);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Get one template
const getTemplate = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name AS category_name
         FROM listing_templates t
         LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error.message);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// Create a new template. Accepts either a flat body or {name, categoryId, data}.
const createTemplate = async (req, res) => {
  try {
    const { name, categoryId, isDefault = false, data = {}, ...rest } = req.body;
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    // Merge any top-level listing fields (title, description, etc.) into template_data.
    const templateData = { ...data, ...rest };
    delete templateData.name;
    delete templateData.categoryId;
    delete templateData.isDefault;

    // If marked default, unset the previous default first.
    if (isDefault) {
      await pool.query(
        `UPDATE listing_templates SET is_default = false WHERE user_id = $1 AND is_default = true`,
        [req.user.id]
      );
    }

    const result = await pool.query(
      `INSERT INTO listing_templates (user_id, name, category_id, template_data, is_default)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING *`,
      [req.user.id, name.trim(), categoryId || null, JSON.stringify(templateData), !!isDefault]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error.message);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { name, categoryId, isDefault, data, ...rest } = req.body;

    // Fetch existing row to merge template_data.
    const existing = await pool.query(
      `SELECT * FROM listing_templates WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const mergedData = {
      ...(existing.rows[0].template_data || {}),
      ...(data || {}),
      ...rest
    };
    delete mergedData.name;
    delete mergedData.categoryId;
    delete mergedData.isDefault;

    if (isDefault) {
      await pool.query(
        `UPDATE listing_templates SET is_default = false WHERE user_id = $1 AND id <> $2`,
        [req.user.id, req.params.id]
      );
    }

    const result = await pool.query(
      `UPDATE listing_templates
          SET name = COALESCE($1, name),
              category_id = COALESCE($2, category_id),
              template_data = $3::jsonb,
              is_default = COALESCE($4, is_default),
              updated_at = now()
        WHERE id = $5 AND user_id = $6
        RETURNING *`,
      [name || null, categoryId || null, JSON.stringify(mergedData),
       typeof isDefault === 'boolean' ? isDefault : null,
       req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error.message);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM listing_templates WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error.message);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// Increment usage counter when a seller applies the template.
const applyTemplate = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE listing_templates
          SET usage_count = usage_count + 1, updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Apply template error:', error.message);
    res.status(500).json({ error: 'Failed to apply template' });
  }
};

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate
};
