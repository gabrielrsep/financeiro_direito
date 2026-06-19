<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, Check, DollarSign, FileText, Loader2, Search, User } from 'lucide-vue-next'
import ClientSelectionModal from '~/components/ClientSelectionModal.vue'
import { useToastStore } from '~/stores/toast'

interface Client {
  id: number
  name: string
  document: string
}

interface ServiceFormData {
  id?: number
  client_id?: number
  client_name?: string
  client_document?: string
  description: string
  value_charged: number
  payment_method: string
  status?: string
}


const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialService?: ServiceFormData | null
  isLoading?: boolean
}>(), {
  initialService: null,
  isLoading: false
})

const emit = defineEmits<{
  cancel: []
  saved: [number]
}>()

const toastStore = useToastStore()

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
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
]

const hydrateForm = () => {
  const service = props.initialService
  description.value = service?.description || ''
  valueCharged.value = Number(service?.value_charged || 0)
  paymentMethod.value = service?.payment_method || 'pix'
  status.value = service?.status || 'Ativo'
  selectedClient.value = service?.client_id
    ? {
      id: Number(service.client_id),
      name: service.client_name || 'Cliente selecionado',
      document: service.client_document || ''
    }
    : null
}

watch(() => props.initialService, hydrateForm, { immediate: true })

const title = computed(() => props.mode === 'edit' ? 'Editar serviço' : 'Novo serviço')
const subtitle = computed(() => props.mode === 'edit'
  ? 'Atualize as informacoes do serviço prestado.'
  : 'Registre um novo serviço prestado ao cliente.'
)

const canSubmit = computed(() => {
  return description.value.trim().length > 0 && !!selectedClient.value && Number(valueCharged.value) > 0
})

const onClientSelected = (client: Client) => {
  selectedClient.value = client
  isClientModalOpen.value = false
}

const submit = async () => {
  if (!canSubmit.value) {
    toastStore.error('Preenchimento obrigatorio: descricao, cliente e valor')
    return
  }

  isSaving.value = true
  try {
    if (props.mode === 'edit' && props.initialService?.id) {
      await $fetch(`/api/services/${props.initialService.id}`, {
        method: 'PUT',
        body: {
          description: description.value.trim(),
          value_charged: Number(valueCharged.value),
          payment_method: paymentMethod.value,
          status: status.value
        }
      })
      toastStore.success('Serviço atualizado com sucesso')
    } else {
      const postBody: any = {
        client_id: selectedClient.value!.id,
        description: description.value.trim(),
        value_charged: Number(valueCharged.value),
        payment_method: paymentMethod.value
      }

      if (showInstallments.value) {
        postBody.installments = {
          downPayment: downPayment.value,
          value: installments.value,
          initialPaymentDate: firstDate.value
        }
      }

      const response = await $fetch<{ success: boolean; data: { id: number } }>('/api/services', {
        method: 'POST',
        body: postBody
      })
      toastStore.success('Serviço criado com sucesso')

      if (response.data.id) {
        emit('saved', response.data.id)
      }
      
    }
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.message || 'Erro ao salvar serviço')
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
        Voltar para Serviços
      </button>
    </div>

    <div
      class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div
            class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white">
            <FileText class="h-5 w-5" />
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{{ title }}</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
        </div>
      </div>
    </div>

    <form class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" @submit.prevent="submit">
      <div class="space-y-6">
        <section
          class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Dados do serviço
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
                      'Documento nao informado' }}</p>
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
              <label for="description" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                Descriçao do serviço *
              </label>
              <textarea id="description" v-model="description" rows="6" placeholder="Descreva o serviço prestado..."
                class="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
            </div>

            <div class="grid gap-2">
              <label for="value_charged" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                Valor cobrado *
              </label>
              <div class="relative">
                <DollarSign class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="value_charged" v-model.number="valueCharged" type="number" min="0" step="0.01"
                  placeholder="0.00"
                  class="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-1 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300" />
              </div>
            </div>
          </div>
        </section>

        <section
          class="rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Condicoes financeiras
          </h2>

          <div class="space-y-4">
            <div class="grid gap-2">
              <span class="text-sm font-medium leading-none text-slate-900 dark:text-white">Forma de pagamento</span>
              <div class="grid gap-2 sm:grid-cols-2">
                <button v-for="method in paymentMethods" :key="method.value" type="button" :class="[
                  'flex h-10 items-center justify-between rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300',
                  paymentMethod === method.value
                    ? 'border-slate-900 bg-slate-100 text-slate-900 dark:border-slate-300 dark:bg-slate-800 dark:text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                ]" @click="paymentMethod = method.value">
                  <span>{{ method.label }}</span>
                  <Check v-if="paymentMethod === method.value" class="h-4 w-4" />
                </button>
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
            </div>


            <div v-if="mode === 'edit'" class="grid gap-2">
              <span class="text-sm font-medium leading-none text-slate-900 dark:text-white">Status</span>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="item in ['Ativo', 'Inativo']" :key="item" type="button" :class="[
                  'h-10 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300',
                  status === item
                    ? 'border-slate-900 bg-slate-100 text-slate-900 dark:border-slate-300 dark:bg-slate-800 dark:text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                ]" @click="status = item">
                  {{ item }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="space-y-4">
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
              <dt class="text-slate-500 dark:text-slate-400">Valor</dt>
              <dd class="font-medium text-slate-900 dark:text-white">
                {{ formatCurrency(valueCharged) }}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-400">Pagamento</dt>
              <dd class="font-medium text-slate-900 dark:text-white">
                {{paymentMethods.find((method) => method.value === paymentMethod)?.label}}
              </dd>
            </div>
            <div v-if="mode === 'create' && installments > 0" class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-400">Parcelamento</dt>
              <dd class="font-medium text-slate-900 dark:text-white">
                {{ installments + 'x de ' + peace }}
              </dd>
            </div>
          </dl>
        </div>

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
