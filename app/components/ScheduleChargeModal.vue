<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, DollarSign, Calendar, Link2, ChevronDown } from 'lucide-vue-next'
import ClientSelectionModal from '~/components/ClientSelectionModal.vue'
import ProcessSelectionModal from '~/components/ProcessSelectionModal.vue'
import ServiceSelectionModal from '~/components/ServiceSelectionModal.vue'
import { useToastStore } from '~/stores/toast'

interface Props {
  isOpen: boolean
}

interface LinkedEntity {
  type: 'process' | 'service' | 'client'
  id: number
  label: string
}

const toastStore = useToastStore()

const props = defineProps<Props>()
const emit = defineEmits(['close', 'created'])

const amount = ref<number>(0)
const movementDate = ref(new Date().toISOString().split('T')[0])
const description = ref('')
const linkedEntity = ref<LinkedEntity | null>(null)
const isLoading = ref(false)
const showLinkSelector = ref(false)
const isClientModalOpen = ref(false)
const isProcessModalOpen = ref(false)
const isServiceModalOpen = ref(false)

const closeModal = () => {
    amount.value = 0
    movementDate.value = new Date().toISOString().split('T')[0]
    description.value = ''
    linkedEntity.value = null
    showLinkSelector.value = false
    emit('close')
}

const canSubmit = computed(() => {
    return amount.value > 0 && movementDate.value && linkedEntity.value
})

const saveSchedule = async () => {
    if (!canSubmit.value) {
        toastStore.error('Preencha o valor, data e entidade vinculada')
        return
    }

    isLoading.value = true
    try {
        const body: any = {
            amount: amount.value,
            movement_date: movementDate.value,
            description: description.value || null
        }

        // Add the appropriate entity ID
        if (linkedEntity.value) {
            if (linkedEntity.value.type === 'process') {
                body.process_id = linkedEntity.value.id
            } else if (linkedEntity.value.type === 'service') {
                body.service_id = linkedEntity.value.id
            } else if (linkedEntity.value.type === 'client') {
                body.client_id = linkedEntity.value.id
            }
        }

        await $fetch('/api/schedules', {
            method: 'POST',
            body
        })

        toastStore.success('Pagamento agendado com sucesso')
        emit('created')
        closeModal()
    } catch (error: any) {
        console.error('Erro ao agendar pagamento:', error)
        toastStore.error(error.message || 'Erro ao agendar pagamento')
    } finally {
        isLoading.value = false
    }
}

const selectEntity = (entity: LinkedEntity) => {
    linkedEntity.value = entity
    showLinkSelector.value = false
}

const onClientSelected = (client: any) => {
    selectEntity({ type: 'client', id: client.id, label: client.name })
    isClientModalOpen.value = false
}

const onProcessSelected = (process: any) => {
    selectEntity({ type: 'process', id: process.id, label: `${process.process_number} — ${process.client_name}` })
    isProcessModalOpen.value = false
}

const onServiceSelected = (service: any) => {
    selectEntity({ type: 'service', id: service.id, label: `${service.description} — ${service.client_name}` })
    isServiceModalOpen.value = false
}

const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        'process': 'Processo',
        'service': 'Serviço',
        'client': 'Cliente'
    }
    return labels[type] || type
}
</script>

<template>
    <div v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        @click.self="closeModal">
        <div class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
            <div class="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex justify-between items-center">
                    <h3 class="font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-white">
                        Agendar Pagamento
                    </h3>
                    <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X class="h-4 w-4" />
                    </button>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Registre uma cobrança a ser paga em data futura.
                </p>
            </div>

            <div class="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div class="grid gap-2">
                    <label for="amount" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Valor <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <DollarSign class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input id="amount" type="number" step="0.01" v-model.number="amount"
                            class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white" 
                            placeholder="0,00" />
                    </div>
                </div>

                <div class="grid gap-2">
                    <label for="movement_date" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Data do Agendamento <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <Calendar class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input id="movement_date" type="date" v-model="movementDate"
                            class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white" />
                    </div>
                </div>

                <div class="grid gap-2">
                    <label class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Vinculado a <span class="text-red-500">*</span>
                    </label>
                    <button 
                        v-if="linkedEntity"
                        @click="showLinkSelector = !showLinkSelector"
                        class="flex items-center justify-between h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        <span class="text-blue-700 dark:text-blue-300 font-medium">
                            {{ getEntityTypeLabel(linkedEntity.type) }}: {{ linkedEntity.label }}
                        </span>
                        <ChevronDown class="h-4 w-4 text-blue-700 dark:text-blue-300" />
                    </button>
                    <button 
                        v-else
                        @click="showLinkSelector = !showLinkSelector"
                        class="flex items-center justify-between h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div class="flex items-center gap-2">
                            <Link2 class="h-4 w-4" />
                            <span>Selecione uma entidade</span>
                        </div>
                        <ChevronDown class="h-4 w-4" />
                    </button>

                    <!-- Link Selector Dropdown: open specific selection modals -->
                    <div v-if="showLinkSelector" class="mt-2 p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50 space-y-2">
                        <button @click="isClientModalOpen = true" class="w-full text-sm p-2 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-left">Selecionar Cliente</button>
                        <button @click="isProcessModalOpen = true" class="w-full text-sm p-2 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-left">Selecionar Processo</button>
                        <button @click="isServiceModalOpen = true" class="w-full text-sm p-2 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-left">Selecionar Serviço</button>
                    </div>
                </div>

                <div class="grid gap-2">
                    <label for="description" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Descrição (opcional)
                    </label>
                    <textarea id="description" v-model="description"
                        class="flex min-h-[80px] w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white resize-none" 
                        placeholder="Adicione notas sobre este agendamento..." />
                </div>
            </div>

            <div class="flex items-center p-6 pt-0 justify-end space-x-2">
                <button @click="closeModal"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-4 py-2 text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Cancelar
                </button>
                <button @click="saveSchedule" :disabled="!canSubmit || isLoading"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 h-9 px-4 py-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isLoading ? 'Salvando...' : 'Agendar' }}
                </button>
            </div>
        </div>
    </div>

    <ClientSelectionModal
        :isOpen="isClientModalOpen"
        @close="isClientModalOpen = false"
        @select="onClientSelected"
    />

    <ProcessSelectionModal
        :isOpen="isProcessModalOpen"
        @close="isProcessModalOpen = false"
        @select="onProcessSelected"
    />

    <ServiceSelectionModal
        :isOpen="isServiceModalOpen"
        @close="isServiceModalOpen = false"
        @select="onServiceSelected"
    />
</template>
