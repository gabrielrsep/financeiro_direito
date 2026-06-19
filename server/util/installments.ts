import type { PoolClient } from "@neondatabase/serverless"
import { repeatParms } from "~~/server/database/connection"
import type { User } from '#auth-utils'

type ClientInstallment = {
  value: number
  downPayment: number
  initialPaymentDate: string
}

export async function insertMoviments(connection: PoolClient, forId: number, total_paid: number, user: User, installment?: ClientInstallment) {

  const count = installment?.value || 0
  const downPayment = installment?.downPayment || 0

  if(installment && !installment.initialPaymentDate) {
    throw new Error('No initial payment date provided for installments')
  }
  
  if(downPayment > 0 && count === 0) {
    throw new Error('Operation not allowed')
  }

  if (downPayment > 0) {
    await connection.query(
      `INSERT INTO financial_movements(movement_date, service_id, type, amount, description, office_id) VALUES (CURRENT_TIMESTAMP, ${repeatParms(5)})`,
      [forId, 'payment', downPayment, `Entrada`, user.office_id]
    )
  }

  // 3. Cálculo do valor da parcela (arredondando para 2 casas decimais)
  const remainingValue = total_paid - downPayment
  const p = Math.round((remainingValue / count) * 100) / 100

  // Ajuste para a última parcela não perder centavos por arredondamento
  const lastInstallmentAdjustment = Math.round((remainingValue - (p * count)) * 100) / 100;

  const baseDate = installment ? new Date(installment.initialPaymentDate) : new Date();

  for (let i = 0; i < count; i++) {

    // Evita o bug do dia 31 clonando a data base de forma segura
    const installmentDate = new Date(baseDate.getTime());
    installmentDate.setMonth(baseDate.getMonth() + i);

    // Se o mês estourar (ex: 31 de agosto virar outubro), ajusta para o último dia do mês correto
    if (installmentDate.getDate() !== baseDate.getDate() && i > 0) {
      installmentDate.setDate(0); // Vai para o último dia do mês anterior
    }

    // Na última parcela, adiciona a diferença dos centavos se houver
    const currentInstallmentValue = (i === count - 1) ? (p + lastInstallmentAdjustment) : p;

    await connection.query(
      `INSERT INTO financial_movements(service_id, movement_date, type, amount, description, office_id) VALUES (${repeatParms(6)})`,
      [forId, installmentDate.toISOString(), 'charge', currentInstallmentValue, `parcela ${i + 1}`, user!.office_id]
    )
  }

}