
import json
import os

def restructure_json():
    file_path = os.path.join('D:\\FlutterApps\\PromotionCBT', 'data', 'current_affairs.json')
    topics_file_path = os.path.join('D:\\FlutterApps\\PromotionCBT', 'data', 'topics.json')

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    with open(topics_file_path, 'r', encoding='utf-8') as f:
        topics_data = json.load(f)

    current_affairs_topic = next((topic for topic in topics_data['topics'] if topic['id'] == 'current_affairs'), None)

    if not current_affairs_topic:
        print("Current affairs topic not found in topics.json")
        return

    new_subcategories = {sub['id']: {'id': sub['id'], 'name': sub['name'], 'description': sub['description'], 'icon': sub['icon'], 'questions': []} for sub in current_affairs_topic['subcategories']}

    reform_keywords = ['PSR', 'FCSC', 'OHCSF', 'JSC', 'PMS', 'APER', 'IPPIS', 'Secondment', 'Retirement', 'Pension', 'Leave', 'Allowance', 'Discipline', 'Misconduct', 'Promotion', 'Appointment', 'Recruitment', 'Tenure']
    governance_keywords = ['Constitution', 'Legal', 'Financial', 'Budget', 'Procurement', 'Audit', 'Sanction', 'TSA', 'Revenue', 'Policy', 'Governance', 'National Assembly', 'President', 'Minister', 'Judiciary']
    international_keywords = ['Foreign Service', 'Diplomatic', 'ECOWAS', 'UN', 'International', 'Overseas', 'Embassy', 'Consular', 'Estacode']
    national_keywords = ['History', 'Symbols', 'Leadership', 'Agencies', 'Events', 'Geography', 'Sports', 'Technology', 'Inventors']

    for question in data['subcategories'][0]['questions']:
        assigned = False
        question_text = question.get('question', '').lower()
        question_keywords = ' '.join(question.get('keywords', [])).lower()

        for keyword in reform_keywords:
            if keyword.lower() in question_keywords or keyword.lower() in question_text:
                new_subcategories['ca_public_service_reforms']['questions'].append(question)
                assigned = True
                break
        if assigned:
            continue

        for keyword in governance_keywords:
            if keyword.lower() in question_keywords or keyword.lower() in question_text:
                new_subcategories['ca_national_governance']['questions'].append(question)
                assigned = True
                break
        if assigned:
            continue

        for keyword in international_keywords:
            if keyword.lower() in question_keywords or keyword.lower() in question_text:
                new_subcategories['ca_international_affairs']['questions'].append(question)
                assigned = True
                break
        if assigned:
            continue

        for keyword in national_keywords:
            if keyword.lower() in question_keywords or keyword.lower() in question_text:
                new_subcategories['ca_national_events']['questions'].append(question)
                assigned = True
                break

        if not assigned:
            new_subcategories['ca_national_events']['questions'].append(question)

    data['subcategories'] = list(new_subcategories.values())

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    restructure_json()
