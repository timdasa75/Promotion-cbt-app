#!/usr/bin/env node
/**
 * Question bank quality fixes.
 *
 * Phase 1 — curated fixes (id-keyed, reviewed against the explanation):
 *   - Reconstruct truncated stems ("which of the following?" -> real question)
 *   - Rebuild placeholder/duplicate options (csh_sdg_066/067, circ_..._086)
 *   - Fix garbled stems ("primary the primary", "is to?", "best explains the X mandates...")
 *   - Correct metadata (psr_train_074 sourceSubcategoryName)
 *
 * Phase 2 — mechanical fixes applied to every question (safe, deterministic):
 *   - Trim + collapse double spaces (question, options, explanation)
 *   - Terminal punctuation: "?" for interrogative stems, "." otherwise
 *   - Capitalize the first visible word of lowercase-starting stems
 *   - Uppercase known acronyms that an earlier pass lowercased (psr -> PSR,
 *     ppa -> PPA, mda(s) -> MDA(s), ippis -> IPPIS, gl -> GL, ...)
 *   - Strip embedded letter/number prefixes from options ("A) 15 chapters.")
 *   - Fix mojibake apostrophes/quotes ("one?s" -> "one's", "?Corrected?" -> "'Corrected'")
 *   - Remove stray possessive apostrophe after bold ("**MDAs**'?" -> "**MDAs**?")
 *   - Collapse template garble ("primary the primary" -> "primary") and a/an errors
 *
 * Usage:
 *   node scripts/fix_question_quality.mjs [--bank <file>] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { NEW_QUESTIONS } from "./new_questions.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const BANK_FILES = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !["topics.json", "exam_templates.json", "gl_band_weights.json"].includes(f))
  .sort();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const bankArgIndex = process.argv.indexOf("--bank");
const requestedBank = bankArgIndex >= 0 ? process.argv[bankArgIndex + 1] : "";

// ---------------------------------------------------------------------------
// Curated fixes
// ---------------------------------------------------------------------------

// Reconstructed stems for truncated/garbled questions, written from each
// question's explanation + options so the tested concept is preserved and the
// correct index still matches. One entry per bank (no duplicate keys).
const CURATED_STEMS = {
  civil_service_ethics: {
    csh_duty_003: "Which office in a Ministry carries direct responsibility for accountability and proper public-finance control?",
    csh_duty_015: "Who is responsible for aligning staff development and training with organizational goals?",
    csh_duty_017: "Who is the Accounting Officer responsible for all financial transactions and compliance in a Ministry?",
    csh_duty_021: "Which body issues Circulars that clarify policies and implement reforms across MDAs?",
    csh_duty_027: "Which body is responsible for identifying and disseminating information for volunteer and internship programmes (PSR 020417)?",
    csh_duty_046: "Which office handles deployments, coordination of postings, and overall service reforms?",
    csh_disc_050: "Who is the disciplinary authority for Directors in the Federal Civil Service?",
    csh_disc_076: "Which body has ultimate authority on matters of ethical conduct and appeals?",
    csh_pt_001: "Which report is the official tool used to evaluate staff performance annually (PSR 050402)?",
    csh_pt_012: "In which document shall strategies to ensure continuous capacity development be encapsulated?",
    csh_pt_014: "If the emolument in an officer's former post is higher than the minimum point of the new salary grade level, at what point will the officer be placed?",
    csh_pt_026: "Who holds the authority to decide on restoring a deferred increment (PSR 040208)?",
    csh_ap_001: "Which administrative structure groups officers by professional discipline?",
    csh_ap_006: "Which office coordinates service-wide reforms and issues Establishment Circulars to keep administrative rules aligned across government?",
    csh_ap_007: "Who is authorized to promote eligible candidates to posts up to GL 06 (PSR 020801(b))?",
    csh_ap_016: "On whose authority shall appointments, promotions, and discipline for senior and junior officers in Parastatals be made (PSR 170301)?",
    csh_it_047: "Which register is the core financial control register that GIFMIS digitizes (FR 601)?",
    csh_sdg_046: "In accordance with whose guidelines shall all promotions be considered?",
    csh_sdg_068: "When handling service delivery and grievance matters, which choice reflects proper administrative ethics standards?",
    csh_duty_041: "With what objective must adverse comments on an officer's conduct be conveyed in sympathetic terms (**PSR** 050205)?",
    csh_duty_048: "Under **PSR** **rule 070103**, strategies to ensure continuous capacity development shall be encapsulated in which document?",
    csh_disc_012: "Under **PSR** **rule 100409**, an officer charged with a criminal offense must promptly report the charge to whom?",
    csh_disc_046: "The **PSR** rule that officers cannot be punished without being heard ensures adherence to which principle?",
    csh_pt_030: "Under **PSR** **rule 070210**, what shall a female officer who interrupts a course of training of not more than six months duration on grounds of pregnancy be required to do?",
    csh_pt_035: "**Rule 070102** states that training benefits the individual staff and the organization by positively impacting what?",
    csh_it_023: "The **Nigeria Data Protection Commission (NDPC)** enforces rules related to which of the following?",
    csh_sdg_038: "Under **PSR** **rule 020606**, officers may seek redress for grievances regarding posting instructions provided they submit the complaint within what period?",
    csh_pt_029: "What is the primary objective of the **Reward and Recognition System (R&RS)** in the civil service?",
    csh_it_003: "What is the primary objective of implementing **IPPIS** across the civil service?",
    csh_it_050: "What is the primary objective of **training on cyber hygiene** for civil servants?",
    csh_duty_045: "Remuneration for officers re-engaged on contract after retirement shall be based on which of the following (**PSR** 020412)?",
    csh_disc_026: "**PSR** forbids officers from seeking to influence prominent persons to gain promotion or transfer (**PSR** 100427), aiming to enforce which of the following principles?",
    csh_pt_016: "Under **PSR** **rule 070101**, staff development is the policy of enhancing the knowledge, skills, attitude, and efficiency of staff in order to meet which of the following?",
    csh_pt_019: "An officer may be granted special leave with full pay (**PSR** 120222) to take a **non-compulsory** examination, provided the permanent secretary certifies that the passing of the examination is likely to which of the following?",
    csh_pt_042: "**PSR** provides for officers to take courses of instruction under a technical assistance scheme. They receive emoluments while all other conditions of service are decided by which of the following?",
    csh_pt_049: "Under **PSR** **rule 050205**, the substance of any adverse comment on an officer's work or conduct must be conveyed in sympathetic terms with the objective of which of the following?",
    csh_ap_011: "**PSR** requires that any complaints or grievances with respect to posting instructions should be submitted through the appropriate channel within which of the following?",
    csh_ap_013: "An officer on **secondment** to another government or international organization may retain their substantive post and be entitled to increment and promotion, provided the period of secondment shall not exceed which of the following?",
    csh_ap_017: "**PSR** defines **acting appointment** (**PSR** 020703) as being **not** intended as a means of testing the suitability of officers for promotion, but normally made only in order to fill posts that are which of the following?",
    csh_ap_025: "**PSR** requires that petitions concerning administrative decisions affecting an officer personally must generally be handled within a maximum period of which of the following?",
    csh_ap_040: "Under **PSR** **rule 020606**, officers may seek redress where they are of the opinion that their job/location movement has not been done in line with which of the following?",
    csh_ap_086: "If a permanent secretary instructs an officer to destroy a record subject to a pending **FOI** request, both the permanent secretary and the officer may be liable under which of the following?",
    csh_sdg_010: "An officer may seek redress for a grievance regarding posting instructions (**rule 020606**) if they believe the decision violates which of the following?",
    csh_sdg_025: "Under **PSR** **rule 020606**, grievances regarding posting instructions must be addressed through which of the following?",
    csh_sdg_049: "Under **PSR** **rule 120233**, special leave with full pay for a period of up to two weeks on **compassionate grounds** is granted for which of the following?",
    csh_sdg_050: "**FCSC** facilitates improvement in the welfare of employees and enrichment of the administrative procedures/guidelines in the public service, serving as which of the following?",
  },
  constitutional_foi: {
    clg_con_003: "Which principle requires that appointments be fair and open, ensuring merit, credibility, and equal opportunity (Rule 170302)?",
    clg_con_005: "Into which account are all government revenues paid?",
    clg_con_006: "Who audits public accounts and reports to the National Assembly?",
    clg_con_010: "Which body receives asset declarations and monitors compliance with ethical standards?",
    clg_con_012: "Which document is the Oath of Allegiance/Oath of Office a binding promise to uphold?",
    clg_con_018: "Which formal government publication is used to publish laws, appointments, and constitutional changes?",
    clg_lc_023: "Which Act enforces secrecy requirements for civil servants handling official matters?",
    clg_lc_039: "Which certificate confirms that work was done or goods were received before payment is processed?",
    clg_lc_044: "Who must sign all payment vouchers before payments are processed?",
    FOI_EX_050: "Protecting test questions until they are administered preserves which of the following (FOI Act, S. 19)?",
    FOI_OP_036: "Who holds the guideline-making authority under the FOI Act?",
    clg_gc_063: "What is the primary objective of staff development and training (**rule 070101**)?",
    clg_gc_076: "What is the primary objective of the **Reward and Recognition Scheme (R&RS)** in the **PSR**?",
    clg_gc_083: "What is the purpose of the **contingencies fund**?",
    FOI_OP_015: "What is the primary objective of imposing penalties for **FOI** violations?",
    FOI_OP_057: "When drafts are given to the Secretary for fairing, what should be clearly recorded at the top of page 1 of every draft?",
    clg_lc_022: "**Section 58** of the Public Procurement Act (**PPA**) prescribes penalties for offenses such as bid rigging, collusion, and procurement fraud, including which of the following?",
    clg_lc_032: "The practice of illegally breaking down a contract into smaller units to circumvent approval limits is explicitly prohibited in the **PPA** as which of the following?",
    clg_gc_067: "Which body is responsible for issuing establishment circulars that amend, clarify, or interpret the public service rules (**PSR**)?",
    FOI_AO_034: "For efficiency, institutions are required to keep records in formats that make them easily accessible, as per **section 9**. This is vital for promoting which of the following?",
    FOI_AO_035: "Under **Section 5**, if an **MDA** receives a request for information that primarily concerns another **MDA**, the receiving **MDA** must transfer the request within which of the following?",
    FOI_AO_045: "If an officer discloses information in good faith, believing that the disclosure is required under the **FOI** Act, which section protects that officer from civil or criminal liability?",
    FOI_EX_040: "If an **MDA** denies a request based on the exemption provisions, the burden of proving that the harm outweighs the public benefit lies with which of the following?",
    FOI_OP_031: "**Section 10** applies to destruction of records needed for pending **FOI** requests, but does not apply to records destroyed as part of which of the following?",
    FOI_OP_032: "If an applicant is denied access, **Section 20** grants them the right to seek redress in a court of competent jurisdiction within how many days of the denial or deemed denial?",
    FOI_OP_037: "**Section 27** provides protection from liability for officers who disclose information, provided the disclosure is based on the officer's belief that it is required by the Act and is made in which of the following?",
    foi_offences_penalties_gen_020: "Which practice should a responsible officer prioritize to sustain offences, penalties & enforcement (FOI) compliance in Offences, Penalties & Enforcement (**FOI**)?",
  },
  financial_regulations: {
    fin_bgt_002: "Which legal instrument authorizes the Federal Government to withdraw funds from the CRF for annual expenditure?",
    fin_bgt_024: "If an officer is promoted to a grade level that does not overlap his old grade level, at what point shall he be placed (Rule 040104(i))?",
    fin_bgt_033: "Which fund is used for replacing depreciating government assets?",
    fin_bgt_048: "Which body is empowered to grant special increments (Rule 040207)?",
    fin_pro_001: "Which Act provides the primary legal basis and framework for managing public procurement processes in Nigeria?",
    fin_aud_005: "Which agency investigates and prosecutes financial crimes, fraud, and money laundering?",
    fin_aud_012: "Who holds the authority to decide on restoring a deferred increment (Rule 040208)?",
    fin_aud_025: "In whom is the power to dismiss and exercise disciplinary control over officers in the Federal Civil Service vested (Rule 100102)?",
    fin_aud_034: "Dismissal results in forfeiture of benefits, subject to the provisions of which Act (Rule 100407)?",
    fin_pro_033: "What is the primary objective of pre-qualification of bidders in the public procurement process?",
    fin_aud_017: "What is the purpose of activating an **audit alarm**?",
    fin_bgt_006: "Expenditure incurred by an **MDA** that exceeds the amount appropriated for that specific subhead without subsequent legislative sanction is termed which of the following?",
    fin_bgt_011: "**Medium-Term Expenditure Framework (MTEF)**, a key planning tool, requires government budgeting to focus on planning and projections over a rolling period of which of the following?",
    fin_aud_026: "Which specific body has delegated full disciplinary powers to Permanent Secretaries/Heads of Extra-Ministerial Offices in respect of officers on Salary **GL 13** and below?",
    fin_aud_027: "If the **FCSC** does not approve the officer's dismissal or impose any penalty, the officer shall be reinstated forthwith and be entitled to the full amount of salary denied him if he was interdicted or suspended, as stipulated by which of the following?",
    fin_aud_030: "Which committee's recommendation forms the basis for the discipline (including removal from office) of officers on Salary **GL 06** and below by the Permanent Secretary/Head of Extra-Ministerial Office?",
    fin_aud_033: "Before documentary evidence can be used against an officer during an inquiry (**rule 100307(vii)**), the officer must previously have been provided with a copy thereof or given which of the following?",
    fin_aud_036: "An officer involved in procurement fraud, such as collusion or over-invoicing, faces which penalty under the Public Procurement Act (**PPA**) framework (**Section 58**)?",
    fin_aud_038: "Which of the following best explains the expression 'serious financial embarrassment' (**rule 100414**)? It refers to an officer's state of indebtedness which has actually caused serious financial hardship to him and which may be prejudicial to which of the following?",
    fin_aud_039: "If an officer is suspected of **general inefficiency**, the superior officer must first administer instruction and warning and give the officer adequate time to redeem his image, for the objective of improving the officer's which of the following?",
    fin_aud_047: "In the case of an inquiry into serious misconduct, the head of the officer's department shall generally **not** be a member of the inquiry board, in order to maintain which of the following?",
    fin_aud_049: "An officer absent from duty without leave (**rule 100413**) renders himself liable to be dismissed from the service, and the onus rests entirely on him to show that circumstances do not justify the imposition of the full penalty. This is due to the concept of which of the following?",
    fin_gen_002: "Which government official is responsible for issuing **Treasury Circulars** that provide detailed instructions on financial procedures and implementation across MDAs?",
    clg_gc_072: "Use of the Government Integrated Financial Management Information System (**GIFMIS**) primarily supports the financial management process by providing which of the following?",
  },
  ict_digital: {
    ict_sec_039: "Which agency investigates and prosecutes financial crimes, including digital fraud affecting the public sector?",
    ict_f_036: "What is the primary objective of using **version control systems** (like Git) in government application development?",
    ict_f_073: "What is the primary function of a **Virtual Private Network (VPN)** in remote government access?",
    ict_eg_001: "What is the primary objective of the integrated payroll and personnel information system (**IPPIS**)?",
    ict_sec_072: "The ultimate disciplinary penalty for gross misconduct, such as digital fraud or corruption detected through the **GIFMIS**/**IPPIS** audit trail, is which of the following?",
  },
  leadership_negotiation: {
    leadership_smp_030: "What is the primary objective of **environmental scanning** in strategic planning?",
    leadership_smp_040: "What is the primary objective of the **contingencies fund** in public finance strategy?",
    leadership_smp_045: "When an **MDA** uses **Benchmarking** in its strategic review, what is its primary goal?",
    NLR_P_005: "What is the key purpose of executing a memorandum of understanding (MOU) after negotiation?",
    leadership_smp_034: "Which framework sets out government's spending priorities and projections over a three-year period?",
    leadership_smp_038: "In which document are training strategies encapsulated?",
    NLR_P_004: "What does BATNA stand for?",
    NLR_S_021: "To whom are unresolved disputes escalated through the Standing Committee?",
    leadership_lsm_017: "According to the **PSR**, an officer must make a statutory declaration renouncing membership in any secret society, and contravention may lead to which of the following?",
    leadership_lsm_028: "Which **PSR** Rule mandates that Officers must discharge every duty assigned to him by Government and accept liability of being stationed wherever his presence is considered to be most useful?",
    leadership_smp_029: "The strategy of setting **SMART goals** (specific, measurable, achievable, relevant, time-bound) is primarily used to ensure clarity and feasibility in which of the following?",
    leadership_mpf_012: "The **performance management cycle** shall run from January to December of every year and shall commence immediately after the leadership of each **MDA** has finalized which of the following?",
  },
  psr_rules: {
    psr_admin_002: "According to **PSR** 010102, to whom do the Rules apply?",
    psr_admin_005: "**PSR** 010105 provides that matters not expressly covered by the Rules shall be referred to whom?",
    csh_ap_033: "**PSR** **rule 120235** prohibits an officer on **leave of absence** from accepting what?",
    psr_interp_002: "**PSR** 180102 provides that the interpretation of any rule shall be the responsibility of whom?",
    psr_interp_047: "**PSR** 190107 states that the 2021 Rules supersede what?",
    psr_train_001: "According to **PSR** 070101, what is the purpose of training in the public service?",
    psr_train_050: "What is the primary objective of **PSR** chapter 7?",
    psr_ret_050: "What is the general objective of **PSR** chapters 8 and 9?",
    psr_admin_050: "What is the general purpose of chapter 11 of the **PSR**?",
    psr_interp_050: "What is the overall purpose of chapters 18 and 19 of **PSR** 2021?",
    ppa_ims_029: "Which body is vested with powers to appoint, promote, and discipline civil servants up to certain grade levels, including the Directorate Cadre?",
    CIRC_ATD_010: "Who approves an extension of the probationary period, which shall not exceed two years?",
    CIRC_LWA_012: "Dismissal results in forfeiture of benefits, subject to the provisions of which Act?",
    psr_app_032: "Which **PSR** rule mandates that advertisement for **FCSC** vacancies appear in three national newspapers and the Commission's website with a six-week application deadline?",
    psr_app_036: "Which **PSR** rule mandates that a newly recruited officer who has spent six months and above shall be allowed to sit for compulsory examinations for confirmation?",
    psr_app_042: "Which **PSR** rule disqualifies appointment without prior specific approval where a candidate has been convicted of a criminal offence or dismissed from public service?",
    psr_app_049: "Which **PSR** provision states that appointment documents and staff records must be typed/filled in ink and one copy sent to the National Record Centre and other offices?",
    PSIR_079: "What is the maximum period within which a newly appointed Officer on **GL.07**–17 is expected to complete the confirmation examination after taking up their appointment in the Ministry/Extra-Ministerial Office?",
    leadership_lsm_012: "Which **PSR** rule strictly prohibits an officer from seeking the influence of prominent persons for obtaining consideration in matters connected with promotion or postings?",
    csh_ap_047: "**PSR** requires that where the head of a department is not available for a period spanning one month (due to approved assignment or leave), the most senior officer is mandated to oversee the office of the head of the department. This is covered by which of the following?",
    leadership_smp_014: "The final authority for ratifying amendments to the public service rules (**PSR**), based on recommendations from the National Council on Establishments (NCE), is which of the following?",
    CIRC_ATD_004: "Which body retains the primary authority for discipline over officers on the established cadre (**GL 07** and above), as reinforced by the 2015 Disciplinary Circulars?",
    CIRC_ATD_005: "If an officer's transfer is at their own request, extant circulars (based on **PSR** **rule 140137**) clarify that they are entitled to which of the following?",
    CIRC_LWA_013: "The **PSR** mandates that all allowances, such as House Master/Mistress allowance or Science Teaching Allowance, shall be paid at the rates specified in which official document?",
    CIRC_PPC_017: "If an officer on **GL 14** meets all criteria, the minimum number of years required on the grade level before being considered for promotion to **GL 15** is which of the following?",
  },
  public_procurement: {
    ppa_objectives_015: "What is the primary objective of the Public Procurement Act, 2007?",
    ppa_ims_010: "**Section 57** prohibits public officials involved in procurement from having any personal interest that might compromise their judgment. This is the rule against what?",
    ppa_objectives_044: "Which body must review and approve contracts exceeding the MTB threshold?",
    ppa_bid_015: "Which bid must the contract be awarded to under Section 33?",
    ppa_bid_024: "At which stage do only technically responsive bidders compete on price?",
    ppa_bid_076: "To which bidder must the contract be awarded under Section 33?",
    ppa_ethic_006: "Section 12 mandates the establishment and publication of which journal to ensure wide dissemination of information regarding contracts awarded?",
    ppa_ethic_012: "Which record provides a chronological record of transactions, allowing auditors to verify integrity and traceability?",
    ppa_ethic_019: "Which agency monitors compliance with anti-corruption laws and investigates institutional corruption and ethical breaches?",
    ppa_ethic_028: "Which Act grants citizens the right to request public records, complementing the PPA's transparency mandates?",
    ppa_ethic_045: "Who reports on public accounts and unauthorized expenditure, providing the primary basis for PAC oversight?",
    ppa_ims_028: "Which certificate confirms satisfactory delivery of goods or completion of work before payment authorization?",
    ppa_ims_030: "Which record documents the flow of transactions, allowing auditors to verify integrity and traceability?",
    ppa_objectives_048: "For small value purchases below the competitive threshold, strict financial regulations typically mandate that the **MDA** must obtain a minimum of which of the following?",
    ppa_objectives_050: "The power of the BPP to cancel a procurement proceeding before contract award if irregularities are found (**Section 53**) reinforces the principle of which of the following?",
    ppa_bid_026: "**PPA** ensures that all bid opening procedures adhere to transparency by requiring minutes to be recorded and signed by representatives of which of the following?",
    ppa_ethic_007: "BPP is statutorily empowered to blacklist or permanently exclude contractors who commit offenses under **section 58**. This is based on sanctions provided in which of the following?",
    ppa_ethic_008: "The principle of transparency in bid opening (**section 27**) requires the procurement entity to record and sign the minutes in the presence of which of the following?",
    ppa_ethic_039: "Legal backing for the government's centralization of all revenues into the Treasury Single Account (**TSA**) promotes financial accountability by ensuring which of the following?",
    ppa_ethic_049: "Which body is responsible for regulating, monitoring, and enforcing compliance with the Public Procurement Act, thereby guaranteeing accountability across **MDAs**?",
    ppa_elb_010: "Pre-qualification (**section 22**) is primarily used to check the bidder's capacity *before* issuing tender documents, thereby saving resources during which of the following?",
    ppa_elb_019: "In the context of consultancy, which ethical concern must be verified before engaging a firm that previously helped the **MDA** draft the Terms of Reference (ToR) for the same project?",
    ppa_elb_029: "**MDA**'s procurement planning committee (PPC) ensures procurement items are correctly classified as goods, works, or services, as required by which of the following?",
    ppa_elb_039: "For major capital procurements, the **PPA** requires the procurement planning committee to align the project with the **MDA**'s needs assessment and the strategic objectives outlined in which of the following?",
    ppa_elb_046: "**PPA** mandates that the procurement planning process must precede the tendering phase, ensuring that the necessary funds have been secured through which of the following?",
    ppa_ims_017: "BPP's maintenance of a national database of contractors (**section 9**) supports monitoring by providing verified information on the contractor's which of the following?",
    ppa_objectives_027: "Before an **MDA** commences procurement planning, the PPC must establish the justification and scope through which of the following?",
  },
  core_competencies: {
    competency_verbal_014: "Which word best completes the sentence: 'The committee reached a unanimous ______ on the issue'?",
    competency_verbal_027: "Which word best completes the sentence: 'The officer was known for his strict ______ to rules'?",
    competency_verbal_050: "Which word correctly completes: 'The officer was praised for his ______ in handling the crisis'?",
  },
  general_current_affairs: {
    NGPD_001: "The Public Service Rules (**PSR**) apply to all officers except where specific terms in a contract or letter of appointment conflict with them. What must the **PSR** itself conform to?",
    IRA_129: "The **FCSC** makes appointments to posts graded **GL.07**–17. The deadline for application submissions is six weeks from the date of advertisement placement in how many national newspapers?",
  },
};

