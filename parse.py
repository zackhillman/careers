import json
import csv

def run_main():
    with open('output.txt', 'r') as f:
        careers_dict = json.load(f)

    key_dict = dict()
    print(len(careers_dict))
    for career in careers_dict:
        for key in career.keys():
            if key in key_dict:
                key_dict[key] = key_dict[key]+1
            else:
                key_dict[key] = 1
    print(key_dict)
    key_list = key_dict.keys()

    with open('output_csv.csv', 'w') as output_csv:
        output_writer = csv.writer(output_csv, delimiter=',')
        for career in careers_dict:
            output_writer.writerow(get_list(career, key_list))



def get_list(career, keys):
    output_list = []
    for key in keys:
        if key in career:
            output_list.append(career[key])
        else:
            output_list.append('')

    return output_list

run_main()
