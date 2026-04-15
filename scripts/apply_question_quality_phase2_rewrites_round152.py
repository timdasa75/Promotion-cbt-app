# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'ict_digital.json',
        {
            'ict_f_002': {
                'explanation': 'The CPU performs processing and executes software instructions, which is why it is commonly described as the brain of the computer.',
            },
            'ict_f_005': {
                'explanation': 'Microsoft Word is an application for creating documents, not an operating system that manages computer hardware and software resources.',
            },
            'ict_f_008': {
                'explanation': 'An IP address identifies a device on a network, so it is the correct networking term rather than a protocol name like HTTP.',
            },
            'ict_f_012': {
                'explanation': 'A bit is the smallest unit of digital data because it represents only one of two states: 0 or 1.',
            },
            'ict_f_016': {
                'explanation': 'A switch connects devices within a local area network and forwards traffic to the correct recipient, which makes it the best answer.',
            },
            'ict_f_021': {
                'explanation': 'HTML structures the content of web pages, so it is the standard language used for organizing web content.',
            },
            'ict_f_023': {
                'explanation': 'A projector is the device used to display presentation slides on a screen during meetings, making it the correct output device here.',
            },
            'ict_f_024': {
                'explanation': 'MAC stands for Media Access Control, the networking term used in addressing and device identification.',
            },
            'ict_f_025': {
                'explanation': 'A MAC address is the unique hardware identifier tied to a device network interface, so it is the correct ICT component.',
            },
            'ict_f_032': {
                'explanation': 'ROM is the non-volatile memory used to store permanent data because it retains information even when power is removed.',
            },
            'ict_f_039': {
                'explanation': 'WAN stands for Wide Area Network, the networking term for a network that spans a large geographic area.',
            },
            'ict_f_040': {
                'explanation': 'A monitor is output hardware because it displays information to the user, unlike input devices such as a keyboard or mouse.',
            },
            'ict_f_041': {
                'explanation': 'Microsoft Project is commonly used for project planning and tracking, which is why it fits administrative work better than media or note-taking tools.',
            },
            'ict_f_047': {
                'explanation': 'FTP, or File Transfer Protocol, is designed for uploading and downloading files across a network.',
            },
            'ict_f_052': {
                'explanation': 'RAM is volatile memory, so data stored there is lost when power is turned off.',
            },
            'ict_f_053': {
                'question': 'What does the acronym OS stand for?',
                'explanation': 'OS stands for Operating System, the software layer that manages hardware resources and runs applications.',
            },
            'ict_f_054': {
                'question': 'What is the primary function of a projector?',
                'explanation': 'A projector displays visuals from a computer or other source onto a screen, which is why it is used for presentations.',
            },
            'ict_f_056': {
                'explanation': 'SaaS means Software as a Service, where applications are delivered over the internet on a subscription basis.',
            },
            'ict_f_057': {
                'explanation': 'A byte contains 8 bits, so 8 is the maximum number of bits in one byte.',
            },
            'ict_f_059': {
                'explanation': 'IDE stands for Integrated Development Environment, the toolset programmers use to write, test, and debug code.',
            },
            'ict_f_063': {
                'explanation': 'A switch is the device that connects computers within a LAN and directs traffic to the correct port.',
            },
            'ict_f_065': {
                'explanation': 'URL stands for Uniform Resource Locator, which is the unique web address used to locate a page on the internet.',
            },
            'ict_f_069': {
                'explanation': 'JavaScript is the front-end language used for interactive client-side scripting on web pages.',
            },
            'ict_f_070': {
                'explanation': 'A DBMS is a system that stores, manages, and updates electronic data in a structured way.',
            },
            'ict_f_071': {
                'question': 'What is the unique network address assigned to a device by an administrator or network protocol?',
                'explanation': 'An IP address is the unique network address used to identify a device on a network.',
            },
            'ict_f_074': {
                'explanation': 'Virtualization is the process of running multiple operating systems or applications on one physical machine.',
            },
            'ict_f_075': {
                'question': 'Which type of professional is most likely to use Python for automation and data analysis within an MDA?',
                'explanation': 'Data analysts and data scientists commonly use Python for automation, analysis, and reporting in public-administration settings.',
            },
        },
    ),
]


def update(node: object, updates: dict[str, dict]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            payload = updates[qid]
            for key, value in payload.items():
                node[key] = value
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> None:
    total_changed = 0
    for target, updates in TARGETS:
        data = json.loads(target.read_text(encoding='utf-8'))
        changed = update(data, updates)
        if changed != len(updates):
            raise SystemExit(f'{target.name}: expected {len(updates)} updates, applied {changed}')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total_changed += changed
        print(f'Applied round 152 updates to {changed} questions in {target}')
    print(f'Applied round 152 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    raise SystemExit(main())
