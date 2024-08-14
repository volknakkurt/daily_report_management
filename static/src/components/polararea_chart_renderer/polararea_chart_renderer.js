/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";

const { Component, onWillStart, useRef, onMounted, onWillUpdateProps, onPatched } = owl

export class PolarAreaChartRenderer extends Component {

    setup() {
        this.chartRef = useRef("polar_area_chart")
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
        this.destroyChart()
        this.chart = new Chart(this.chartRef.el,
        {
          type: this.props.type,
          data: this.props.config.data,
          options: {
            onClick: async (e) => {
                const active = e.chart.getActiveElements();
                if (active.length > 0) {
                    const project_name = e.chart.data.labels[active[0].index];

                    const employee_id = this.props.employee_id;
                    console.log(employee_id);

                    const project_id = await this.findProjectIdByName(project_name);
                    let domain = []
                    if (employee_id != 0) {
                        domain = [["project_id", "=", project_id],["employee_id", "=", employee_id]];
                    }
                    let treeView = await this.orm.searchRead("ir.model.data", [['name', '=', 'timesheet_view_tree_user']], ['res_id']);
                        const view_id = treeView[0].res_id;

                        await this.actionService.doAction({
                            name: 'Timesheets',
                            type: 'ir.actions.act_window',
                            res_model: 'account.analytic.line',
                            view_mode: 'tree,form',
                            views: [[view_id, 'tree'], [false, 'form']],
                            domain: domain,
                            context: {
                                search_default_project_id: project_id,
                                search_default_employee_id: employee_id
                            },
                            target: 'current',
                    });
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
PolarAreaChartRenderer.template = "owl.PolarAreaChartRenderer"

