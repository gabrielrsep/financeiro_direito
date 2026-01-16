export default `SELECT SUM(value_paid) as total 
FROM payments 
    WHERE strftime('%m', payment_date) = strftime('%m', 'now') 
    AND strftime('%Y', payment_date) = strftime('%Y', 'now')`