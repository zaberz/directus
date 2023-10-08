<script setup>
import {inject, useAttrs, watch} from 'vue'
import {useApi} from '@directus/extensions-sdk'

const props = defineProps(['value'])
const emit = defineEmits(['input'])
const v = inject('values')

const lastQuery = {
  sku: 0,
  classify: 0
}

const api = useApi()

function handleChange(value) {
  emit('input', value)
}

watch(v, (newVal) => {
  if (newVal.sku && newVal.classify) {
    if (lastQuery.sku == newVal.sku && lastQuery.classify == newVal.classify) return
    lastQuery.sku = newVal.sku
    lastQuery.classify = newVal.classify

    api.get('/items/sku_classify_price', {
      params: {
        limit: 1,
        filter: {
          '_and': [
            {
              sku: {'_eq': newVal.sku}
            },
            {
              classify: {'_eq': newVal.classify}
            }
          ],
        }
      }
    }).then(res => {
      if (res.data.data && res.data.data.length > 0) {
        const item = res.data.data[0]
        const price = item.price
        emit('input', price)
      }
    })
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