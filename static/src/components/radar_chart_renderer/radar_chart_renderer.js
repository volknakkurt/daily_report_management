/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";

const { Component, onWillStart, useRef, onMounted, onWillUpdateProps, onPatched } = owl

export class RadarChartRenderer extends Component {

    setup() {
        this.chartRef = useRef("radar_chart")

        onWillStart(async ()=>{
            await loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.3.0/chart.umd.min.js")
        })

        onMounted(()=> this.renderChart())
        onWillUpdateProps(() => this.destroyChart())
        onPatched(() => this.renderChart())
    }

    renderChart () {
        this.chart = new Chart(this.chartRef.el,
        {
          type: this.props.type,
          data: this.props.config.data,
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
              },
              title: {
                display: true,
                text: this.props.title,
                position: 'bottom',
              }
            }
          },
        }
      );
    }

    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}
RadarChartRenderer.template = "owl.RadarChartRenderer"

