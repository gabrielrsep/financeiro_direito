<script setup lang="ts">
import { watch } from 'vue'
import IMask from 'imask'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
let numberMask: ReturnType<typeof IMask> | undefined

onMounted(() => {
  if (!inputRef.value)
    return

  numberMask = IMask(inputRef.value, { mask: Number, thousandsSeparator: '.' })
  numberMask.typedValue = props.modelValue
  numberMask.on('accept', () => {
    emit('update:modelValue', numberMask?.typedValue ?? 0)
  })
})

watch(() => props.modelValue, (value) => {
  if (numberMask && numberMask.typedValue !== value)
    numberMask.typedValue = value
})

onBeforeUnmount(() => {
  numberMask?.destroy()
  numberMask = undefined
})
</script>

<template>
  <input ref="inputRef" v-bind="$attrs" type="text" />
</template>