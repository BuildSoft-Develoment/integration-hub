import { defineConfig, defineThemeColor } from 'likec4/config'

export default defineConfig({
  name: 'integration-hub-architecture',
  title: 'Integration Hub Architecture',
  styles: {
    theme: {
      colors: {
        indigo: defineThemeColor({
          elements: '#FFF2CC',
          relationships: '#7A6A00'
        })
      }
    }
  }
})
