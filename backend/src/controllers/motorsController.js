// eBay Motors Controller - Vehicles & Parts
const { pool } = require('../config/database');

// ============================================
// VEHICLE LISTINGS
// ============================================

// Create vehicle listing
const createVehicleListing = async (req, res) => {
  try {
    const {
      productId, vin, year, make, model, trimLevel, bodyType,
      engineType, engineSize, fuelType, transmission, drivetrain, horsepower,
      mileage, exteriorColor, interiorColor, numOwners, accidentHistory,
      titleStatus, features
    } = req.body;

    const result = await pool.query(
      `INSERT INTO vehicles
       (product_id, seller_id, vin, year, make, model, trim_level, body_type,
        engine_type, engine_size, fuel_type, transmission, drivetrain, horsepower,
        mileage, exterior_color, interior_color, num_owners, accident_history,
        title_status, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [productId, req.user.id, vin, year, make, model, trimLevel, bodyType,
       engineType, engineSize, fuelType, transmission, drivetrain, horsepower,
       mileage, exteriorColor, interiorColor, numOwners, accidentHistory,
       titleStatus, JSON.stringify(features)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get vehicle by VIN
const getVehicleByVin = async (req, res) => {
  try {
    const { vin } = req.params;

    const result = await pool.query(
      `SELECT v.*, p.title, p.current_price, p.buy_now_price, p.status,
              u.username as seller_name
       FROM vehicles v
       JOIN products p ON v.product_id = p.id
       JOIN users u ON v.seller_id = u.id
       WHERE v.vin = $1`,
      [vin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Decode VIN (simulated - in production would use NHTSA API)
const decodeVin = async (req, res) => {
  try {
    const { vin } = req.params;

    // Validate VIN format (17 characters)
    if (!vin || vin.length !== 17) {
      return res.status(400).json({ error: 'Invalid VIN format' });
    }

    // Simulated VIN decoding - in production, call NHTSA API
    // https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json
    const vinData = {
      vin,
      year: 2020 + Math.floor(Math.random() * 5),
      make: ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes'][Math.floor(Math.random() * 5)],
      model: ['Camry', 'Accord', 'F-150', '3 Series', 'C-Class'][Math.floor(Math.random() * 5)],
      bodyType: 'Sedan',
      engineSize: '2.5L',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      drivetrain: 'FWD',
      manufacturerCountry: 'USA'
    };

    res.json(vinData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get vehicle history report
const getVehicleHistory = async (req, res) => {
  try {
    const { vin } = req.params;

    // Simulated vehicle history - in production, integrate with Carfax/AutoCheck
    const history = {
      vin,
      owners: [
        { ownerNumber: 1, state: 'CA', purchaseDate: '2020-03-15', mileage: 0 },
        { ownerNumber: 2, state: 'TX', purchaseDate: '2022-08-20', mileage: 35000 }
      ],
      accidents: [],
      serviceRecords: [
        { date: '2021-03-15', mileage: 12000, service: 'Oil Change' },
        { date: '2021-09-10', mileage: 24000, service: 'Tire Rotation' },
        { date: '2022-03-20', mileage: 36000, service: 'Major Service' }
      ],
      titleHistory: [
        { date: '2020-03-15', status: 'Clean', state: 'CA' }
      ],
      recalls: [],
      estimatedValue: {
        tradein: 22000,
        private: 25000,
        dealer: 27000
      }
    };

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search vehicles
const searchVehicles = async (req, res) => {
  try {
    const { make, model, yearFrom, yearTo, priceMin, priceMax, mileageMax, bodyType } = req.query;

    let whereClause = `p.status = 'active'`;
    const params = [];
    let paramCount = 0;

    if (make) {
      paramCount++;
      whereClause += ` AND v.make ILIKE $${paramCount}`;
      params.push(`%${make}%`);
    }
    if (model) {
      paramCount++;
      whereClause += ` AND v.model ILIKE $${paramCount}`;
      params.push(`%${model}%`);
    }
    if (yearFrom) {
      paramCount++;
      whereClause += ` AND v.year >= $${paramCount}`;
      params.push(yearFrom);
    }
    if (yearTo) {
      paramCount++;
      whereClause += ` AND v.year <= $${paramCount}`;
      params.push(yearTo);
    }
    if (mileageMax) {
      paramCount++;
      whereClause += ` AND v.mileage <= $${paramCount}`;
      params.push(mileageMax);
    }
    if (bodyType) {
      paramCount++;
      whereClause += ` AND v.body_type = $${paramCount}`;
      params.push(bodyType);
    }

    const result = await pool.query(
      `SELECT v.*, p.title, p.current_price, p.buy_now_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM vehicles v
       JOIN products p ON v.product_id = p.id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT 50`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// PARTS COMPATIBILITY
// ============================================

// Add parts compatibility
const addPartsCompatibility = async (req, res) => {
  try {
    const { productId, compatibleVehicles } = req.body;

    const insertPromises = compatibleVehicles.map(vehicle =>
      pool.query(
        `INSERT INTO vehicle_parts_compatibility
         (product_id, year_from, year_to, make, model, trim_level, engine, submodel, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [productId, vehicle.yearFrom, vehicle.yearTo, vehicle.make, vehicle.model,
         vehicle.trimLevel, vehicle.engine, vehicle.submodel, vehicle.notes]
      )
    );

    const results = await Promise.all(insertPromises);
    res.status(201).json(results.map(r => r.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if part fits vehicle
const checkCompatibility = async (req, res) => {
  try {
    const { productId, year, make, model, trim, engine } = req.query;

    const result = await pool.query(
      `SELECT * FROM vehicle_parts_compatibility
       WHERE product_id = $1
       AND make ILIKE $2
       AND model ILIKE $3
       AND year_from <= $4
       AND (year_to >= $4 OR year_to IS NULL)`,
      [productId, make, model, year]
    );

    const isCompatible = result.rows.length > 0;

    res.json({
      compatible: isCompatible,
      compatibilityInfo: isCompatible ? result.rows[0] : null,
      message: isCompatible
        ? `This part fits your ${year} ${make} ${model}`
        : `This part may not fit your ${year} ${make} ${model}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all compatible vehicles for a part
const getCompatibleVehicles = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT * FROM vehicle_parts_compatibility
       WHERE product_id = $1
       ORDER BY make, model, year_from`,
      [productId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// VEHICLE INSPECTIONS
// ============================================

// Request vehicle inspection
const requestInspection = async (req, res) => {
  try {
    const { vehicleId, inspectionLocation } = req.body;

    const result = await pool.query(
      `INSERT INTO vehicle_inspections
       (vehicle_id, inspection_location, inspection_date)
       VALUES ($1, $2, CURRENT_DATE + INTERVAL '7 days')
       RETURNING *`,
      [vehicleId, inspectionLocation]
    );

    res.status(201).json({
      message: 'Inspection requested successfully',
      inspection: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get inspection report
const getInspectionReport = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const result = await pool.query(
      `SELECT i.*, v.vin, v.year, v.make, v.model
       FROM vehicle_inspections i
       JOIN vehicles v ON i.vehicle_id = v.id
       WHERE i.vehicle_id = $1
       ORDER BY i.inspection_date DESC
       LIMIT 1`,
      [vehicleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No inspection report found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createVehicleListing,
  getVehicleByVin,
  decodeVin,
  getVehicleHistory,
  searchVehicles,
  addPartsCompatibility,
  checkCompatibility,
  getCompatibleVehicles,
  requestInspection,
  getInspectionReport
};
