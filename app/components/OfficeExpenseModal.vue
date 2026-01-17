<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, DollarSign, Calendar, FileText, Repeat } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

interface Props {
  isOpen: boolean
  expense: any | null
}

const toastStore = useToastStore()

const props = defineProps<Props>()
const emit = defineEmits(['close', 'saved'])

const description = ref('')
const amount = ref<number | null>(null)
const dueDate = ref(new Date().toISOString().split('T')[0])
const isRecurrent = ref(false)

watch(() => props.expense, (newExpense) => {
    if (newExpense) {
        description.value = newExpense.description
        amount.value = newExpense.amount
        dueDate.value = newExpense.due_date
        isRecurrent.value = !!newExpense.is_recurrent
    } else {
        description.value = ''
        amount.value = null
        dueDate.value = new Date().toISOString().split('T')[0]
        isRecurrent.value = false
    }
}, { immediate: true })

const closeModal = () => {
    emit('close')
}

const saveExpense = async () => {
    if (!description.value || !amount.value || !dueDate.value) {
        toastStore.error('Preencha todos os campos obrigatórios')
        return
    }

    try {
        const method = props.expense ? 'PATCH' : 'POST'
        const url = props.expense ? `/api/office-expenses/${props.expense.id}` : '/api/office-expenses'
        
        await $fetch(url, {
            method,
            body: {
                description: description.value,
                amount: amount.value,
                due_date: dueDate.value,
                is_recurrent: isRecurrent.value
            }
        })
        
        emit('saved')
        closeModal()
    } catch (error: any) {
        console.error('Erro ao salvar gasto:', error)
        toastStore.error('Erro ao salvar gasto: ' + (error.message || 'Erro desconhecido'))
    }
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
                        {{ expense ? 'Editar Gasto' : 'Novo Gasto do Escritório' }}
                    </h3>
                    <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X class="h-4 w-4" />
                    </button>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Registre uma despesa administrativa do escritório.
                </p>
            </div>

            <div class="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div class="grid gap-2">
                    <label for="description" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Descrição
                    </label>
                    <div class="relative">
                        <FileText class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input id="description" v-model="description"
                            class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white" 
                            placeholder="Ex: Aluguel, Luz, Papelaria..." />
                    </div>
                </div>

                <div class="grid gap-2">
                    <label for="amount" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Valor
                    </label>
                    <div class="relative">
                        <DollarSign class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input id="amount" type="number" step="0.01" v-model="amount"
                            class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white" 
                            placeholder="0,00" />
                    </div>
                </div>

                <div class="grid gap-2">
                    <label for="due_date" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Data de Vencimento
                    </label>
                    <div class="flex items-center gap-4">
                        <div class="relative flex-1">
                            <Calendar class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input id="due_date" type="date" v-model="dueDate"
                                class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white" />
                        </div>
                        <div class="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 h-10 transition-colors">
                            <input type="checkbox" id="is_recurrent" v-model="isRecurrent"
                                class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900" />
                            <label for="is_recurrent" class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center cursor-pointer select-none">
                                <Repeat class="h-3.5 w-3.5 mr-1.5 opacity-70" />
                                Recorrente
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center p-6 pt-0 justify-end space-x-2">
                <button @click="closeModal"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-4 py-2 text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Cancelar
                </button>
                <button @click="saveExpense"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-100 text-slate-900 dark:text-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:bg-slate-200 h-9 px-4 py-2 shadow-sm transition-colors">
                    {{ expense ? 'Salvar Alterações' : 'Salvar Gasto' }}
                </button>
            </div>
        </div>
    </div>
</template>