const CURATED_OPTIONS = {
  civil_service_ethics: {
    csh_sdg_066: ["Rule 100426.", "Rule 100422.", "Rule 100428.", "Rule 100427."],
    csh_sdg_067: ["Chapter 2.", "Chapter 4.", "Chapter 5.", "Chapter 6."],
  },
  psr_rules: {
    circ_appointments_tenure_discipline_gen_086: ["020306.", "020307.", "020308.", "020309."],
  },
  constitutional_foi: {
    FOI_OP_057: ["The number of copies required.", "The file number.", "The secretary's name.", "The date."],
  },
  core_competencies: {
    competency_num_045: ["86.", "85.", "87.", "88."],
  },
};

// Phase 3 (manual read-through) curated stems — garbled/truncated stems found
// during the full 10-bank read, written from each question's explanation +
// options so the tested concept and correct index are preserved.
const CURATED_STEMS_P2 = {
  core_competencies: {
    competency_num_028: "A machine cost ₦1,000,000 with salvage value ₦100,000 and useful life 5 years. Straight-line depreciation per year is which of the following?",
    competency_num_033: "A town of 1,000 people grows at 2% per annum. After 2 years the population is approximately which of the following?",
    competency_verbal_002: "Choose the word that is most similar in meaning to 'prerogative.'",
    competency_verbal_015: "Select the word that is opposite in meaning to 'scarce.'",
    competency_verbal_017: "Choose the synonym for 'meticulous.'",
    competency_verbal_022: "Choose the word that is most opposite in meaning to 'expand.'",
    competency_verbal_040: "Select the word closest in meaning to 'resilient.'",
    competency_verbal_011: "Choose the correct preposition: 'He insisted ___ his right to appeal.'",
    competency_num_070: "What does the term 'Permanent Secretary' mean?",
    competency_num_075: "According to Section 2 of the Finance (Control and Management) Act 1958, what does 'Public Finance' include?",
  },
  financial_regulations: {
    fin_bgt_039: "If an officer is promoted across overlapping salary levels, the placement rule dictates that the officer is placed at which of the following?",
    fin_bgt_038: "**Government Integrated Financial Management Information System (GIFMIS)** supports the budgeting process by providing which of the following?",
    fin_gen_045: "**Government Integrated Financial Management Information System (GIFMIS)** is primarily designed to integrate which of the following?",
    fin_gen_004: "What is the main purpose of the **cash book**?",
    fin_pro_067: "Which role is the regulatory authority in charge of setting standards and developing the legal framework for public procurement in Nigeria?",
  },
  public_procurement: {
    ppa_objectives_028: "For what minimum period must procurement documents and records be retained for audit and inspection purposes?",
    ppa_ims_005: "For what minimum period must procurement documents and records be retained by the procuring entity for audit and inspection purposes?",
    ppa_objectives_031: "Which of the following best describes the rule that allows preferential scoring or price advantage for local firms to encourage the use of Nigerian goods and services?",
    ppa_objectives_042: "The procurement objective that encourages community participation in small-scale, localized projects is provided for in which of the following?",
    leadership_smp_036: "The Nigerian Public Procurement Act (**PPA**) strategically emphasizes **open competitive bidding** as the default method to promote which of the following?",
    ppa_elb_073: "Which of the following best defines the process of verifying a bidder's technical capacity after bid opening but before contract award?",
  },
  general_current_affairs: {
    NGPD_075: "Which role is accountable for maintaining a payment voucher register and confirming the accuracy of entries before signing a voucher?",
    NEKP_171: "When an officer's increment has been withheld, what may the FCSC grant later to mitigate the lasting effect?",
  },
  constitutional_foi: {
    clg_constitutional_governance_gen_061: "Choose the option that is NOT one of the fundamental and universal principles for the provision of public services listed in the chapter?",
    FOI_OP_041: "If an officer inadvertently destroys a public record while transferring offices, would they be liable under **Section 10**?",
    FOI_OP_058: "Which section requires applications under the **FOI** Act to be heard and determined in a summary way?",
    FOI_AO_017: "**Section 2**(3) mandates public institutions to widely disseminate information through various media to the public. This relates to which of the following?",
    FOI_OP_77: "Which of the following actions is a criminal offence under Section 10 of the FOI Act?",
    FOI_EX_82: "Which of the following best describes the treatment of documents kept under security classification under the FOI Act?",
    FOI_OP_82: "Which of the following best describes the effect of failing to provide records in a form accessible to the applicant under the FOI Act?",
    // FOI Act section-citation corrections (verified against the actual Act map:
    // s.10 destruction offence, s.19(2) public-interest test, s.18 severability,
    // s.11 intl affairs/defence, s.12 law enforcement, s.13 training, s.9 records,
    // s.5 transfer, s.29 AGF oversight reports).
    FOI_OP_003: "What is the penalty prescribed for wrongful destruction or falsification of public records under **Section 10** of the FOI Act?",
    FOI_OP_005: "**Section 10** prohibits the destruction of records needed for pending **FOI** requests. This is intended to ensure which of the following?",
    FOI_OP_009: "If an officer is prosecuted for willful concealment of records (s. 10), this action is typically initiated by which of the following?",
    FOI_OP_010: "**Section 10** addresses which cluster of criminal activities related to public records?",
    FOI_OP_014: "Under **Section 10** of the FOI Act, falsification of public records by an officer constitutes what?",
    FOI_OP_018: "What happens if a public officer is found guilty of an offense under **Section 10**?",
    FOI_OP_022: "Which act is treated as a criminal offense under **Section 10** of the FOI Act?",
    FOI_OP_027: "**Section 10** ensures the accountability of officers concerning public records by criminalizing which of the following?",
    FOI_OP_028: "Penalty for unlawful destruction of records under the **FOI** Act (**Section 10**) includes which of the following?",
    FOI_OP_034: "**Section 10** of the **FOI** Act is primarily concerned with protecting the integrity of government which of the following?",
    FOI_OP_048: "Which body ensures the enforcement of the criminal offences outlined in **Section 10**?",
    FOI_OP_049: "An officer found to have willfully concealed records (s. 10) is liable to which of the following?",
    FOI_OP_064: "Why does **Section 10** prohibit destroying records needed for pending FOI requests?",
    FOI_OP_065: "**Section 10** does not apply where records are destroyed as part of what lawful process?",
    FOI_EX_012: "When may otherwise exempt information be disclosed under **Section 19**(2) of the FOI Act?",
    FOI_EX_013: "How are exemptions under the FOI Act to be interpreted?",
    FOI_EX_019: "If otherwise exempt geological data must be disclosed because it relates to massive environmental fraud, this action would be justified by the principle of which of the following?",
    FOI_EX_027: "The inclusion of the Public Interest Test (**Section 19**(2)) serves what strategic objective regarding exemptions?",
    FOI_EX_031: "Where a record contains both exempt and non-exempt information, which section requires the institution to disclose the non-exempt parts?",
    FOI_EX_039: "Which section exempts information whose disclosure could be injurious to the conduct of international affairs or the defence of Nigeria?",
    FOI_OP_029: "Which section exempts information compiled for law enforcement or investigation where disclosure could interfere with an ongoing investigation or endanger safety?",
    FOI_OP_043: "Which section empowers a court, where a denial of access was unjustified, to order the public institution to disclose the information?",
    FOI_OP_050: "Reading exemptions narrowly in favour of disclosure promotes accountability by minimizing which of the following?",
    FOI_OP_075: "Which section allows the court, during **FOI** proceedings, to examine the very information in dispute without public disclosure?",
    FOI_AO_016: "**Section 9** obliges institutions to maintain records in which format for easy access?",
    FOI_AO_023: "What is required of public institutions regarding compliance reports under **Section 29**?",
    FOI_AO_025: "For the prompt handling of **FOI** requests, which institutional arrangement is central to effective implementation?",
    FOI_AO_038: "To ensure effective compliance, **Section 13** requires public institutions to maintain which of the following?",
    FOI_AO_046: "Establishment of **FOI** desk officers is a strategy to ensure which of the following?",
    FOI_AO_049: "Requirement in **Section 9** for maintaining updated indexes of records enhances which of the following?",
    FOI_OP_038: "If an **MDA** fails to designate an **FOI** desk officer, this constitutes a failure in which of the following?",
    FOI_EX_023: "Which of the following is most likely exempt under **Section 17** (Research Materials)?",
    FOI_EX_024: "Records of deliberations concerning international affairs and national defence, protected under **Section 11**, are most likely to be held by which body?",
    FOI_EX_029: "**Section 11** deals with international affairs and national defence. This provision aims to ensure the protection of which of the following?",
    FOI_EX_030: "Decision to withhold information under **Section 17** (exams) is conditional on the examination material being which of the following?",
    FOI_EX_035: "When geological data is denied under an applicable **FOI** exemption, the denial is predicated on protecting which of the following?",
    FOI_EX_041: "Information exempt under **Section 11** (international affairs and defence) is primarily protected to maintain which of the following?",
    FOI_EX_042: "Exemption protecting research materials and pending academic work (**Section 17**) is intended to ensure which of the following?",
    // --- round 2: remaining section-citation corrections ---
    FOI_AO_015: "Which institutional arrangement ensures that FOI requests are handled promptly by staff with clear responsibility?",
    FOI_AO_044: "The form in which access to a record is granted should be the one preferred by the applicant, unless which of the following?",
    FOI_EX_010: "Geological and mineral exploration data obtained in confidence from a private firm would most likely be exempted under which section of the **FOI** Act?",
    FOI_EX_016: "If a record contains both exempt deliberations and non-exempt public expenditure information, the principle of partial disclosure mandates which of the following?",
    FOI_EX_045: "Which exemption is intended to protect commercial or financial information obtained in confidence from a third party?",
    FOI_OP_046: "Failure to produce records in accessible, machine-readable formats (s. 9) undermines which of the following?",
    FOI_OP_071: "What objective is undermined when records are not provided in accessible, machine-readable form under Section 9?",
  },
  leadership_negotiation: {
    leadership_smp_005: "What is the primary task in strategic implementation that involves allocating funds and personnel across objectives efficiently?",
    leadership_smp_016: "What is the primary strategic objective of the Nigerian Open Contracting Portal (NOCOPO)?",
    leadership_smp_042: "What is the main purpose of a **renewal fund** or **replacement reserve fund** in a strategic context?",
    leadership_smp_049: "What is the primary strategic objective of linking **reward and recognition** to measurable performance (**rule 060103**)?",
    leadership_mpf_005: "What is the main purpose that **feedback** serves in performance management?",
    leadership_mpf_030: "If an officer is in receipt of a personal allowance, such allowance will be treated as part of his substantive basic emolument for the purpose of calculating which of the following?",
    leadership_mpf_050: "What is the primary objective of the **civil service handbook** in providing clear guidelines on administrative workflow and conduct?",
  },
  policy_analysis: {
    policy_psr_043: "What was one of the key recommendations of the Udoji Commission?",
  },
  civil_service_ethics: {
    csh_principle_017: "What is the primary purpose of the mandatory asset declaration requirement for public officers?",
    csh_principle_021: "The contravention of **PSR rule 020211** (prohibition of membership of a secret society) is regarded as which of the following?",
    csh_principle_031: "The rule against civil servants seeking to influence prominent persons to gain appointment, transfer, or promotion is aimed at preventing which of the following?",
    csh_principle_032: "**PSR rule 100402(r)** classifies holding more than one full-time paid job as which of the following?",
    csh_ap_022: "**PSR rule 020507** outlines conditions for an applicant to be considered for which of the following?",
    ethics_007: "Which of the following is an ethical obligation of public servants?",
    csh_sdg_061: "Choose the best answer for: What should a civil servant do with a circular that necessitates action to be taken?",
  },
  ict_digital: {
    ict_li_105: "What is the main purpose of the 'track changes' feature in a shared document?",
  },
  psr_rules: {
    psr_leave_061: "What is the consequence for an officer who fails to pass the compulsory confirmation examination within the stipulated period?",
    psr_allow_065: "What is the main aim of Rule 021002?",
    psr_allow_056: "Who is responsible for forwarding departmental files and other documents necessary for processing retirement to PENCOM?",
    psr_disc_041: "If a disciplinary case leads to dismissal and the officer appeals unsuccessfully, can he be re-employed?",
    psr_leave_069: "What document is demanded for appointment to senior posts?",
    psr_allow_052: "Select the statement that is true about acting appointments?",
    psr_allow_063: "Which of the following best defines the term \"maximum duration of an acting appointment\" according to official standards?",
  },
};

