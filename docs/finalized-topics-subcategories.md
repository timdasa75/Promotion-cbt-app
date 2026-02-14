# Finalized Topic & Subcategory Taxonomy (Directorate Cadre CBT) â€” Merged Version

This version consolidates overlapping areas so the curriculum is easier to navigate, while still aligning to Nigerian Federal Civil Service standard documents and directorate-level preparation needs.

## Consolidation decisions made

1. **FOI merged into Constitutional & Legal Framework** (FOI is retained as a subcategory, not a standalone top-level topic).
2. **Ethics merged into Civil Service Administration** (to reduce overlap with PSR conduct/discipline and admin practice).
3. **Negotiation merged into Leadership & Strategic Management** (industrial relations retained as a leadership subcategory).
4. **Official Circulars merged into PSR and Civil Service Administration** (treated as source overlays and targeted subcategories, not a separate topic).

## Finalized Topics (10)

### 1) Public Service Rules (PSR 2021)
- **Topic ID**: `psr`
- **Primary file**: `data/psr_rules.json`
- **Subcategories**:
  - `psr_appointments` â€” Appointments, Promotions & Transfers
  - `psr_discipline` â€” Discipline & Misconduct
  - `psr_leave` â€” Leave, Absence & Holidays
  - `psr_allowances` â€” Allowances, Pay & Benefits
  - `psr_ethics` â€” Conduct & Ethics
  - `psr_medical` â€” Medical & Welfare
  - `psr_training` â€” Training, Performance & Career Development
  - `psr_retirement` â€” Separation, Retirement & Pensions
  - `psr_general_admin` â€” General Administration & Office Procedures
  - `psr_interpretation` â€” Interpretation & Commencement
  - `psr_circulars_alignment` *(target for migration)* â€” Circulars Interpreting/Updating PSR Provisions

### 2) Financial Regulations (FR) & Public Financial Management
- **Topic ID**: `financial_regulations`
- **Primary file**: `data/financial_regulations.json`
- **Subcategories**:
  - `fin_budgeting` â€” Budgeting & Financial Planning
  - `fin_procurement` â€” Procurement under Financial Controls
  - `fin_audits_sanctions` â€” Audits, Sanctions & Compliance
  - `fin_general` â€” General Financial Management Principles

### 3) Public Procurement Act (PPA 2007)
- **Topic ID**: `procurement_act`
- **Primary file**: `data/public_procurement.json`
- **Subcategories**:
  - `proc_objectives_institutions` â€” Procurement Objectives & Institutions
  - `proc_bidding_evaluation` â€” Bidding, Evaluation & Award
  - `proc_transparency_ethics` â€” Transparency, Ethics & Accountability
  - `proc_eligibility_consultants_budgeting` â€” Eligibility, Consultants & Budgeting
  - `proc_implementation_sanctions` â€” Implementation, Monitoring & Sanctions

### 4) Constitutional, Legal & FOI Framework
- **Topic ID**: `constitutional_law`
- **Primary file**: `data/constitutional_foi.json`
- **Subcategories**:
  - `clg_constitutional_governance` â€” Constitutional Structure, Bodies & Principles
  - `clg_legal_compliance` â€” Legal Frameworks & Statutory Compliance
  - `clg_general_competency` â€” General Competency, Ethics & Reforms
  - `foi_access_obligations` â€” Access Rights & Obligations (FOI)
  - `foi_exemptions_public_interest` â€” Exemptions & Public Interest Tests (FOI)
  - `foi_offences_penalties` â€” Offences, Penalties & Enforcement (FOI)

