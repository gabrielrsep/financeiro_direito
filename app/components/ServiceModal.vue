<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, DollarSign, FileText } from 'lucide-vue-next'
import ClientSelectionModal from '~/components/ClientSelectionModal.vue'
import { useToastStore } from '~/stores/toast'

interface Client {
  id: number
  name: string
  document: string
}

const toastStore = useToastStore()

const emit = defineEmits(['close', 'created'])

const description = ref('')
const valueCharged = ref<number>(0)
const paymentMethod = ref('em_conta')
const selectedClient = ref<Client | null>(null)
const isLoading = ref(false)
const isClientModalOpen = ref(false)

const onClientSelected = (client: Client) => {
    selectedClient.value = client
}

const canSubmit = computed(() => {
    return description.value.trim().length > 0 && selectedClient.value && valueCharged.value > 0
})

const createService = async () => {
    if (!canSubmit.value) {
        toastStore.error('Preenchimento obrigatório: Descrição, Cliente e Valor')
        return
    }

    isLoading.value = true
    try {
        await $fetch('/api/services', {
            method: 'POST',
            body: {
                client_id: selectedClient.value!.id,
                description: description.value.trim(),
                value_charged: valueCharged.value,
                payment_method: paymentMethod.value
            }
        })
        .then(() => {
            toastStore.success('Serviço criado com sucesso')
            emit('created')
        })
    } catch (error: any) {
        toastStore.error(error.message || 'Erro ao criar serviço')
    } finally {
        isLoading.value = false
    }
}

const closeModal = () => {
    description.value = ''
    valueCharged.value = 0
    selectedClient.value = null
    paymentMethod.value = 'em_conta'
    emit('close')
}
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        @click.self="closeModal">
        <div class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
            <div class="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex justify-between items-center">
                    <h3 class="font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-white">
                        Novo Serviço
                    </h3>
                    <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X class="h-4 w-4" />
                    </button>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Preencha os detalhes do novo serviço prestado
                </p>
            </div>

            <div class="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <!-- Client Selection -->
                <div class="grid gap-2">
                    <label class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Cliente *
                    </label>
                    <button
                        v-if="!selectedClient"
                        @click="isClientModalOpen = true"
                        class="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                        Selecionar cliente...
                    </button>
                    <div v-else class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div>
                            <p class="font-medium text-slate-900 dark:text-white">{{ selectedClient.name }}</p>
                            <p class="text-xs text-slate-600 dark:text-slate-400">{{ selectedClient.document }}</p>
                        </div>
                        <button
                            @click="selectedClient = null"
                            class="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                        >
                            Alterar
                        </button>
                    </div>
                </div>

                <!-- Description -->
                <div class="grid gap-2">
                    <label for="description" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Descrição do Serviço *
                    </label>
                    <textarea
                        id="description"
                        v-model="description"
                        placeholder="Descreva o serviço prestado..."
                        class="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 min-h-[100px] resize-none"
                    ></textarea>
                </div>

                <!-- Value Charged -->
                <div class="grid gap-2">
                    <label for="value_charged" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Valor Cobrado (R$) *
                    </label>
                    <div class="relative">
                        <DollarSign class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            id="value_charged"
                            v-model.number="valueCharged"
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            class="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                <!-- Payment Method -->
                <div class="grid gap-2">
                    <label for="payment_method" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Forma de Pagamento
                    </label>
                    <select
                        id="payment_method"
                        v-model="paymentMethod"
                        class="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                        <option value="em_conta">Parcelado pelo Escritório</option>
                        <option value="pix">PIX</option>
                        <option value="cartao">Cartão de Crédito</option>
                        <option value="transferencia">Transferência Bancária</option>
                        <option value="dinheiro">Dinheiro</option>
                    </select>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button
                    @click="closeModal"
                    class="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button
                    @click="createService"
                    :disabled="!canSubmit || isLoading"
                    class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                    <FileText v-if="!isLoading" class="h-4 w-4" />
                    <span v-if="!isLoading">Criar Serviço</span>
                    <span v-else>Criando...</span>
                </button>
            </div>
        </div>

        <ClientSelectionModal 
            :isOpen="isClientModalOpen" 
            @close="isClientModalOpen = false" 
            @select="onClientSelected" 
        />
    </div>
</template>
