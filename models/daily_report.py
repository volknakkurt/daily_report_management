# Copyright 2024 Akkurt Volkan, Patrion
# License AGPL-3.0.

from odoo import api, fields, models, _
from datetime import datetime, timedelta


class DailyReportManagement(models.Model):
    _name = 'daily.report.management'
    _rec_name = 'daily_report_reference'

    daily_report_reference = fields.Char(string="Reference", compute="_compute_daily_report_reference")

    employee_id = fields.Many2one('res.users', 'Employee', required=True, default=lambda self: self.env.user,
                                  index=True,
                                  ondelete='cascade')
    report_date = fields.Date(default=fields.Date.context_today, string="Report Date")

    project_line_ids = fields.One2many('project.line', 'daily_report_management_id',
                                       string="Project Line")
    manufacturing_line_ids = fields.One2many('manufacturing.line', 'daily_report_management_id',
                                             string="Manufacturing Line")
    analytic_account_ids = fields.Many2many('account.analytic.account', string="Analytic Accounts")
    project_ids = fields.Many2many('project.project', string="Projects", compute='_compute_project_ids', store=True)
    manufacturing_order_ids = fields.Many2many('mrp.production', string="Manufacturing Orders")
    work_order_ids = fields.Many2many('mrp.workorder', string="Work Orders")

    time_ids = fields.Many2many('mrp.workcenter.productivity', string="Time Logs")
    project_task_ids = fields.Many2many('project.task', string="Project Tasks")
    timesheets_ids = fields.Many2many('account.analytic.line', string="Timesheets")
    notes = fields.Html('Notes')

    state = fields.Selection([
        ('draft', 'Draft'),
        ('waiting_for_review', 'Review'),
        ('approved', 'Approved')], default='draft', string="State")

    work_status = fields.Selection([
        ('off_work', 'Off Work'),
        ('half_day_off', 'Half-Day Off'),
        ('worked_full_time', 'Worked Full Time')], default="worked_full_time", string="Work Status")

    def open_timesheets(self):
        view_id = self.env.ref('hr_timesheet.hr_timesheet_line_tree').id
        return {
            'name': _('Timesheets'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.analytic.line',
            'views': [[view_id, 'list']],
            'domain': [('employee_id', '=', self.employee_id.id)],
            'context': {
                'group_by': 'project_id',
            },
            'target': 'current',
        }

    def open_work_orders(self):
        view_id = self.env.ref('mrp.mrp_production_workorder_tree_view').id
        return {
            'name': _('Work Orders'),
            'type': 'ir.actions.act_window',
            'res_model': 'mrp.workorder',
            'views': [[view_id, 'list']],
            'domain': [('production_id', 'in', self.manufacturing_order_ids.ids)],
            'context': {
                'group_by': 'production_id',
            },
            'target': 'current',
        }

    @api.depends('analytic_account_ids')
    def _compute_project_ids(self):
        for rec in self:
            projects = self.env['project.project'].search([
                ('analytic_account_id', 'in', rec.analytic_account_ids.ids)
            ])
            rec.project_ids = projects

    @api.onchange('project_ids')
    def _onchange_project_ids(self):
        for rec in self:
            tasks = self.env['project.task'].search([
                ('project_id', 'in', rec.project_ids.ids),
                ('user_ids', '=', rec.employee_id.id),
                ('stage_id', 'not in', ['1_done', '1_cancelled'])
            ])

            lines = []
            for task in tasks:
                line = self.env['project.line'].create({
                    'operation_name': task.name,
                    'operation_date': fields.Date.today(),
                    'project_id': task.project_id.id,
                    'task_id': task.id,
                    'state': task.state,
                    'date_deadline': task.date_deadline,
                    'duration_expected': task.allocated_hours,
                    'duration_spent': task.effective_hours,
                    'line_type': 'project_task',
                })
                lines.append(line.id)

            rec.project_line_ids = [(6, 0, lines)]

    @api.onchange('manufacturing_order_ids')
    def _onchange_manufacturing_order_ids(self):
        for rec in self:
            lines = []
            for mo in rec.manufacturing_order_ids:
                for wo in mo.workorder_ids:
                    line = self.env['manufacturing.line'].create({
                        'production_id': mo.id,
                        'operation_name': wo.name,
                        'state': wo.state,
                        'work_order_id': wo.id,
                        'work_center_id': wo.workcenter_id.id,
                        'product_id': wo.product_id.id,
                        'duration_expected': wo.duration_expected,
                        'duration_spent': wo.duration,
                        'line_type': 'work_order',
                    })
                    lines.append(line.id)
            rec.manufacturing_line_ids = [(6, 0, lines)]

    @api.depends('employee_id')
    def _compute_daily_report_reference(self):
        for rec in self:
            if rec.employee_id:
                rec.daily_report_reference = str(rec.employee_id.name) + ' Daily Report'
            else:
                rec.daily_report_reference = 'Daily Report'

    def action_time_off_create(self):
        view_id = self.env.ref('hr_holidays.hr_leave_view_form_manager').id
        if self.work_status == 'half_day_off':
            request_unit_half = True
        else:
            request_unit_half = False

        return {
            'name': _('Time Off'),
            'type': 'ir.actions.act_window',
            'res_model': 'hr.leave',
            'views': [[view_id, 'form']],
            'context': {
                'default_holiday_type': 'employee',
                'default_employee_id': self.employee_id.id,
                'default_request_unit_half': request_unit_half,
            },
            'target': 'new',
        }

    def action_work_entry_create(self):
        view_id = self.env.ref('hr_work_entry.hr_work_entry_view_form').id
        now = datetime.now()
        date_start = datetime(year=now.year, month=now.month, day=now.day, hour=6, minute=0)
        date_stop = datetime(year=now.year, month=now.month, day=now.day, hour=14, minute=0)
        work_entry_type = self.env['hr.work.entry.type'].search([('code', '=', 'overtime_shift_basic')])
        return {
            'name': _('Work Entry'),
            'type': 'ir.actions.act_window',
            'res_model': 'hr.work.entry',
            'views': [[view_id, 'form']],
            'context': {
                'default_employee_id': self.employee_id.id,
                'default_date_start': date_start,
                'default_date_stop': date_stop,
                'default_work_entry_type_id': work_entry_type,
            },
            'target': 'new',
        }

    def action_convert_to_draft(self):
        self.state = 'draft'

    def action_send_for_review(self):
        self.state = 'waiting_for_review'

    def action_send_for_approved(self):
        for rec in self.project_line_ids:
            rec.action_create_timesheet()
        for rec in self.manufacturing_line_ids:
            rec.action_create_productivity()
        self.state = 'approved'

    @api.model
    def get_employee_radar_chart_data(self, employee_id=None):
        domain = [('state', '=', 'approved')]
        if employee_id != 0:
            if employee_id:
                domain.append(('employee_id', '=', employee_id))

            employees = self.env['hr.employee'].search([])
            data = {}
            for employee in employees:
                # Get reports for the last 30 days
                last_30_days_date = datetime.now() - timedelta(days=30)
                domain_last_30_days = domain + [('report_date', '>=', last_30_days_date)]
                reports_last_30_days = self.search(domain_last_30_days)

                # Get all time reports
                reports_all_time = self.search(domain)

                timesheets_duration_last_30_days = sum(
                    line.duration for report in reports_last_30_days for line in
                    report.project_line_ids)
                approved_reports_count_last_30_days = len(reports_last_30_days)
                projects_count_last_30_days = len(
                    set(project.id for report in reports_last_30_days for project in report.project_ids))
                leaves_count_last_30_days = len(reports_last_30_days.filtered(lambda r: r.work_status == 'off_work'))

                timesheets_duration_all_time = sum(
                    line.duration for report in reports_all_time for line in report.project_line_ids)
                approved_reports_count_all_time = len(reports_all_time)
                projects_count_all_time = len(
                    set(project.id for report in reports_all_time for project in report.project_ids))
                leaves_count_all_time = len(reports_all_time.filtered(lambda r: r.work_status == 'off_work'))

                data[employee.id] = {
                    'employee': employee.name,
                    'last_30_days': {
                        'timesheets_duration': timesheets_duration_last_30_days,
                        'approved_reports_count': approved_reports_count_last_30_days,
                        'projects_count': projects_count_last_30_days,
                        'leaves_count': leaves_count_last_30_days,
                    },
                    'all_time': {
                        'timesheets_duration': timesheets_duration_all_time,
                        'approved_reports_count': approved_reports_count_all_time,
                        'projects_count': projects_count_all_time,
                        'leaves_count': leaves_count_all_time,
                    }
                }
        else:
            employees = self.env['hr.employee'].search([])
            data = {'average': {
                'last_30_days': {
                    'timesheets_duration': 0,
                    'approved_reports_count': 0,
                    'projects_count': 0,
                    'leaves_count': 0,
                },
                'all_time': {
                    'timesheets_duration': 0,
                    'approved_reports_count': 0,
                    'projects_count': 0,
                    'leaves_count': 0,
                }
            }}

            total_employees = len(employees)
            if total_employees > 0:
                total_timesheets_duration_last_30_days = 0
                total_approved_reports_count_last_30_days = 0
                total_projects_count_last_30_days = set()
                total_leaves_count_last_30_days = 0

                total_timesheets_duration_all_time = 0
                total_approved_reports_count_all_time = 0
                total_projects_count_all_time = set()
                total_leaves_count_all_time = 0

                last_30_days_date = datetime.now() - timedelta(days=30)

                for employee in employees:
                    domain_last_30_days = domain + [('employee_id', '=', employee.id),
                                                    ('report_date', '>=', last_30_days_date)]
                    reports_last_30_days = self.search(domain_last_30_days)

                    reports_all_time = self.search(domain + [('employee_id', '=', employee.id)])

                    total_timesheets_duration_last_30_days += sum(
                        line.duration for report in reports_last_30_days for line in
                        report.project_line_ids)
                    total_approved_reports_count_last_30_days += len(reports_last_30_days)
                    total_projects_count_last_30_days.update(
                        project.id for report in reports_last_30_days for project in report.project_ids)
                    total_leaves_count_last_30_days += len(
                        reports_last_30_days.filtered(lambda r: r.work_status == 'off_work'))

                    total_timesheets_duration_all_time += sum(
                        line.duration for report in reports_all_time for line in
                        report.project_line_ids)
                    total_approved_reports_count_all_time += len(reports_all_time)
                    total_projects_count_all_time.update(
                        project.id for report in reports_all_time for project in report.project_ids)
                    total_leaves_count_all_time += len(reports_all_time.filtered(lambda r: r.work_status == 'off_work'))

                data['average']['last_30_days'][
                    'timesheets_duration'] = total_timesheets_duration_last_30_days / total_employees
                data['average']['last_30_days'][
                    'approved_reports_count'] = total_approved_reports_count_last_30_days / total_employees
                data['average']['last_30_days']['projects_count'] = len(
                    total_projects_count_last_30_days) / total_employees
                data['average']['last_30_days']['leaves_count'] = total_leaves_count_last_30_days / total_employees

                data['average']['all_time'][
                    'timesheets_duration'] = total_timesheets_duration_all_time / total_employees
                data['average']['all_time'][
                    'approved_reports_count'] = total_approved_reports_count_all_time / total_employees
                data['average']['all_time']['projects_count'] = len(total_projects_count_all_time) / total_employees
                data['average']['all_time']['leaves_count'] = total_leaves_count_all_time / total_employees

        return data

    @api.model
    def get_employee_polar_area_chart_data(self, employee_id=None):
        labels = []
        data = []
        project_set = set()

        # Get reports based on employee_id
        if employee_id:
            reports = self.search([('employee_id', '=', employee_id)])
        else:
            reports = self.search([])

        # Collect all unique projects
        for report in reports:
            for project in report.project_ids:
                if not project.stage_id.fold:
                    project_set.add((project.id, project.name))

        Project = self.env['project.project']
        for project_id, project_name in project_set:
            project = Project.browse(project_id)
            total_time = sum(project.timesheet_ids.mapped('unit_amount'))
            if employee_id:
                labels.append(project_name)
                data.append(total_time)
            else:
                employee_reports = self.search([('project_ids', 'in', project_id)])
                employee_count = len(employee_reports.mapped('employee_id'))
                average_time = total_time / employee_count if employee_count > 0 else 0
                labels.append(project_name)
                data.append(average_time)

        return {
            'labels': labels,
            'datasets': [{
                'label': 'Time(minute)' if employee_id else 'Average Time(minute)',
                'data': data,
            }]
        }

    @api.model
    def get_project_data(self):
        daily_reports = self.env['daily.report.management'].search([])

        project_data = {}

        for report in daily_reports:
            for project in report.project_ids:
                if not project.stage_id.fold:
                    if project.id not in project_data:
                        project_data[project.id] = {
                            'name': project.name,
                            'spent_hours': sum(project.timesheet_ids.mapped('unit_amount')),
                            'allocated_hours': project.allocated_hours,
                        }
                    else:
                        project_data[project.id]['spent_hours'] += sum(project.timesheet_ids.mapped('unit_amount'))

        data = [
            {'id': pid, 'name': pdata['name'], 'spent_hours': pdata['spent_hours'],
             'allocated_hours': pdata['allocated_hours']}
            for pid, pdata in project_data.items()
        ]

        return data

    @api.model
    def get_project_table_data(self):
        approved_reports = self.env['daily.report.management'].search([('state', '=', 'approved')])
        project_ids = set()

        for report in approved_reports:
            project_ids.update(report.project_ids.ids)

        active_projects = self.env['project.project'].search(
            [('stage_id.fold', '=', False), ('id', 'in', list(project_ids))])

        table_data = []
        for project in active_projects:

            open_tasks = self.env['project.task'].search_count(
                [('project_id', '=', project.id), ('user_ids', '!=', False), ('state', 'not in', ('1_done', '1_canceled'))])
            closed_tasks = self.env['project.task'].search_count(
                [('project_id', '=', project.id), ('user_ids', '!=', False), ('state', '=', '1_done')])

            successful_tasks = self.env['project.task'].search_count(
                [('project_id', '=', project.id), ('user_ids', '!=', False), ('remaining_hours', '<', 0)])
            unsuccessful_tasks = self.env['project.task'].search_count(
                [('project_id', '=', project.id), ('user_ids', '!=', False), ('remaining_hours', '>=', 0)])
            mrp_production_ids = self.env['mrp.production'].search([('analytic_distribution', '!=', False), ('state', '=', 'done')])
            produced_items = 0
            for mrp_prod in mrp_production_ids:
                analytic_account = mrp_prod.analytic_distribution
                for key in analytic_account.keys():
                    if int(key) == project.id:
                        produced_items += 1

            table_data.append({
                "name": project.name,
                "allocated_hours": project.allocated_hours,
                "deadline": project.date,
                "open_tasks": open_tasks,
                "closed_tasks": closed_tasks,
                "successful_tasks": successful_tasks,
                "unsuccessful_tasks": unsuccessful_tasks,
                "produced_items": produced_items,
            })

        return table_data
