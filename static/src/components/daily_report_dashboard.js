/** @odoo-module */

import { registry } from "@web/core/registry";
import { KpiCard } from "./kpi_card/kpi_card";
import { RadarChartRenderer } from "./radar_chart_renderer/radar_chart_renderer";
import { PolarAreaChartRenderer } from "./polararea_chart_renderer/polararea_chart_renderer";
import { BarChartRenderer } from "./bar_chart_renderer/bar_chart_renderer";
import { Table } from "./table/table";
import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";
const { Component, onWillStart, useState, useEffect } = owl

export class OwlDailyReportComponents extends Component {

    async getEmployees(){
        const data = await this.orm.readGroup("daily.report.management",  [], ['employee_id'], ['employee_id'], { orderby:"employee_id asc" })
        const employeeNames = data.map(emp => ({
            id: emp.employee_id[0],
            name: emp.employee_id[1],
        }));
        return employeeNames
    }

    async prepareRadarChartData(id=0) {
        const radar_chart_data = await this.orm.call('daily.report.management', 'get_employee_radar_chart_data', [id]);
        const labels = ['Timesheets', 'Approved Reports', 'Projects', 'Leaves'];
        const datasets = [];

        const colors = [
            'rgba(105, 199, 208, 0.2)',
            'rgba(255, 0, 89, 0.2)',
        ];
        const borderColors = [
            'rgb(105, 199, 208)',
            'rgb(255, 0, 89)',
        ];

        if (id !== 0) {
            const emp = radar_chart_data[id];
            const last30DaysData = {
                label: emp.employee + ' (Last 30 Days)',
                data: [
                    emp.last_30_days.timesheets_duration,
                    emp.last_30_days.approved_reports_count,
                    emp.last_30_days.projects_count,
                    emp.last_30_days.leaves_count
                ],
                fill: true,
                backgroundColor: colors[0],
                borderColor: borderColors[0],
                pointBackgroundColor: borderColors[0],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: borderColors[0]
            };

            const allTimeData = {
                label: emp.employee + ' (All Time)',
                data: [
                    emp.all_time.timesheets_duration,
                    emp.all_time.approved_reports_count,
                    emp.all_time.projects_count,
                    emp.all_time.leaves_count
                ],
                fill: true,
                backgroundColor: colors[1],
                borderColor: borderColors[1],
                pointBackgroundColor: borderColors[1],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: borderColors[1]
            };

            datasets.push(last30DaysData, allTimeData);

            this.state.prepareRadarChartData  = {
                data: {
                    labels: labels,
                      datasets: datasets
                },
            }
        }
        else {
            const average = radar_chart_data.average;
            const last30DaysData = {
                label: 'Average Last 30 Days',
                data: [
                    average.last_30_days.timesheets_duration,
                    average.last_30_days.approved_reports_count,
                    average.last_30_days.projects_count,
                    average.last_30_days.leaves_count
                ],
                fill: true,
                backgroundColor: colors[0],
                borderColor: borderColors[0],
                pointBackgroundColor: borderColors[0],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: borderColors[0]
            };

            const allTimeData = {
                label: 'Average All Time',
                data: [
                    average.all_time.timesheets_duration,
                    average.all_time.approved_reports_count,
                    average.all_time.projects_count,
                    average.all_time.leaves_count
                ],
                fill: true,
                backgroundColor: colors[1],
                borderColor: borderColors[1],
                pointBackgroundColor: borderColors[1],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: borderColors[1]
            };

            datasets.push(last30DaysData, allTimeData);
            this.state.prepareRadarChartData  = {
                data: {
                    labels: labels,
                      datasets: datasets
                },
            }
        };
    }

