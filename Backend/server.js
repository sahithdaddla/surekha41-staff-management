const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3605;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
});

// Input validation functions
const validateEmployeeId = (empId) => {
    return /^ATS0\d{3}$/.test(empId) && empId !== 'ATS0000';
};

const validateEmail = (email) => {
    return /^[a-zA-Z0-9][a-zA-Z0-9._]{4,}@astrolitetech\.com$/.test(email);
};

const validateName = (name) => {
    return /^[A-Za-z]+( [A-Za-z]+)*$/.test(name) && name.replace(/[^a-zA-Z]/g, '').length >= 5;
};

const validateRole = (role) => {
    return /^[A-Za-z]+( [A-Za-z]+)*$/.test(role) && role.replace(/[^a-zA-Z]/g, '').length >= 3;
};

const validateProjectName = (projectName) => {
    if (!projectName) return true;
    return /^[A-Za-z]+( [A-Za-z]+)*$/.test(projectName) && projectName.replace(/[^a-zA-Z]/g, '').length >= 5;
};

const validateDate = (dateStr) => {
    const selectedDate = new Date(dateStr);
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    return selectedDate <= today && selectedDate >= threeMonthsAgo;
};

// Routes
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/employees/:empId', async (req, res) => {
    try {
        const { empId } = req.params;
        const result = await pool.query('SELECT * FROM employees WHERE emp_id = $1', [empId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/employees', async (req, res) => {
    const { name, empId, email, role, joiningDate, training, projectStatus, projectName } = req.body;

    // Validation
    if (!validateName(name)) {
        return res.status(400).json({ error: 'Invalid name format' });
    }
    if (!validateEmployeeId(empId)) {
        return res.status(400).json({ error: 'Invalid employee ID format' });
    }
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!validateRole(role)) {
        return res.status(400).json({ error: 'Invalid role format' });
    }
    if (!validateDate(joiningDate)) {
        return res.status(400).json({ error: 'Invalid joining date' });
    }
    if (projectStatus === 'in-project' && !validateProjectName(projectName)) {
        return res.status(400).json({ error: 'Invalid project name format' });
    }

    try {
        // Check for duplicate employee ID
        const existingEmp = await pool.query('SELECT id FROM employees WHERE emp_id = $1', [empId]);
        if (existingEmp.rows.length > 0) {
            return res.status(400).json({ error: 'Employee ID already exists' });
        }

        const result = await pool.query(
            `INSERT INTO employees (name, emp_id, email, role, joining_date, training, project_status, project_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, empId, email, role, joiningDate, training, projectStatus, projectName || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/employees/:empId', async (req, res) => {
    const { empId } = req.params;
    const { name, email, role, joiningDate, training, projectStatus, projectName } = req.body;

    // Validation
    if (!validateName(name)) {
        return res.status(400).json({ error: 'Invalid name format' });
    }
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!validateRole(role)) {
        return res.status(400).json({ error: 'Invalid role format' });
    }
    if (!validateDate(joiningDate)) {
        return res.status(400).json({ error: 'Invalid joining date' });
    }
    if (projectStatus === 'in-project' && !validateProjectName(projectName)) {
        return res.status(400).json({ error: 'Invalid project name format' });
    }

    try {
        const result = await pool.query(
            `UPDATE employees 
             SET name = $1, email = $2, role = $3, joining_date = $4, training = $5, 
                 project_status = $6, project_name = $7
             WHERE emp_id = $8 RETURNING *`,
            [name, email, role, joiningDate, training, projectStatus, projectName || null, empId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/employees/:empId', async (req, res) => {
    try {
        const { empId } = req.params;
        const result = await pool.query('DELETE FROM employees WHERE emp_id = $1 RETURNING *', [empId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});