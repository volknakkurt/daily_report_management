# Copyright 2024 Akkurt Volkan, Patrion
# License AGPL-3.0.

from odoo import api, fields, models, _
from odoo.exceptions import UserError
from datetime import timedelta, datetime


class ProjectLine(models.Model):
    _name = 'project.line'

    daily_report_management_id = fields.Many2one('daily.report.management', string="Daily Report")

    operation_name = fields.Char(string="Operation Name")
    operation_date = fields.Date(default=fields.Date.context_today, string="Operation Date")

    project_id = fields.Many2one('project.project', string="Project")
    project_ids = fields.Many2many('project.project', related="daily_report_management_id.project_ids",
                                   string="Projects")
    task_id = fields.Many2one('project.task', string="Task")
    date_deadline = fields.Date(string='Deadline', readonly=True)

    duration_expected = fields.Float(string="Expected Duration")
    duration_spent = fields.Float(string="Spent Duration")
    duration = fields.Float(string="Duration")

    line_type = fields.Selection([
        ('work_order', 'Work Order'),
        ('project_task', 'Project Task')], default='project_task', string="Line Type")

    button_timesheet_clicked = fields.Boolean(string="Button Timesheet Clicked", default=False)
    state = fields.Selection([
        ('01_in_progress', 'In Progress'),
        ('1_done', 'Done'),
        ('04_waiting_normal', 'Waiting'),
        ('03_approved', 'Approved'),
        ('1_canceled', 'Canceled'),
        ('02_changes_requested', 'Changes Requested'),
    ], string='State')

    def action_create_timesheet(self):
        if not self.task_id:
            raise UserError('You did not enter the relevant task!')
        else:
            now = datetime.now().strftime('%Y-%m-%d')
            timesheet_id = self.env['account.analytic.line'].create({
                'date': now,
                'name': self.operation_name,
                'project_id': self.project_id.id,
                'task_id': self.task_id.id,
                'unit_amount': self.duration,
                'employee_id': self.daily_report_management_id.employee_id.id,
            })
            self.button_timesheet_clicked = True

            task = self.env['project.task'].browse(self.task_id.id)
            task.write({
                'state': self.state if self.state else '04_waiting_normal'
            })
