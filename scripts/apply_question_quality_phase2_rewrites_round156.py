# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'general_current_affairs.json'

UPDATES = {
    'ca_general_001': 'Lagos State is officially known as the Centre of Excellence, so that nickname is the correct answer.',
    'ca_general_002': 'The Head of the Civil Service of the Federation is the top administrative officer for the federal civil service, so that office is the correct one here.',
    'ca_general_004': 'As of 2025, the office of President of Nigeria is held by the President and Commander-in-Chief, so the answer identifies the correct office-holder role rather than a ministry post.',
    'ca_general_006': 'Ogun State is called the Gateway State because of its location and historic role as an entry point between regions.',
    'ca_general_007': 'Lafia is the capital of Nasarawa State, so it is the correct state-capital match.',
    'ca_general_011': 'Ondo State is popularly known as the Sunshine State, which is why that option is correct.',
    'ca_general_013': 'Akwa Ibom State is known as the Land of Promise, so that nickname is the correct answer.',
    'ca_general_014': 'ECOWAS is headquartered in Abuja, Nigeria, so it is the correct international organization named in the item.',
    'ca_general_015': 'Maiduguri is the capital of Borno State, making it the correct response to the question.',
    'ca_general_016': 'Benue State is nicknamed the Food Basket of the Nation because of its strong agricultural identity.',
    'ca_general_017': 'Calabar is the capital of Cross River State, so it is the correct city-state match.',
    'ca_general_018': 'Plateau State is often called the Home of Peace, which is why that nickname fits the item.',
    'ca_general_019': 'General Ibrahim Babangida introduced the Structural Adjustment Programme in 1986, so the question points to his administration.',
    'ca_general_020': 'Lokoja is the capital of Kogi State, making it the correct answer.',
    'ca_general_022': 'Gombe is the capital of Gombe State, so it is the correct city named in the question.',
    'ca_general_024': 'Sokoto State is known as the Seat of Caliphate because of its historic association with the Sokoto Caliphate.',
    'ca_general_026': 'Nigeria joined the United Nations in 1960, the year it gained independence and entered the UN system.',
    'ca_general_028': 'Awka is the capital of Anambra State, so it is the correct city-state match.',
    'ca_general_029': 'Plateau State is nicknamed the Home of Solid Minerals because of its long association with mineral resources.',
    'ca_general_030': 'Damaturu is the capital of Yobe State, which makes it the right answer.',
    'ca_general_032': 'Benin City is known as the Ancient City because of its long and prominent historical legacy.',
    'ca_general_034': 'Akwa Ibom State is often called the Hospitality State, which is the nickname tested here.',
    'ca_general_035': 'Nigeria is divided into six geopolitical zones, so that number is the correct answer.',
    'ca_general_036': 'Port Harcourt is nicknamed the Garden City because of its greenery and urban identity.',
    'ca_general_037': 'Ekiti State is called the Land of Honour and Integrity, so that sobriquet is the correct one.',
    'ca_general_038': 'Katsina City is the capital of Katsina State, so it is the correct location here.',
    'ca_general_039': 'Rivers State is nicknamed the Treasure Base of the Nation because of its oil-rich status.',
    'ca_general_040': 'Benin City is commonly called the Ancient City of Benin, making that the correct option.',
    'ca_general_041': 'Kaduna State is popularly described as the Land of Courage, so that nickname fits the item.',
    'ca_general_042': 'Abakaliki is the capital of Ebonyi State, so it is the correct city to choose.',
    'ca_general_043': 'The Speaker of the House of Representatives presides over the lower chamber, so that office is the correct legislative role in this item.',
    'ca_general_044': 'Bauchi State is called the Home of Peace and Tourism, which makes that nickname the correct answer.',
    'ca_general_045': 'Lagos is nicknamed the City of Excellence because of its long-standing role as Nigeria’s commercial and administrative centre.',
    'ca_general_046': 'Kogi State is commonly called the Power State, so that nickname is the correct answer.',
    'ca_general_050': 'Minna is the capital of Niger State, so it is the correct state capital.',
    'ca_general_053': 'The Chief Justice of Nigeria heads the judiciary at the federal level, so that role is the correct answer.',
    'ca_general_054': 'When a cheque is received, it should be made payable in accordance with official cash-control procedures so it can be properly traced and banked.',
    'ca_general_055': 'The office responsible for printing Treasury and other receipt and licence books is the Accountant-General / Treasury control structure, which manages public finance documentation.',
    'ca_general_064': 'General control of Treasury and other receipt and licence books belongs to the Treasury control/accounting-office function, which ensures secure custody and accountability.',
    'ca_general_076': 'Osun State is popularly known as the Home of Heroes, so that nickname is the correct answer.',
    'ca_general_077': 'Cross River State is widely known as the Land of Hospitality, making that nickname the correct option.',
    'ca_general_gen_005': 'Good governance in general affairs depends on keeping official updates accurate, timely, and properly documented.',
    'ca_general_gen_006': 'Regional and global context is best demonstrated by keeping official work aligned with wider national, regional, and international realities.',
    'ca_general_gen_007': 'Public communication literacy improves when officers write clearly, accurately, and in a way that the intended audience can understand.',
    'ca_general_gen_008': 'Civic relevance is best shown by official actions that serve the public interest and reflect sound public-service values.',
    'ca_general_gen_012': 'Service integrity is strengthened when officers apply rules consistently, keep records accurately, and avoid shortcuts.',
    'ca_general_gen_014': 'Decision transparency is best preserved when actions are documented, open to review, and explained through proper administrative records.',
    'ca_general_gen_016': 'Citizen-focused service puts the needs of the public first, especially by ensuring prompt, fair, and respectful service delivery.',
    'ca_general_gen_024': 'Regional and global context in public service means keeping official decisions aware of both local realities and wider policy expectations.',
}


def update(node: object, updates: dict[str, str]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            node['explanation'] = updates[qid]
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data, UPDATES)
    if changed != len(UPDATES):
        raise SystemExit(f'expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 156 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
