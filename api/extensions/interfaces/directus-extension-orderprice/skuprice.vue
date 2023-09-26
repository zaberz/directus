<template>
  <v-input
      :modelValue="value"
      @update:modelValue="handleChange($event.target.value)"
      label="price"></v-input>
</template>

<script setup>
import {inject, useAttrs, watch} from 'vue'
import {useApi} from '@directus/extensions-sdk'
const props = defineProps(['value'])
const emit = defineEmits(['input'])
const v = inject('values')
let api = useApi()
function handleChange(value) {
  emit('input', value)
}
watch(v, (newVal) => {
  if (newVal.order_sku_detail && newVal.order_sku_detail.create) {
    let totalPrice = newVal.order_sku_detail.create.reduce((acc, next) => {
      return acc + next.price
    },0)
    emit('input', totalPrice)
  }
}, {deep: true})

</script>

<style scoped>

</style>