// Phase 3 curated options (full arrays, correct index preserved).
const CURATED_OPTIONS_P2 = {
  ict_digital: {
    ict_eg_080: ["Conflicts", "Responsiveness", "Security and Order", "Welfare of the People."],
    ict_eg_085: ["Responsiveness", "Security and Order", "Welfare of the People.", "Conflicts"],
    ict_li_079: ["To facilitate international tenders exclusively.", "To serve as a chief and definitive source of all information on government procurement", "To be a platform for public complaints only", "To serve as a private communication channel for government officials"],
    ict_li_083: ["That they are based on verified facts, figures, and data.", "That they are as short as possible.", "That they are as long as possible.", "That they are based on personal opinion."],
    ict_li_090: ["That they are based on verified facts, figures, and data.", "That they are as short as possible.", "That they are as long as possible.", "That they are based on personal opinion."],
  },
  financial_regulations: {
    fin_pro_062: ["It must not be paid without the authority of the Accounting Officer.", "It should be held indefinitely by the government.", "It should be paid immediately to the officer's family.", "It must be used to offset the officer's debts."],
    fin_pro_065: ["The Financial Regulations book, Chapter 16.", "The annual budget document.", "The HR policy manual.", "The organization's internal memo."],
    fin_pro_067: ["The Auditor-General for the Federation.", "The Accountant-General of the Federation.", "The Head of the Civil Service of the Federation.", "The Bureau of Public Procurement"],
    fin_pro_055: ["The Accounting Officer.", "The Head of Finance and Accounts of a ministry.", "The Accountant-General.", "The Minister of Finance."],
    fin_gen_046: ["Integrated Payroll and Personnel Information System (IPPIS).", "Treasury Single Account (TSA).", "Bureau of Public Procurement (BPP).", "Government Integrated Financial Management Information System (GIFMIS)."],
    fin_gen_054: ["Development Fund.", "Treasury Single Account.", "Federation Account.", "Consolidated Revenue Fund."],
    fin_gen_062: ["The Accountant-General and the Auditor-General or their representatives.", "Only the Accounting Officer.", "Only the Minister of Finance.", "The Head of Finance and Accounts."],
    fin_gen_063: ["The Auditor-General.", "The Accountant-General.", "The Head of the Civil Service.", "The Minister of Finance."],
    fin_gen_070: ["The Head of the Civil Service.", "The Auditor-General for the Federation.", "The Accountant-General of the Federation.", "The Minister of Finance."],
    fin_gen_071: ["Only federal ministries.", "Only extra-ministerial offices.", "The Federal Public Service, including ministries, extra-ministerial offices, and other arms of government.", "Only self-accounting units."],
    fin_gen_075: ["All officers.", "Only the Head of Finance and Accounts.", "Only the Auditor-General.", "Only the Accountant-General."],
    fin_aud_063: ["The Head of Internal Audit.", "The Accountant-General.", "The Accounting Officer.", "The Head of Finance and Accounts."],
    fin_aud_066: ["To track the movements of the Revenue Collector.", "To serve as an internal audit document.", "To support the lodgement of moneys with a Sub-Accounting Officer.", "To report a loss of funds."],
    fin_aud_073: ["A form signed by the Accountant-General.", "Verbal permission from the Head of Department.", "A written request.", "A requisition form (Treasury Form 65A) in triplicate."],
    fin_aud_074: ["It ensures specialization and clear accountability for pension-related financial procedures.", "It prevents any external audits.", "It simplifies the overall accounting procedure.", "It allows for less oversight."],
  },
  public_procurement: {
    ppa_objectives_049: ["A promotion to a non-procurement post.", "Demotion or reduction in rank.", "Imprisonment and/or a substantial fine.", "Mandatory annual leave."],
    ppa_elb_023: ["Operational training requirements.", "Approval thresholds for contract awards.", "Emergency procurement procedures.", "Staff promotion procedures."],
    ppa_elb_053: ["To protect information that could be harmful if disclosed.", "To make it difficult to access.", "To make it a permanent document.", "To hide its contents from other Ministries."],
    ppa_elb_054: ["To make it difficult to access.", "To hide its contents from other Ministries.", "To make it a permanent log.", "To protect information that could be harmful if disclosed."],
  },
  general_current_affairs: {
    NGPD_064: ["An officer who approves all capital expenditure.", "An officer in charge of auditing revenue collections.", "An officer entrusted with the disbursement of public money for which vouchers cannot be immediately presented to a Sub-Accounting Officer, and who keeps a cash book.", "An officer who manages the ministry's main bank account."],
    ca_national_events_gen_071: ["The Paying Officer.", "The Accountant-General.", "The ministry, extra-ministerial office, or other arms of Government authorising payment.", "The payee."],
    ca_national_events_gen_079: ["Quarterly.", "Weekly and at the close of each month.", "Once every month.", "Annually."],
    NEKP_171: ["One or more special increments.", "A cash bonus.", "An extra leave period.", "A promotion."],
  },
  constitutional_foi: {
    // Desk officers are an administrative practice (FOI implementation guidelines), not a
    // statutory provision — rework the options so no fabricated "Section 5(1)" is tested.
    FOI_AO_015: [
      "Outsourcing FOI requests to private consultants.",
      "Limiting FOI requests to written form only.",
      "Appointing dedicated FOI desk officers.",
      "Charging search and processing fees.",
    ],
    FOI_EX_82: [
      "Their classified status does not preclude disclosure under the Act.",
      "They are automatically exempt from the Act.",
      "They can never be released to anyone.",
      "They must be destroyed after classification.",
    ],
    clg_constitutional_governance_gen_061: ["Principle of nepotism.", "Principle of continuity.", "Principle of legality.", "Principle of equality of treatment."],
    clg_general_competency_gen_071: ["GL 10 and above.", "GL 08 and below.", "GL 08 and GL 09.", "GL 08 - GL 10."],
    clg_general_competency_gen_073: ["Six years.", "Two years.", "Four years.", "Eight years."],
    clg_general_competency_gen_076: ["Guarantee actions remain within statutory authority and constitutional safeguards.", "Delay escalation until issues become material and difficult to reverse.", "Proceed without validating source records and decision criteria.", "Treat exceptions as normal practice without written justification."],
    clg_general_competency_gen_092: ["Rely on informal instructions without documentary evidence.", "Close cases without validating facts or demand records.", "Guarantee administrative actions remain within constitutional limits.", "Delay decisions until issues escalate into avoidable crises."],
    clg_constitutional_governance_gen_062: ["To allow civil servants to participate in partisan politics.", "To guarantee that civil servants serve the government of the day without political bias.", "To prevent civil servants from having any opinions.", "To allow civil servants to publicly criticize government policies."],
    clg_constitutional_governance_gen_074: ["Refusing to carry out an unlawful order.", "Voting for an opposition party.", "Giving constructive criticism to a superior in private.", "Publicly criticizing the government."],
    clg_constitutional_governance_gen_069: ["To document the personal lives of civil servants.", "To create a historical archive of government actions.", "To generate a paper trail for all financial transactions.", "To provide a basis for continuity and reference to the decisions of past governments."],
    clg_constitutional_governance_gen_081: ["To document the personal lives of civil servants.", "To provide a basis for continuity and reference to the decisions of past governments.", "To create a historical archive of government actions.", "To generate a paper trail for all financial transactions."],
    FOI_OP_053: ["The last school or college attended", "Both A and B", "A local government chairman.", "His/her last employer"],
  },
  leadership_negotiation: {
    leadership_lsm_062: ["To discuss new business.", "To review the decisions and actions taken from the previous meeting.", "To discuss personal issues.", "To debate old decisions."],
    leadership_mpf_048: ["55 years or 30 years in service.", "60 years of age or 35 years of service, whichever comes first.", "65 years only.", "After 40 years in service."],
    leadership_smp_023: ["To allow the MDA to bypass competitive bidding.", "To confirm compliance with procurement rules and budgetary capacity before final award.", "To increase the contract sum.", "To speed up payment processing."],
    leadership_smp_058: ["By sending a blank document.", "By phone call only.", "By quoting verbatim specific extracts or conveying the gist of the information.", "By sending a personal letter."],
    leadership_smp_062: ["Passenger names and destinations.", "Fuel purchases only.", "Departure/arrival times, mileage, and objective of journey.", "Date and driver's name only."],
    leadership_smp_073: ["To waste time before the meeting starts.", "To show off his intelligence to the members.", "To guarantee a smooth and effective control of the meeting and earn the respect of the members.", "To give the Secretariat less work to do."],
  },
  policy_analysis: {
    policy_constitution_069: ["Serving as the Administrative Head.", "Preventing fraud and corruption.", "Appearing before Public Accounts Committees.", "Formulating government policy on behalf of the Minister."],
    policy_constitution_067: ["To discard them.", "To provide the political leadership with instruments to administer government at the highest level.", "To keep them confidential from their superiors.", "To make a policy pronouncement without approval."],
    policy_psr_054: ["Discard it.", "Keep it for themselves.", "Give it to the officer in charge of the most appropriate Registry.", "Send it to the Chairman."],
    policy_psr_055: ["A wife/husband married under the Marriage Act, customary law, or Islamic law.", "Any family member.", "A domestic partner.", "A dependent child."],
    pol_analysis_methods_gen_076: ["The officer's recommendations and conclusions.", "The officer's personal opinion.", "A detailed financial analysis.", "A list of all staff involved."],
    pol_analysis_methods_gen_079: ["Political campaigns.", "The affairs of private citizens.", "Successful conception, planning, execution and monitoring of the policies, projects and programmes of Government.", "Private business ventures."],
  },
  civil_service_ethics: {
    csh_ap_052: ["Effectiveness and Efficiency", "Equity and Inclusiveness", "Consensus Orientation", "Accountability"],
    csh_ap_056: ["The Constitution.", "The government.", "The public trust.", "The political party."],
    csh_ap_086: ["The Fiscal Responsibility Act and budget implementation rules.", "Under the FOI Act.", "The Official Secrets Act as sole governing framework.", "The Appropriation Act and Financial Regulations provisions."],
    csh_ap_231: ["The Head of Finance and Accounts.", "Only the Minister of Finance.", "Only the Accounting Officer.", "The Accountant-General and the Auditor-General or their representatives."],
    ethics_102: ["To move on with the meeting anyway.", "To revert to the convening authority to seek clarification.", "To dismiss the meeting entirely.", "To force his own interpretation of the role on the members."],
    eth_general_gen_090: ["The officer's personal opinion.", "A list of all staff involved.", "A detailed financial analysis.", "The officer's recommendations and conclusions."],
    eth_general_gen_093: ["One day.", "Two days.", "Seven days.", "Five working days."],
    eth_general_gen_097: ["A good style.", "A very informal style.", "A complex style.", "A poetic style."],
  },
  psr_rules: {
    psr_allow_056: ["The officer retiring.", "The Permanent Secretary/Head of Extra-Ministerial Office.", "The Departmental Pension Officer.", "The Head of the Civil Service of the Federation."],
    psr_allow_060: ["Salary advance on first appointment.", "Non-personal advances", "Recovery of advances", "Personal advances"],
    psr_allow_066: ["Travelling allowances.", "Commission or profits of any kind, but will devote the whole of their time to the service of the Government.", "Emoluments.", "Leave benefits."],
    psr_leave_067: ["The date of promotion.", "The date of assumption of duty.", "1st January of every year.", "The first day of the month of appointment."],
    psr_leave_069: ["Federal Civil Service Commission Application Form (FCSC Form 1).", "Federal Civil Service Commission Application Form (FCSC Form 2).", "Public Service Application Form (PS Form 1).", "Personal Particulars Form (Gen 60)."],
    psr_allow_052: ["They are made only when an officer is due for promotion.", "They are not to be made unless absolutely necessary.", "They are made for all grade levels.", "They are only for a duration of six months."],
    psr_allow_071: ["Weekly installments.", "Monthly installments of one twelfth of the annual rate.", "Bi-monthly installments.", "As a lump sum at the end of the year."],
  },
};

