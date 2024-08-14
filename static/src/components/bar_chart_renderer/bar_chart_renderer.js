/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";

const { Component, onWillStart, useRef, onMounted, onWillUpdateProps, onPatched } = owl

export class BarChartRenderer extends Component {

    setup() {
        this.chartRef = useRef("bar_chart")
        this.orm = useService("orm")
        this.actionService = useService("action")

        onWillStart(async ()=>{
            await loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.3.0/chart.umd.min.js")
        })

        onMounted(()=> this.renderChart())
        onWillUpdateProps(() => this.destroyChart())
        onPatched(() => this.renderChart())
    }

    async findProjectIdByName(project_name) {
        const domain = [["name", "=", project_name]];
        const project = await this.orm.searchRead("project.project", domain, []);
        return project.length > 0 ? project[0].id : null;
    }

    renderChart () {
        this.chart = new Chart(this.chartRef.el,
        {
          type: this.props.type,
          data: this.props.config.data,
          options: {
            onClick: async (e) => {
                const active = e.chart.getActiveElements();
                if (active.length > 0) {
                    const project_name = e.chart.data.labels[active[0].index];

                    const project_id = await this.findProjectIdByName(project_name);
                    console.log(project_id)
                    if (project_id) {
                        const domain = [
                            ["project_id", "=", project_id]
                        ];
                        let kanbanView = await this.orm.searchRead("ir.model.data", [['name', '=', 'project_update_view_kanban']], ['res_id']);

                        await this.actionService.doAction('project.project_update_all_action', {
                            additionalContext: {
                                active_id: project_id
                            }
                        });
                    }
                }
            },
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
            },
            scales: {
                spent_hours: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    }
                },
                allocated_hours: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    }
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
BarChartRenderer.template = "owl.BarChartRenderer"

