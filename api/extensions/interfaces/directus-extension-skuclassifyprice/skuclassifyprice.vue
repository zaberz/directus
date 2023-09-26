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
const lastQuery = {
  sku: 0,
  classify: 0
}
let api = useApi()
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
      if( res.data.data && res.data.data.length > 0) {
        let item = res.data.data[0]
        let price = item.price
        emit('input', price)
      }
    })
  }
}, {deep: true})

</script>

<style scoped>

</style>