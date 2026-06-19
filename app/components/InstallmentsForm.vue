<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  entityType?: 'service' | 'process',
  isOpen: boolean
  entityId?: number
  total: number
}>()

const emit = defineEmits(['created'])

const downPayment = ref<number>(0)
const installments = ref<number>(1)
const firstDate = ref<string>(new Date().toISOString().split('T')[0]!)

const schedule = computed(() => {
  // use same logic as server util client-side
  const t = Number(props.total || 0)
  const d = Number(downPayment.value || 0)
  const n = Math.max(0, Math.floor(installments.value || 0))
  const arr: { amount: number; movement_date: string }[] = []

  const cents = (v: number) => Math.round(v * 100)
  const fromCents = (c: number) => +(c / 100).toFixed(2)

  const totalC = cents(t)
  const downC = cents(d)
  const remainder = Math.max(0, totalC - downC)
  const perBase = n > 0 ? Math.floor(remainder / n) : remainder
  const distributed = perBase * n
  const leftover = remainder - distributed

  const baseDate = new Date(firstDate.value || new Date().toISOString())

  if (downC > 0) {
    arr.push({ amount: fromCents(downC), movement_date: baseDate.toISOString() })
  }

  for (let i = 0; i < n; i++) {
    const date = new Date(baseDate)
    date.setMonth(date.getMonth() + i + 1)
    let amt = perBase
    if (i === n - 1) amt += leftover
    arr.push({ amount: fromCents(amt), movement_date: date.toISOString() })
  }

  return arr
})

const submit = async () => {
  let targetId = props.entityId

  // Build movements array
  const movements: any[] = []
  for (const s of schedule.value) {
    const mv: any = {
      amount: s.amount,
      movement_date: s.movement_date,
      type: 'charge',
    }
    if (props.entityType === 'service') mv.service_id = targetId
    if (props.entityType === 'process') mv.process_id = targetId
    movements.push(mv)
  }

  emit('created', movements)
}
</script>

<template>
  <div v-if="isOpen" class="grid gap-3">
    <h3 class="text-lg font-semibold">Parcelamento</h3>

    <div>
      <label class="text-sm font-medium">Valor Total (R$)</label>
      <input type="number" :value="total" step="0.01" 
      class="w-full pl-5 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-sm font-medium">Entrada (R$)</label>
        <input type="number" v-model.number="downPayment" step="0.01" class="w-full pl-5 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
      </div>
      <div>
        <label class="text-sm font-medium">Número de parcelas</label>
        <input type="number" v-model.number="installments" min="0" class="w-full pl-5 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
      </div>
    </div>

    <div>
      <label class="text-sm font-medium">Data da 1ª parcela</label>
      <input type="date" v-model="firstDate" class="w-full pl-5 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
    </div>

    <div>
      <label class="text-sm font-medium">Pré-visualização</label>
      <div class="mt-2 max-h-40 overflow-auto border rounded">
        <table class="w-full text-left text-sm">
          <thead class="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"><tr><th class="px-3 py-2">Data</th><th class="px-3 py-2">Valor (R$)</th></tr></thead>
          <tbody>
            <tr v-for="(s, i) in schedule" :key="i" class="border-t">
              <td class="px-3 py-2">{{ new Date(s.movement_date).toLocaleDateString() }}</td>
              <td class="px-3 py-2">{{ s.amount.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
