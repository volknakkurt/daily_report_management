# Copyright 2024 Akkurt Volkan, Patrion
# License AGPL-3.0.

from odoo import api, fields, models, _
from odoo.exceptions import UserError
from datetime import timedelta, datetime


class ManufacturingLine(models.Model):
    _name = 'manufacturing.line'

    daily_report_management_id = fields.Many2one('daily.report.management', string="Daily Report")

    operation_name = fields.Char(string="Operation Name")
    operation_date = fields.Date(default=fields.Date.context_today, string="Operation Date")

    project_id = fields.Many2one('project.project', string="Project")
    project_ids = fields.Many2many('project.project', related="daily_report_management_id.project_ids",
                                   string="Projects")
    task_id = fields.Many2one('project.task', string="Task")
    date_deadline = fields.Date(string='Deadline', readonly=True)

    work_order_id = fields.Many2one('mrp.workorder', string="Work Order")

    work_center_id = fields.Many2one('mrp.workcenter', string="Work Center")
    product_id = fields.Many2one('product.product', string="Product")
    production_id = fields.Many2one('mrp.production', string="Manufacturing Order")
    duration_expected = fields.Float(string="Expected Duration")
    duration_spent = fields.Float(string="Spent Duration")
    duration = fields.Float(string="Duration")

    line_type = fields.Selection([
        ('work_order', 'Work Order'),
        ('project_task', 'Project Task')], default='project_task', string="Line Type")

    button_productivity_clicked = fields.Boolean(string="Button Productivity Clicked", default=False)
    button_timesheet_clicked = fields.Boolean(string="Button Timesheet Clicked", default=False)
    state = fields.Selection([
        ('01_in_progress', 'In Progress'),
        ('1_done', 'Done'),
        ('04_waiting_normal', 'Waiting'),
        ('03_approved', 'Approved'),
        ('1_canceled', 'Canceled'),
        ('02_changes_requested', 'Changes Requested'),
    ], string='State')

    def action_create_productivity(self):
        if not self.duration:
            raise UserError('You did not enter working durations!')
        else:
            now = datetime.now()
            remaining = self.duration
            self.env['mrp.workcenter.productivity'].create({
                'employee_id': self.daily_report_management_id.employee_id.id,
                'workcenter_id': self.work_center_id.id,
                'date_start': now,
                'date_end': now + timedelta(minutes=remaining),
                'loss_id': self.env.ref('mrp.block_reason7').id,
                'description': self.operation_name,
                'workorder_id': self.work_order_id.id
            })
            self.button_productivity_clicked = True

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
