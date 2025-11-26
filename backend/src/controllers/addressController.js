const { pool } = require('../config/database');

const getAddresses = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, address_type, is_default, full_name, street_address, street_address_2,
              city, state, postal_code, country, phone, created_at
       FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );

    res.json({
      addresses: result.rows.map(a => ({
        id: a.id,
        addressType: a.address_type,
        isDefault: a.is_default,
        fullName: a.full_name,
        streetAddress: a.street_address,
        streetAddress2: a.street_address_2,
        city: a.city,
        state: a.state,
        postalCode: a.postal_code,
        country: a.country,
        phone: a.phone,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const { addressType, isDefault, fullName, streetAddress, streetAddress2, city, state, postalCode, country, phone } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1 AND address_type = $2',
        [req.user.id, addressType]
      );
    }

    const result = await pool.query(
      `INSERT INTO addresses (user_id, address_type, is_default, full_name, street_address, street_address_2, city, state, postal_code, country, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.user.id, addressType || 'shipping', isDefault || false, fullName, streetAddress, streetAddress2 || null, city, state, postalCode, country || 'United States', phone || null]
    );

    res.status(201).json({
      message: 'Address created',
      address: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { addressType, isDefault, fullName, streetAddress, streetAddress2, city, state, postalCode, country, phone } = req.body;

    // Verify ownership
    const checkResult = await pool.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1 AND address_type = $2 AND id != $3',
        [req.user.id, addressType, id]
      );
    }

    const result = await pool.query(
      `UPDATE addresses SET
        address_type = COALESCE($1, address_type),
        is_default = COALESCE($2, is_default),
        full_name = COALESCE($3, full_name),
        street_address = COALESCE($4, street_address),
        street_address_2 = $5,
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        postal_code = COALESCE($8, postal_code),
        country = COALESCE($9, country),
        phone = $10,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [addressType, isDefault, fullName, streetAddress, streetAddress2, city, state, postalCode, country, phone, id]
    );

    res.json({
      message: 'Address updated',
      address: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };
