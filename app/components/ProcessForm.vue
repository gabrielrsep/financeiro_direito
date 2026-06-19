<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, Check, DollarSign, FileText, Gavel, Loader2, Search, User, Target } from 'lucide-vue-next'
import ClientSelectionModal from '~/components/ClientSelectionModal.vue'
import { useToastStore } from '~/stores/toast'
import { formatCurrency } from '~/utils/formatters'
import { formatPaymentMethod } from '~/utils'

interface Client {
  id: number
  name: string
  document: string
}

interface ProcessFormData {
  id?: number
  client_id: number | null
  client_name?: string
  client_document?: string
  process_number: string
  tribunal: string
  target: string
  description: string
  status: string
  value_charged: number
  payment_method: string
}

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialProcess?: ProcessFormData | null
  isLoading?: boolean
}>(), {
  initialProcess: null,
  isLoading: false
})

const emit = defineEmits<{
  cancel: []
  saved: [number]
}>()

const toastStore = useToastStore()

const processNumber = ref('')
const tribunal = ref('')
const target = ref('')
const description = ref('')
const valueCharged = ref<number>(0)
const paymentMethod = ref('pix')
const status = ref('Ativo')
const selectedClient = ref<Client | null>(null)
const isClientModalOpen = ref(false)
const isSaving = ref(false)

const showInstallments = ref(false)
const installments = ref(0)
const downPayment = ref(0)
const firstDate = ref(new Date().toISOString().split('T').at(0))

const mapStringMonth = (month: number) => {
  const sMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return sMonths[month]
}

const lastCustomFormattedDate = computed(() => {
  const first = new Date(firstDate.value!.replace(/-/g, '/'))
  const currentMonth = first.getMonth()
  first.setMonth(currentMonth + installments.value - 1)

  return first.getDate() + ' de ' + mapStringMonth(first.getMonth()) + ' de ' + first.getFullYear()
})

const peace = computed(() => formatCurrency((valueCharged.value - downPayment.value) / installments.value))

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão de Crédito' },
  { value: 'dinheiro', label: 'Dinheiro' },
]

const statusOptions = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Concluido', label: 'Concluido' },
  { value: 'Arquivado', label: 'Arquivado' },
]

const hydrateForm = () => {
  const proc = props.initialProcess
  processNumber.value = proc?.process_number || ''
  tribunal.value = proc?.tribunal || ''
  target.value = proc?.target || ''
  description.value = proc?.description || ''
  valueCharged.value = Number(proc?.value_charged || 0)
  paymentMethod.value = proc?.payment_method || 'pix'
  status.value = proc?.status || 'Ativo'
  selectedClient.value = proc?.client_id
    ? {
      id: Number(proc.client_id),
      name: proc.client_name || 'Cliente selecionado',
      document: proc.client_document || ''
    }
    : null
}

watch(() => props.initialProcess, hydrateForm, { immediate: true })

const title = computed(() => props.mode === 'edit' ? 'Editar Processo' : 'Novo Processo')
const subtitle = computed(() => props.mode === 'edit'
  ? 'Atualize as informações do processo jurídico.'
  : 'Registre um novo processo no sistema.'
)

const canSubmit = computed(() => {
  return processNumber.value.trim().length > 0 && !!selectedClient.value && Number(valueCharged.value) >= 0
})

const onClientSelected = (client: Client) => {
  selectedClient.value = client
  isClientModalOpen.value = false
}

