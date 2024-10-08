/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS, loadCSS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";

const { Component, onWillStart, useRef, onMounted } = owl;

export class Table extends Component {
    setup() {
        this.chartRef = useRef("table");
        this.orm = useService("orm")
        onWillStart(async () => {
            await loadJS("https://unpkg.com/tabulator-tables@5.0.7/dist/js/tabulator.min.js");
            await loadCSS("https://unpkg.com/tabulator-tables@5.0.7/dist/css/tabulator.min.css");
        });
        const style = document.createElement('style');
            style.innerHTML = `
                .tabulator .tabulator-header .tabulator-col {
                    background-color: #cf1336 !important;
                    color: white !important;
                }
            `;
            document.head.appendChild(style);
        onMounted(() => this.renderTable());
    }

    async renderTable() {
        const tableData = await this.orm.call('daily.report.management', 'get_project_table_data');

        var columns = [
            { title: "Project Name", field: "name", frozen: true },
            {
                title: "Time Info", columns: [
                    { title: "Allocated Hours", field: "allocated_hours", hozAlign:"center" },
                    { title: "Spent Hours", field: "spent_hours", hozAlign:"center" },
                    { title: "Deadline", field: "deadline", hozAlign:"center", formatter: "date", formatterParams: { outputFormat: "YYYY/MM/DD" } }
                ]
            },
            {
                title: "Task Info", columns: [
                    { title: "Open Task", field: "open_tasks", hozAlign:"center" },
                    { title: "Closed Task", field: "closed_tasks", hozAlign:"center" },
                    { title: "Success", field: "successful_tasks", hozAlign:"center" },
                    { title: "Overdue", field: "unsuccessful_tasks", hozAlign:"center" }
                ]
            },
            { title: "Production", field: "produced_items", hozAlign:"center" }
        ];

        new Tabulator(this.chartRef.el, {
            data: tableData,
            columns: columns,
            layout:"fitDataFill",
            movableRows:true,
            frozenRows:1,
            spreadsheet:true,
            spreadsheetOutputFull: true,
            maxHeight:"100%",
            rowHeight:100,
        });
    }

}
Table.template = "owl.Table";
