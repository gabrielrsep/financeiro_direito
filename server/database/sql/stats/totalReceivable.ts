export default `SELECT
	(
	SELECT
		SUM(value_charged)
	FROM
		processes
	WHERE
		payment_method = 'em_conta'
		AND deleted_at IS NULL) 
	- 
	(
	SELECT
		SUM(pa.amount)
	FROM
		financial_movements pa
	INNER JOIN processes pr ON
		pa.process_id = pr.id
		AND pr.deleted_at IS NULL
	WHERE
		pr.payment_method = 'em_conta'
		AND pa.type = 'payment'
		AND pa.status = 'Pendente') 
AS total;`