const submit = async () => {
  if (!canSubmit.value) {
    toastStore.error('Preenchimento obrigatório: número do processo e cliente')
    return
  }

  isSaving.value = true
  try {
    const payload = {
      client_id: selectedClient.value!.id,
      process_number: processNumber.value.trim(),
      tribunal: tribunal.value.trim(),
      target: target.value.trim(),
      description: description.value.trim(),
      value_charged: Number(valueCharged.value),
      payment_method: paymentMethod.value,
      status: status.value
    } as any

    if (props.mode === 'edit' && props.initialProcess?.id) {
      await $fetch(`/api/processes/${props.initialProcess.id}`, {
        method: 'PUT',
        body: payload
      })
      toastStore.success('Processo atualizado com sucesso')
      emit('saved', props.initialProcess.id)
    } else {
      const response = await $fetch<{ success: boolean; data: { id: number } }>('/api/processes', {
        method: 'POST',
        body: payload
      })

      if (showInstallments.value) {
        payload.installments = {
          downPayment: downPayment.value,
          value: installments.value,
          initialPaymentDate: firstDate.value
        }
      }

      toastStore.success('Processo criado com sucesso')
      if (response.data?.id) {
        emit('saved', response.data.id)
      }
    }
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.message || 'Erro ao salvar processo')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
      <button type="button"
        class="inline-flex items-center transition-colors hover:text-slate-900 dark:hover:text-white"
        @click="emit('cancel')">
        <ArrowLeft class="mr-1 h-4 w-4" />
        Voltar para Processos
      </button>
    </div>

    <div
      class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div
            class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white">
            <Gavel class="h-5 w-5" />
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{{ title }}</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
        </div>
      </div>
    </div>

    <form class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" @submit.prevent="submit">
      <div class="space-y-6">
        <!-- Main Form Data Section -->
        <section
          class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Dados do Processo
          </h2>

          <div class="space-y-4">
            <div class="grid gap-2">
              <label class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                Cliente *
              </label>
              <button v-if="!selectedClient" type="button"
                class="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent px-3 py-1 text-left text-sm text-slate-500 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-300"
                @click="isClientModalOpen = true">
                <span>Selecionar cliente...</span>
                <Search class="h-4 w-4" />
              </button>
              <div v-else
                class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <User class="h-4 w-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-slate-900 dark:text-white">{{ selectedClient.name }}</p>
                    <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ selectedClient.document ||
                      'Documento não informado' }}</p>
                  </div>
                </div>
                <button v-if="mode === 'create'" type="button"
                  class="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  @click="selectedClient = null">
                  Alterar
                </button>
              </div>
            </div>

            <div class="grid gap-2">
              <label for="process_number" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                Número do Processo *
              </label>
              <input id="process_number" v-model="processNumber" type="text" placeholder="Ex: 0000000-00.0000.0.00.0000"
                class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2">
                <label for="tribunal" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                  Tribunal
                </label>
                <input id="tribunal" v-model="tribunal" type="text" placeholder="Ex: TJSP - 2ª Vara Cível"
                  class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
              </div>

              <div class="grid gap-2">
                <label for="target" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                  Contra Parte
                </label>
                <input id="target" v-model="target" type="text" placeholder="Ex: Nome da Parte Contrária"
                  class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
              </div>
            </div>

            <div class="grid gap-2">
              <label for="description" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                Descrição do Caso
              </label>
              <textarea id="description" v-model="description" rows="5"
                placeholder="Descreva os detalhes da ação judicial..."
                class="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
            </div>
          </div>
        </section>

        <!-- Financial & Status Section -->
        <section
          class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Condições Financeiras
          </h2>

          <div class="space-y-6">
            <div class="grid gap-2">
              <label for="value_charged" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                Valor Cobrado *
              </label>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="value_charged" v-model.number="valueCharged" type="number" min="0" step="0.01"
                  placeholder="0.00"
                  class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-1 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="grid gap-2">
              <span class="text-sm font-medium leading-none text-slate-900 dark:text-white">Forma de Pagamento</span>
              <div class="grid gap-2 sm:grid-cols-2">
                <button v-for="method in paymentMethods" :key="method.value" type="button" :class="[
                  'flex h-10 items-center justify-between rounded-md border px-3 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300',
                  paymentMethod === method.value
                    ? 'border-slate-900 bg-slate-100 text-slate-900 dark:border-slate-300 dark:bg-slate-800 dark:text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                ]" @click="paymentMethod = method.value">
                  <span class="truncate">{{ method.label }}</span>
                  <Check v-if="paymentMethod === method.value" class="h-4 w-4 flex-shrink-0" />
                </button>
              </div>
            </div>

            <div v-if="mode === 'create'" class="grid gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" v-model="showInstallments"
                  class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:checked:bg-slate-50 dark:focus:ring-slate-300" />
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Este serviço será parcelado
                </span>
              </label>
              <div v-if="showInstallments" class="grid gap-3 animate-in fade-in duration-200">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-sm font-medium">Entrada (R$)</label>
                    <input type="number" v-model.number="downPayment" step="0.01"
                      class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Número de parcelas</label>
                    <input type="number" v-model.number="installments" min="0"
                      class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium">Data da 1ª parcela</label>
                  <input type="date" v-model="firstDate"
                    class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
                </div>
                <div v-if="installments > 0"
                  class="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30 space-y-2">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-500 dark:text-slate-400">Valor das parcelas</span>
                    <span class="font-semibold text-slate-900 dark:text-white">{{ peace }}</span>
                  </div>
                  <div class="flex justify-between items-center text-sm">
                    <label class="text-slate-500 dark:text-slate-400">Última Parcela</label>
                    <label class="font-medium text-slate-700 dark:text-slate-300">{{ lastCustomFormattedDate
                    }}</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Status Section -->
            <div class="grid gap-2">
              <span class="text-sm font-medium leading-none text-slate-900 dark:text-white">Status</span>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="item in statusOptions" :key="item.value" type="button" :class="[
                  'h-10 rounded-md border text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300',
                  status === item.value
                    ? 'border-slate-900 bg-slate-100 text-slate-900 dark:border-slate-300 dark:bg-slate-800 dark:text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                ]" @click="status = item.value">
                  {{ item.label }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="space-y-4">
        <!-- Summary Card -->
        <div
          class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resumo</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-400">Cliente</dt>
              <dd class="max-w-40 truncate text-right font-medium text-slate-900 dark:text-white">
                {{ selectedClient?.name || '-' }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-400">Processo nº</dt>
              <dd class="max-w-40 truncate text-right font-mono text-xs font-medium text-slate-900 dark:text-white">
                {{ processNumber || '-' }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-400">Valor Cobrado</dt>
              <dd class="font-medium text-slate-900 dark:text-white">
                {{ formatCurrency(valueCharged) }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-400">Pagamento</dt>
              <dd class="font-medium text-slate-900 dark:text-white">
                {{paymentMethods.find((m) => m.value === paymentMethod)?.label || '-'}}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-400">Status</dt>
              <dd class="font-medium text-slate-900 dark:text-white">
                {{ status }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Action Card -->
        <div
          class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div class="flex gap-3">
            <button type="button"
              class="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-slate-200 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              @click="emit('cancel')">
              Cancelar
            </button>
            <button type="submit" :disabled="!canSubmit || isSaving || isLoading"
              class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
              <Loader2 v-if="isSaving || isLoading" class="h-4 w-4 animate-spin" />
              <FileText v-else class="h-4 w-4" />
              {{ mode === 'edit' ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </div>
      </aside>
    </form>

    <ClientSelectionModal :isOpen="isClientModalOpen" @close="isClientModalOpen = false" @select="onClientSelected" />
  </div>
</template>
