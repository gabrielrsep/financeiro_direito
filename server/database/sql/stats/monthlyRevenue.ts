export default `
    SELECT 
        sum(fm.amount) as total
    FROM
        financial_movements fm
    LEFT JOIN processes p ON fm.process_id = p.id
    LEFT JOIN services s ON s.id = fm.service_id
    LEFT JOIN clients c ON fm.client_id = c.id
    WHERE
        (
        p.office_id = ?
        OR c.office_id = ?
        OR s.office_id = ?
        )
    AND fm.type = 'payment'
    AND strftime('%m', fm.movement_date) = strftime('%m', 'now') 
    AND strftime('%Y', fm.movement_date) = strftime('%Y', 'now')
`