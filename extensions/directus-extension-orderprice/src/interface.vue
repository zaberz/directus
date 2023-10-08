<script setup>
import {inject, useAttrs, watch} from 'vue'
import {useApi} from '@directus/extensions-sdk'

const props = defineProps(['value'])
const emit = defineEmits(['input'])
const v = inject('values')
const api = useApi()

function handleChange(value) {
  emit('input', value)
}

watch(v, (newVal) => {
  if (newVal.order_sku_detail && newVal.order_sku_detail.create) {
    const totalPrice = newVal.order_sku_detail.create.reduce((acc, next) => {
      return acc + next.price
    }, 0)

    emit('input', totalPrice)
  }
}, {deep: true})

</script>

<template>
  <v-input
      :model-value="value"
      label="price"
      @update:modelValue="handleChange($event.target.value)"></v-input>
</template>

<style scoped>

</style>