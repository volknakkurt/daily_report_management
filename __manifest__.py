# Copyright 2024 Akkurt Volkan, Patrion
# License AGPL-3.0.


{
    "name": "Daily Report Management",
    "version": "17.0.1.0.1",
    "author": "Volkan," "Patrion",
    "license": "AGPL-3",
    "complexity": "normal",
    "depends": ["base", "web", "project", "analytic", "mrp", "hr", "hr_payroll", "board"],
    "data": [
        'security/ir.model.access.csv',
        'data/daily_report_category_data.xml',
        'security/res_groups.xml',
        'views/daily_report_management_view.xml',
        'views/menu.xml',
    ],
    "assets": {
        "web.assets_backend": [
            'pt_daily_report_management/static/src/components/**/*.js',
            'pt_daily_report_management/static/src/components/**/*.scss',
            'pt_daily_report_management/static/src/components/**/*.xml',
        ],
    },
    "auto_install": False,
    "installable": True,
    "application": True,
}