### 5) Civil Service Administration, Ethics & Integrity
- **Topic ID**: `civil_service_admin`
- **Primary file**: `data/civil_service_ethics.json`
- **Subcategories**:
  - `csh_principles_ethics` â€” Civil Service Principles & Ethics
  - `csh_duties_responsibilities` â€” Duties & Responsibilities
  - `csh_discipline_conduct` â€” Discipline & Conduct
  - `csh_performance_training` â€” Performance & Training
  - `csh_administrative_procedures` â€” Administrative Procedures
  - `csh_innovation_technology` â€” Innovation & Technology in Administration
  - `csh_service_delivery_grievance` â€” Service Delivery & Grievance Handling
  - `eth_code_conduct` *(target for migration)* â€” Code of Conduct & Ethical Principles
  - `eth_values_integrity` *(target for migration)* â€” Civil Service Values & Integrity
  - `eth_anti_corruption` *(target for migration)* â€” Anti-Corruption Agencies & Measures
  - `eth_conflict_interest` *(target for migration)* â€” Conflict of Interest
  - `eth_misconduct` *(target for migration)* â€” Misconduct & Discipline
  - `eth_general` *(target for migration)* â€” General Ethics

### 6) Leadership, Strategic Management & Negotiation
- **Topic ID**: `leadership_management`
- **Primary file**: `data/leadership_negotiation.json`
- **Subcategories**:
  - `lead_principles_styles` â€” Leadership Principles & Styles
  - `lead_strategic_management` â€” Strategic Management & Planning
  - `lead_management_performance` â€” Management Functions & Performance
  - `neg_principles_outcomes` â€” Negotiation Principles & Outcomes
  - `neg_structure_bodies` â€” Negotiating Structures & Bodies
  - `neg_dispute_law` â€” Dispute Resolution & Labour Law

### 7) ICT Management & Digital Transformation
- **Topic ID**: `ict_management`
- **Primary file**: `data/ict_digital.json`
- **Subcategories**:
  - `ict_fundamentals` â€” ICT Fundamentals & Concepts
  - `ict_e_governance` â€” E-Governance & Digital Services
  - `ict_security` â€” Digital Security & Cybersecurity
  - `ict_literacy_innovation` â€” Digital Literacy & Innovation

### 8) Policy Analysis & Development
- **Topic ID**: `policy_analysis`
- **Primary file**: `data/policy_analysis.json`
- **Subcategories (target IDs for migration)**:
  - `pol_formulation_cycle` â€” Policy Formulation & Cycle
  - `pol_analysis_methods` â€” Policy Analysis Methods
  - `pol_implementation_evaluation` â€” Policy Implementation & Evaluation
  - `pol_public_sector_planning` â€” Public Sector Planning

### 9) General Knowledge & Current Affairs
- **Topic ID**: `general_current_affairs`
- **Primary file**: `data/general_current_affairs.json`
- **Subcategories**:
  - `ca_public_service_reforms` â€” Public Service & Institutional Reforms
  - `ca_national_governance` â€” National Governance & Policy Developments
  - `ca_international_affairs` â€” International & Regional Affairs
  - `ca_national_events` â€” National Events & Key Personalities
  - `ca_general` â€” General Current Affairs

### 10) Core Civil Service Competencies
- **Topic ID**: `competency_framework`
- **Primary file**: `data/core_competencies.json`
- **Subcategories (target IDs for migration)**:
  - `comp_numerical_reasoning` â€” Numerical & Mathematical Reasoning
  - `comp_verbal_reasoning` â€” Verbal & Analytical Reasoning

## What changed from the previous draft

- Top-level topics reduced from **14 â†’ 10** by merging overlap-heavy areas.
- Improved learner flow by grouping related standards and operational practice together.
- Preserved standards fidelity by retaining explicit FOI, ethics, negotiation, and circulars coverage as subcategory layers.

## Migration notes

- Completed in this phase:
  - Backfilled subcategory IDs in `data/core_competencies.json` and `data/policy_analysis.json`.
  - Updated `data/topics.json` to the 10-topic model with a single primary file per topic.
  - Consolidated all topic content into the 10 primary files to remove auxiliary dependencies.
- Auxiliary files merged and retired:
  - `data/freedom.json`, `data/ethics.json`, `data/negotiation.json`, and `data/circulars.json` were merged into their primary topic files and removed.

## Curriculum governance checklist

- Tag each question with: `sourceDocument`, `sourceSection`, `year`, `difficulty`, `lastReviewed`.
- Run quarterly statutory review for PSR/FR/PPA/Constitution/FOI/Circular-linked content.
- Run monthly refresh for Current Affairs.
- Enforce duplicate checks using normalized question text + source section fingerprints.

