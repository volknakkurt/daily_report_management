# Copyright 2024 Akkurt Volkan
# License AGPL-3.0.
from odoo import api, fields, models


class MrpProduction(models.Model):
    _inherit = 'mrp.production'
    _rec_name = 'product_id'
