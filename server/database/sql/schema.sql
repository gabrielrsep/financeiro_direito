PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE offices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL, -- username or email
    ip_address TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    last_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, ip_address)
);
CREATE TABLE processes (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	client_id INTEGER NOT NULL,

	process_number TEXT NOT NULL,

	tribunal TEXT,

	target TEXT,

	description TEXT,

	status TEXT DEFAULT ('Ativo'),

	value_charged REAL DEFAULT (0),

	payment_method TEXT,

	em_conta_details TEXT,

	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	deleted_at DATETIME,

	office_id INTEGER NOT NULL,

	CONSTRAINT FK_processes_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE

);
CREATE TABLE services (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	client_id INTEGER NOT NULL,

	description TEXT NOT NULL,

	value_charged REAL DEFAULT (0) NOT NULL,

	payment_method TEXT,

	em_conta_details TEXT,

	status TEXT DEFAULT ('Pendente'),

	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	deleted_at DATETIME,

	office_id INTEGER NOT NULL,

	CONSTRAINT FK_services_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE

);
CREATE TABLE users (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	username TEXT NOT NULL,

	email TEXT NOT NULL,

	password TEXT NOT NULL,

	avatar_url TEXT,

	name TEXT NOT NULL,

	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	office_id INTEGER,

	CONSTRAINT users_offices_FK FOREIGN KEY (office_id) REFERENCES offices(id)

);
CREATE TABLE office_expenses (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	description TEXT NOT NULL,

	amount REAL NOT NULL,

	due_date DATE NOT NULL,

	status TEXT DEFAULT ('Pendente'),

	is_recurrent INTEGER DEFAULT (0),

	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	deleted_at DATETIME,

	office_id INTEGER NOT NULL,

	CONSTRAINT office_expenses_office_expenses_FK FOREIGN KEY (office_id) REFERENCES office_expenses(id)

);
CREATE TABLE clients (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	name TEXT NOT NULL,

	document TEXT NOT NULL,

	contact TEXT,

	address TEXT,

	is_recurrent INTEGER DEFAULT (0),

	recurrence_value REAL,

	recurrence_day INTEGER,

	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	deleted_at DATETIME,

	office_id INTEGER NOT NULL

);
CREATE TABLE financial_movements (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	process_id INTEGER,

	"type" TEXT NOT NULL,

	amount REAL NOT NULL,

	description TEXT,

	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),

	client_id INTEGER,

	service_id INTEGER, movement_date DATETIME,

	CONSTRAINT FK_financial_movements_processes_2 FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,

	CONSTRAINT financial_movements_clients_FK FOREIGN KEY (client_id) REFERENCES clients(id),

	CONSTRAINT financial_movements_services_FK FOREIGN KEY (service_id) REFERENCES services(id)

);
CREATE TABLE password_recovery_tokens (

	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,

	user_id INTEGER NOT NULL,

	token TEXT NOT NULL,

	expires_at DATETIME NOT NULL,

	CONSTRAINT password_recovery_tokens_users_FK FOREIGN KEY (user_id) REFERENCES users(id)

);
CREATE TABLE password_recovery_attempts (

	id INTEGER PRIMARY KEY AUTOINCREMENT,

	email TEXT NOT NULL,

	attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,

	created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);
PRAGMA writable_schema=ON;
CREATE TABLE IF NOT EXISTS sqlite_sequence(name,seq);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('offices',28);
INSERT INTO sqlite_sequence VALUES('payments',80);
INSERT INTO sqlite_sequence VALUES('login_attempts',5);
INSERT INTO sqlite_sequence VALUES('processes',57);
INSERT INTO sqlite_sequence VALUES('services',16);
INSERT INTO sqlite_sequence VALUES('users',60);
INSERT INTO sqlite_sequence VALUES('office_expenses',25);
INSERT INTO sqlite_sequence VALUES('clients',65);
INSERT INTO sqlite_sequence VALUES('financial_movements',101);
CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_services_client_id ON services (client_id);
CREATE INDEX idx_services_created_at ON services (created_at);
CREATE INDEX idx_services_deleted_at ON services (deleted_at);
CREATE INDEX idx_services_status ON services (status);
CREATE UNIQUE INDEX password_recovery_tokens_token_IDX ON password_recovery_tokens (token);
CREATE INDEX idx_password_recovery_attempts_email_time 

ON password_recovery_attempts(email, attempted_at);
CREATE INDEX idx_password_recovery_attempts_created_at 

ON password_recovery_attempts(created_at);
PRAGMA writable_schema=OFF;
COMMIT;
