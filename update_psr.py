import json

# Load the base psr.json file
with open('D:\\FlutterApps\\PromotionCBT\\data\\psr.json', 'r') as f:
    psr_data = json.load(f)

# Mapping of subcategory IDs to their data files
file_mapping = {
    'psr_appointments': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_appointments.json',
    'psr_discipline': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_discipline.json',
    'psr_leave': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_leave.json',
    'psr_allowances': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_allowances.json',
    'psr_ethics': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_ethics.json',
    'psr_medical': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_medical.json',
    'psr_training': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_training.json',
    'psr_retirement': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_retirement.json',
    'psr_general_admin': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_general_admin.json',
    'psr_interpretation': 'D:\\FlutterApps\\PromotionCBT\\data\\psr_interpretation.json'
}

# Iterate through the subcategories in psr.json and update the questions
for subcategory in psr_data['subcategories']:
    subcategory_id = subcategory['id']
    if subcategory_id in file_mapping:
        file_path = file_mapping[subcategory_id]
        with open(file_path, 'r') as f:
            data_to_merge = json.load(f)
            # The questions are nested under the subcategory_id key
            if subcategory_id in data_to_merge:
                subcategory['questions'] = data_to_merge[subcategory_id]['questions']

# Write the updated data back to psr.json
with open('D:\\FlutterApps\\PromotionCBT\\data\\psr.json', 'w') as f:
    json.dump(psr_data, f, indent=4)

print("Successfully updated psr.json")
