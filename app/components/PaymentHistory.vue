<script lang="ts" setup>
import { CheckCircle2, Clock } from 'lucide-vue-next';

type Props = {
    payments: Payment[]
    isFullyPaid: boolean
}

const props = defineProps<Props>()

defineEmits<{ action: [PointerEvent] }>()

</script>

<template>
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                <Clock class="w-4 h-4 mr-2" /> Histórico de Lançamentos
            </h3>
            <button v-if="!isFullyPaid" @click="$emit('action', $event)"
                class="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                Adicionar Pagamento
            </button>
        </div>

        <div v-if="!payments || payments.length === 0" class="text-center py-8">
            <p class="text-slate-500 dark:text-slate-400">Nenhum pagamento registrado ainda</p>
        </div>

        <div v-else class="space-y-2">
            <div v-for="payment in payments" :key="payment.id"
                class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <div class="flex items-center gap-3 flex-1">
                    <div :class="[
                        'p-1.5 rounded-lg',
                        payment.type === 'payment' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-amber-100 dark:bg-amber-900/20'
                    ]">
                        <CheckCircle2 v-if="payment.type === 'payment'"
                            class="w-4 h-4 text-green-600 dark:text-green-400" />
                        <Clock v-else class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-slate-900 dark:text-white">
                            {{ formatCurrency(payment.value_paid) }}
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            <span v-if="payment.type === 'payment'">Pago em {{ formatDate(payment.payment_date)
                                }}</span>
                            <span v-else>Vencimento: {{ formatDate(payment.movement_date) }}</span>
                        </p>
                    </div>
                </div>
                <span :class="[
                    'text-xs font-semibold px-2.5 py-0.5 rounded-full',
                    payment.type === 'payment'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                ]">
                    {{ payment.type == 'payment' ? 'Pago' : 'Agendado' }}
                </span>
            </div>
        </div>
    </div>
</template>