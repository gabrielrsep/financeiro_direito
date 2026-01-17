import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
    id: number
    type: ToastType
    message: string
    permanent: boolean
}

export const useToastStore = defineStore('toast', () => {
    const toasts = ref<Toast[]>([])
    
    let nextId = 1

    function add(toast: Omit<Toast, 'id'>) {
        const id = nextId++
        toasts.value.push({
            id,
            type: toast.type,
            message: toast.message,
            permanent: toast.permanent,
        })

        if (!toast.permanent) {
            setTimeout(() => {
                remove(id)
            }, 3000)
        }
    }

    function remove(id: number) {
        const index = toasts.value.findIndex(t => t.id === id)
        if (index !== -1) {
            toasts.value.splice(index, 1)
        }
    }

    function success(message: string, permanent = false) {
        add({ type: 'success', message, permanent })
    }

    function error(message: string, permanent = false) {
        add({ type: 'error', message, permanent })
    }

    function info(message: string, permanent = false) {
        add({ type: 'info', message, permanent })
    }

    return {
        toasts,
        add,
        remove,
        success,
        error,
        info,
    }
})