    async loadPolarAreaChartData(id=0) {
        const polar_area_data = await this.orm.call('daily.report.management', 'get_employee_polar_area_chart_data', [id]);

        const colors = [
            'rgba(254, 49, 224, 0.2)',
            'rgba(187, 255, 193, 0.2)',
            'rgba(245, 205, 184, 0.2)',
            'rgba(255, 0, 89, 0.2)',
            'rgba(255, 203, 0, 0.2)',
            'rgba(73, 21, 134, 0.2)',
            'rgba(105, 199, 208, 0.2)',
            'rgba(247, 119, 55, 0.2)',
            'rgba(209, 223, 187, 0.2)',
            'rgba(135, 87, 92, 0.2)'
        ];

        const borderColors = [
            'rgb(254, 49, 224)',
            'rgb(187, 255, 193)',
            'rgb(245, 205, 184)',
            'rgb(255, 0, 89)',
            'rgb(255, 203, 0)',
            'rgb(73, 21, 134)',
            'rgb(105, 199, 208)',
            'rgb(247, 119, 55)',
            'rgb(209, 223, 187)',
            'rgb(135, 87, 92)'
        ];

        const backgroundColor = polar_area_data.datasets[0].data.map((_, index) => colors[index % colors.length]);
        const borderColor = polar_area_data.datasets[0].data.map((_, index) => borderColors[index % borderColors.length]);

        polar_area_data.datasets[0].backgroundColor = backgroundColor;
        polar_area_data.datasets[0].borderColor = borderColor;

        this.state.loadPolarAreaChartData  = {
            data: polar_area_data,
        }
    }
    
    async loadProjectData(){
        const project_data = await this.orm.call('daily.report.management', 'get_project_data');
        if (project_data && project_data.length > 0) {
            const labels = project_data.map(project => project.name);
            const spentHours = project_data.map(project => project.spent_hours);
            const allocatedHours = project_data.map(project => project.allocated_hours);

            const data = {
                labels: labels,
                datasets: [
                    {
                        label: 'Spent Hours',
                        data: spentHours,
                        borderColor: 'rgba(187, 255, 193, 1)',
                        backgroundColor: 'rgba(187, 255, 193, 0.5)',
                        hoverOffset: 4,
                        stack: 'combined',
                        type: 'bar',
                        yAxisID: 'spent_hours',
                    },
                    {
                        label: 'Allocated Hours',
                        data: allocatedHours,
                        borderColor: 'rgba(254, 49, 224, 1)',
                        backgroundColor: 'rgba(254, 49, 224, 0.5)',
                        hoverOffset: 4,
                        stack: 'combined',
                        yAxisID: 'allocated_hours',
                    }
                ]
            };

            this.state.loadProjectData = {
                data: data,
            };
        } else {
            console.error('No project data found.');
        }
    }

    setup() {
        this.state = useState({
            employeeId: null,
            employees: [],
        });
        this.orm = useService("orm")
        this.actionService = useService("action")
        this.employeeNames = this.getEmployees()

        onWillStart(async ()=>{
            await loadJS("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js")
            const employees = await this.getEmployees();
            this.state.employees = employees;
            this.state.employeeId = 0
            await this.prepareRadarChartData();
            await this.loadPolarAreaChartData();
            await this.loadProjectData();
            await this.getKpiCardsData();

        })

    }

    async onEmployeeChange(event){
        const employeeId = parseInt(event.target.value, 10);
        this.state.employeeId = employeeId
        this.prepareRadarChartData(employeeId)
        this.loadPolarAreaChartData(employeeId)
        this.getKpiCardsData(employeeId)
    }