// Distractor upgrades (manual read): per-index option replacements that turn
// ultra-short / obviously-wrong options into plausible-sounding distractors
// (expanded acronyms, fuller wrong definitions). Options are keyed by their
// CANONICAL (pre-scramble) index — the answer-order pass reorders afterwards.
const CURATED_OPTIONS_P3 = {
  civil_service_ethics: {
    csh_ap_123: { 1: "To make the file easier to read and retrieve.", 2: "To make the file thicker for archival purposes.", 3: "To hide the minutes from public scrutiny." },
    csh_ap_126: { 0: "To hide the minutes from public scrutiny.", 3: "To make the file thicker for archival purposes." },
    csh_it_031: { 2: "Secrecy and confidentiality of official records." },
    csh_it_033: { 0: "HyperText Markup Language (HTML).", 1: "Cascading Style Sheets (CSS).", 3: "PHP programming language." },
    csh_principle_070: { 1: "The disciplinary procedures applicable to erring officers.", 2: "Training programmes organised for newly recruited officers.", 3: "The retirement and pension benefit plans of the Service." },
    csh_pt_069: { 1: "Approving the annual budgets of MDAs.", 3: "Coordinating service-wide training programmes." },
    eth_general_gen_083: { 0: "The retirement and pension benefit plans of the Service.", 1: "Training programmes organised for newly recruited officers.", 2: "The disciplinary procedures applicable to erring officers." },
    ethics_005: { 2: "Nigerian Communications Commission (NCC)." },
    ethics_010: { 1: "Nigerian Communications Commission (NCC).", 3: "Independent National Electoral Commission (INEC)." },
    ethics_031: { 2: "Nigerian Communications Commission (NCC).", 3: "Independent National Electoral Commission (INEC)." },
    ethics_038: { 2: "Independent National Electoral Commission (INEC).", 3: "Nigerian Communications Commission (NCC)." },
    ethics_046: { 3: "Nigerian Communications Commission (NCC)." },
    ethics_055: { 2: "Nigerian Communications Commission (NCC)." },
    ethics_063: { 3: "Nigerian Communications Commission (NCC)." },
  },
  constitutional_foi: {
    clg_lc_046: { 0: "Loyalty to the appointing authority.", 1: "Adequate funding of the audit unit." },
    FOI_AO_034: { 2: "Secrecy of official records." },
    // section-citation corrections (canonical index): offences -> s.10, no fine
    FOI_OP_003: { 1: "Imprisonment for a minimum term of one year." },
    FOI_OP_004: { 0: "Section 10." },
    FOI_OP_006: { 2: "Section 10." },
    FOI_OP_018: { 1: "Imprisonment for a minimum term of one year and dismissal from service." },
    FOI_OP_028: { 2: "Imprisonment for a minimum term of one year." },
    FOI_OP_033: { 1: "Willful concealment of records (S. 10)." },
    FOI_OP_049: { 3: "Imprisonment for a minimum term of one year." },
    // public-interest / narrow-interpretation cluster -> real provisions
    FOI_EX_031: { 2: "Section 18." },
    FOI_EX_039: { 2: "Section 14(1).", 3: "Section 11." },
    FOI_EX_041: { 0: "The nation's security and the effective conduct of international affairs." },
    FOI_OP_029: { 0: "Section 12(1)." },
    FOI_OP_043: { 2: "Section 25." },
    FOI_OP_058: { 0: "Section 21." },
    FOI_OP_075: { 0: "Section 22." },
    // round 2: national security/defence -> s.11; life/safety -> s.12; severability -> s.18;
    // reports -> s.29; geological/commercial data -> s.15; PPA budgetary provision -> s.16
    FOI_EX_018: { 1: "Section 11." },
    FOI_EX_025: { 3: "Section 12." },
    FOI_EX_043: { 3: "Section 11 (National Security)." },
    FOI_EX_008: { 2: "Section 18." },
    FOI_EX_014: { 2: "Section 18." },
    FOI_EX_037: { 0: "Section 18." },
    FOI_EX_049: { 0: "Section 18." },
    FOI_AO_014: { 0: "Section 29." },
    FOI_AO_032: { 0: "Section 29." },
    FOI_EX_045: { 0: "Section 15 (Commercial information).", 1: "Section 11 (International affairs)." },
    clg_lc_031: { 3: "Section 16 (Budgetary provision)." },
  },
  core_competencies: {
    competency_num_066: { 1: "Approve all capital projects of the Ministry personally.", 2: "Hire all new staff of the Ministry directly.", 3: "Control the National Planning Commission and its agencies directly." },
    competency_num_068: { 0: "To set the salaries of all government workers.", 2: "To hire and fire civil servants across the Service." },
    competency_num_071: { 1: "The Head of the Civil Service of the Federation and all Permanent Secretaries.", 2: "The full Board of Directors of the parastatal.", 3: "The Chief Executive Officer and the Financial Officer of the parastatal." },
    competency_num_075: { 0: "Only funds obtained from international loans.", 2: "Any moneys held by a private citizen in a personal capacity." },
    competency_num_080: { 0: "As service in the Judiciary of the Federation.", 2: "As service in the National Assembly and its agencies." },
    competency_verbal_068: { 0: "Offering services under a short-term contract.", 2: "Offering services in exchange for payment.", 3: "Offering one's time or talent in return for a fee." },
  },
  financial_regulations: {
    fin_aud_033: { 0: "Access to legal counsel.", 2: "Payment of his salary.", 3: "A promise of promotion." },
    fin_aud_057: { 0: "Specific departmental guidelines issued by the Ministry.", 1: "Internal audit reports of the preceding year.", 2: "Only the Annual Estimates approved by the National Assembly." },
    fin_aud_068: { 2: "To distribute them to the public for general information." },
    fin_aud_069: { 0: "Ignore the matter unless an actual loss occurs.", 2: "Inform only the immediate supervisor of the unit." },
    fin_bgt_055: { 0: "To empower expenditure from the Contingencies Fund.", 1: "To fund new capital projects in the Estimates." },
    fin_bgt_059: { 0: "The Minister of Finance of the Federation." },
    fin_bgt_061: { 0: "The Minister of Finance of the Federation." },
    fin_gen_065: { 1: "The Head of the Civil Service of the Federation." },
    fin_gen_066: { 0: "The Auditor-General of the Federation.", 2: "The Head of Department of the ministry." },
    fin_pro_007: { 3: "An invoice from the contractor." },
    fin_pro_059: { 0: "To guide public officers on procurement matters only.", 1: "To dictate the contents of the national budget.", 2: "To set national tax policies." },
    fin_pro_060: { 0: "Only to the Accounting Officer of the ministry.", 2: "Only to the internal audit unit of the ministry.", 3: "Only to the Head of Finance and Accounts." },
  },
  general_current_affairs: {
    IRA_132: { 0: "A written warning." },
    IRA_149: { 2: "To issue them independently of the Accounting Officer.", 3: "To disregard them entirely." },
    IRA_167: { 1: "To disregard them entirely.", 3: "To issue them independently of the Accounting Officer." },
    NEKP_173: { 2: "A written warning." },
    NGPD_050: { 0: "A written warning." },
    NGPD_060: { 2: "The Head of Finance and Accounts of the ministry." },
    NGPD_061: { 1: "An officer who approves all capital expenditure of the ministry." },
    PSIR_058: { 0: "Integrated Payroll and Personnel Information System (IPPIS)." },
    PSIR_085: { 2: "The Director of Human Resource Management only." },
    PSIR_124: { 0: "To prepare the annual budget of the ministry.", 1: "To approve all payments of the ministry.", 2: "To conduct internal audits of the ministry." },
  },
  ict_digital: {
    // canonical order was [Public, Restricted (correct), Marketing, Open];
    // patch the correct option at canonical 1 and restore the stray at 2
    ict_sec_118: { 1: "Sensitive or classified data.", 2: "Marketing data." },
    ict_eg_006: { 3: "Bimodal Voter Accreditation System (BVAS)." },
    ict_eg_011: { 2: "Treasury Single Account (TSA)." },
    ict_eg_012: { 1: "Integrated Payroll and Personnel Information System (IPPIS).", 2: "National Identification Number (NIN).", 3: "Bimodal Voter Accreditation System (BVAS)." },
    ict_eg_016: { 0: "Nigerian Communications Commission (NCC).", 3: "National Pension Commission (PenCom)." },
    ict_eg_020: { 0: "Nigerian Communications Commission (NCC).", 3: "Central Bank of Nigeria (CBN)." },
    ict_eg_023: { 1: "Integrated Payroll and Personnel Information System (IPPIS).", 2: "Government Integrated Financial Management Information System (GIFMIS).", 3: "Nigerian Open Contracting Portal (NOCOPO)." },
    ict_eg_028: { 1: "Integrated Payroll and Personnel Information System (IPPIS).", 2: "Government Integrated Financial Management Information System (GIFMIS).", 3: "Remita payment platform." },
    ict_eg_034: { 0: "Treasury Single Account (TSA).", 2: "Nigerian Open Contracting Portal (NOCOPO).", 3: "Bank Verification Number (BVN)." },
    ict_eg_036: { 0: "Debt Management Office (DMO).", 2: "Office of the Head of the Civil Service of the Federation (OHCSF).", 3: "Federal Inland Revenue Service (FIRS)." },
    ict_eg_041: { 1: "Bimodal Voter Accreditation System (BVAS).", 2: "National Identification Number (NIN).", 3: "Nigerian Open Contracting Portal (NOCOPO)." },
    ict_eg_043: { 1: "Nigerian Communications Commission (NCC).", 2: "Independent National Electoral Commission (INEC).", 3: "Central Bank of Nigeria (CBN)." },
    ict_eg_060: { 1: "Nigerian Communications Commission (NCC).", 3: "Central Bank of Nigeria (CBN)." },
    ict_eg_064: { 2: "Central Bank of Nigeria (CBN)." },
    ict_eg_069: { 3: "Bimodal Voter Accreditation System (BVAS)." },
    ict_eg_071: { 1: "Integrated Payroll and Personnel Information System (IPPIS).", 2: "Government Integrated Financial Management Information System (GIFMIS).", 3: "Bank Verification Number (BVN)." },
    ict_eg_072: { 0: "Government Integrated Financial Management Information System (GIFMIS).", 1: "National Identification Number (NIN).", 2: "Bank Verification Number (BVN)." },
    ict_eg_099: { 0: "Bimodal Voter Accreditation System (BVAS).", 1: "Government Integrated Financial Management Information System (GIFMIS).", 2: "Integrated Payroll and Personnel Information System (IPPIS)." },
    ict_f_002: { 0: "Random Access Memory (RAM)." },
    ict_f_035: { 1: "Word document format (DOCX).", 2: "Portable Network Graphics (PNG).", 3: "MP3 audio format." },
    ict_f_056: { 3: "Virtual Private Network (VPN)." },
    ict_f_077: { 2: "By regular postal mail.", 3: "By email attachment." },
    ict_f_085: { 1: "By regular postal mail.", 3: "By email attachment." },
    ict_li_009: { 0: "Personal blogs." },
    ict_li_036: { 2: "TikTok social media platform." },
    ict_li_037: { 1: "Nigerian Communications Commission (NCC).", 3: "Central Bank of Nigeria (CBN)." },
    ict_li_054: { 1: "Nigerian Communications Commission (NCC).", 2: "Independent National Electoral Commission (INEC).", 3: "Central Bank of Nigeria (CBN)." },
  },
  policy_analysis: {
    policy_constitution_034: { 3: "Secrecy of official information." },
  },
  psr_rules: {
    CIRC_LWA_010: { 2: "Calendar months.", 3: "Calendar weeks." },
    psr_allow_059: { 1: "Wage payments." },
    psr_allow_068: { 2: "Payment of a fine.", 3: "A transfer to another department." },
    psr_app_008: { 0: "Staff Record Form (Gen 60)." },
    psr_docx_008: { 0: "Service in any government office at any level of government." },
    psr_docx_010: { 0: "The lowest score recorded by any candidate in an examination.", 1: "The average score attained by all candidates in an examination.", 3: "The highest score recorded by any candidate in an examination." },
    psr_docx_012: { 0: "An officer recruited from another African country.", 1: "A foreign officer on secondment to Nigeria.", 3: "An officer engaged on a fixed contract." },
    psr_docx_016: { 1: "Entry-level posts in the service.", 2: "Posts in the civil service of a State.", 3: "Posts held on contract." },
    psr_docx_018: { 0: "An officer's official government residence.", 2: "An officer's place of work in Nigeria.", 3: "Any location within the borders of Nigeria." },
    psr_docx_022: { 0: "A political appointee posted to a ministry.", 2: "A general administrative officer in a department.", 3: "A junior officer in a ministry." },
    psr_docx_023: { 0: "Service in the armed forces of the Federation.", 2: "Service in the government of a State.", 3: "Service in a Local Government Council." },
    psr_docx_024: { 1: "Legal statutes enacted by the National Assembly.", 2: "Ethical codes issued by professional bodies.", 3: "Operational manuals of individual ministries." },
    psr_docx_025: { 0: "A welfare package covering the allowances of public servants.", 2: "A plan governing pension and retirement benefits.", 3: "A programme for training newly recruited officers." },
    psr_docx_026: { 1: "Posts reserved for managerial staff only.", 2: "Posts filled by officers on contract.", 3: "Posts requiring professional certification." },
    psr_docx_029: { 0: "Temporary promotion pending review of the case.", 2: "Temporary transfer to another ministry.", 3: "Leave of absence on full salary." },
    psr_docx_035: { 0: "Only by a written letter of appointment.", 1: "Only by a formal written agreement.", 3: "Verbally by the appointing authority." },
    psr_docx_041: { 0: "The Federal Civil Service Commission (FCSC).", 3: "Administrative Staff College of Nigeria (ASCON)." },
    psr_docx_042: { 0: "The Federal Civil Service Commission alone.", 2: "The Minister of the ministry.", 3: "The Permanent Secretary of the ministry." },
    psr_docx_046: { 0: "The Federal Civil Service Commission (FCSC).", 1: "The Office of the Head of the Civil Service of the Federation (OHCSF).", 3: "Administrative Staff College of Nigeria (ASCON)." },
    psr_docx_047: { 0: "The Federal Civil Service Commission (FCSC).", 2: "The Office of the Head of the Civil Service of the Federation (OHCSF)." },
    psr_docx_050: { 0: "The Federal Civil Service Commission (FCSC).", 3: "The Office of the Head of the Civil Service of the Federation (OHCSF)." },
    psr_docx_051: { 0: "The Federal Civil Service Commission (FCSC).", 3: "The Office of the Head of the Civil Service of the Federation (OHCSF)." },
    psr_docx_052: { 1: "1st July of the year of appointment." },
    psr_docx_054: { 0: "By the Minister of the ministry.", 1: "By the officer's date of birth.", 3: "By the officer's level of education." },
    psr_docx_056: { 0: "The Office of the Head of the Civil Service of the Federation (OHCSF).", 3: "The Federal Civil Service Commission (FCSC)." },
    psr_docx_057: { 1: "Form FC (FCSC record)." },
    psr_docx_059: { 3: "Within one week of the appointment." },
    psr_docx_063: { 0: "Promotion of existing staff within the service.", 1: "Transfer of officers between ministries.", 3: "Temporary employment pending confirmation." },
    psr_docx_073: { 2: "A fixed period of one year.", 3: "A fixed period of two years." },
    psr_docx_090: { 0: "Staff Record Form (Gen 60).", 2: "Form Gen 69C (staff particulars).", 3: "Form 1 (Oath of Secrecy)." },
    psr_docx_099: { 0: "A written warning.", 3: "Payment of a fine." },
    psr_docx_103: { 1: "Grant of a special award.", 3: "Transfer to another department." },
    psr_docx_107: { 2: "Transfer to another department.", 3: "Demotion to a lower grade." },
    psr_docx_109: { 0: "Passing the civil service examination.", 2: "Possession of a professional certificate.", 3: "Completion of a training course." },
    psr_docx_110: { 0: "The Federal Civil Service Commission (FCSC).", 1: "The Office of the Head of the Civil Service of the Federation (OHCSF).", 3: "The officer concerned." },
    psr_docx_112: { 2: "The Office of the Head of the Civil Service of the Federation (OHCSF).", 3: "The Minister of the ministry." },
    psr_docx_113: { 0: "Transfer to another department.", 2: "A formal warning letter.", 3: "Automatic extension of probation." },
    psr_docx_114: { 0: "The Minister of the ministry.", 3: "The Head of Department." },
    psr_docx_115: { 2: "Level of education.", 3: "Political considerations." },
    psr_docx_119: { 0: "Length of service.", 2: "Internal posting within the ministry.", 3: "Transfer from another ministry." },
    psr_docx_120: { 2: "The Office of the Head of the Civil Service of the Federation (OHCSF)." },
    psr_docx_121: { 0: "The Ministry concerned.", 1: "The Office of the Head of the Civil Service of the Federation (OHCSF)." },
    psr_docx_124: { 0: "Demotion to a lower grade.", 1: "A formal warning letter.", 3: "Transfer to another department." },
    psr_docx_128: { 3: "Imposition of a disciplinary sanction." },
    psr_docx_130: { 2: "No, never under any circumstance.", 3: "Only with the approval of the Head of Service." },
    psr_docx_132: { 0: "Lose all accrued seniority.", 2: "Determined afresh by the receiving Ministry.", 3: "Gained seniority in the new Ministry." },
    psr_docx_134: { 3: "The Minister of the ministry." },
    psr_docx_142: { 2: "Sell it and donate the proceeds." },
    psr_docx_157: { 2: "Organise training programmes.", 3: "Recommend officers for promotion." },
    psr_docx_161: { 3: "Sell it for personal gain." },
    psr_docx_163: { 2: "The Central Bank of Nigeria (CBN).", 3: "The Nigerian Bar Association (NBA)." },
    psr_docx_171: { 0: "Offer advisory opinions.", 2: "Organise training programmes.", 3: "Recommend officers for promotion." },
    psr_docx_176: { 0: "Secrecy of official information.", 2: "Private access to official information.", 3: "Delegating decision-making authority." },
    psr_docx_185: { 0: "A formal warning letter." },
    psr_docx_191: { 0: "Once every year.", 3: "Only upon retirement from service." },
    psr_docx_192: { 0: "The Economic and Financial Crimes Commission (EFCC).", 1: "The Bureau of Public Procurement (BPP).", 3: "The Independent Corrupt Practices and Other Related Offences Commission (ICPC)." },
    psr_docx_194: { 0: "The Independent Corrupt Practices and Other Related Offences Commission (ICPC).", 1: "The Code of Conduct Bureau (CCB)." },
    psr_docx_195: { 2: "The Freedom of Information (FOI) Act." },
    psr_docx_203: { 0: "Secrecy of official records.", 2: "Reduce the workload of staff.", 3: "Simplify the procurement process." },
    psr_docx_205: { 0: "Clerical staff only.", 3: "Officers on training." },
    psr_docx_206: { 0: "The Freedom of Information (FOI) Act." },
    psr_docx_210: { 0: "Larger in size and scope.", 2: "Less responsive to citizens.", 3: "Focused on revenue generation." },
    psr_docx_211: { 2: "Delay implementation of strategies.", 3: "Increase the cost of implementation." },
    psr_docx_213: { 3: "Secrecy of official information." },
    psr_docx_214: { 2: "Payment Voucher (PV)." },
    psr_docx_218: { 0: "The Economic and Financial Crimes Commission (EFCC).", 1: "The Independent Corrupt Practices and Other Related Offences Commission (ICPC).", 3: "The Federal Civil Service Commission (FCSC)." },
    psr_docx_221: { 3: "Secrecy of official information." },
    psr_docx_224: { 0: "Verbally to the Permanent Secretary.", 2: "By email to the Human Resource unit." },
    psr_docx_230: { 0: "Retirement of the officer for misconduct.", 2: "Voluntary resignation by the officer.", 3: "Death of the officer in service." },
    psr_docx_233: { 3: "The Minister of the ministry." },
    psr_eth_028: { 0: "A formal caution.", 3: "A salary advance." },
    psr_eth_055: { 0: "To document a personal conversation between officers.", 1: "To provide a confidential report to the Minister.", 3: "To communicate official information to the public." },
    psr_eth_056: { 1: "To document a personal conversation between officers.", 2: "To communicate official information to the public.", 3: "To provide a confidential report to the Minister." },
    psr_eth_058: { 0: "To communicate official information to the public.", 1: "To provide a confidential report to the Minister.", 2: "To document a personal conversation between officers." },
    psr_leave_072: { 1: "They must submit a report to the FCSC every six months.", 3: "They must maintain a list of all seconded staff." },
    psr_leave_076: { 1: "A formal warning within established administrative procedures.", 2: "Payment of a fine in line with public service practice.", 3: "Withholding of increment subject to regulatory standards." },
    psr_med_052: { 1: "Coordinating service-wide training programmes.", 3: "Approving the annual budgets of MDAs." },
    psr_med_062: { 0: "The minimum score for passing any examination.", 2: "The age limit for promotion in the service." },
    psr_med_073: { 1: "The date determined by the Permanent Secretary of the ministry.", 2: "The date on which the promotion exercise was conducted.", 3: "The date the officer assumes duty in the new post." },
    psr_ret_033: { 0: "Within one month of retirement." },
    psr_train_061: { 0: "The emoluments will be terminated immediately.", 1: "The emoluments will be withheld indefinitely.", 3: "The officer will be dismissed from the service." },
  },
  public_procurement: {
    ppa_bid_058: { 1: "Return them to the wrong office.", 2: "Keep them for your own use.", 3: "Throw them away to avoid confusion." },
    ppa_elb_014: { 2: "Quality and Cost-Based Selection (QCBS)." },
    ppa_ethic_031: { 0: "A bonus payment." },
  },
};

