<template>
  <input type="text" :value="value" @input="updateValue($event.target.value)" />
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  value: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:value'])

const updateValue = (value) => {
  emit('update:value', value)
}
</script>
