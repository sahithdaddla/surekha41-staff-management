CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emp_id VARCHAR(7) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    training VARCHAR(20) NOT NULL,
    project_status VARCHAR(20) NOT NULL,
    project_name VARCHAR(100),
    UNIQUE(emp_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_emp_id ON employees(emp_id);
CREATE INDEX idx_email ON employees(email);