// NOTE: the wrong-answer-key fixes found during the manual read (ppa_ims_003/
// 060/074, the circ_leave_welfare_allowances_gen_* family, ca_international_
// affairs_gen_040, leadership_lsm_009, policy_psr_058/063) were APPLIED AND
// BAKED into the data during the Aug 2026 answer-order migration: their
// correct keys now point at the right option text, and the entries were
// removed here because re-applying a canonical index would corrupt the key
// once options are scrambled (canonical order is not recoverable for those
// questions).
const CURATED_ANSWERS = {
  constitutional_foi: {
    // FOI Act s.4: respond within 7 days (extendable by 7 more, 14 max) — not 30.
    FOI_AO_77: 0,
    // FOI Act s.10: destruction/falsification of records is the criminal offence (not s.29).
    FOI_OP_002: 2, // "Section 10."
    // FOI Act s.29: AGF annual FOI compliance reports (not s.32, which is the citation clause).
    FOI_OP_024: 1, // "Section 29."
    // FOI Act s.20: judicial review within 30 days (not 14).
    FOI_OP_032: 2, // "30 days."
    FOI_OP_063: 0, // "30 days."
    // FOI Act s.13: training of officials (not s.5, which is transfer of application).
    FOI_AO_048: 0, // "Section 13."
    // national security/defence/intl relations = s.11, not s.12 (law enforcement).
    FOI_EX_002: 0, // "Section 11."
    // life/safety harm = s.12 (law enforcement harm test), not s.16 (privileges).
    FOI_EX_009: 2, // "Section 12."
    // geological data obtained in confidence = s.15 (third-party commercial), not s.17.
    FOI_EX_010: 0, // "Section 15."
    // transfer of request = s.5, not s.7 (where access is refused).
    FOI_AO_008: 2, // "Section 5."
    // record indexes = s.9(1), not s.6(1) (extension of time).
    FOI_AO_018: 3, // "Section 9(1)."
  },
};

