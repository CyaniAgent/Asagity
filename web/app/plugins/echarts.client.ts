import { defineNuxtPlugin } from '#app'

// ECharts Core and SVG Renderer
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

// Import the specific charts and components we need
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
} from 'echarts/components'

// The Vue Wrapper
import VChart from 'vue-echarts'

export default defineNuxtPlugin((nuxtApp) => {
  // Register necessary components to the echarts core
  echarts.use([
    CanvasRenderer,
    LineChart,
    PieChart,
    BarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DataZoomComponent
  ])

  // Register VChart globally as <ClientOnly><VChart />
  nuxtApp.vueApp.component('VChart', VChart)
})
