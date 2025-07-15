import json
import requests
from bs4 import BeautifulSoup

class UrlExtractor:
    
    def scrape_course_modules_units_and_topics(course_url, api_key):
        endpoint = 'https://api.scrapingant.com/v2/general'
        base_path_url = 'https://learn.microsoft.com/en-us/training/paths/'
        headers = {'x-api-key': api_key}

        params = {
            'url': course_url,
            'x-api-key': api_key,
            'browser': False
        }

        # Obtener contenido del curso
        response = requests.get(endpoint, params=params, headers=headers)
        if response.status_code != 200:
            print(f"Error al hacer scraping del curso: {response.status_code}")
            return {}

        soup = BeautifulSoup(response.text, 'html.parser')

        course_title_tag = soup.find('meta', attrs={'property': 'og:title'})
        course_name = course_title_tag['content'].strip()  if course_title_tag else 'Módulo sin título'

        # Obtener URLs de los módulos desde las etiquetas <meta name="learn_item">
        modules_urls = []
        for learn in soup.find_all('meta', attrs={'name': 'learn_item'}):
            content_value = learn.get('content')
            if content_value:
                module_path = content_value.split('.')[-1]
                full_url = base_path_url + module_path
                modules_urls.append(full_url)

        # Estructura de salida
        output = {
            "course": course_name,
            "modules": []
        }

        for module_url in modules_urls:
            module_params = {
                'url': module_url,
                'x-api-key': api_key,
                'browser': False
            }

            module_response = requests.get(endpoint, params=module_params, headers=headers)
            if module_response.status_code != 200:
                print(f"Error al hacer scraping del módulo: {module_url}")
                continue

            module_soup = BeautifulSoup(module_response.text, 'html.parser')


            # Obtener el nombre del módulo desde la etiqueta meta[property="og:title"]
            title_tag = module_soup.find('meta', attrs={'property': 'og:title'})
            module_name = title_tag['content'].strip()  if title_tag else 'Módulo sin título'

            module_units_urls = []

            # Extraer URLs de unidades desde los enlaces <a class="card"> que llevan a módulos individuales
            for unit_link in module_soup.find_all('a', href=True):
                href = unit_link['href']
                if href.startswith('../../modules/'):
                    unit_url = 'https://learn.microsoft.com/en-us/training/' + href.replace('../../', '')
                    if unit_url not in module_units_urls:
                        module_units_urls.append(unit_url)

            units = []
            # Procesar cada unidad
            for unit_url in module_units_urls:
                unit_params = {
                    'url': unit_url,
                    'x-api-key': api_key,
                    'browser': False
                }

                unit_response = requests.get(endpoint, params=unit_params, headers=headers)
                if unit_response.status_code != 200:
                    print(f"Error al hacer scraping de la unidad: {unit_url}")
                    continue

                unit_soup = BeautifulSoup(unit_response.text, 'html.parser')

                # Obtener nombre de la unidad
                unit_title_tag = unit_soup.find('h1')
                unit_name = unit_title_tag.text.strip() if unit_title_tag else 'Unidad sin título'

                topics = []
                for topic_link in unit_soup.find_all('a', class_='unit-title', href=True):
                    topic_name = topic_link.text.strip()
                    topic_url = unit_url + topic_link['href'] if not topic_link['href'].startswith('http') else topic_link['href']

                    topics.append({
                        'name': topic_name,
                        'url': topic_url
                    })

                units.append({
                    'name': unit_name,
                    'url': unit_url,
                    'topics': topics
                })

            output['modules'].append({
                'name': module_name,
                'url': module_url,
                'units': units
            })

        json_structure = json.dumps(output, indent=4, ensure_ascii=False)

        return json_structure


