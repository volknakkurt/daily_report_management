/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS, loadCSS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";

const { Component, onWillStart, useRef, onMounted } = owl;

export class Table extends Component {
    setup() {
        this.chartRef = useRef("table");
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

    renderTable() {
        var tableData = [
            { id: 1, name: "John Doe", progress: 50, rating: 4.5, car: "Toyota", gender: "Male", col: "Blue", dob: "1990-05-20" },
            { id: 2, name: "Jane Smith", progress: 80, rating: 4.2, car: "Ford", gender: "Female", col: "Red", dob: "1985-02-15" },
            { id: 3, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
            { id: 4, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
            { id: 5, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
            { id: 6, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
            { id: 7, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
            { id: 8, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
            { id: 9, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
            { id: 10, name: "Mike Johnson", progress: 30, rating: 3.9, car: "Honda", gender: "Male", col: "Green", dob: "1995-10-10" },
        ];

        var columns = [
            { title: "Name", field: "name", frozen:true },
            { title: "Car Details", columns: [
                { title: "Car", field: "car" },
                { title: "Color", field: "col" }
            ]},
            { title: "Personal Info", columns: [
                { title: "Gender", field: "gender" },
                { title: "Date of Birth", field: "dob", formatter: "date", formatterParams: { outputFormat: "YYYY-MM-DD" } }
            ]},
            { title: "Progress", field: "progress" },
            { title: "Rating", field: "rating" },
            { title: "Progress", field: "progress" },
            { title: "Rating", field: "rating" },
            { title: "Progress", field: "progress" },
            { title: "Rating", field: "rating" },
            { title: "Progress", field: "progress" },
            { title: "Rating", field: "rating" },
            { title: "Progress", field: "progress" },
            { title: "Rating", field: "rating" },
            { title: "Progress", field: "progress" },
            { title: "Rating", field: "rating" }
        ];

        new Tabulator(this.chartRef.el, {
            data: tableData,
            columns: columns,
            layout:"fitDataStretch",
            frozenRows:1,
            height:300,
            rowHeight:40,
        });
    }
}
Table.template = "owl.Table";
