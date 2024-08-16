# Copyright 2024 Akkurt Volkan
# License AGPL-3.0.

from odoo import api, fields, models


class ProjectTask(models.Model):
    _inherit = 'project.task'

    @property
    def OPEN_STATES(self):
        """ Return a list of the technical names complementing the CLOSED_STATES, a.k.a the open states """
        return list(set(self._fields['state'].get_values(self.env)))
