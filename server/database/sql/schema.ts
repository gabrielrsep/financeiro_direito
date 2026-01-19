export default `CREATE TABLE IF NOT EXISTS offices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    office_id INTEGER NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL, -- username or email
    ip_address TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    last_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, ip_address)
);
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    document TEXT NOT NULL UNIQUE, -- CPF/CNPJ
    contact TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);
CREATE TABLE IF NOT EXISTS processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    process_number TEXT NOT NULL UNIQUE,
    tribunal TEXT,
    target TEXT, -- O alvo do processo - a outra parte
    description TEXT,
    status TEXT DEFAULT 'Ativo', -- Ativo, Arquivado, Concluido
    value_charged REAL DEFAULT 0,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS office_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Pendente', -- Pendente, Pago
    is_recurrent INTEGER DEFAULT 0, -- 0 = Não, 1 = Sim
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    value_paid REAL NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Pago', -- Pago, Pendente
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
);
CREATE TRIGGER IF NOT EXISTS idx_clients_updated_at AFTER UPDATE ON clients
BEGIN
    UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS idx_processes_updated_at AFTER UPDATE ON processes
BEGIN
    UPDATE processes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS idx_payments_updated_at AFTER UPDATE ON payments
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS idx_office_expenses_updated_at AFTER UPDATE ON office_expenses
BEGIN
    UPDATE office_expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_processes_client_id ON processes(client_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_deleted_at ON processes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_processes_payment_method ON processes(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_process_id ON payments(process_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_office_expenses_deleted_at ON office_expenses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_office_expenses_status ON office_expenses(status);
CREATE INDEX IF NOT EXISTS idx_office_expenses_due_date ON office_expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_users_office_id ON users(office_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);`