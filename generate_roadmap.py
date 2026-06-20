# generate_roadmap.py
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class PropManagerPDF(FPDF):
    def __init__(self):
        super().__init__('P', 'mm', 'A4')
        self.set_auto_page_break(auto=True, margin=25)
        # Colors
        self.navy = (15, 23, 42)
        self.slate = (51, 65, 85)
        self.blue = (37, 99, 235)
        self.green = (22, 163, 74)
        self.red = (220, 38, 38)
        self.gray = (100, 116, 139)
        self.light_bg = (248, 250, 252)
        self.border = (226, 232, 240)

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'B', 10)
            self.set_text_color(*self.navy)
            self.cell(0, 8, 'PropManager Pro', align='L')
            self.set_font('Helvetica', '', 7)
            self.set_text_color(*self.gray)
            self.cell(0, 8, 'Roadmap & Launch Checklist', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_draw_color(*self.border)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(6)

    def footer(self):
        self.set_y(-20)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(*self.gray)
        self.cell(0, 10, f'Confidential - Page {self.page_no()}/{{nb}}', align='C')

    def title_page(self):
        self.add_page()
        self.ln(40)
        self.set_fill_color(*self.navy)
        self.rect(75, self.get_y(), 60, 4, 'F')
        self.ln(12)
        self.set_font('Helvetica', 'B', 30)
        self.set_text_color(*self.navy)
        self.cell(0, 14, 'PropManager Pro', align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(6)
        self.set_font('Helvetica', '', 13)
        self.set_text_color(*self.gray)
        self.cell(0, 9, 'Property Management SaaS Platform', align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(4)
        self.set_draw_color(*self.blue)
        self.set_line_width(0.8)
        self.line(70, self.get_y(), 140, self.get_y())
        self.ln(12)
        self.set_font('Helvetica', '', 11)
        self.set_text_color(*self.slate)
        self.cell(0, 8, 'Project Roadmap & Launch Checklist', align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.cell(0, 8, 'Version 1.0 - June 2026', align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(20)
        # Metadata box
        self.set_fill_color(*self.light_bg)
        self.set_draw_color(*self.border)
        y_start = self.get_y()
        self.rect(40, y_start, 130, 35, 'DF')
        self.set_xy(45, y_start + 6)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.slate)
        items = [
            'Backend:    Node.js + Express + TypeScript + Prisma',
            'Frontend:   React + Vite',
            'Database:   PostgreSQL (Supabase)',
            'Deploy:     Railway (API) + Vercel (UI)',
            'Status:     Architecture Refactor Complete'
        ]
        for item in items:
            self.cell(120, 5, item, align='L', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def section_title(self, title, color=None):
        if color is None:
            color = self.navy
        self.ln(4)
        self.set_fill_color(*color)
        self.rect(10, self.get_y(), 3, 8, 'F')
        self.set_x(16)
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(*color)
        self.cell(0, 8, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(8)

    def sub_heading(self, text, color=None):
        if color is None:
            color = self.blue
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*color)
        self.cell(0, 7, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def body(self, text):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(*self.slate)
        self.set_x(16)
        self.multi_cell(178, 5.5, text)
        self.ln(2)

    def bullet_item(self, text, checked=False):
        self.set_x(16)
        if checked:
            self.set_font('Helvetica', 'B', 9)
            self.set_text_color(*self.green)
            self.cell(6, 5.5, '+')
        else:
            self.set_font('Helvetica', 'B', 9)
            self.set_text_color(*self.blue)
            self.cell(6, 5.5, '-')
        self.set_font('Helvetica', '', 9)
        self.set_text_color(*self.slate)
        self.multi_cell(172, 5.5, text)

    def code_box(self, lines):
        self.set_x(20)
        self.set_fill_color(*self.light_bg)
        self.set_draw_color(*self.border)
        text_height = len(lines) * 5.5 + 8
        self.rect(20, self.get_y(), 170, text_height, 'DF')
        self.set_xy(24, self.get_y() + 4)
        self.set_font('Courier', '', 8)
        self.set_text_color(*self.navy)
        for line in lines:
            self.cell(162, 5.5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_y(self.get_y() + 4)
        self.ln(3)

    def phase_block(self, number, title, description, items, tag=None):
        self.set_fill_color(*self.blue)
        header_text = f'PHASE {number}'
        if tag:
            header_text += f'  [{tag}]'
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(255, 255, 255)
        self.cell(0, 9, f'  {header_text}', fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(3)
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*self.navy)
        self.set_x(14)
        self.cell(0, 7, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)
        if description:
            self.body(description)
        for item in items:
            self.bullet_item(item)
        self.ln(6)

    def domain_card(self, letter, title, description, items):
        self.set_fill_color(*self.light_bg)
        self.set_draw_color(*self.border)
        card_height = len(items) * 7 + 38
        y_start = self.get_y()
        self.rect(14, y_start, 182, card_height, 'DF')
        self.set_xy(18, y_start + 4)
        self.set_fill_color(*self.blue)
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(255, 255, 255)
        self.cell(14, 6, f'  {letter}', fill=True)
        self.set_x(34)
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*self.navy)
        self.cell(0, 6, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(18)
        self.ln(3)
        self.body(description)
        for item in items:
            self.bullet_item(item)
            self.set_x(18)
        self.set_y(y_start + card_height + 6)

    def checklist_card(self, items):
        self.set_fill_color(*self.light_bg)
        self.set_draw_color(*self.border)
        card_height = len(items) * 7 + 14
        y_start = self.get_y()
        self.rect(14, y_start, 182, card_height, 'DF')
        self.set_xy(18, y_start + 6)
        for item in items:
            self.bullet_item(item, checked=False)
            self.set_x(18)
        self.set_y(y_start + card_height + 4)


# ============================================================
# BUILD PDF
# ============================================================
pdf = PropManagerPDF()
pdf.alias_nb_pages()

# --- TITLE PAGE ---
pdf.title_page()

# --- PAYMENT DOMAINS ---
pdf.add_page()
pdf.section_title('Payment Architecture')

pdf.body('PropManager Pro handles two distinct payment domains. '
         'This separation is critical for clean architecture and compliance.')

pdf.domain_card(
    'A',
    'Landlord Business Payments  (MVP - Existing)',
    'Tenant-to-landlord transactions for rent and fees.',
    [
        'Rent payments processing',
        'Late fee calculation and collection',
        'Payment history and receipts',
        'Lease payment records tracking',
    ]
)

pdf.domain_card(
    'B',
    'SaaS Billing  (Phase 5 - Lemon Squeezy)',
    'Platform subscription revenue. Separate from landlord payments.',
    [
        'Monthly/annual subscription plans',
        'Automated billing via Lemon Squeezy',
        'Subscription status management',
        'Access gating based on subscription state',
    ]
)

# --- PHASES ---
pdf.add_page()
pdf.section_title('Project Phases')

pdf.phase_block(
    1, 'Frontend-Backend Integration',
    'Connect React frontend to Express API. Verify all CRUD operations '
    'work end-to-end with authentication and error handling.',
    [
        'Properties CRUD connected and tested',
        'Units CRUD connected and tested',
        'Tenants CRUD connected and tested',
        'Leases CRUD connected and tested',
        'Payments CRUD connected and tested',
        'Auth flow (register/login/token refresh) integrated',
        'Error states display correctly in UI',
        'Loading states implemented for all async operations',
    ]
)

pdf.phase_block(
    2, 'End-to-End Workflow Testing',
    'Complete user workflows across the entire stack before deployment.',
    [
        'Full landlord onboarding flow (register -> first property)',
        'Property -> Unit -> Tenant -> Lease -> Payment chain',
        'Archive and restore workflows for all entities',
        'Audit log recording verified end-to-end',
        'Error scenarios handled gracefully (network, auth, validation)',
        'Edge cases documented: empty states, concurrent edits, large data',
    ]
)

pdf.phase_block(
    3, 'Production Backend Deployment',
    'Deploy Express API to Railway with Supabase PostgreSQL.',
    [
        'Railway project created and configured',
        'Supabase production database provisioned',
        'Prisma migrations applied to production',
        'Environment variables set (JWT, DB URL, CORS)',
        'Health check endpoint responding',
        'CORS configured for Vercel production domain',
        'API documentation accessible',
    ]
)

pdf.phase_block(
    4, 'Production Frontend Deployment',
    'Deploy React frontend to Vercel with production API connectivity.',
    [
        'Vercel project created and configured',
        'Production environment variables set',
        'API base URL points to Railway backend',
        'Static assets served with caching headers',
        'Custom domain configured (optional)',
        'SSL/HTTPS enforced',
    ]
)

# --- PHASE 5 ---
pdf.add_page()
pdf.phase_block(
    5, 'SaaS Billing Integration',
    'Integrate Lemon Squeezy for subscription management. This is the '
    'final major feature before launch freeze.',
    [
        'Starter and Professional plans defined in Lemon Squeezy',
        'POST /billing/create-checkout endpoint functional',
        'POST /billing/webhook endpoint receiving events',
        'Subscription, Customer, BillingStatus tables created',
        'Webhooks: created, updated, cancelled, expired handled',
        'Inactive subscription -> read-only or blocked access',
        'Grace period for payment failures',
        'Billing audit logs recorded for all events',
    ],
    tag='v0.9.0'
)

pdf.ln(2)
pdf.sub_heading('Exit Criteria', pdf.green)
pdf.body('User can subscribe via checkout, subscription status updates '
         'automatically, and cancelled/expired subscriptions correctly gate access.')

# --- PHASE 6 ---
pdf.add_page()
pdf.phase_block(
    6, 'Launch Readiness',
    'Verify infrastructure resilience, backups, monitoring, and security.',
    [
        'Supabase PITR enabled and verified',
        'Automatic daily backups confirmed',
        'Recovery procedure: restore DB -> redeploy Railway -> redeploy Vercel -> verify',
        'Railway logs accessible',
        'Vercel logs accessible',
        'Supabase logs accessible',
        'JWT authentication verified',
        'Ownership checks prevent cross-tenant data access',
        'CORS restricted to production domains only',
        'All secrets in environment variables (none in code)',
        'HTTPS enforced on all endpoints',
    ]
)

pdf.ln(2)
pdf.sub_heading('Exit Criteria', pdf.green)
pdf.body('Production infrastructure can survive failure and recover within documented procedure.')

# --- PHASE 7 ---
pdf.phase_block(
    7, 'Public Launch',
    'MVP scope lock. No features beyond this list without explicit approval.',
    [
        'Properties management',
        'Units management',
        'Tenants management',
        'Leases management',
        'Payments management',
        'Subscription billing',
        'Audit logging for all actions',
    ]
)

# --- LAUNCH FREEZE ---
pdf.add_page()
pdf.section_title('Launch Freeze Rule', pdf.red)

pdf.sub_heading('Effective: Start of Phase 5', pdf.red)
pdf.ln(2)

freeze_items = [
    'NO new features permitted',
    'Bug fixes only - must be documented and approved',
    'Security fixes only - immediate action required',
    'Deployment fixes only - infrastructure stability',
]
for item in freeze_items:
    pdf.bullet_item(item)

pdf.ln(4)
pdf.set_fill_color(254, 242, 242)
pdf.set_draw_color(254, 202, 202)
y_box = pdf.get_y()
pdf.rect(14, y_box, 182, 16, 'DF')
pdf.set_xy(18, y_box + 3)
pdf.set_font('Helvetica', 'B', 9)
pdf.set_text_color(*pdf.red)
pdf.cell(0, 6, 'Why this matters:', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.set_x(18)
pdf.set_font('Helvetica', '', 8)
pdf.set_text_color(*pdf.slate)
pdf.cell(0, 6, 'Feature creep is the #1 cause of SaaS launch delays. This rule enforces shipping discipline.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

# --- MASTER CHECKLIST ---
pdf.ln(8)
pdf.section_title('Master Launch Checklist')

master_items = [
    'Register flow working end-to-end',
    'Login flow working end-to-end',
    'Properties CRUD fully functional',
    'Units CRUD fully functional',
    'Tenants CRUD fully functional',
    'Leases CRUD fully functional',
    'Payments CRUD fully functional',
    'Audit logs recording all actions',
    'Railway backend live and healthy',
    'Vercel frontend live and responsive',
    'Supabase database live with backups',
    'Lemon Squeezy billing accepting payments',
    'Subscription gating enforced correctly',
    'Database backups verified and tested',
    'Disaster recovery documented and practiced',
]

pdf.checklist_card(master_items)

pdf.ln(8)
pdf.set_draw_color(*pdf.blue)
pdf.set_line_width(1)
pdf.line(25, pdf.get_y(), 185, pdf.get_y())
pdf.ln(8)
pdf.set_font('Helvetica', 'B', 12)
pdf.set_text_color(*pdf.navy)
pdf.cell(0, 8, 'PropManager Pro  --  v1.0 Launch Candidate', align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(7)
pdf.set_font('Helvetica', '', 9)
pdf.set_text_color(*pdf.gray)
pdf.cell(0, 6, 'All items checked = Legitimate production SaaS, not a development project.', align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

# --- SAVE ---
output_path = r'C:\Users\DELL\Development\propmanagerpro\PropManagerPro_Roadmap.pdf'
pdf.output(output_path)
print(f'PDF generated: {output_path}')