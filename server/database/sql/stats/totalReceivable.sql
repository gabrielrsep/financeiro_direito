-- Calcula o valor total a receber para processos com método de pagamento 'em_conta',
-- subtraindo o total pago (tabela payments) do total cobrado (tabela processes).

SELECT
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
		SUM(pa.value_paid)
	FROM
		payments pa
	INNER JOIN processes pr ON
		pa.process_id = pr.id
		AND pr.deleted_at IS NULL
	WHERE
		pr.payment_method = 'em_conta'
		AND pa.status = 'Pendente') 
AS total;