const CURATED_META = {
  ict_digital: {
    ict_sec_118: {
      explanation: "Sensitive information whose disclosure could harm national security is classified and requires special handling.",
    },
  },
  constitutional_foi: {
    FOI_AO_77: {
      explanation: "Section 4 of the FOI Act requires public institutions to respond to requests within 7 days, extendable by a further 7 days (14 days maximum) in specified circumstances.",
    },
    FOI_OP_76: {
      explanation: "Section 7(5) of the FOI Act prescribes a fine of ₦500,000 for wrongful denial of access to information.",
    },
    FOI_OP_77: {
      explanation: "Section 10 makes it a criminal offence to wilfully destroy, doctor, or falsify public records, particularly those needed for pending requests.",
      chapter: "Offences (S. 10)",
    },
    FOI_EX_77: {
      explanation: "The FOI Act's presumption of openness means exemptions are applied restrictively in favour of disclosure; the institution bears the burden of proving an exemption (Section 24).",
      chapter: "Exemptions & Public Interest",
    },
    FOI_EX_78: {
      explanation: "Section 11 exempts information whose disclosure could prejudice national security, defence, or international relations.",
      chapter: "Exemptions (S. 11)",
    },
    FOI_EX_82: {
      explanation: "Section 28 provides that the fact that information is under security classification or is classified under the Official Secrets Act does not preclude its disclosure under the FOI Act.",
      chapter: "Exemptions (S. 28)",
    },
    FOI_EX_83: {
      explanation: "Section 17 protects course and research materials, including test questions and scoring keys, until the research is complete or the examination has been administered.",
      chapter: "Exemptions (S. 17)",
    },
    FOI_EX_76: { chapter: "Exemptions & Public Interest" },
    FOI_EX_81: { chapter: "Exemptions (S. 12)" },
    FOI_EX_84: { chapter: "Exemptions (S. 18)" },
    FOI_EX_85: { chapter: "Enforcement (S. 24)" },
    // --- section-citation corrections: offences/fines are s.10, not s.29 ---
    FOI_OP_002: {
      explanation: "Section 10 makes it a criminal offence to wilfully destroy, damage, alter, conceal or falsify public records, punishable on conviction by imprisonment for a minimum term of one year.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_003: {
      explanation: "Section 10 makes it a criminal offence to wilfully destroy, doctor, alter, conceal or falsify public records, punishable on conviction by imprisonment for a minimum term of one year — there is no option of a fine.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_004: {
      explanation: "Section 10 makes alteration or falsification of records a criminal offence with a minimum penalty of one year's imprisonment.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_005: {
      explanation: "Section 10 prohibits destruction of records subject to FOI requests and prescribes imprisonment for a minimum term of one year for wilful destruction.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_006: {
      explanation: "Section 10 criminalizes willful concealment, destruction, or falsification of public records.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_009: {
      explanation: "Criminal offences under the FOI Act are subject to prosecution, usually initiated by the Attorney-General's office or relevant law enforcement agencies.",
    },
    FOI_OP_010: {
      explanation: "Section 10 criminalizes willful concealment, destruction, or falsification of public records.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_014: {
      explanation: "Section 10 of the Freedom of Information Act treats falsification of public records by an officer as a criminal offense. The item therefore tests the legal status of that conduct under the Act.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_018: {
      explanation: "Section 10 prescribes imprisonment for a minimum term of one year for wilful destruction or falsification of records. Criminal conviction typically leads to dismissal under PSR guidelines.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_022: {
      explanation: "Section 10 of the Freedom of Information Act identifies falsification of public records as a criminal offense. The item therefore tests recognition of the conduct specifically penalized by that section.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_027: {
      explanation: "Section 10 criminalizes actions that undermine record integrity, such as concealment and falsification.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_028: {
      explanation: "Section 10 prescribes imprisonment for a minimum term of one year for criminal offences related to the wilful destruction or falsification of records.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_031: {
      explanation: "The offence under Section 10 applies only to wrongful or unlawful destruction, not routine records management and retention policies.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_033: {
      explanation: "Proper record indexing prevents claims that the institution is concealing records by claiming they don't exist or cannot be located.",
      chapter: "Record Integrity",
    },
    FOI_OP_034: {
      explanation: "Section 10 criminalizes actions against public records (destruction, falsification, concealment).",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_041: {
      explanation: "Section 10 criminalizes 'willful' concealment, destruction, or falsification. Inadvertent destruction lacks the requisite intent for this criminal offense.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_048: {
      explanation: "Criminal offences under the FOI Act are tried by the Judiciary, with prosecution typically initiated by the Attorney-General's office.",
    },
    FOI_OP_049: {
      explanation: "Section 10 prescribes imprisonment for a minimum term of one year for willful concealment of records — there is no option of a fine.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_064: {
      explanation: "Section 10 protects the evidence needed for disclosure by keeping the records available and intact.",
      chapter: "Offences (S. 10)",
    },
    FOI_OP_065: {
      explanation: "Section 10 targets improper destruction of records tied to pending FOI requests, not lawful destruction carried out under valid records-management and retention policies.",
      chapter: "Offences (S. 10)",
    },
    // --- public-interest / narrow-interpretation cluster: real provisions ---
    FOI_EX_012: {
      explanation: "Section 19(2) provides a public-interest test: otherwise exempt information may still be disclosed when the public value of disclosure outweighs the harm the exemption is meant to prevent.",
      chapter: "Public Interest (S. 19(2))",
    },
    FOI_EX_013: {
      explanation: "The FOI Act presumes openness: exemptions are applied restrictively in favour of disclosure, and courts read them narrowly so the right of access is not defeated.",
      chapter: "Exemptions & Interpretation",
    },
    FOI_EX_019: {
      explanation: "The Public Interest Test (Section 19(2)) allows disclosure if the public benefit (exposing fraud or environmental harm) outweighs the harm of releasing the data.",
      chapter: "Public Interest (S. 19(2))",
    },
    FOI_EX_027: {
      explanation: "Section 19(2) prioritizes public good by allowing disclosure if the benefit outweighs the harm, preventing blanket secrecy claims.",
      chapter: "Public Interest (S. 19(2))",
    },
    FOI_EX_031: {
      explanation: "Section 18 (severability) requires the institution to disclose any part of a record that does not contain exempted information.",
      chapter: "Exemptions (S. 18)",
    },
    FOI_EX_039: {
      explanation: "Section 11 exempts information whose disclosure could be injurious to the conduct of international affairs or the defence of Nigeria.",
      chapter: "Exemptions (S. 11)",
    },
    FOI_EX_046: {
      explanation: "FOI exemptions are not absolute. Section 19(2) provides a public-interest test, and the Act expects exemptions to be read narrowly rather than expansively.",
      chapter: "Public Interest (S. 19(2))",
    },
    FOI_OP_029: {
      explanation: "Section 12 exempts records compiled for law enforcement or investigation where disclosure could interfere with proceedings or endanger safety.",
      chapter: "Exemptions (S. 12)",
    },
    FOI_OP_043: {
      explanation: "Section 25 empowers the court, where it finds a denial unjustified, to order the public institution to disclose the information.",
      chapter: "Enforcement (S. 25)",
    },
    FOI_OP_050: {
      explanation: "Narrow interpretation and the public interest test minimize the use of exemptions to shield illegal activity from public view.",
      chapter: "Public Interest (S. 19(2))",
    },
    FOI_OP_058: {
      explanation: "Section 21 requires applications under Section 20 to be heard and determined in a summary way.",
      chapter: "Enforcement (S. 21)",
    },
    FOI_OP_075: {
      explanation: "Section 22 allows the court, notwithstanding the Evidence Act, to examine the very information in dispute during proceedings without public disclosure.",
      chapter: "Enforcement (S. 22)",
    },
    // --- oversight / timelines / training / records / transfer ---
    FOI_OP_024: {
      explanation: "Section 29 requires the Attorney-General of the Federation to submit annual FOI compliance reports to the National Assembly.",
      chapter: "Oversight (S. 29)",
    },
    FOI_OP_032: {
      explanation: "Section 20 grants the right to court action within 30 days of the denial or deemed denial.",
      chapter: "Appeals Time Limit",
    },
    FOI_OP_063: {
      explanation: "Section 20 gives the applicant 30 days from the denial or deemed denial to seek judicial redress in a court of competent jurisdiction.",
      chapter: "Appeals Time Limit",
    },
    FOI_AO_048: {
      explanation: "Section 13 requires public institutions to provide appropriate training for their officials on the public right to access information and records.",
      chapter: "Implementation",
    },
    FOI_AO_038: {
      explanation: "Section 13 requires public institutions to train officials to ensure effective implementation of the Act.",
      chapter: "Implementation",
    },
    FOI_AO_035: {
      explanation: "Section 5 requires the receiving institution to transfer the application to the institution with a greater interest within 3 days, and not later than 7 days.",
      chapter: "Request Transfer",
    },
    FOI_AO_023: {
      explanation: "Section 29 requires public institutions to submit annual compliance reports through the Attorney-General of the Federation to the National Assembly.",
      chapter: "Oversight (S. 29)",
    },
    FOI_AO_025: {
      explanation: "The FOI implementation guidelines require public institutions to designate officers responsible for handling FOI requests so that applications are dealt with promptly.",
      chapter: "Implementation",
    },
    FOI_AO_046: {
      explanation: "Designated FOI desk officers ensure clear responsibility, leading to streamlined processing and prompt response to requests.",
      chapter: "Implementation Strategy",
    },
    FOI_OP_038: {
      explanation: "A failure to designate an FOI desk officer is a failure of the administrative implementation of the Act.",
      chapter: "Implementation Failure",
    },
    FOI_AO_016: {
      explanation: "Section 9 requires public institutions to keep records in formats that make them easily accessible to the public.",
      chapter: "Record Management",
    },
    FOI_AO_034: {
      explanation: "Keeping records in easily accessible (machine-readable) formats supports digital governance and efficient service delivery.",
      chapter: "Record Management",
    },
    FOI_AO_049: {
      explanation: "Section 9 requires updated indexes of records; indexes improve accessibility and help the public identify specific records needed.",
      chapter: "Record Management",
    },
    // --- exemption retargets: s.17 research materials, s.11 intl affairs/defence ---
    FOI_EX_023: {
      explanation: "Section 17 specifically exempts course and research materials, including examination materials and test questions, until administration.",
      chapter: "Exemptions (S. 17)",
    },
    FOI_EX_030: {
      explanation: "Section 17 allows withholding course and research material only while it is pending or unadministered.",
      chapter: "Exemptions (S. 17)",
    },
    FOI_EX_042: {
      explanation: "Section 17 protects course and research materials and pending academic work until the work is finalized.",
      chapter: "Exemptions (S. 17)",
    },
    FOI_EX_024: {
      explanation: "Section 11 exempts records whose disclosure could prejudice the conduct of international affairs or the defence of Nigeria — deliberations on such matters are typically held by the Executive Council of the Federation.",
      chapter: "Exemptions (S. 11)",
    },
    FOI_EX_041: {
      explanation: "Section 11 protects information whose disclosure could prejudice international affairs or national defence, thereby safeguarding the nation's security and the effective conduct of its external relations.",
      chapter: "Exemptions (S. 11)",
    },
    FOI_EX_029: {
      explanation: "Section 11 protects national security and defence information, so the provision aims at the safety of the nation and its strategic interests.",
      chapter: "Exemptions (S. 11)",
    },
    FOI_EX_035: {
      explanation: "Geological and mineral exploration records may be withheld under an applicable FOI exemption where disclosure would harm national economic interests.",
      chapter: "Exemptions",
    },
    // --- round 2: national security/defence -> s.11 ---
    FOI_EX_002: {
      explanation: "Section 11 exempts information whose disclosure could be injurious to the conduct of international affairs or the defence of Nigeria.",
      chapter: "Exemptions (S. 11)",
    },
    FOI_EX_018: {
      explanation: "Section 11 protects information that could prejudice international relations or national defence, so it is the relevant exemption here.",
      chapter: "Exemptions (S. 11)",
    },
    FOI_EX_043: {
      explanation: "Information concerning national security and defence is exempt under Section 11 (international affairs and defence).",
      chapter: "Exemptions (S. 11)",
    },
    // --- round 2: life/safety harm -> s.12 (law enforcement) ---
    FOI_EX_009: {
      explanation: "Section 12 exempts information whose disclosure could endanger the life or physical safety of any person.",
      chapter: "Exemptions (S. 12)",
    },
    FOI_EX_025: {
      explanation: "Section 12 exempts disclosure of information that could endanger the life or physical safety of any individual.",
      chapter: "Exemptions (S. 12)",
    },
    // --- round 2: partial disclosure / severability -> s.18 ---
    FOI_EX_008: {
      explanation: "Section 18 (severability) requires the disclosure of any non-exempt portion of a record.",
      chapter: "Exemptions (S. 18)",
    },
    FOI_EX_014: {
      explanation: "Section 18 allows partial disclosure by separating the exempt information from the non-exempt portion.",
      chapter: "Exemptions (S. 18)",
    },
    FOI_EX_016: {
      explanation: "Section 18 mandates the release of any non-exempt portion of the record.",
      chapter: "Exemptions (S. 18)",
    },
    FOI_EX_037: {
      explanation: "Section 18 supports partial disclosure by allowing the exempt part to be removed and the rest released.",
      chapter: "Exemptions (S. 18)",
    },
    FOI_EX_049: {
      explanation: "Section 18 allows partial disclosure by excising the exempt information from the document.",
      chapter: "Exemptions (S. 18)",
    },
    // --- round 2: geological/commercial data -> s.15 ---
    FOI_EX_010: {
      explanation: "Section 15 exempts trade secrets and commercial or financial information obtained in confidence, which is the closest fit for confidential geological and mineral exploration data.",
      chapter: "Exemptions (S. 15)",
    },
    FOI_EX_045: {
      explanation: "Section 15 protects trade secrets and commercial or financial information obtained in confidence, safeguarding the commercial interests of third parties.",
      chapter: "Exemptions (S. 15)",
    },
    // --- round 2: annual compliance reports -> s.29 ---
    FOI_AO_014: {
      explanation: "Section 29 requires public institutions to submit annual FOI compliance reports to the Attorney-General of the Federation.",
      chapter: "Oversight (S. 29)",
    },
    FOI_AO_032: {
      explanation: "Section 29 requires annual compliance reports, so failure to submit the report breaches that provision.",
      chapter: "Oversight (S. 29)",
    },
    FOI_AO_021: {
      explanation: "The Attorney-General of the Federation is responsible for oversight, issuing guidelines, and submitting an annual report to the National Assembly (Section 29).",
      chapter: "Oversight (S. 29)",
    },
    FOI_AO_039: {
      explanation: "Section 29 requires the Attorney-General to submit an annual report on FOI implementation to the National Assembly.",
      chapter: "Oversight (S. 29)",
    },
    FOI_OP_021: {
      explanation: "Section 29 requires the Attorney-General to submit an annual report to the National Assembly.",
      chapter: "Oversight (S. 29)",
    },
    // --- round 2: transfer of request -> s.5; indexes/records -> s.9; desk officers ---
    FOI_AO_008: {
      explanation: "Section 5 requires the institution to transfer the application to the institution with a greater interest in the information.",
      chapter: "Request Transfer",
    },
    FOI_AO_015: {
      explanation: "Designating FOI desk officers gives clear responsibility for handling requests, leading to prompt processing (per the FOI implementation guidelines).",
      chapter: "Implementation",
    },
    FOI_AO_018: {
      explanation: "Section 9(1) mandates public institutions to maintain updated indexes of their records for accessibility.",
      chapter: "Record Management",
    },
    FOI_AO_028: {
      explanation: "Section 9 mandates updated indexes of records for public accessibility and identification.",
      chapter: "Record Management",
    },
    FOI_OP_046: {
      explanation: "Section 9 requires records to be kept in formats that are easily accessible, including machine-readable forms.",
      chapter: "Record Management",
    },
    FOI_OP_071: {
      explanation: "Section 9 requires records to be accessible; failure to provide them in accessible, machine-readable form undermines that objective directly.",
      chapter: "Record Management",
    },
    FOI_AO_044: {
      explanation: "Under the FOI implementation guidelines, access should be provided in the form preferred by the applicant unless it is impracticable to do so.",
      chapter: "Access Rights",
    },
    // --- round 2: PPA budgetary provision -> s.16 (not s.14) ---
    clg_lc_031: {
      explanation: "Section 16(1)(b) of the PPA requires that all public procurement be conducted based only on the prior existence of budgetary provision and availability of funds.",
      chapter: "PPA Section 16",
    },
  },
  psr_rules: {
    psr_train_074: { sourceSubcategoryName: "Training, Performance & Career Development" },
  },
};

// Exact/accidental duplicate questions to REMOVE (merge). Each pair has an
// identical stem (modulo a synonym), identical options and identical correct
// answer; the surviving copy is listed in the comment. Ids of removed
// questions are gone from the bank (no renumbering); topic counts in
// topics.json are decremented automatically.
const CURATED_REMOVE = {
  "general_current_affairs.json": {
    // keep csh_ap_073 (civil_service_ethics): OHCSF supervision
    ca_general_071: "dup of csh_ap_073 (cross-bank)",
    // keep PSIR_107
    PSIR_108: "dup of PSIR_107 (risk vs danger)",
    // keep PSIR_096 (public service reforms home)
    IRA_141: "dup of PSIR_096 (cross-subcategory)",
    // keep IRA_150
    IRA_168: "dup of IRA_150 (embrace vs include)",
  },
  "constitutional_foi.json": {
    // keep psr_train_073 (psr_rules): study leave with pay
    clg_gc_090: "dup of psr_train_073 (cross-bank)",
    // keep psr_admin_064 (psr_rules): Gen 60 form
    FOI_EX_069: "dup of psr_admin_064 (cross-bank)",
  },
  "leadership_negotiation.json": {
    // keep fin_bgt_011 (financial_regulations): MTEF horizon
    leadership_smp_013: "dup of fin_bgt_011 (cross-bank)",
  },
  "policy_analysis.json": {
    // keep ict_li_100 (ict_digital): duplicate note-book procedure
    policy_psr_051: "dup of ict_li_100 (cross-bank)",
  },
  "civil_service_ethics.json": {
    // keep ethics_080 (original id)
    eth_conflict_interest_gen_078: "dup of ethics_080 (unauthorized vehicle use)",
    // record-management family: keep csh_ap_197; these are the same question
    // with the same answer under different file-type nouns
    csh_ap_195: "file-routine dup (keep csh_ap_197)",
    csh_ap_196: "file-routine dup (keep csh_ap_197)",
    csh_ap_200: "file-routine dup (keep csh_ap_197)",
    csh_ap_202: "file-routine dup (keep csh_ap_197)",
    csh_ap_206: "file-routine dup (keep csh_ap_197)",
    csh_ap_208: "file-routine dup (keep csh_ap_197)",
    csh_ap_210: "file-routine dup (keep csh_ap_197)",
    csh_ap_212: "file-routine dup (keep csh_ap_197)",
  },
};

// Questions whose CONTENT belongs to a different subcategory (id prefixes are
// legacy and intentionally left unchanged so saved progress stays valid). All
// moves are within the same file, so topic counts in topics.json are untouched.
// sourceSubcategoryId/Name are updated to match the new home.
const CURATED_MOVES = {
  civil_service_ethics: {
    ict_li_057: "eth_values_integrity", // core civil service values, not admin procedures
    clg_gc_092: "csh_service_delivery_grievance", // grievance procedures chapter
    clg_lc_054: "csh_discipline_conduct", // gross misconduct classification
  },
  psr_rules: {
    csh_principle_016: "psr_leave", // paid employment while on leave of absence
    csh_pt_011: "psr_leave", // sabbatical leave duration
    csh_pt_033: "psr_leave", // sabbatical appointment rule
    csh_pt_044: "psr_appointments", // minimum years in post before promotion
    csh_ap_020: "psr_leave", // categories of leave of absence
    csh_sdg_044: "psr_leave", // approval of leave of absence
    clg_gc_088: "psr_leave", // study leave with pay
    ict_li_065: "psr_leave", // study leave without pay
    ict_li_049: "psr_training", // training institution for career advancement
    leadership_lsm_012: "psr_ethics", // prohibition of seeking undue influence
    leadership_mpf_041: "psr_leave", // leave-of-absence categories under Rule 120236
    PSIR_079: "psr_appointments", // confirmation examination timeline
    ppa_ims_029: "psr_appointments", // FCSC appointment/promotion powers
    ppa_ims_046: "psr_discipline", // misuse of government transport = serious misconduct
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getQuestions(s) {
  if (!s || !Array.isArray(s.questions)) return [];
  if (s.id === "ca_general" && Array.isArray(s.questions[0]?.ca_general)) return s.questions[0].ca_general;
  const first = s.questions[0];
  if (
    first &&
    typeof first === "object" &&
    !Array.isArray(first) &&
    first.id === undefined &&
    Object.values(first).some(Array.isArray)
  ) {
    return Object.values(first).flatMap((v) => (Array.isArray(v) ? v : []));
  }
  return s.questions;
}

function loadBank(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
}

// Metadata defaults applied to authored NEW_QUESTIONS on insertion. Chapters
// are normalized to the subcategory's dominant chapter style by the fixer's
// mechanical pass afterwards; these values match the source banks.
const NEW_QUESTION_META = {
  civil_service_ethics: { sourceTopicId: "civil_service_admin", sourceDocument: "Federal Civil Service Handbook and Circulars" },
  constitutional_foi: { sourceTopicId: "constitutional_law", sourceDocument: "Constitution of the Federal Republic of Nigeria and FOI Act" },
  core_competencies: { sourceTopicId: "competency_framework", sourceDocument: "Directorate Competency Framework" },
  financial_regulations: { sourceTopicId: "financial_regulations", sourceDocument: "Financial Regulations (FR)" },
  general_current_affairs: { sourceTopicId: "general_current_affairs", sourceDocument: "Government Current Affairs Compendium" },
  ict_digital: { sourceTopicId: "ict_management", sourceDocument: "National ICT and Digital Governance Framework" },
  leadership_negotiation: { sourceTopicId: "leadership_management", sourceDocument: "Leadership and Management Framework" },
  policy_analysis: { sourceTopicId: "policy_analysis", sourceDocument: "Public Policy and Governance Framework" },
  psr_rules: { sourceTopicId: "psr", sourceDocument: "Public Service Rules (PSR 2021)" },
  public_procurement: { sourceTopicId: "procurement_act", sourceDocument: "Public Procurement Act (2007)" },
};

function buildNewQuestion(nq, subcategory, bankName) {
  const meta = NEW_QUESTION_META[bankName] || {};
  const bands = nq.difficulty === "hard" ? ["GL15_16", "GL16_17"] : ["GL14_15", "GL15_16", "GL16_17"];
  return {
    id: nq.id,
    question: nq.question,
    options: [...nq.options],
    correct: nq.correct,
    explanation: nq.explanation,
    difficulty: nq.difficulty,
    chapter: nq.chapter,
    keywords: [...(nq.keywords || [])],
    sourceDocument: meta.sourceDocument || "",
    sourceSection: subcategory.name || "",
    year: 2026,
    lastReviewed: "2026-08-10",
    glBands: bands,
    marks: nq.difficulty === "hard" ? 2 : 1,
    questionType: "single_best_answer",
    reviewStatus: "approved",
    tags: [...new Set([...(nq.keywords || []), nq.id.split("_").slice(0, 2).join("_")])],
    sourceTopicId: meta.sourceTopicId || "",
    sourceSubcategoryId: subcategory.id,
    sourceSubcategoryName: subcategory.name || "",
  };
}

const COMMON_WORDS = new Set([
  "is", "are", "was", "were", "not", "all", "any", "the", "and", "for", "with", "from",
  "that", "this", "those", "these", "they", "their", "them", "has", "have", "had", "who",
  "which", "what", "when", "where", "how", "why", "can", "could", "would", "should",
  "may", "might", "must", "will", "shall", "do", "does", "did", "be", "being", "been",
  "by", "on", "of", "to", "in", "at", "or", "as", "if", "it", "its", "no", "so", "up",
  "out", "off", "one", "two", "a", "an", "per", "via", "us", "our", "me", "we", "he",
  "she", "his", "her", "him", "you", "your", "my", "am", "nor", "but", "yet", "than",
  "then", "there", "here", "now", "also", "only", "just", "such", "same", "own", "new",
  "old", "are", "was", "were", "pm", "am", "ok", "etc", "eg", "ie", "vs", "iii",
]);

const TERMINAL = new Set(["?", ".", "!", ":", "”", '"', "…", "'"]);

// Build the set of acronym tokens a bank uses, from tokens that appear in ALL
// CAPS at least twice. Words that are common English are excluded so emphasis
// words like **NOT** never trigger replacements.
function buildAcronyms(bankName) {
  const payload = loadBank(bankName + ".json");
  const texts = [];
  for (const s of getSubcategories(payload)) {
    for (const q of getQuestions(s)) {
      texts.push(q.question || "");
      texts.push(...(Array.isArray(q.options) ? q.options : []));
      texts.push(q.explanation || "");
    }
  }
  const joined = texts.join(" ");
  const freq = new Map();
  for (const m of joined.matchAll(/\b[A-Z]{2,8}\b/g)) {
    freq.set(m[0], (freq.get(m[0]) || 0) + 1);
  }
  const out = new Map(); // lowercase -> canonical uppercase
  for (const [tok, n] of freq) {
    if (n < 2) continue;
    if (COMMON_WORDS.has(tok.toLowerCase())) continue;
    out.set(tok.toLowerCase(), tok);
    out.set(tok.toLowerCase() + "s", tok + "s"); // plural form: mdas -> MDAs
  }
  return out;
}

function getSubcategories(payload) {
  if (payload && typeof payload === "object" && Array.isArray(payload.subcategories)) return payload.subcategories;
  if (payload && typeof payload === "object" && payload.subcategories && typeof payload.subcategories === "object") {
    return Object.values(payload.subcategories);
  }
  if (payload && typeof payload === "object" && payload.domains && Array.isArray(payload.domains)) {
    return payload.domains.flatMap((d) => (d && Array.isArray(d.topics) ? d.topics : []));
  }
  return [];
}

function collapseSpaces(s) {
  return String(s).replace(/[^\S\n]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
}

function normalizeAcronyms(text, acronyms) {
  let out = String(text);
  for (const [lower, canonical] of acronyms) {
    const re = new RegExp(`(?<![A-Za-z])${lower}(?![A-Za-z])`, "gi");
    out = out.replace(re, (m) => (m === canonical ? m : canonical));
  }
  return out;
}

function capitalizeFirstWord(stem, acronyms) {
  const idx = stem.search(/[A-Za-z]/);
  if (idx < 0) return stem;
  const m = stem.slice(idx).match(/^([A-Za-z]+)/);
  if (!m) return stem;
  const word = m[1];
  if (word[0] !== word[0].toUpperCase()) {
    const canonical = acronyms.get(word.toLowerCase());
    if (canonical) {
      return stem.slice(0, idx) + canonical + stem.slice(idx + word.length);
    }
    return stem.slice(0, idx) + word[0].toUpperCase() + stem.slice(idx + 1);
  }
  return stem;
}

function addTerminalPunct(stem) {
  const t = stem.trim();
  if (!t) return stem;
  if (TERMINAL.has(t[t.length - 1])) return stem;
  const qw = /\b(what|which|who|whom|whose|why|how|where|when|whether)\b/i;
  const aux = /^(do|does|did|is|are|was|were|can|could|would|should|may|might|must|will|shall|has|have|had)\b/i;
  if (qw.test(t) || aux.test(t)) return t + "?";
  return t + ".";
}

function fixStemMechanical(stem, acronyms) {
  let s = collapseSpaces(stem);
  s = s.replace(/\*\*([^*]{2,40})\*\*['’]([^s])/g, "**$1**$2"); // stray possessive (long spans incl. spaces)
  s = s.replace(/\b(primary|main|key|general|overall)\s+the\s+(primary|main|key|general|overall|purpose|objective|goal)\b/g, "$2"); // template garble
  s = s.replace(/\ba\s+(officer|accountable)\b/g, "an $1"); // a/an errors
  s = s.replace(/\br&rs\b/gi, "R&RS"); // reward & recognition system acronym
  s = fixCaseNouns(s);
  s = normalizeAcronyms(s, acronyms);
  s = capitalizeFirstWord(s, acronyms);
  s = addTerminalPunct(s);
  return s;
}

function fixOptionMechanical(opt, acronyms) {
  let o = collapseSpaces(opt);
  o = o.replace(/^(?:\(?[a-zA-Z]\)|\(?[a-zA-Z]\.|\d+[.)])\s+/, ""); // embedded prefix
  o = o.replace(/(?<=\w)\?s\b/g, "'s"); // one?s -> one's
  o = o.replace(/\?([A-Za-z]+)\?/g, "'$1'"); // ?Corrected? -> 'Corrected'
  o = o.replace(/\s*[□■]\.?/g, ""); // checkbox mojibake
  o = o.replace(/\.(\d{1,2})\.$/g, "."); // stray trailing numbering ("...countries.3."), never touches decimals like "86.4"
  o = o.replace(/\s+Q\.$/g, "."); // stray question-number artifact ("...file number. Q.")
  o = o.replace(/(?<=\.)\s+[a-zA-Z]\.?$/g, "."); // stray trailing single letter after period ("...Federation. a.")
  o = o.replace(/\s+Q$/, "."); // trailing stray Q ("...chairman Q")
  o = o.replace(/(?<!\.)\.\.(?!\.)/g, "."); // exactly-double period ("...members.."), never ellipsis
  o = fixNecessitate(o);
  o = fixCaseNouns(o);
  o = normalizeAcronyms(o, acronyms);
  return o;
}

function fixNecessitate(s) {
  return String(s)
    .replace(/\bnecessitate records\b/gi, "required records")
    .replace(/\bcare necessitate\b/gi, "care necessary")
    .replace(/\bcopies necessitate\b/gi, "copies required")
    .replace(/\bcopies demand\b/gi, "copies required")
    .replace(/\b(is|are)\s+necessitate\s+to\b/gi, "$1 required to")
    .replace(/\bnecessitate\s+for\b/gi, "required for")
    .replace(/\bif necessitate\b/gi, "if required")
    .replace(/\bnecessitate\s+skills\b/gi, "required skills")
    .replace(/\bnecessitate\s+the\b/gi, "require the")
    .replace(/\bnecessitate\s+an\b/gi, "requires an")
    .replace(/\bnecessitate\s+a\b/gi, "requires a")
    .replace(/\bno longer necessitate\b/gi, "no longer required")
    .replace(/\bmust be necessitate to\b/gi, "must be required to")
    .replace(/\bdoes not necessitate actually to\b/gi, "is not required to actually");
}

// Proper-noun casing: bolded statute references and country/title nouns that
// an earlier pass lowercased ("**FOI** act", "nigeria", "attorney-general").
function fixCaseNouns(s) {
  return String(s)
    .replace(/\*\*section (\d+[a-z]?)\*\*/gi, "**Section $1**")
    .replace(/\*\*[A-Z]{2,8}\*\*\s+act\b/gi, (m) => m.replace(/\s+act\b/i, " Act"))
    .replace(/\bnigeria\b/g, "Nigeria")
    .replace(/\bnigerian\b/g, "Nigerian")
    .replace(/\battorney-general\b/gi, "Attorney-General");
}

function fixTextMechanical(text, acronyms) {
  let s = collapseSpaces(text);
  s = s.replace(/(?<=\w)\?s\b/g, "'s");
  s = s.replace(/\?([A-Za-z]+)\?/g, "'$1'");
  s = s.replace(/\s*[□■]\.?/g, ""); // checkbox mojibake
  s = s.replace(/(\([^)]*\))\.\s*\1/g, "$1."); // duplicated "Correct option: B (X). (X)."
  s = fixNecessitate(s);
  s = fixCaseNouns(s);
  s = normalizeAcronyms(s, acronyms);
  return s;
}

// ---------------------------------------------------------------------------
// Answer-order scrambling
// ---------------------------------------------------------------------------

// Deterministic, idempotent reorder of options so the correct answer never sits
// in a predictable position and no simple pattern ("A, A, B, B, C, D") emerges
// in file order. The FIRST run generates a permutation per question id and
// records it in data/answer_order.json (tracked); later runs replay the
// recorded permutation (identity) so repeated runs never re-shuffle.
//
// IMPORTANT for future curated edits: options in the CURATED_OPTIONS* tables
// are ALWAYS authored in canonical (original, pre-scramble) order. Curated
// questions are re-scrambled on every run from a hash-derived permutation
// (their canonical input is guaranteed because the curated pass rewrites them
// first); all other questions are scrambled exactly once and recorded. To
// force a fresh scramble of everything, delete data/answer_order.json.
const ANSWER_ORDER_PATH = path.join(DATA_DIR, "answer_order.json");
const SCRAMBLE_SALT = "freebuff-cbt-v2"; // v2: avoids a random 11-run tail in psr_rules (max run <= 7 everywhere)

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Seeded PRNG (mulberry32) so generation is reproducible across machines.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick a uniformly random permutation of [0..n). The `fixed` argument is kept
// for seed stability but deliberately NOT used as a constraint: any constraint
// tied to the original correct position would invert the old position bias
// (positions that were overloaded would become depleted). A position-independent
// shuffle gives a uniform ~25% distribution per bank regardless of the
// historical bias, which is exactly what defeats position-based guessing.
function pickPermutation(seed, n, fixed) {
  const rand = mulberry32(seed);
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadAnswerOrders() {
  try {
    return JSON.parse(fs.readFileSync(ANSWER_ORDER_PATH, "utf8"));
  } catch {
    return { version: 1, orders: {} };
  }
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

const stats = { curatedStems: 0, curatedStemsP2: 0, curatedOptions: 0, curatedOptionsP2: 0, curatedOptionsP3: 0, curatedAnswers: 0, curatedMeta: 0, moves: 0, removed: 0, added: 0, punct: 0, case: 0, acronyms: 0, prefixes: 0, mojibake: 0, strayApos: 0, whitespace: 0, scrambled: 0 };

// topics.json questionCount is trusted by the app, so decrement it when
// questions are removed from a bank.
function updateTopicCounts(bankFile, removedCount, addedCount) {
  if (!removedCount && !addedCount) return;
  const topicsPath = path.join(DATA_DIR, "topics.json");
  const topics = JSON.parse(fs.readFileSync(topicsPath, "utf8"));
  const target = topics.topics.find((t) => t.file === path.join("data", bankFile) || t.file === "data/" + bankFile);
  if (target && Number.isFinite(Number(target.questionCount))) {
    const before = Number(target.questionCount);
    target.questionCount = before - removedCount + addedCount;
    fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2) + "\n", "utf8");
    console.log(`topics.json: ${target.id} questionCount ${before} -> ${target.questionCount}`);
  } else {
    console.error(`could not update questionCount for ${bankFile}`);
  }
}

const answerOrders = loadAnswerOrders();
let manifestDirty = 0;

for (const file of BANK_FILES) {
  const bankName = file.replace(".json", "");
  if (requestedBank && bankName !== requestedBank) continue;
  const payload = loadBank(file);
  const acronyms = buildAcronyms(bankName);
  const moves = CURATED_MOVES[bankName] || {};
  const removes = CURATED_REMOVE[file] || {};
  let fileChanged = false;
  let removedCount = 0;
  let addedCount = 0;

  // ---- remove pass: drop exact/accidental duplicates ----
  if (Object.keys(removes).length) {
    for (const s of getSubcategories(payload)) {
      const qs = getQuestions(s); // unwraps the legacy ca_general wrapper
      if (!qs.length) continue;
      const kept = qs.filter((q) => !(q && removes[q.id]));
      if (kept.length !== qs.length) {
        removedCount += qs.length - kept.length;
        stats.removed += qs.length - kept.length;
        fileChanged = true;
        qs.length = 0;
        qs.push(...kept);
      }
    }
  }

  // ---- move pass: relocate content-misplaced questions to their correct subcategory ----
  const subs = getSubcategories(payload);
  const pendingMoves = [];
  for (const s of subs) {
    if (!Array.isArray(s.questions)) continue;
    const kept = [];
    for (const q of s.questions) {
      const target = q && moves[q.id];
      if (target && target !== s.id) {
        pendingMoves.push({ q, target });
        stats.moves++;
        fileChanged = true;
      } else {
        kept.push(q);
      }
    }
    s.questions = kept;
  }
  for (const { q, target } of pendingMoves) {
    const t = subs.find((x) => x.id === target);
    if (!t) {
      console.error(`target subcategory '${target}' not found in ${bankName}`);
      continue;
    }
    t.questions.push(q);
    q.sourceSubcategoryId = target;
    q.sourceSubcategoryName = t.name;
  }

  // ---- insert pass: add authored questions for thin subcategories ----
  const newForBank = NEW_QUESTIONS[bankName] || {};
  const insertedIds = new Set();
  for (const s of subs) {
    const toAdd = newForBank[s.id];
    if (!toAdd || !toAdd.length) continue;
    const existing = new Set(getQuestions(s).map((q) => q && q.id));
    for (const nq of toAdd) {
      if (!nq || !nq.id || existing.has(nq.id) || insertedIds.has(nq.id)) continue;
      const full = buildNewQuestion(nq, s, bankName);
      s.questions.push(full);
      insertedIds.add(nq.id);
      stats.added++;
      addedCount++;
      fileChanged = true;
    }
  }

  for (const s of subs) {
    const questions = getQuestions(s);
    for (const q of questions) {
      const curatedStem = CURATED_STEMS[bankName]?.[q.id] ?? CURATED_STEMS_P2[bankName]?.[q.id];
      const curatedMeta = CURATED_META[bankName]?.[q.id];

      // question
      if (curatedStem && q.question !== curatedStem) {
        q.question = curatedStem;
        if (CURATED_STEMS_P2[bankName]?.[q.id]) stats.curatedStemsP2++;
        else stats.curatedStems++;
        fileChanged = true;
      } else if (!curatedStem && typeof q.question === "string") {
        const before = q.question;
        q.question = fixStemMechanical(q.question, acronyms);
        if (q.question !== before) {
          if (before !== before.trim() || /[^\S\n]{2,}/.test(before)) stats.whitespace++;
          if (/[?.!:]$/.test(before.trim()) !== /[?.!:]$/.test(q.question.trim())) stats.punct++;
          if ((before.match(/[A-Za-z]/) || [])[0] !== (q.question.match(/[A-Za-z]/) || [])[0]) stats.case++;
          if (before !== normalizeAcronyms(before, acronyms)) stats.acronyms++;
          fileChanged = true;
        }
      }

      // options (mechanical only here — curated option replacements, distractor
      // patches and the answer key are applied by the answer-order pass below,
      // which works in canonical space so re-runs stay idempotent)
      if (Array.isArray(q.options)) {
        for (let i = 0; i < q.options.length; i++) {
          if (typeof q.options[i] !== "string") continue;
          const before = q.options[i];
          q.options[i] = fixOptionMechanical(q.options[i], acronyms);
          if (q.options[i] !== before) {
            if (/^(?:\(?[a-zA-Z]\)|\(?[a-zA-Z]\.|\d+[.)])\s+/.test(before)) stats.prefixes++;
            if (/(?<=\w)\?s\b|\?[A-Za-z]+\?/.test(before)) stats.mojibake++;
            if (before !== normalizeAcronyms(before, acronyms)) stats.acronyms++;
            fileChanged = true;
          }
        }
      }

      // metadata
      if (curatedMeta) {
        for (const [k, v] of Object.entries(curatedMeta)) {
          if (q[k] !== v) {
            q[k] = v;
            stats.curatedMeta++;
            fileChanged = true;
          }
        }
      }

      // explanation (mechanical only)
      if (typeof q.explanation === "string") {
        const before = q.explanation;
        q.explanation = fixTextMechanical(q.explanation, acronyms);
        if (q.explanation !== before) fileChanged = true;
      }
    }
  }

  // ---- answer-order pass: curated option patches + answer-key fixes + scramble.
  // Works in canonical space: on the first run the data is canonical; on later
  // runs the recorded permutation is used to unscramble back to canonical before
  // patching, then re-scrambled with the same hash-derived permutation (so
  // repeated runs are idempotent). perm[j] = canonical index at scrambled
  // position j; newOptions[j] = canonical[perm[j]]; newCorrect = perm.indexOf(canonical).
  const bankOrders = answerOrders.orders[bankName] || (answerOrders.orders[bankName] = {});
  for (const s of subs) {
    for (const q of getQuestions(s)) {
      const opts = Array.isArray(q.options) ? q.options : null;
      if (!opts || opts.length !== 4) continue;
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= 4) continue;
      const curatedFull = CURATED_OPTIONS[bankName]?.[q.id] ?? CURATED_OPTIONS_P2[bankName]?.[q.id];
      const curatedPatch = CURATED_OPTIONS_P3[bankName]?.[q.id];
      const curatedAnswer = CURATED_ANSWERS[bankName]?.[q.id];
      const isCurated = !!(curatedFull || curatedPatch || curatedAnswer !== undefined);
      const recorded = bankOrders[q.id];

      // recover canonical options + correct index
      let canonicalOpts;
      let canonicalCorrect;
      if (curatedFull) {
        const recovered = recorded ? recorded.map((_, c) => opts[recorded.indexOf(c)]) : opts;
        if (JSON.stringify(recovered) !== JSON.stringify(curatedFull)) {
          if (CURATED_OPTIONS_P2[bankName]?.[q.id]) stats.curatedOptionsP2++;
          else stats.curatedOptions++;
          fileChanged = true;
        }
        canonicalOpts = curatedFull;
        canonicalCorrect = recorded ? recorded[q.correct] : q.correct;
      } else if (recorded) {
        canonicalOpts = recorded.map((_, c) => opts[recorded.indexOf(c)]);
        canonicalCorrect = recorded[q.correct];
      } else {
        canonicalOpts = opts;
        canonicalCorrect = q.correct;
      }

      // curated distractor upgrades (indexes are canonical)
      if (curatedPatch) {
        for (const [idx, text] of Object.entries(curatedPatch)) {
          const i = Number(idx);
          if (typeof canonicalOpts[i] !== "string" || canonicalOpts[i] === text) continue;
          canonicalOpts[i] = text;
          stats.curatedOptionsP3++;
          fileChanged = true;
        }
      }

      // answer-key fix (canonical index; idempotent — recovered value already
      // matches after the first run)
      if (curatedAnswer !== undefined && canonicalCorrect !== curatedAnswer) {
        canonicalCorrect = curatedAnswer;
        stats.curatedAnswers++;
        fileChanged = true;
      }

      let perm;
      if (isCurated) {
        perm = pickPermutation(hashString(SCRAMBLE_SALT + "|" + bankName + "|" + q.id), 4, canonicalCorrect);
        if (!recorded || perm.some((v, j) => v !== recorded[j])) {
          bankOrders[q.id] = perm;
          manifestDirty++;
        }
      } else if (recorded) {
        continue; // already scrambled on a previous run
      } else {
        perm = pickPermutation(hashString(SCRAMBLE_SALT + "|" + bankName + "|" + q.id), 4, canonicalCorrect);
        bankOrders[q.id] = perm;
        manifestDirty++;
      }

      const newOpts = perm.map((c) => canonicalOpts[c]);
      const newCorrect = perm.indexOf(canonicalCorrect);
      if (newCorrect !== q.correct || newOpts.some((o, j) => o !== opts[j])) {
        q.options = newOpts;
        q.correct = newCorrect;
        stats.scrambled++;
        fileChanged = true;
      }
    }
  }

  if (!fileChanged) continue;
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
  const endsWithNewline = raw.endsWith("\n");
  const out = JSON.stringify(payload, null, 2) + (endsWithNewline ? "\n" : "");
  if (dryRun) {
    console.log(`[dry-run] ${file} would be rewritten`);
  } else {
    fs.writeFileSync(path.join(DATA_DIR, file), out, "utf8");
    console.log(`rewrote ${file} (${raw.length} -> ${out.length} bytes)`);
    updateTopicCounts(file, removedCount, addedCount);
  }
}

if (!dryRun && manifestDirty) {
  fs.writeFileSync(ANSWER_ORDER_PATH, JSON.stringify(answerOrders, null, 2) + "\n", "utf8");
  console.log(`answer_order.json: recorded ${manifestDirty} new permutation(s)`);
}

console.log("\nFix summary:");
for (const [k, v] of Object.entries(stats)) console.log(`  ${k.padEnd(14)} ${v}`);
console.log(dryRun ? "\n(dry run — no files written)" : "\ndone.");
