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

watch(() => v, (newVal) => {
  console.log(v)
  if (newVal.order_sku_detail && newVal.order_sku_detail.create) {
    const totalPrice = newVal.order_sku_detail.create.reduce((acc, next) => {
      return acc + next.price
    }, 0)

    if (totalPrice != v.total_price) {
      emit('input', totalPrice)
    }
  }
}, {deep: true})
</script>

<template>
  <v-input
      :modelValue="value"
      @update:modelValue="handleChange"
  ></v-input>

</template>

<style scoped>

</style>