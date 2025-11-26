const { pool } = require('../config/database');

const getAllCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.icon,
              COUNT(DISTINCT p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
       WHERE c.is_active = true AND c.parent_id IS NULL
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`
    );

    res.json({
      categories: result.rows.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.image_url,
        icon: cat.icon,
        productCount: parseInt(cat.product_count),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const catResult = await pool.query(
      `SELECT id, name, slug, description, image_url, icon
       FROM categories WHERE slug = $1 AND is_active = true`,
      [slug]
    );

    if (catResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = catResult.rows[0];

    // Get subcategories
    const subResult = await pool.query(
      `SELECT sc.id, sc.name, sc.slug, sc.description, sc.image_url,
              COUNT(DISTINCT p.id) as product_count
       FROM subcategories sc
       LEFT JOIN products p ON sc.id = p.subcategory_id AND p.status = 'active'
       WHERE sc.category_id = $1 AND sc.is_active = true
       GROUP BY sc.id
       ORDER BY sc.sort_order, sc.name`,
      [category.id]
    );

    res.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.image_url,
        icon: category.icon,
      },
      subcategories: subResult.rows.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        imageUrl: sub.image_url,
        productCount: parseInt(sub.product_count),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getCategoriesWithSubcategories = async (req, res, next) => {
  try {
    const catResult = await pool.query(
      `SELECT id, name, slug, description, image_url, icon
       FROM categories
       WHERE is_active = true AND parent_id IS NULL
       ORDER BY sort_order, name`
    );

    const categories = await Promise.all(
      catResult.rows.map(async (cat) => {
        const subResult = await pool.query(
          `SELECT id, name, slug, description
           FROM subcategories
           WHERE category_id = $1 AND is_active = true
           ORDER BY sort_order, name`,
          [cat.id]
        );

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: cat.image_url,
          icon: cat.icon,
          subcategories: subResult.rows.map(sub => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
          })),
        };
      })
    );

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  getCategoriesWithSubcategories,
};