    async getKpiCardsData(id = 0) {
        const totalReportData = await this.orm.searchRead("daily.report.management", [], ["project_ids"]);

        //First KpiCard Datas
        const totalProjectIds = new Set();

        totalReportData.forEach(record => {
            record.project_ids.forEach(id => {
                totalProjectIds.add(id);
            });
        });

        const totalEmpProjects = totalProjectIds.size;

        if (id === 0 || id === false) {
            this.state.project = {
                value: totalEmpProjects,
                percentage: 100,
                explanation: 'All Projects'
            };
        }
        else {
            const reportData = await this.orm.searchRead("daily.report.management", [['employee_id', '=', id]], ["project_ids"]);
            const employeeProjectIds = new Set();

            reportData.forEach(record => {
                record.project_ids.forEach(id => {
                    employeeProjectIds.add(id);
                });
            });

            const employeeProjects = employeeProjectIds.size;

            this.state.project = {
                value: employeeProjects,
                percentage: ((employeeProjects / totalEmpProjects) * 100).toFixed(2),
                explanation: 'Projects Worked On'
            };
        }

        //Second KpiCard Datas
        const totalWaitingApprovalReportsData = await this.orm.searchRead("daily.report.management", [['state', '=', 'waiting_for_review']], []);
        const totalWaitingApprovalReports = totalWaitingApprovalReportsData.length;

        if (id === 0 || id === false) {
            this.state.waiting_approve = {
                count: totalWaitingApprovalReports,
                explanation: 'Total Reports Waiting for Approval'
            };
        } else {
            const employeeReportData = await this.orm.searchRead("daily.report.management", [['employee_id', '=', id], ['state', '=', 'waiting_for_review']], []);
            const employeeWaitingApprovalReports = employeeReportData.length;

            this.state.waiting_approve = {
                count: employeeWaitingApprovalReports,
                explanation: 'Reports Waiting for Approval'
            };
        }

        //Third KpiCard Datas
        const totalApprovedReportsData = await this.orm.searchRead("daily.report.management", [['state', '=', 'approved']], []);
        const totalApprovedReports = totalApprovedReportsData.length;

        if (id === 0 || id === false) {
            this.state.approved = {
                count: totalApprovedReports,
                explanation: 'Total Approved Reports'
            };
        } else {
            const employeeReportData = await this.orm.searchRead("daily.report.management", [['employee_id', '=', id], ['state', '=', 'approved']], []);
            const employeeApprovedReports = employeeReportData.length;

            this.state.approved = {
                count: employeeApprovedReports,
                explanation: 'Approved Reports'
            };
        }

    }

    async viewProjects() {
        let daily_domain = [];
        if (this.state.employeeId) {
            daily_domain = [['employee_id', '=', this.state.employeeId]];
        }
        const reportData = await this.orm.searchRead("daily.report.management", daily_domain, ["project_ids"]);

        const projectIds = reportData.reduce((acc, record) => {
            return acc.concat(record.project_ids);
        }, []);

        let domain = [['id', 'in', projectIds]];

        let listView = await this.orm.searchRead("ir.model.data", [['name', '=', 'project_project_tree']], ['res_id']);
        let kanbanView = await this.orm.searchRead("ir.model.data", [['name', '=', 'project_project_kanban']], ['res_id']);
        let formView = await this.orm.searchRead("ir.model.data", [['name', '=', 'project_project_form']], ['res_id']);

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Projects",
            res_model: "project.project",
            domain: domain,
            views: [
                [kanbanView.length > 0 ? kanbanView[0].res_id : false, "kanban"],
                [listView.length > 0 ? listView[0].res_id : false, "list"],
                [formView.length > 0 ? formView[0].res_id : false, "form"]
            ],
            context: {
                search_default_groupby_stage: true,
            }
        });
    }

    async viewWaitingApproval(){
        let domain = [['state', '=', 'waiting_for_review']];

        if (this.state.employeeId) {
            domain.push(['employee_id', '=', this.state.employeeId]);
        }
        const reportData = await this.orm.searchRead("daily.report.management", domain, ["project_ids"]);

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Pending Daily Reports",
            res_model: "daily.report.management",
            domain,
            views: [
                [false, "list"],
                [false, "form"]
                ]
        })
    }

    async viewApproved(){
        let domain = [['state', '=', 'approved']];

        if (this.state.employeeId) {
            domain.push(['employee_id', '=', this.state.employeeId]);
        }
        const reportData = await this.orm.searchRead("daily.report.management", domain, ["project_ids"]);

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Pending Daily Reports",
            res_model: "daily.report.management",
            domain,
            views: [
                [false, "list"],
                [false, "form"]
                ]
        })
    }

}
OwlDailyReportComponents.template = "owl.OwlDailyReportComponents"
OwlDailyReportComponents.components = { KpiCard, RadarChartRenderer, PolarAreaChartRenderer, BarChartRenderer, Table }

registry.category("actions").add("owl.daily_report_dashboard", OwlDailyReportComponents);